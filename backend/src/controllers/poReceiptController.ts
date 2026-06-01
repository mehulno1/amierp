import { Response } from 'express'
import { executeQuery, pool } from '../config/database'
import { getNextDocumentNumber } from '../utils/documentSequence'
import { AuthRequest } from '../types'

const EPS = 0.001

// ── Helpers ──────────────────────────────────────────────────────────────────

// Single source of truth: purchase_order_items.received_qty is a *recomputed* cache
// = SUM(po_receipt_items.received_qty) per line. Never increment in place; always rebuild
// from the GRN event log so creates/edits/deletes are self-healing. Then mirror the PO's
// existing auto-status (delivered / partially_delivered / confirmed) and cascade to the
// source requisition, guarding its terminal states.
async function recomputeAndCascade(conn: any, poId: number) {
  // Rebuild per-line received_qty from the receipt lines.
  await conn.execute(
    `UPDATE purchase_order_items poi
     SET poi.received_qty = COALESCE((
       SELECT SUM(pri.received_qty)
       FROM po_receipt_items pri
       JOIN po_receipts pr ON pr.id = pri.receipt_id
       WHERE pri.po_item_id = poi.id
     ), 0)
     WHERE poi.po_id = ?`,
    [poId]
  )

  const [items] = await conn.execute(
    'SELECT qty, received_qty FROM purchase_order_items WHERE po_id = ?',
    [poId]
  ) as any[]

  const allDelivered = (items as any[]).length > 0 &&
    (items as any[]).every((i: any) => parseFloat(i.received_qty) + EPS >= parseFloat(i.qty))
  const anyDelivered = (items as any[]).some((i: any) => parseFloat(i.received_qty) > EPS)

  // Mirror the PO auto-calc. 'confirmed' is the resting state once nothing is received.
  const poStatus = allDelivered ? 'delivered' : (anyDelivered ? 'partially_delivered' : 'confirmed')
  await conn.execute('UPDATE purchase_orders SET status = ? WHERE id = ?', [poStatus, poId])

  // Cascade to the linked requisition. PO lines have no FK to requisition lines — the link is
  // requisition_id + TRIM(description) (the same loose match 018's spare_part_id backfill uses).
  // Propagate BOTH the per-line received_qty (so the requisition's balance bar moves) AND the
  // overall status, preserving the legacy behavior (delivered / partially_delivered).
  const [poRows] = await conn.execute('SELECT requisition_id FROM purchase_orders WHERE id = ?', [poId]) as any[]
  const requisitionId = (poRows as any[])[0]?.requisition_id
  if (requisitionId) {
    // Per requisition line, received = total received across ALL of this requisition's POs,
    // matched by trimmed description and capped at the line's ordered qty. Fully derived
    // (0 when nothing matches) so it self-heals on receipt edits/deletes.
    await conn.execute(
      `UPDATE requisition_items ri
       LEFT JOIN (
         SELECT TRIM(poi.description) AS d, SUM(poi.received_qty) AS recv
         FROM purchase_order_items poi
         JOIN purchase_orders po ON po.id = poi.po_id
         WHERE po.requisition_id = ?
         GROUP BY TRIM(poi.description)
       ) agg ON TRIM(ri.description) = agg.d
       SET ri.received_qty = LEAST(COALESCE(agg.recv, 0), ri.qty)
       WHERE ri.requisition_id = ?`,
      [requisitionId, requisitionId]
    )

    // Status: delivered / partially_delivered when goods are in; revert to 'po_raised' when a
    // receipt deletion empties the PO. Never overwrite a terminal state ('cancelled','rejected').
    if (poStatus === 'confirmed') {
      await conn.execute(
        "UPDATE requisitions SET status = 'po_raised' WHERE id = ? AND status IN ('partially_delivered','delivered')",
        [requisitionId]
      )
    } else {
      const reqStatus = allDelivered ? 'delivered' : 'partially_delivered'
      await conn.execute(
        "UPDATE requisitions SET status = ? WHERE id = ? AND status NOT IN ('cancelled','rejected')",
        [reqStatus, requisitionId]
      )
    }
  }
}

// Credit/debit inventory for a single PO line by `delta`. No-op when the line has no
// spare_part_id or no matching active inventory_items row. Writes an inventory_transactions
// row matching the exact columns inventoryController uses, tagged reference_type='po_receipt'.
async function applyInventoryDelta(conn: any, brandId: number, poItemId: number, delta: number, userId: number, receiptId: number) {
  if (Math.abs(delta) < EPS) return
  const [lineRows] = await conn.execute(
    'SELECT spare_part_id FROM purchase_order_items WHERE id = ?',
    [poItemId]
  ) as any[]
  const sparePartId = (lineRows as any[])[0]?.spare_part_id
  if (!sparePartId) return

  const [invRows] = await conn.execute(
    'SELECT id, brand_id, current_stock FROM inventory_items WHERE id = ? AND is_active = 1',
    [sparePartId]
  ) as any[]
  if (!(invRows as any[]).length) return
  const inv = (invRows as any[])[0]

  const stockBefore = parseFloat(inv.current_stock)
  const stockAfter = stockBefore + delta
  await conn.execute('UPDATE inventory_items SET current_stock = ? WHERE id = ?', [stockAfter, inv.id])
  await conn.execute(
    `INSERT INTO inventory_transactions
       (brand_id, inventory_item_id, transaction_type, quantity, reference_id, reference_type, notes, created_by, stock_before, stock_after)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [inv.brand_id, inv.id, 'purchase', delta, String(receiptId), 'po_receipt', `GRN receipt #${receiptId}`, userId, stockBefore, stockAfter]
  )
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export async function getReceipts(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params // po id
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const pos = await executeQuery<any>(
      `SELECT id FROM purchase_orders WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!pos.length) return res.status(404).json({ success: false, error: 'PO not found' })

    const receipts = await executeQuery<any>(
      `SELECT pr.*, u.name as received_by_name
       FROM po_receipts pr
       LEFT JOIN new_users u ON pr.received_by = u.id
       WHERE pr.po_id = ?
       ORDER BY pr.receipt_date DESC, pr.id DESC`,
      [id]
    )
    for (const r of receipts) {
      r.items = await executeQuery<any>(
        `SELECT pri.*, poi.description, poi.uom, poi.qty as ordered_qty, poi.received_qty as line_received_qty
         FROM po_receipt_items pri
         JOIN purchase_order_items poi ON poi.id = pri.po_item_id
         WHERE pri.receipt_id = ?`,
        [r.id]
      )
    }
    res.json({ success: true, data: receipts })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createReceipt(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params // po id
    const ids = req.userBrandIds!
    const pos = await executeQuery<any>(
      `SELECT id, brand_id FROM purchase_orders WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!pos.length) { conn.release(); return res.status(404).json({ success: false, error: 'PO not found' }) }
    const po = pos[0]
    const brandId = po.brand_id

    const { receipt_date, received_by, transporter, lr_number, vehicle_no, vendor_invoice_no, notes, items } = req.body
    if (!receipt_date) { conn.release(); return res.status(400).json({ success: false, error: 'receipt_date required' }) }

    // Current line state for over-receipt guard. Baseline = a fresh SUM(po_receipt_items)
    // per line (cache-independent, matching updateReceipt), not the denormalised received_qty.
    const poItems = await executeQuery<any>('SELECT id, qty, description FROM purchase_order_items WHERE po_id = ?', [id])
    const byId = new Map<number, any>(poItems.map((i: any) => [i.id, i]))
    const receivedRows = await executeQuery<any>(
      'SELECT pri.po_item_id, SUM(pri.received_qty) AS received FROM po_receipt_items pri JOIN purchase_order_items poi ON poi.id = pri.po_item_id WHERE poi.po_id = ? GROUP BY pri.po_item_id',
      [id]
    )
    const receivedById = new Map<number, number>(receivedRows.map((r: any) => [r.po_item_id, parseFloat(r.received) || 0]))

    // Normalise + validate the incoming non-zero lines.
    const lines: { po_item_id: number; qty: number }[] = []
    for (const it of (items || [])) {
      const poItemId = Number(it.po_item_id)
      const qty = Number(it.received_qty) || 0
      if (qty <= EPS) continue
      const line = byId.get(poItemId)
      if (!line) { conn.release(); return res.status(400).json({ success: false, error: `Unknown PO line ${poItemId}` }) }
      const ordered = parseFloat(line.qty)
      const already = receivedById.get(poItemId) || 0
      if (already + qty > ordered + EPS) {
        conn.release()
        return res.status(400).json({ success: false, error: `Over-receipt on "${line.description}": received ${already + qty} exceeds ordered ${ordered}` })
      }
      lines.push({ po_item_id: poItemId, qty })
    }
    if (!lines.length) { conn.release(); return res.status(400).json({ success: false, error: 'At least one line with a positive received quantity is required' }) }

    await conn.beginTransaction()
    const receipt_no = await getNextDocumentNumber(brandId, 'AEPL/GRN')
    const [result] = await conn.execute(
      `INSERT INTO po_receipts (brand_id, po_id, receipt_no, receipt_date, received_by, transporter, lr_number, vehicle_no, vendor_invoice_no, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [brandId, id, receipt_no, receipt_date, received_by ?? req.user!.id, transporter ?? null, lr_number ?? null, vehicle_no ?? null, vendor_invoice_no ?? null, notes ?? null]
    ) as any[]
    const receiptId = result.insertId

    for (const l of lines) {
      await conn.execute(
        'INSERT INTO po_receipt_items (receipt_id, po_item_id, received_qty) VALUES (?,?,?)',
        [receiptId, l.po_item_id, l.qty]
      )
      await applyInventoryDelta(conn, brandId, l.po_item_id, l.qty, req.user!.id, receiptId)
    }

    await recomputeAndCascade(conn, Number(id))
    await conn.commit(); conn.release()
    res.status(201).json({ success: true, data: { id: receiptId, receipt_no } })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updateReceipt(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id, receiptId } = req.params // po id, receipt id
    const ids = req.userBrandIds!
    const pos = await executeQuery<any>(
      `SELECT id, brand_id FROM purchase_orders WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!pos.length) { conn.release(); return res.status(404).json({ success: false, error: 'PO not found' }) }
    const brandId = pos[0].brand_id

    const receipts = await executeQuery<any>('SELECT id FROM po_receipts WHERE id = ? AND po_id = ?', [receiptId, id])
    if (!receipts.length) { conn.release(); return res.status(404).json({ success: false, error: 'Receipt not found' }) }

    const { receipt_date, received_by, transporter, lr_number, vehicle_no, vendor_invoice_no, notes, items } = req.body

    // Baseline = received-so-far per line EXCLUDING this receipt's own prior quantities, so
    // we revalidate over-receipt against everyone else's contribution.
    const poItems = await executeQuery<any>('SELECT id, qty, received_qty, description FROM purchase_order_items WHERE po_id = ?', [id])
    const oldLines = await executeQuery<any>('SELECT po_item_id, received_qty FROM po_receipt_items WHERE receipt_id = ?', [receiptId])
    const oldByItem = new Map<number, number>()
    for (const ol of oldLines) oldByItem.set(ol.po_item_id, parseFloat(ol.received_qty))

    const baseline = new Map<number, { ordered: number; otherReceived: number; description: string }>()
    for (const pi of poItems) {
      const totalReceived = parseFloat(pi.received_qty || 0)
      const ownPrior = oldByItem.get(pi.id) || 0
      baseline.set(pi.id, { ordered: parseFloat(pi.qty), otherReceived: totalReceived - ownPrior, description: pi.description })
    }

    // Normalise the new line set and validate against the baseline.
    const newLines: { po_item_id: number; qty: number }[] = []
    if (Array.isArray(items)) {
      for (const it of items) {
        const poItemId = Number(it.po_item_id)
        const qty = Number(it.received_qty) || 0
        if (qty <= EPS) continue
        const b = baseline.get(poItemId)
        if (!b) { conn.release(); return res.status(400).json({ success: false, error: `Unknown PO line ${poItemId}` }) }
        if (b.otherReceived + qty > b.ordered + EPS) {
          conn.release()
          return res.status(400).json({ success: false, error: `Over-receipt on "${b.description}": received ${b.otherReceived + qty} exceeds ordered ${b.ordered}` })
        }
        newLines.push({ po_item_id: poItemId, qty })
      }
      if (!newLines.length) { conn.release(); return res.status(400).json({ success: false, error: 'At least one line with a positive received quantity is required' }) }
    }

    await conn.beginTransaction()

    // Update header fields (COALESCE keeps existing when omitted).
    await conn.execute(
      `UPDATE po_receipts SET
         receipt_date = COALESCE(?, receipt_date),
         received_by = COALESCE(?, received_by),
         transporter = ?, lr_number = ?, vehicle_no = ?, vendor_invoice_no = ?, notes = ?
       WHERE id = ?`,
      [receipt_date ?? null, received_by ?? null, transporter ?? null, lr_number ?? null, vehicle_no ?? null, vendor_invoice_no ?? null, notes ?? null, receiptId]
    )

    if (Array.isArray(items)) {
      // Apply the per-line inventory delta (newQty - oldQty), covering removed lines too.
      const newByItem = new Map<number, number>()
      for (const nl of newLines) newByItem.set(nl.po_item_id, nl.qty)
      const touched = new Set<number>([...oldByItem.keys(), ...newByItem.keys()])
      for (const poItemId of touched) {
        const delta = (newByItem.get(poItemId) || 0) - (oldByItem.get(poItemId) || 0)
        await applyInventoryDelta(conn, brandId, poItemId, delta, req.user!.id, Number(receiptId))
      }

      // Replace the receipt lines wholesale.
      await conn.execute('DELETE FROM po_receipt_items WHERE receipt_id = ?', [receiptId])
      for (const nl of newLines) {
        await conn.execute(
          'INSERT INTO po_receipt_items (receipt_id, po_item_id, received_qty) VALUES (?,?,?)',
          [receiptId, nl.po_item_id, nl.qty]
        )
      }
    }

    await recomputeAndCascade(conn, Number(id))
    await conn.commit(); conn.release()
    res.json({ success: true, message: 'Receipt updated' })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function deleteReceipt(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id, receiptId } = req.params // po id, receipt id
    const ids = req.userBrandIds!
    const pos = await executeQuery<any>(
      `SELECT id, brand_id FROM purchase_orders WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!pos.length) { conn.release(); return res.status(404).json({ success: false, error: 'PO not found' }) }
    const brandId = pos[0].brand_id

    const receipts = await executeQuery<any>('SELECT id FROM po_receipts WHERE id = ? AND po_id = ?', [receiptId, id])
    if (!receipts.length) { conn.release(); return res.status(404).json({ success: false, error: 'Receipt not found' }) }

    const oldLines = await executeQuery<any>('SELECT po_item_id, received_qty FROM po_receipt_items WHERE receipt_id = ?', [receiptId])

    await conn.beginTransaction()
    // Reverse inventory for every line, then drop the header (lines cascade).
    for (const ol of oldLines) {
      await applyInventoryDelta(conn, brandId, ol.po_item_id, -parseFloat(ol.received_qty), req.user!.id, Number(receiptId))
    }
    await conn.execute('DELETE FROM po_receipts WHERE id = ?', [receiptId])
    await recomputeAndCascade(conn, Number(id))
    await conn.commit(); conn.release()
    res.json({ success: true, message: 'Receipt deleted' })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}
