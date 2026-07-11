import { Response } from 'express'
import { executeQuery, pool } from '../config/database'
import { getNextDocumentNumber } from '../utils/documentSequence'
import { numberToWords } from '../utils/amountInWords'
import { sendPIEmail } from '../utils/emailService'
import { AuthRequest } from '../types'

interface GeneratePIParams {
  brandId: number
  userId: number
  orderId: number
  po_no?: string
  po_date?: string
  gst_percent?: number
  bank_id?: number
}

export async function generatePI(params: GeneratePIParams): Promise<void> {
  const { brandId, userId, orderId, po_no, po_date, gst_percent = 18 } = params

  const orders = await executeQuery<any>(
    `SELECT o.*, c.name as client_name, c.email as client_email, c.billing_address, c.billing_city, c.billing_state, c.gstin as client_gstin
     FROM new_orders o JOIN new_clients c ON o.client_id = c.id WHERE o.id = ? AND o.brand_id = ?`,
    [orderId, brandId]
  )
  if (!orders.length) return
  const order = orders[0]
  const items = await executeQuery<any>('SELECT * FROM order_items WHERE order_id = ?', [orderId])
  const brand = await executeQuery<any>('SELECT * FROM brands WHERE id = ?', [brandId])
  const brandData = brand[0]

  // Resolve bank for this PI. Priority: caller-supplied bank_id → order.bank_id →
  // brand's default bank → legacy bank columns on the brand row. The PI snapshots
  // text fields so historical PIs stay stable even if the bank record is later edited.
  const bankIdToUse = params.bank_id ?? order.bank_id ?? null
  let bankSnap: any = null
  if (bankIdToUse) {
    const b = await executeQuery<any>('SELECT * FROM brand_banks WHERE id = ? AND brand_id = ?', [bankIdToUse, brandId])
    bankSnap = b[0] || null
  }
  if (!bankSnap) {
    const def = await executeQuery<any>(
      'SELECT * FROM brand_banks WHERE brand_id = ? AND is_active = 1 ORDER BY is_default DESC, id LIMIT 1',
      [brandId]
    )
    bankSnap = def[0] || null
  }
  const bank = bankSnap ?? {
    bank_name: brandData?.bank_name,
    account_name: brandData?.account_name,
    account_no: brandData?.account_no,
    ifsc_code: brandData?.ifsc_code,
    swift_code: brandData?.swift_code,
  }

  // GST % is driven by the order's gst_type: a "none" type is a 0% (zero-rated /
  // export) invoice; everything else uses the standard rate. Currency follows the
  // order type — export invoices are billed in USD, domestic in INR.
  const effective_gst_percent = order.gst_type === 'none' ? 0 : gst_percent
  const currency = order.order_type === 'export' ? 'USD' : 'INR'

  const basic_total = items.reduce((sum: number, i: any) => sum + parseFloat(i.total), 0)
  const gst_amount = (basic_total * effective_gst_percent) / 100
  const total_amount = basic_total + gst_amount
  const amount_in_words = numberToWords(total_amount, currency)
  const pi_no = await getNextDocumentNumber(brandId, 'AEPL/OFF')

  const result = await executeQuery<any>(
    `INSERT INTO proforma_invoices (brand_id, pi_no, order_id, pi_date, po_no, po_date, gst_percent, basic_total, gst_amount, total_amount, amount_in_words, bank_id, bank_name, account_name, account_no, ifsc_code, swift_code, created_by)
     VALUES (?,?,?,CURDATE(),?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [brandId, pi_no, orderId, po_no || null, po_date || null, effective_gst_percent, basic_total, gst_amount, total_amount, amount_in_words,
     bankSnap?.id ?? null, bank.bank_name, bank.account_name, bank.account_no, bank.ifsc_code, bank.swift_code, userId]
  )
  const piId = (result as any).insertId

  for (const item of items) {
    await executeQuery(
      'INSERT INTO pi_items (pi_id, material_no, description, quantity_pcs, quantity_kgs, uom, billable_quantity, billing_uom, rate, total) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [piId, item.material_no ?? null, item.description || item.product_name || null, item.quantity_pcs ?? 0, item.quantity_kgs ?? 0, item.uom ?? 'pcs', item.billable_quantity ?? 0, item.billing_uom ?? null, item.rate ?? 0, item.total ?? 0]
    )
  }
}

export async function getProformaInvoices(req: AuthRequest, res: Response) {
  try {
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const pis = await executeQuery(
      `SELECT pi.*, o.order_id as order_ref, o.order_type, c.name as client_name, b.name as brand_name FROM proforma_invoices pi
       JOIN new_orders o ON pi.order_id = o.id JOIN new_clients c ON o.client_id = c.id JOIN brands b ON pi.brand_id = b.id
       WHERE pi.brand_id IN (${ids.map(() => '?').join(',')}) ORDER BY pi.created_at DESC`,
      ids
    )
    res.json({ success: true, data: pis })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function getProformaInvoice(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const pis = await executeQuery<any>(
      `SELECT pi.*, o.order_id as order_ref, o.order_type, o.gst_type,
        c.name as client_name, c.contact_person as client_contact, c.email as client_email, c.mobile as client_mobile,
        c.billing_address, c.billing_city, c.billing_state, c.billing_zip, c.gstin as client_gstin,
        b.name as brand_name, b.address as brand_address, b.phone as brand_phone, b.email as brand_email, b.gstin as brand_gstin, b.pan as brand_pan, b.iec as brand_iec
       FROM proforma_invoices pi
       JOIN new_orders o ON pi.order_id = o.id
       JOIN new_clients c ON o.client_id = c.id
       JOIN brands b ON pi.brand_id = b.id
       WHERE pi.id = ?`,
      [id]
    )
    if (!pis.length) return res.status(404).json({ success: false, error: 'PI not found' })
    const pi = pis[0]
    pi.items = await executeQuery('SELECT * FROM pi_items WHERE pi_id = ?', [id])
    res.json({ success: true, data: pi })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function sendPI(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { to_email } = req.body
    const pis = await executeQuery<any>(
      `SELECT pi.*, c.email as client_email, c.name as client_name FROM proforma_invoices pi
       JOIN new_orders o ON pi.order_id = o.id JOIN new_clients c ON o.client_id = c.id
       WHERE pi.id = ?`,
      [id]
    )
    if (!pis.length) return res.status(404).json({ success: false, error: 'PI not found' })
    const pi = pis[0]
    const email = to_email || pi.client_email
    if (email) {
      pi.items = await executeQuery('SELECT * FROM pi_items WHERE pi_id = ?', [id])
      pi.brand = req.brand
      await sendPIEmail(pi, email)
    }
    await executeQuery("UPDATE proforma_invoices SET status = 'sent', sent_at = NOW(), sent_to_email = ? WHERE id = ?", [email, id])
    res.json({ success: true, message: 'PI sent' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function deletePI(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const pis = await executeQuery<any>(`SELECT id FROM proforma_invoices WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [id, ...ids])
    if (!pis.length) { conn.release(); return res.status(404).json({ success: false, error: 'PI not found' }) }
    await conn.beginTransaction()
    await conn.execute('DELETE FROM pi_items WHERE pi_id = ?', [id])
    await conn.execute('DELETE FROM proforma_invoices WHERE id = ?', [id])
    await conn.commit()
    conn.release()
    res.json({ success: true, message: 'PI deleted' })
  } catch (err: any) {
    await conn.rollback()
    conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function regeneratePI(req: AuthRequest, res: Response) {
  try {
    const { order_id } = req.params
    const orderRows = await executeQuery<any>('SELECT brand_id FROM new_orders WHERE id = ?', [parseInt(order_id)])
    const brandId = orderRows[0]?.brand_id || req.userBrandIds![0]
    await generatePI({ brandId, userId: req.user!.id, orderId: parseInt(order_id) })
    res.json({ success: true, message: 'PI regenerated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
