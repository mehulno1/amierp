import { Response } from 'express'
import { executeQuery, pool } from '../config/database'
import { getNextDocumentNumber } from '../utils/documentSequence'
import { AuthRequest } from '../types'

export async function getRequisitions(req: AuthRequest, res: Response) {
  try {
    const { status, priority, search } = req.query
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    let sql = `SELECT r.*, u.name as created_by_name, b.name as brand_name FROM requisitions r
               JOIN new_users u ON r.created_by = u.id
               JOIN brands b ON r.brand_id = b.id
               WHERE r.brand_id IN (${ids.map(() => '?').join(',')})`
    const params: any[] = [...ids]
    if (status) { sql += ' AND r.status = ?'; params.push(status) }
    if (priority) { sql += ' AND r.priority = ?'; params.push(priority) }
    if (search) { sql += ' AND (r.indent_no LIKE ? OR r.machine_area LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
    sql += ' ORDER BY r.created_at DESC'
    const requisitions = await executeQuery(sql, params)
    for (const r of requisitions as any[]) {
      r.items = await executeQuery('SELECT * FROM requisition_items WHERE requisition_id = ?', [r.id])
    }
    res.json({ success: true, data: requisitions })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function getRequisition(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const rows = await executeQuery<any>(
      `SELECT r.*, u.name as created_by_name, b.name as brand_name FROM requisitions r JOIN new_users u ON r.created_by = u.id JOIN brands b ON r.brand_id = b.id WHERE r.id = ? AND r.brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' })
    const req_ = rows[0]
    req_.items = await executeQuery('SELECT * FROM requisition_items WHERE requisition_id = ?', [id])
    req_.quotations = await executeQuery<any>(
      'SELECT vq.*, v.name as vendor_name FROM vendor_quotations vq JOIN vendors v ON vq.vendor_id = v.id WHERE vq.requisition_id = ?',
      [id]
    )
    for (const q of req_.quotations) {
      q.items = await executeQuery('SELECT * FROM vendor_quotation_items WHERE quotation_id = ?', [q.id])
    }
    res.json({ success: true, data: req_ })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createRequisition(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { brand_id, machine_area, priority, reminder_date, notes, items } = req.body
    const effectiveBrandId = Number(brand_id || req.brandId)
    if (!effectiveBrandId || !req.userBrandIds!.includes(effectiveBrandId)) {
      conn.release()
      return res.status(400).json({ success: false, error: 'Valid company required' })
    }
    const indent_no = await getNextDocumentNumber(effectiveBrandId, 'AEPL/IND')
    const [result] = await conn.execute(
      "INSERT INTO requisitions (brand_id, indent_no, created_by, machine_area, priority, reminder_date, notes, status) VALUES (?,?,?,?,?,?,?,'pending_approval')",
      [effectiveBrandId, indent_no, req.user!.id, machine_area ?? null, priority || 'normal', reminder_date || null, notes ?? null]
    ) as any[]
    const reqId = result.insertId
    for (const item of (items || [])) {
      await conn.execute(
        'INSERT INTO requisition_items (requisition_id, spare_part_id, description, area, qty, uom, no_of_days) VALUES (?,?,?,?,?,?,?)',
        [reqId, item.spare_part_id || null, item.description, item.area ?? null, item.qty, item.uom || 'nos', item.no_of_days ?? null]
      )
    }
    await conn.commit()
    conn.release()
    res.status(201).json({ success: true, data: { id: reqId, indent_no } })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updateRequisitionStatus(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params
    const { status, notes } = req.body
    const ids = req.userBrandIds!

    // A requisition awaiting approval (or rejected) can only move via the dedicated
    // approve/reject/resubmit endpoints — never through the generic status dropdown.
    const cur = await executeQuery<any>(
      `SELECT status FROM requisitions WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!cur.length) { conn.release(); return res.status(404).json({ success: false, error: 'Not found' }) }
    if (['pending_approval', 'rejected'].includes(cur[0].status)) {
      conn.release()
      return res.status(400).json({ success: false, error: 'Requisition must be approved first' })
    }

    await conn.beginTransaction()
    await conn.execute(
      `UPDATE requisitions SET status = ?, notes = COALESCE(?, notes) WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [status, notes ?? null, id, ...ids]
    )

    // When a requisition is marked delivered, credit the spare-parts inventory for every
    // item that's linked to a spare part. We only credit the *outstanding* quantity
    // (qty - received_qty) so flipping the status back and forth doesn't double-count.
    // The GRN flow (po_receipts) is now the single inventory-crediting path. If any goods
    // receipt exists for this requisition's PO, that flow already credited inventory and
    // maintains received_qty — so skip the legacy credit here to avoid double-counting.
    // The legacy credit remains ONLY for no-PO / manually-closed requisitions.
    const [grnRows] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM po_receipts pr
       JOIN purchase_orders po ON po.id = pr.po_id
       WHERE po.requisition_id = ?`,
      [id]
    ) as any[]
    const hasGrn = (grnRows as any[])[0].cnt > 0
    if (status === 'delivered' && !hasGrn) {
      const [itemsRows] = await conn.execute(
        'SELECT id, spare_part_id, qty, received_qty FROM requisition_items WHERE requisition_id = ?',
        [id]
      ) as any[]
      for (const item of itemsRows as any[]) {
        if (!item.spare_part_id) continue
        const outstanding = Math.max(0, parseFloat(item.qty) - parseFloat(item.received_qty || 0))
        if (outstanding <= 0) continue
        const [invRows] = await conn.execute(
          'SELECT id, brand_id, uom, current_stock, current_stock_kgs FROM inventory_items WHERE id = ? AND is_active = 1',
          [item.spare_part_id]
        ) as any[]
        if (!(invRows as any[]).length) continue
        const inv = (invRows as any[])[0]
        // Credit the dimension matching the item's unit: weight units -> kgs, else pcs.
        const isKgs = inv.uom === 'kgs' || inv.uom === 'gms'
        const beforePcs = parseFloat(inv.current_stock)
        const beforeKgs = parseFloat(inv.current_stock_kgs)
        const afterPcs = isKgs ? beforePcs : beforePcs + outstanding
        const afterKgs = isKgs ? beforeKgs + outstanding : beforeKgs
        await conn.execute('UPDATE inventory_items SET current_stock = ?, current_stock_kgs = ? WHERE id = ?', [afterPcs, afterKgs, inv.id])
        await conn.execute(
          `INSERT INTO inventory_transactions (brand_id, inventory_item_id, transaction_type, quantity, quantity_kgs, notes, created_by, stock_before, stock_after, stock_before_kgs, stock_after_kgs)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [inv.brand_id, inv.id, 'purchase', isKgs ? 0 : outstanding, isKgs ? outstanding : 0, `Requisition #${id} delivered`, req.user!.id, beforePcs, afterPcs, beforeKgs, afterKgs]
        )
        await conn.execute('UPDATE requisition_items SET received_qty = qty WHERE id = ?', [item.id])
      }
    }

    await conn.commit(); conn.release()
    res.json({ success: true, message: 'Status updated' })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function addVendorQuotation(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { id: requisitionId } = req.params
    const { vendor_id, quotation_date, validity_date, notes, items } = req.body
    const reqRow = await executeQuery<any>('SELECT brand_id, status FROM requisitions WHERE id = ?', [requisitionId])
    if (['pending_approval', 'rejected'].includes(reqRow[0]?.status)) {
      conn.release()
      return res.status(400).json({ success: false, error: 'Requisition must be approved before adding quotations' })
    }
    const quotBrandId = reqRow[0]?.brand_id || req.userBrandIds![0]
    const [result] = await conn.execute(
      'INSERT INTO vendor_quotations (brand_id, requisition_id, vendor_id, quotation_date, validity_date, notes, created_by) VALUES (?,?,?,?,?,?,?)',
      [quotBrandId, requisitionId, vendor_id, quotation_date, validity_date || null, notes ?? null, req.user!.id]
    ) as any[]
    const quotationId = result.insertId
    for (const item of (items || [])) {
      await conn.execute(
        'INSERT INTO vendor_quotation_items (quotation_id, requisition_item_id, rate, uom, delivery_days, remarks) VALUES (?,?,?,?,?,?)',
        [quotationId, item.requisition_item_id, item.rate ?? 0, item.uom ?? null, item.delivery_days ?? null, item.remarks ?? null]
      )
    }
    await conn.execute("UPDATE requisitions SET status = 'quotation_received' WHERE id = ? AND status IN ('pending','quotation_pending')", [requisitionId])
    await conn.commit(); conn.release()
    res.status(201).json({ success: true, data: { quotation_id: quotationId } })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function hardDeleteRequisition(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params
    const ids = req.userBrandIds!
    const rows = await executeQuery<any>(`SELECT id FROM requisitions WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [id, ...ids])
    if (!rows.length) { conn.release(); return res.status(404).json({ success: false, error: 'Not found' }) }
    await conn.beginTransaction()
    const quotations = await executeQuery<any>('SELECT id FROM vendor_quotations WHERE requisition_id = ?', [id])
    for (const q of quotations) {
      await conn.execute('DELETE FROM vendor_quotation_items WHERE quotation_id = ?', [q.id])
    }
    await conn.execute('DELETE FROM vendor_quotations WHERE requisition_id = ?', [id])
    await conn.execute('DELETE FROM requisition_items WHERE requisition_id = ?', [id])
    await conn.execute('DELETE FROM requisitions WHERE id = ?', [id])
    await conn.commit()
    conn.release()
    res.json({ success: true, message: 'Requisition deleted' })
  } catch (err: any) {
    await conn.rollback()
    conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updateRequisitionItems(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params
    const ids = req.userBrandIds!
    const rows = await executeQuery<any>(`SELECT id, created_by, status FROM requisitions WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [id, ...ids])
    if (!rows.length) { conn.release(); return res.status(404).json({ success: false, error: 'Not found' }) }
    // super_admin can edit any requisition's items; the creator may edit their own only
    // while it is still awaiting approval or has been rejected (i.e. before procurement).
    const r = rows[0]
    const isCreatorEditable = r.created_by === req.user!.id && ['pending_approval', 'rejected'].includes(r.status)
    if (req.user!.role !== 'super_admin' && !isCreatorEditable) {
      conn.release()
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
    const { items } = req.body
    await conn.beginTransaction()
    await conn.execute('DELETE FROM requisition_items WHERE requisition_id = ?', [id])
    for (const item of (items || [])) {
      await conn.execute(
        'INSERT INTO requisition_items (requisition_id, spare_part_id, description, area, qty, uom, no_of_days) VALUES (?,?,?,?,?,?,?)',
        [id, item.spare_part_id || null, item.description, item.area ?? null, item.qty, item.uom || 'nos', item.no_of_days ?? null]
      )
    }
    await conn.commit()
    conn.release()
    res.json({ success: true, message: 'Items updated' })
  } catch (err: any) {
    await conn.rollback()
    conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function deleteVendorQuotation(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { quotationId } = req.params
    await conn.beginTransaction()
    await conn.execute('DELETE FROM vendor_quotation_items WHERE quotation_id = ?', [quotationId])
    await conn.execute('DELETE FROM vendor_quotations WHERE id = ?', [quotationId])
    await conn.commit()
    conn.release()
    res.json({ success: true, message: 'Quotation deleted' })
  } catch (err: any) {
    await conn.rollback()
    conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function selectQuotation(req: AuthRequest, res: Response) {
  try {
    const { id: requisitionId, quotationId } = req.params
    await executeQuery("UPDATE vendor_quotations SET status = 'rejected' WHERE requisition_id = ?", [requisitionId])
    await executeQuery("UPDATE vendor_quotations SET status = 'selected' WHERE id = ?", [quotationId])
    await executeQuery("UPDATE requisitions SET status = 'po_raised' WHERE id = ?", [requisitionId])
    res.json({ success: true, message: 'Quotation selected' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

// ── Approval flow ──────────────────────────────────────────────────────────
// A requisition created by a normal user sits in 'pending_approval' until a user with
// the approve right approves it (→ 'pending', the normal start of procurement) or
// rejects it with a reason (→ 'rejected'). The creator can then edit and resubmit.

export async function approveRequisition(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const ids = req.userBrandIds!
    const result = await executeQuery<any>(
      `UPDATE requisitions SET status = 'pending', approved_by = ?, approved_at = NOW(), rejection_reason = NULL
       WHERE id = ? AND status = 'pending_approval' AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [req.user!.id, id, ...ids]
    )
    if (!(result as any).affectedRows) return res.status(400).json({ success: false, error: 'Requisition is not awaiting approval' })
    res.json({ success: true, message: 'Requisition approved' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function rejectRequisition(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { reason } = req.body
    if (!reason || !String(reason).trim()) return res.status(400).json({ success: false, error: 'Rejection reason required' })
    const ids = req.userBrandIds!
    const result = await executeQuery<any>(
      `UPDATE requisitions SET status = 'rejected', rejection_reason = ?, approved_by = ?, approved_at = NOW()
       WHERE id = ? AND status = 'pending_approval' AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [reason, req.user!.id, id, ...ids]
    )
    if (!(result as any).affectedRows) return res.status(400).json({ success: false, error: 'Requisition is not awaiting approval' })
    res.json({ success: true, message: 'Requisition rejected' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function resubmitRequisition(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const ids = req.userBrandIds!
    const rows = await executeQuery<any>(
      `SELECT created_by, status FROM requisitions WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' })
    if (rows[0].status !== 'rejected') return res.status(400).json({ success: false, error: 'Only a rejected requisition can be resubmitted' })
    const isAllowed = rows[0].created_by === req.user!.id || ['super_admin', 'admin'].includes(req.user!.role)
    if (!isAllowed) return res.status(403).json({ success: false, error: 'Forbidden' })
    await executeQuery(
      "UPDATE requisitions SET status = 'pending_approval', rejection_reason = NULL, approved_by = NULL, approved_at = NULL WHERE id = ?",
      [id]
    )
    res.json({ success: true, message: 'Requisition resubmitted for approval' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
