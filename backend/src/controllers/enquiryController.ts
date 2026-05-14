import { Response } from 'express'
import { executeQuery, pool } from '../config/database'
import { getNextDocumentNumber } from '../utils/documentSequence'
import { AuthRequest } from '../types'

export async function getEnquiries(req: AuthRequest, res: Response) {
  try {
    const { status, search } = req.query
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    let sql = `SELECT e.*, u.name as assigned_to_name, b.name as brand_name FROM enquiries e LEFT JOIN new_users u ON e.assigned_to = u.id JOIN brands b ON e.brand_id = b.id WHERE e.brand_id IN (${ids.map(() => '?').join(',')})`
    const params: any[] = [...ids]
    if (status) { sql += ' AND e.status = ?'; params.push(status) }
    if (search) { sql += ' AND (e.customer_name LIKE ? OR e.enquiry_no LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
    sql += ' ORDER BY e.created_at DESC'
    const enquiries = await executeQuery(sql, params)
    for (const e of enquiries as any[]) {
      e.items = await executeQuery('SELECT * FROM enquiry_items WHERE enquiry_id = ?', [e.id])
    }
    res.json({ success: true, data: enquiries })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createEnquiry(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { brand_id, customer_name, contact_person, mobile, email, customer_city, source, due_date, notes, assigned_to, items } = req.body
    const effectiveBrandId = Number(brand_id || req.brandId)
    if (!effectiveBrandId || !req.userBrandIds!.includes(effectiveBrandId)) {
      conn.release()
      return res.status(400).json({ success: false, error: 'Valid company required' })
    }
    const enquiry_no = await getNextDocumentNumber(effectiveBrandId, 'AEPL/ENQ')
    const [result] = await conn.execute(
      'INSERT INTO enquiries (brand_id, enquiry_no, assigned_to, customer_name, contact_person, mobile, email, customer_city, source, due_date, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [effectiveBrandId, enquiry_no, assigned_to || null, customer_name, contact_person, mobile, email, customer_city, source || 'phone', due_date || null, notes]
    ) as any[]
    const enquiryId = result.insertId
    for (const item of (items || [])) {
      await conn.execute(
        'INSERT INTO enquiry_items (enquiry_id, product_id, description, qty, uom, notes) VALUES (?,?,?,?,?,?)',
        [enquiryId, item.product_id || null, item.description, item.qty, item.uom, item.notes]
      )
    }
    await conn.commit(); conn.release()
    res.status(201).json({ success: true, data: { id: enquiryId, enquiry_no } })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function updateEnquiryStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { status, notes } = req.body
    const ids = req.userBrandIds!
    await executeQuery(`UPDATE enquiries SET status = ?, notes = COALESCE(?, notes) WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [status, notes, id, ...ids])
    res.json({ success: true, message: 'Status updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function deleteEnquiry(req: AuthRequest, res: Response) {
  const conn = await pool.getConnection()
  try {
    const { id } = req.params
    const ids = req.userBrandIds!
    const rows = await executeQuery<any>(`SELECT id FROM enquiries WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [id, ...ids])
    if (!rows.length) { conn.release(); return res.status(404).json({ success: false, error: 'Not found' }) }
    await conn.beginTransaction()
    const offers = await executeQuery<any>('SELECT id FROM offers WHERE enquiry_id = ?', [id])
    for (const o of offers) {
      await conn.execute('DELETE FROM offer_items WHERE offer_id = ?', [o.id])
    }
    await conn.execute('DELETE FROM offers WHERE enquiry_id = ?', [id])
    await conn.execute('DELETE FROM enquiry_items WHERE enquiry_id = ?', [id])
    await conn.execute('DELETE FROM enquiries WHERE id = ?', [id])
    await conn.commit()
    conn.release()
    res.json({ success: true, message: 'Enquiry deleted' })
  } catch (err: any) {
    await conn.rollback()
    conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function getEnquiry(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const ids2 = req.brandId ? [req.brandId] : req.userBrandIds!
    const rows = await executeQuery<any>(`SELECT e.*, u.name as assigned_to_name, b.name as brand_name FROM enquiries e LEFT JOIN new_users u ON e.assigned_to = u.id JOIN brands b ON e.brand_id = b.id WHERE e.id = ? AND e.brand_id IN (${ids2.map(() => '?').join(',')})`, [id, ...ids2])
    if (!rows.length) return res.status(404).json({ success: false, error: 'Not found' })
    const enquiry = rows[0]
    enquiry.items = await executeQuery('SELECT * FROM enquiry_items WHERE enquiry_id = ?', [id])
    enquiry.offers = await executeQuery('SELECT id, offer_no, offer_date, status FROM offers WHERE enquiry_id = ?', [id])
    res.json({ success: true, data: enquiry })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
