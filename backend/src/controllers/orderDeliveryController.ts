import { Response } from 'express'
import { executeQuery, pool } from '../config/database'
import { AuthRequest } from '../types'
import type { PoolConnection } from 'mysql2/promise'

// kgs comparison tolerance — DECIMAL(10,3) means 3 dp, so anything under half a milli-unit
// is rounding noise, not a real shortfall.
const KGS_EPSILON = 0.0005

// Drive fulfilment off pcs for piece-counted lines and off kgs for weight lines, matching the
// frontend rule (CreateOrderModal / OrderDetail): uom in (kgs, mt) => kgs, else pcs.
function isKgsDriven(uom: string | null | undefined): boolean {
  const u = (uom || '').toLowerCase()
  return u === 'kgs' || u === 'mt'
}

// Recompute the cached delivered_pcs/kgs on every order line from scratch (never incrementally)
// and derive the order status. Self-healing: a wrong cache is corrected on the next call.
// - allDelivered: every line meets its ordered qty on its driving unit
// - anyDelivered: at least one line has any delivered qty
// Status moves to 'dispatched' (all) or 'partially_dispatched' (some), but only out of an
// in-flight status — completed/cancelled orders are left alone. When nothing is delivered the
// status is rolled back to 'ready_for_dispatch' (used by deleteDelivery / full-line removal).
async function recomputeDeliveryState(conn: PoolConnection, orderId: number, changedBy: number | null) {
  // Recompute the cache from the delivery items.
  await conn.execute(
    `UPDATE order_items oi SET
       delivered_pcs = (SELECT COALESCE(SUM(di.quantity_pcs),0) FROM order_delivery_items di WHERE di.order_item_id = oi.id),
       delivered_kgs = (SELECT COALESCE(SUM(di.quantity_kgs),0) FROM order_delivery_items di WHERE di.order_item_id = oi.id)
     WHERE oi.order_id = ?`,
    [orderId]
  )

  const [items] = await conn.execute(
    'SELECT quantity_pcs, quantity_kgs, uom, delivered_pcs, delivered_kgs FROM order_items WHERE order_id = ?',
    [orderId]
  ) as any[]

  let allDelivered = items.length > 0
  let anyDelivered = false
  for (const it of items) {
    if (isKgsDriven(it.uom)) {
      const ordered = Number(it.quantity_kgs) || 0
      const delivered = Number(it.delivered_kgs) || 0
      if (delivered + KGS_EPSILON < ordered) allDelivered = false
      if (delivered > KGS_EPSILON) anyDelivered = true
    } else {
      const ordered = Number(it.quantity_pcs) || 0
      const delivered = Number(it.delivered_pcs) || 0
      if (delivered < ordered) allDelivered = false
      if (delivered > 0) anyDelivered = true
    }
  }

  const newStatus = allDelivered ? 'dispatched' : (anyDelivered ? 'partially_dispatched' : 'ready_for_dispatch')

  // Read current status so we can record an accurate history row and skip no-op transitions.
  const [curRows] = await conn.execute(
    "SELECT status FROM new_orders WHERE id = ? AND status NOT IN ('completed','cancelled')",
    [orderId]
  ) as any[]
  if (!curRows.length) return // completed/cancelled — leave untouched
  const oldStatus = curRows[0].status
  if (oldStatus === newStatus) return

  await conn.execute(
    "UPDATE new_orders SET status = ? WHERE id = ? AND status NOT IN ('completed','cancelled')",
    [newStatus, orderId]
  )
  await conn.execute(
    'INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes) VALUES (?,?,?,?,?)',
    [orderId, oldStatus, newStatus, changedBy, 'Delivery update']
  )
}

// Load an order the caller is allowed to see, or null. Brand-scoped.
async function loadScopedOrder(req: AuthRequest, id: string | number) {
  const ids = req.brandId ? [req.brandId] : req.userBrandIds!
  const rows = await executeQuery<any>(
    `SELECT id, status FROM new_orders WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
    [id, ...ids]
  )
  return rows[0] || null
}

// Fetch deliveries (headers + nested items) for an order, items joined to order_items so the
// caller has the line description, ordered quantities and uom alongside the delivered qty.
async function fetchDeliveries(orderId: string | number) {
  const deliveries = await executeQuery<any>(
    'SELECT * FROM order_deliveries WHERE order_id = ? ORDER BY delivery_no ASC',
    [orderId]
  )
  for (const d of deliveries) {
    d.items = await executeQuery<any>(
      `SELECT di.id, di.delivery_id, di.order_item_id, di.quantity_pcs, di.quantity_kgs,
              oi.description, oi.product_name, oi.variant_name, oi.uom,
              oi.quantity_pcs AS ordered_pcs, oi.quantity_kgs AS ordered_kgs
       FROM order_delivery_items di
       JOIN order_items oi ON di.order_item_id = oi.id
       WHERE di.delivery_id = ?
       ORDER BY di.id ASC`,
      [d.id]
    )
  }
  return deliveries
}

export async function listDeliveries(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const order = await loadScopedOrder(req, id)
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' })
    const deliveries = await fetchDeliveries(id)
    res.json({ success: true, data: deliveries })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

// Validate posted lines against the order, enforcing the over-delivery guard. `excludeDeliveryId`
// removes a delivery's own existing quantities from the baseline (used on update so editing a
// delivery doesn't count against itself). Returns { error } or { lines } (non-zero lines only).
async function validateAndPrepareLines(
  conn: PoolConnection,
  orderId: string | number,
  postedLines: any[],
  excludeDeliveryId: number | null
): Promise<{ error?: string; status?: number; lines?: { order_item_id: number; quantity_pcs: number; quantity_kgs: number }[] }> {
  const [orderItems] = await conn.execute(
    'SELECT id, description, product_name, quantity_pcs, quantity_kgs, uom FROM order_items WHERE order_id = ?',
    [orderId]
  ) as any[]
  const itemById = new Map<number, any>(orderItems.map((oi: any) => [oi.id, oi]))

  // Already-delivered baseline per line, optionally excluding this delivery's own lines.
  let baselineSql =
    `SELECT di.order_item_id, COALESCE(SUM(di.quantity_pcs),0) AS d_pcs, COALESCE(SUM(di.quantity_kgs),0) AS d_kgs
     FROM order_delivery_items di
     JOIN order_deliveries od ON di.delivery_id = od.id
     WHERE od.order_id = ?`
  const baselineParams: any[] = [orderId]
  if (excludeDeliveryId != null) { baselineSql += ' AND od.id <> ?'; baselineParams.push(excludeDeliveryId) }
  baselineSql += ' GROUP BY di.order_item_id'
  const [baselineRows] = await conn.execute(baselineSql, baselineParams) as any[]
  const baseline = new Map<number, { pcs: number; kgs: number }>()
  for (const r of baselineRows) baseline.set(r.order_item_id, { pcs: Number(r.d_pcs) || 0, kgs: Number(r.d_kgs) || 0 })

  const prepared: { order_item_id: number; quantity_pcs: number; quantity_kgs: number }[] = []
  let anyPositive = false

  for (const line of postedLines) {
    const orderItemId = Number(line.order_item_id)
    const oi = itemById.get(orderItemId)
    if (!oi) return { error: `Invalid order item ${line.order_item_id} for this order`, status: 400 }

    const qtyPcs = Math.trunc(Number(line.quantity_pcs) || 0)
    const qtyKgs = Number(line.quantity_kgs) || 0
    if (qtyPcs < 0 || qtyKgs < 0) return { error: `Negative quantity not allowed for "${oi.description || oi.product_name || orderItemId}"`, status: 400 }

    const prior = baseline.get(orderItemId) || { pcs: 0, kgs: 0 }
    const label = oi.description || oi.product_name || `item ${orderItemId}`

    if (isKgsDriven(oi.uom)) {
      const ordered = Number(oi.quantity_kgs) || 0
      if (prior.kgs + qtyKgs > ordered + KGS_EPSILON) {
        return { error: `Over-delivery on "${label}": ${(prior.kgs + qtyKgs).toFixed(3)} kgs exceeds ordered ${ordered.toFixed(3)} kgs`, status: 400 }
      }
      if (qtyKgs > KGS_EPSILON) anyPositive = true
    } else {
      const ordered = Number(oi.quantity_pcs) || 0
      if (prior.pcs + qtyPcs > ordered) {
        return { error: `Over-delivery on "${label}": ${prior.pcs + qtyPcs} pcs exceeds ordered ${ordered} pcs`, status: 400 }
      }
      if (qtyPcs > 0) anyPositive = true
    }

    // Persist only non-zero lines.
    if (qtyPcs > 0 || qtyKgs > KGS_EPSILON) prepared.push({ order_item_id: orderItemId, quantity_pcs: qtyPcs, quantity_kgs: qtyKgs })
  }

  if (!anyPositive) return { error: 'A delivery must contain at least one non-zero quantity', status: 400 }
  return { lines: prepared }
}

export async function createDelivery(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params
    const order = await loadScopedOrder(req, id)
    if (!order) { conn.release(); return res.status(404).json({ success: false, error: 'Order not found' }) }
    if (order.status === 'cancelled') { conn.release(); return res.status(400).json({ success: false, error: 'Cannot add a delivery to a cancelled order' }) }

    const { delivery_date, dispatched_by, courier_name, transporter, awb_number, awb_link, lr_link, vehicle_no, notes, items } = req.body
    if (!delivery_date) { conn.release(); return res.status(400).json({ success: false, error: 'delivery_date is required' }) }
    if (!Array.isArray(items) || !items.length) { conn.release(); return res.status(400).json({ success: false, error: 'At least one delivery line is required' }) }

    await conn.beginTransaction()
    const check = await validateAndPrepareLines(conn, id, items, null)
    if (check.error) { await conn.rollback(); conn.release(); return res.status(check.status || 400).json({ success: false, error: check.error }) }

    const [maxRows] = await conn.execute('SELECT COALESCE(MAX(delivery_no),0) AS m FROM order_deliveries WHERE order_id = ?', [id]) as any[]
    const deliveryNo = (Number(maxRows[0].m) || 0) + 1

    const [result] = await conn.execute(
      `INSERT INTO order_deliveries (order_id, delivery_no, delivery_date, dispatched_by, courier_name, transporter, awb_number, awb_link, lr_link, vehicle_no, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, deliveryNo, delivery_date, dispatched_by ?? null, courier_name ?? null, transporter ?? null, awb_number ?? null, awb_link ?? null, lr_link ?? null, vehicle_no ?? null, notes ?? null, req.user!.id]
    ) as any[]
    const deliveryId = result.insertId

    for (const line of check.lines!) {
      await conn.execute(
        'INSERT INTO order_delivery_items (delivery_id, order_item_id, quantity_pcs, quantity_kgs) VALUES (?,?,?,?)',
        [deliveryId, line.order_item_id, line.quantity_pcs, line.quantity_kgs]
      )
    }

    await recomputeDeliveryState(conn, Number(id), req.user!.id)
    await conn.commit()
    conn.release()

    const deliveries = await fetchDeliveries(id)
    res.status(201).json({ success: true, data: deliveries.find((d: any) => d.id === deliveryId) || null })
  } catch (err: any) {
    await conn.rollback()
    conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updateDelivery(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id, deliveryId } = req.params
    const order = await loadScopedOrder(req, id)
    if (!order) { conn.release(); return res.status(404).json({ success: false, error: 'Order not found' }) }
    if (order.status === 'cancelled') { conn.release(); return res.status(400).json({ success: false, error: 'Cannot edit a delivery on a cancelled order' }) }

    const existing = await executeQuery<any>('SELECT id FROM order_deliveries WHERE id = ? AND order_id = ?', [deliveryId, id])
    if (!existing.length) { conn.release(); return res.status(404).json({ success: false, error: 'Delivery not found' }) }

    const { delivery_date, dispatched_by, courier_name, transporter, awb_number, awb_link, lr_link, vehicle_no, notes, items } = req.body
    if (!delivery_date) { conn.release(); return res.status(400).json({ success: false, error: 'delivery_date is required' }) }
    if (!Array.isArray(items) || !items.length) { conn.release(); return res.status(400).json({ success: false, error: 'At least one delivery line is required' }) }

    await conn.beginTransaction()
    // Baseline excludes this delivery's own prior lines so an edit isn't penalised against itself.
    const check = await validateAndPrepareLines(conn, id, items, Number(deliveryId))
    if (check.error) { await conn.rollback(); conn.release(); return res.status(check.status || 400).json({ success: false, error: check.error }) }

    await conn.execute(
      `UPDATE order_deliveries SET delivery_date=?, dispatched_by=?, courier_name=?, transporter=?, awb_number=?, awb_link=?, lr_link=?, vehicle_no=?, notes=?
       WHERE id=? AND order_id=?`,
      [delivery_date, dispatched_by ?? null, courier_name ?? null, transporter ?? null, awb_number ?? null, awb_link ?? null, lr_link ?? null, vehicle_no ?? null, notes ?? null, deliveryId, id]
    )

    // Wholesale replace of lines.
    await conn.execute('DELETE FROM order_delivery_items WHERE delivery_id = ?', [deliveryId])
    for (const line of check.lines!) {
      await conn.execute(
        'INSERT INTO order_delivery_items (delivery_id, order_item_id, quantity_pcs, quantity_kgs) VALUES (?,?,?,?)',
        [deliveryId, line.order_item_id, line.quantity_pcs, line.quantity_kgs]
      )
    }

    await recomputeDeliveryState(conn, Number(id), req.user!.id)
    await conn.commit()
    conn.release()

    const deliveries = await fetchDeliveries(id)
    res.json({ success: true, data: deliveries.find((d: any) => d.id === Number(deliveryId)) || null })
  } catch (err: any) {
    await conn.rollback()
    conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function deleteDelivery(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id, deliveryId } = req.params
    const order = await loadScopedOrder(req, id)
    if (!order) { conn.release(); return res.status(404).json({ success: false, error: 'Order not found' }) }

    const existing = await executeQuery<any>('SELECT id FROM order_deliveries WHERE id = ? AND order_id = ?', [deliveryId, id])
    if (!existing.length) { conn.release(); return res.status(404).json({ success: false, error: 'Delivery not found' }) }

    await conn.beginTransaction()
    // Cascade removes order_delivery_items.
    await conn.execute('DELETE FROM order_deliveries WHERE id = ? AND order_id = ?', [deliveryId, id])
    // Recompute drops status to partially_dispatched, or back to ready_for_dispatch when nothing remains.
    await recomputeDeliveryState(conn, Number(id), req.user!.id)
    await conn.commit()
    conn.release()
    res.json({ success: true, message: 'Delivery deleted' })
  } catch (err: any) {
    await conn.rollback()
    conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}
