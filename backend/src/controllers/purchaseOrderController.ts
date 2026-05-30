import { Response } from 'express'
import { executeQuery, pool } from '../config/database'
import { getNextDocumentNumber } from '../utils/documentSequence'
import { AuthRequest } from '../types'

export async function getPurchaseOrders(req: AuthRequest, res: Response) {
  try {
    const { status } = req.query
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    let sql = `SELECT po.*, v.name as vendor_name, b.name as brand_name FROM purchase_orders po JOIN vendors v ON po.vendor_id = v.id JOIN brands b ON po.brand_id = b.id WHERE po.brand_id IN (${ids.map(() => '?').join(',')})`
    const params: any[] = [...ids]
    if (status) { sql += ' AND po.status = ?'; params.push(status) }
    sql += ' ORDER BY po.created_at DESC'
    const pos = await executeQuery(sql, params)
    res.json({ success: true, data: pos })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function getPurchaseOrder(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const pos = await executeQuery<any>(
      `SELECT po.*, v.name as vendor_name, v.contact_person as vendor_contact, v.address as vendor_address, v.city as vendor_city, v.mobile as vendor_mobile, v.gstin as vendor_gstin,
              b.name as brand_name, b.address as brand_address, b.phone as brand_phone, b.email as brand_email, b.gstin as brand_gstin, b.pan as brand_pan
       FROM purchase_orders po JOIN vendors v ON po.vendor_id = v.id JOIN brands b ON po.brand_id = b.id WHERE po.id = ? AND po.brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!pos.length) return res.status(404).json({ success: false, error: 'PO not found' })
    const po = pos[0]
    po.items = await executeQuery('SELECT * FROM purchase_order_items WHERE po_id = ?', [id])
    res.json({ success: true, data: po })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createPurchaseOrder(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { brand_id, requisition_id, vendor_quotation_id, vendor_id, po_date, quotation_no, quotation_date,
      gst_percent, terms_gst, terms_delivery, terms_delivery_instructions, terms_supply_basis, terms_payment, notes, items } = req.body

    const effectiveBrandId = Number(brand_id || req.brandId)
    if (!effectiveBrandId || !req.userBrandIds!.includes(effectiveBrandId)) {
      conn.release()
      return res.status(400).json({ success: false, error: 'Valid company required' })
    }
    const po_no = await getNextDocumentNumber(effectiveBrandId, 'AEPL/OFF')

    const [result] = await conn.execute(
      `INSERT INTO purchase_orders (brand_id, po_no, requisition_id, vendor_quotation_id, vendor_id, po_date, quotation_no, quotation_date, gst_percent, terms_gst, terms_delivery, terms_delivery_instructions, terms_supply_basis, terms_payment, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [effectiveBrandId, po_no, requisition_id || null, vendor_quotation_id || null, vendor_id, po_date, quotation_no, quotation_date || null,
       gst_percent || 18, terms_gst ?? null, terms_delivery ?? null, terms_delivery_instructions ?? null, terms_supply_basis ?? null, terms_payment ?? null, notes ?? null, req.user!.id]
    ) as any[]
    const poId = result.insertId

    for (const item of (items || [])) {
      const qty = parseFloat(item.qty) || 0
      const rate = parseFloat(item.rate) || 0
      const total = parseFloat((qty * rate).toFixed(2))
      await conn.execute(
        'INSERT INTO purchase_order_items (po_id, material_no, description, qty, uom, rate, total) VALUES (?,?,?,?,?,?,?)',
        [poId, item.material_no ?? null, item.description, qty, item.uom || 'nos', rate, total]
      )
    }
    await conn.commit(); conn.release()
    res.status(201).json({ success: true, data: { id: poId, po_no } })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updatePurchaseOrder(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params
    const ids = req.userBrandIds!
    const rows = await executeQuery<any>(
      `SELECT id, brand_id FROM purchase_orders WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!rows.length) { conn.release(); return res.status(404).json({ success: false, error: 'PO not found' }) }

    const { vendor_id, po_date, quotation_no, quotation_date, gst_percent,
      terms_gst, terms_delivery, terms_delivery_instructions, terms_supply_basis, terms_payment, notes, items } = req.body

    await conn.beginTransaction()
    await conn.execute(
      `UPDATE purchase_orders SET vendor_id=?, po_date=?, quotation_no=?, quotation_date=?, gst_percent=?,
       terms_gst=?, terms_delivery=?, terms_delivery_instructions=?, terms_supply_basis=?, terms_payment=?, notes=? WHERE id=?`,
      [vendor_id, po_date, quotation_no ?? null, quotation_date || null, gst_percent ?? 18,
       terms_gst ?? null, terms_delivery ?? null, terms_delivery_instructions ?? null, terms_supply_basis ?? null, terms_payment ?? null, notes ?? null, id]
    )
    if (Array.isArray(items)) {
      // Replace the line items wholesale — easier than reconciling row IDs and the PO is
      // not delivery-tracked yet at this stage in the flow.
      await conn.execute('DELETE FROM purchase_order_items WHERE po_id = ?', [id])
      for (const item of items) {
        const qty = parseFloat(item.qty) || 0
        const rate = parseFloat(item.rate) || 0
        const total = parseFloat((qty * rate).toFixed(2))
        await conn.execute(
          'INSERT INTO purchase_order_items (po_id, material_no, description, qty, uom, rate, total) VALUES (?,?,?,?,?,?,?)',
          [id, item.material_no ?? null, item.description, qty, item.uom || 'nos', rate, total]
        )
      }
    }
    await conn.commit(); conn.release()
    res.json({ success: true, message: 'PO updated' })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function deletePurchaseOrder(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params
    const ids = req.userBrandIds!
    const rows = await executeQuery<any>(`SELECT id FROM purchase_orders WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [id, ...ids])
    if (!rows.length) { conn.release(); return res.status(404).json({ success: false, error: 'PO not found' }) }
    await conn.beginTransaction()
    await conn.execute('DELETE FROM purchase_order_items WHERE po_id = ?', [id])
    await conn.execute('DELETE FROM purchase_orders WHERE id = ?', [id])
    await conn.commit(); conn.release()
    res.json({ success: true, message: 'PO deleted' })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updatePOStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { status } = req.body
    const ids = req.userBrandIds!
    await executeQuery(`UPDATE purchase_orders SET status = ? WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [status, id, ...ids])
    res.json({ success: true, message: 'PO status updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updateReceivedQty(req: AuthRequest, res: Response) {
  try {
    const { id, item_id } = req.params
    const { received_qty } = req.body
    await executeQuery('UPDATE purchase_order_items SET received_qty = ? WHERE id = ? AND po_id = ?', [received_qty, item_id, id])
    // Check if all items fully received → update PO status
    const items = await executeQuery<any>('SELECT qty, received_qty FROM purchase_order_items WHERE po_id = ?', [id])
    const allDelivered = items.every((i: any) => i.received_qty >= i.qty)
    const anyDelivered = items.some((i: any) => i.received_qty > 0)
    if (allDelivered) {
      await executeQuery("UPDATE purchase_orders SET status = 'delivered' WHERE id = ?", [id])
      // update requisition status
      const pos = await executeQuery<any>('SELECT requisition_id FROM purchase_orders WHERE id = ?', [id])
      if (pos[0]?.requisition_id) {
        await executeQuery("UPDATE requisitions SET status = 'delivered' WHERE id = ?", [pos[0].requisition_id])
      }
    } else if (anyDelivered) {
      await executeQuery("UPDATE purchase_orders SET status = 'partially_delivered' WHERE id = ?", [id])
      const pos = await executeQuery<any>('SELECT requisition_id FROM purchase_orders WHERE id = ?', [id])
      if (pos[0]?.requisition_id) {
        await executeQuery("UPDATE requisitions SET status = 'partially_delivered' WHERE id = ?", [pos[0].requisition_id])
      }
    }
    res.json({ success: true, message: 'Received qty updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
