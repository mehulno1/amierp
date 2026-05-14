import { Response } from 'express'
import { executeQuery } from '../config/database'
import { AuthRequest } from '../types'

export async function getVendors(req: AuthRequest, res: Response) {
  try {
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const vendors = await executeQuery(
      `SELECT v.*, b.name as brand_name FROM vendors v JOIN brands b ON v.brand_id = b.id WHERE v.brand_id IN (${ids.map(() => '?').join(',')}) AND v.is_active = 1 ORDER BY v.name`,
      ids
    )
    res.json({ success: true, data: vendors })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createVendor(req: AuthRequest, res: Response) {
  try {
    const { brand_id, name, contact_person, mobile, email, address, city, gstin } = req.body
    const effectiveBrandId = Number(brand_id || req.brandId)
    if (!effectiveBrandId || !req.userBrandIds!.includes(effectiveBrandId)) {
      return res.status(400).json({ success: false, error: 'Valid company required' })
    }
    const result = await executeQuery<any>(
      'INSERT INTO vendors (brand_id, name, contact_person, mobile, email, address, city, gstin) VALUES (?,?,?,?,?,?,?,?)',
      [effectiveBrandId, name, contact_person, mobile, email, address, city, gstin]
    )
    const vendor = await executeQuery('SELECT v.*, b.name as brand_name FROM vendors v JOIN brands b ON v.brand_id = b.id WHERE v.id = ?', [(result as any).insertId])
    res.status(201).json({ success: true, data: vendor[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updateVendor(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { name, contact_person, mobile, email, address, city, gstin } = req.body
    const ids = req.userBrandIds!
    await executeQuery(
      `UPDATE vendors SET name=?, contact_person=?, mobile=?, email=?, address=?, city=?, gstin=? WHERE id=? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [name, contact_person, mobile, email, address, city, gstin, id, ...ids]
    )
    res.json({ success: true, message: 'Vendor updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function deleteVendor(req: AuthRequest, res: Response) {
  try {
    const ids = req.userBrandIds!
    await executeQuery(`UPDATE vendors SET is_active = 0 WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [req.params.id, ...ids])
    res.json({ success: true, message: 'Vendor deactivated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
