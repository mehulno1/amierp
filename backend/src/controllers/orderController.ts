import { Response } from 'express'
import { executeQuery, pool } from '../config/database'
import { AuthRequest } from '../types'

function generateOrderId(): string {
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
}

export async function getOrders(req: AuthRequest, res: Response) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    let sql = `SELECT o.*, c.name as client_name, b.name as brand_name,
               u.name as prepared_by_name,
               f.total_amount, f.payment_received, f.payment_method,
               pi.id as pi_id
               FROM new_orders o
               JOIN new_clients c ON o.client_id = c.id
               JOIN brands b ON o.brand_id = b.id
               LEFT JOIN new_users u ON o.prepared_by = u.id
               LEFT JOIN order_financials f ON o.id = f.order_id
               LEFT JOIN proforma_invoices pi ON o.id = pi.order_id
               WHERE o.brand_id IN (${ids.map(() => '?').join(',')})`
    const params: any[] = [...ids]
    if (status) { sql += ' AND o.status = ?'; params.push(status) }
    if (search) { sql += ' AND (c.name LIKE ? OR o.order_id LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
    const limitVal = parseInt(limit as string) || 20
    const offsetVal = (parseInt(page as string) - 1) * limitVal || 0
    const countSql = `SELECT COUNT(*) as total FROM new_orders o JOIN new_clients c ON o.client_id = c.id JOIN brands b ON o.brand_id = b.id WHERE o.brand_id IN (${ids.map(() => '?').join(',')})` +
      (status ? ' AND o.status = ?' : '') + (search ? ' AND (c.name LIKE ? OR o.order_id LIKE ?)' : '')
    sql += ` ORDER BY o.created_at DESC LIMIT ${limitVal} OFFSET ${offsetVal}`
    const orders = await executeQuery(sql, params)
    const total = await executeQuery<any>(countSql, params)
    res.json({ success: true, data: orders, total: total[0]?.total || 0 })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function getOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const orders = await executeQuery<any>(
      `SELECT o.*, b.name as brand_name,
        c.name as client_name, c.contact_person, c.email as client_email, c.mobile as client_mobile, c.mobile2 as client_mobile2,
        c.gstin as client_gstin, c.billing_address, c.billing_city, c.billing_state, c.billing_zip,
        c.shipping_address, c.shipping_city, c.shipping_state, c.shipping_zip, c.dispatch_instructions
       FROM new_orders o JOIN new_clients c ON o.client_id = c.id
       JOIN brands b ON o.brand_id = b.id
       WHERE o.id = ? AND o.brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!orders.length) return res.status(404).json({ success: false, error: 'Order not found' })
    const order = orders[0]
    order.items = await executeQuery('SELECT * FROM order_items WHERE order_id = ?', [id])
    order.financials = (await executeQuery('SELECT * FROM order_financials WHERE order_id = ?', [id]))[0] || null
    order.dispatch = (await executeQuery('SELECT * FROM dispatch_details WHERE order_id = ?', [id]))[0] || null
    order.pi = (await executeQuery('SELECT pi_no, pi_date, status FROM proforma_invoices WHERE order_id = ?', [id]))[0] || null
    res.json({ success: true, data: order })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createOrder(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { brand_id, client_id, order_type, delivery_mode, delivery_date, order_date, notes, items, po_no, po_date, gst_type } = req.body
    const effectiveBrandId = Number(brand_id || req.brandId)
    if (!effectiveBrandId || !req.userBrandIds!.includes(effectiveBrandId)) {
      conn.release()
      return res.status(400).json({ success: false, error: 'Valid company required' })
    }
    const order_id = generateOrderId()
    const [result] = await conn.execute(
      'INSERT INTO new_orders (brand_id, order_id, client_id, order_type, delivery_mode, delivery_date, order_date, notes, prepared_by, gst_type) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [effectiveBrandId, order_id, client_id, order_type || 'domestic', delivery_mode ?? null, delivery_date || null, order_date, notes ?? null, req.user!.id, gst_type || 'cgst_sgst']
    ) as any[]
    const orderId = result.insertId

    for (const item of (items || [])) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_variant_id, product_name, variant_name, description, quantity_pcs, quantity_kgs, uom, rate, total) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [orderId, item.product_variant_id || null, item.product_name ?? null, item.variant_name ?? null, item.description ?? null, item.quantity_pcs || 0, item.quantity_kgs || 0, item.uom || 'pcs', item.rate ?? 0, item.total ?? 0]
      )
    }

    await conn.execute('INSERT INTO dispatch_details (order_id) VALUES (?)', [orderId])
    await conn.commit()
    conn.release()

    // Auto-generate PI
    const { generatePI } = await import('./proformaInvoiceController')
    await generatePI({ brandId: effectiveBrandId, userId: req.user!.id, orderId, po_no, po_date })

    const order = await getOrderById(orderId, effectiveBrandId)
    res.status(201).json({ success: true, data: order })
  } catch (err: any) {
    await conn.rollback()
    conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updateOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { status, delivery_mode, delivery_date, notes } = req.body
    const ids = req.userBrandIds!
    const sets: string[] = []
    const vals: any[] = []
    if (status !== undefined) { sets.push('status=?'); vals.push(status) }
    if (delivery_mode !== undefined) { sets.push('delivery_mode=?'); vals.push(delivery_mode ?? null) }
    if (delivery_date !== undefined) { sets.push('delivery_date=?'); vals.push(delivery_date || null) }
    if (notes !== undefined) { sets.push('notes=?'); vals.push(notes ?? null) }
    if (!sets.length) return res.json({ success: true, message: 'Nothing to update' })
    await executeQuery(
      `UPDATE new_orders SET ${sets.join(', ')} WHERE id=? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [...vals, id, ...ids]
    )
    res.json({ success: true, message: 'Order updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updateBilling(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { basic_amount, gst_percent, gst_amount, delivery_charges, total_amount, invoice_no, invoice_link } = req.body
    const existing = await executeQuery('SELECT id FROM order_financials WHERE order_id = ?', [id])
    if (existing.length) {
      await executeQuery(
        'UPDATE order_financials SET basic_amount=?, gst_percent=?, gst_amount=?, delivery_charges=?, total_amount=?, invoice_no=?, invoice_link=? WHERE order_id=?',
        [basic_amount, gst_percent, gst_amount, delivery_charges, total_amount, invoice_no, invoice_link, id]
      )
    } else {
      await executeQuery(
        'INSERT INTO order_financials (order_id, basic_amount, gst_percent, gst_amount, delivery_charges, total_amount, invoice_no, invoice_link) VALUES (?,?,?,?,?,?,?,?,?)',
        [id, basic_amount, gst_percent, gst_amount, delivery_charges, total_amount, invoice_no, invoice_link]
      )
    }
    res.json({ success: true, message: 'Billing updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updatePayment(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { payment_received, payment_date, payment_method, payment_link } = req.body
    await executeQuery(
      'UPDATE order_financials SET payment_received=?, payment_date=?, payment_method=?, payment_link=? WHERE order_id=?',
      [payment_received, payment_date, payment_method, payment_link, id]
    )
    res.json({ success: true, message: 'Payment updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function cancelOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const ids = req.userBrandIds!
    await executeQuery(`UPDATE new_orders SET status = 'cancelled' WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [id, ...ids])
    res.json({ success: true, message: 'Order cancelled' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function hardDeleteOrder(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params
    const ids = req.userBrandIds!
    const orders = await executeQuery<any>(`SELECT id FROM new_orders WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [id, ...ids])
    if (!orders.length) { conn.release(); return res.status(404).json({ success: false, error: 'Order not found' }) }
    await conn.beginTransaction()
    await conn.execute('DELETE FROM pi_items WHERE pi_id IN (SELECT id FROM proforma_invoices WHERE order_id = ?)', [id])
    await conn.execute('DELETE FROM proforma_invoices WHERE order_id = ?', [id])
    await conn.execute('DELETE FROM order_financials WHERE order_id = ?', [id])
    await conn.execute('DELETE FROM dispatch_details WHERE order_id = ?', [id])
    await conn.execute('DELETE FROM order_items WHERE order_id = ?', [id])
    await conn.execute('DELETE FROM new_orders WHERE id = ?', [id])
    await conn.commit()
    conn.release()
    res.json({ success: true, message: 'Order deleted' })
  } catch (err: any) {
    await conn.rollback()
    conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updateOrderItems(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params
    const ids = req.userBrandIds!
    const orders = await executeQuery<any>(`SELECT id FROM new_orders WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [id, ...ids])
    if (!orders.length) { conn.release(); return res.status(404).json({ success: false, error: 'Order not found' }) }
    const { items } = req.body
    await conn.beginTransaction()
    await conn.execute('DELETE FROM order_items WHERE order_id = ?', [id])
    for (const item of (items || [])) {
      await conn.execute(
        'INSERT INTO order_items (order_id, product_variant_id, description, quantity_pcs, quantity_kgs, uom, rate, total) VALUES (?,?,?,?,?,?,?,?)',
        [id, item.product_variant_id || null, item.description ?? null, item.quantity_pcs || 0, item.quantity_kgs || 0, item.uom || 'pcs', item.rate ?? 0, item.total ?? 0]
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

async function getOrderById(id: number, brandId: number) {
  const orders = await executeQuery<any>(
    'SELECT o.*, c.name as client_name, b.name as brand_name FROM new_orders o JOIN new_clients c ON o.client_id = c.id JOIN brands b ON o.brand_id = b.id WHERE o.id = ?',
    [id]
  )
  if (!orders.length) return null
  const order = orders[0]
  order.items = await executeQuery('SELECT * FROM order_items WHERE order_id = ?', [id])
  order.financials = (await executeQuery('SELECT * FROM order_financials WHERE order_id = ?', [id]))[0] || null
  return order
}
