import { Response } from 'express'
import { executeQuery, pool } from '../config/database'
import { getNextDocumentNumber } from '../utils/documentSequence'
import { AuthRequest } from '../types'
import { sendOfferEmail } from '../utils/emailService'

export async function getOffers(req: AuthRequest, res: Response) {
  try {
    const { enquiry_id } = req.query
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    let sql = `SELECT o.*, e.customer_name, e.email as customer_email FROM offers o JOIN enquiries e ON o.enquiry_id = e.id WHERE o.brand_id IN (${ids.map(() => '?').join(',')})`
    const params: any[] = [...ids]
    if (enquiry_id) { sql += ' AND o.enquiry_id = ?'; params.push(enquiry_id) }
    sql += ' ORDER BY o.created_at DESC'
    const offers = await executeQuery(sql, params)
    res.json({ success: true, data: offers })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function getOffer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const offers = await executeQuery<any>(
      `SELECT o.*, e.customer_name, e.contact_person, e.customer_address, e.email as customer_email, e.customer_city, COALESCE(o.enquiry_no_override, e.enquiry_no) as enquiry_no, e.mobile,
              b.name as brand_name, b.address as brand_address, b.phone as brand_phone, b.email as brand_email, b.gstin as brand_gstin, b.pan as brand_pan
       FROM offers o JOIN enquiries e ON o.enquiry_id = e.id JOIN brands b ON o.brand_id = b.id WHERE o.id = ? AND o.brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!offers.length) return res.status(404).json({ success: false, error: 'Not found' })
    const offer = offers[0]
    offer.items = await executeQuery('SELECT * FROM offer_items WHERE offer_id = ?', [id])
    res.json({ success: true, data: offer })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createOffer(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { enquiry_id, enquiry_no, offer_date, validity_date, terms_gst, terms_price_validity, terms_delivery,
      terms_supply_basis, terms_weight_tolerance, terms_force_majure, terms_payment, notes, items } = req.body

    // Derive brand from the parent enquiry
    const enqRows = await executeQuery<any>('SELECT brand_id FROM enquiries WHERE id = ?', [enquiry_id])
    const effectiveBrandId = enqRows[0]?.brand_id || req.userBrandIds![0]
    if (!req.userBrandIds!.includes(effectiveBrandId)) {
      conn.release()
      return res.status(403).json({ success: false, error: 'No access to this brand' })
    }

    const offer_no = await getNextDocumentNumber(effectiveBrandId, 'AEPL/OFF')

    const [result] = await conn.execute(
      `INSERT INTO offers (brand_id, offer_no, enquiry_id, enquiry_no_override, offer_date, validity_date, terms_gst, terms_price_validity, terms_delivery, terms_supply_basis, terms_weight_tolerance, terms_force_majure, terms_payment, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [effectiveBrandId, offer_no, enquiry_id, enquiry_no || null, offer_date, validity_date || null, terms_gst, terms_price_validity, terms_delivery, terms_supply_basis, terms_weight_tolerance, terms_force_majure, terms_payment, notes, req.user!.id]
    ) as any[]
    const offerId = result.insertId

    for (const item of (items || [])) {
      await conn.execute(
        'INSERT INTO offer_items (offer_id, material_no, description, qty, uom, rate, remarks) VALUES (?,?,?,?,?,?,?)',
        [offerId, item.material_no, item.description, item.qty, item.uom, item.rate, item.remarks]
      )
    }
    await conn.commit(); conn.release()
    res.status(201).json({ success: true, data: { id: offerId, offer_no } })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updateOfferStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { status } = req.body
    const allowed = ['draft', 'sent', 'accepted', 'rejected', 'revised']
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' })
    }
    const ids = req.userBrandIds!
    const result = await executeQuery<any>(
      `UPDATE offers SET status = ? WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [status, id, ...ids]
    )
    if (status === 'accepted') {
      const rows = await executeQuery<any>('SELECT enquiry_id FROM offers WHERE id = ?', [id])
      if (rows.length) {
        await executeQuery("UPDATE enquiries SET status = 'order_received' WHERE id = ?", [rows[0].enquiry_id])
      }
    }
    res.json({ success: true, message: 'Status updated', data: result })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function sendOffer(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { to_email, cc_email } = req.body
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const offers = await executeQuery<any>(
      `SELECT o.*, e.customer_name, e.email as customer_email, e.enquiry_no, e.contact_person, e.customer_city, e.mobile
       FROM offers o JOIN enquiries e ON o.enquiry_id = e.id WHERE o.id = ? AND o.brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!offers.length) return res.status(404).json({ success: false, error: 'Not found' })
    const offer = offers[0]
    offer.items = await executeQuery('SELECT * FROM offer_items WHERE offer_id = ?', [id])

    // Load brand data for offer email
    const brandRows = await executeQuery<any>('SELECT * FROM brands WHERE id = ?', [offer.brand_id])
    offer.brand = brandRows[0]

    const email = to_email || offer.customer_email
    if (email) {
      await sendOfferEmail(offer, email, cc_email)
    }
    await executeQuery("UPDATE offers SET status = 'sent', sent_at = NOW() WHERE id = ?", [id])
    await executeQuery("UPDATE enquiries SET status = 'offer_sent' WHERE id = ? AND status = 'new'", [offer.enquiry_id])
    res.json({ success: true, message: 'Offer sent successfully' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
