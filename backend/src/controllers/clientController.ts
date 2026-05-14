import { Response } from 'express'
import { executeQuery } from '../config/database'
import { AuthRequest } from '../types'

export async function getClients(req: AuthRequest, res: Response) {
  try {
    const search = req.query.search as string
    const brandFilter = req.brandId || (req.query.brand_id ? parseInt(req.query.brand_id as string) : null)
    let sql: string
    let params: any[]

    if (brandFilter) {
      sql = 'SELECT c.*, b.name as brand_name FROM new_clients c JOIN brands b ON c.brand_id = b.id WHERE c.brand_id = ? AND c.is_active = 1'
      params = [brandFilter]
    } else {
      const ids = req.userBrandIds!
      sql = `SELECT c.*, b.name as brand_name FROM new_clients c JOIN brands b ON c.brand_id = b.id WHERE c.brand_id IN (${ids.map(() => '?').join(',')}) AND c.is_active = 1`
      params = ids
    }
    if (search) { sql += ' AND c.name LIKE ?'; params.push(`%${search}%`) }
    sql += ' ORDER BY c.name ASC'
    const clients = await executeQuery(sql, params)
    res.json({ success: true, data: clients })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createClient(req: AuthRequest, res: Response) {
  try {
    const { brand_id, name, contact_person, mobile, mobile2, email, gstin, billing_address, billing_city, billing_state, billing_zip, shipping_address, shipping_city, shipping_state, shipping_zip, dispatch_instructions, notes } = req.body
    const effectiveBrandId = brand_id || req.brandId
    if (!effectiveBrandId || !req.userBrandIds!.includes(Number(effectiveBrandId))) {
      return res.status(400).json({ success: false, error: 'Valid company required' })
    }
    const result = await executeQuery<any>(
      `INSERT INTO new_clients (brand_id, name, contact_person, mobile, mobile2, email, gstin, billing_address, billing_city, billing_state, billing_zip, shipping_address, shipping_city, shipping_state, shipping_zip, dispatch_instructions, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [effectiveBrandId, name, contact_person, mobile, mobile2, email, gstin, billing_address, billing_city, billing_state, billing_zip, shipping_address, shipping_city, shipping_state, shipping_zip, dispatch_instructions, notes].map(v => v ?? null)
    )
    const created = await executeQuery('SELECT c.*, b.name as brand_name FROM new_clients c JOIN brands b ON c.brand_id = b.id WHERE c.id = ?', [(result as any).insertId])
    res.status(201).json({ success: true, data: created[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updateClient(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const fields = ['name','contact_person','mobile','mobile2','email','gstin','billing_address','billing_city','billing_state','billing_zip','shipping_address','shipping_city','shipping_state','shipping_zip','dispatch_instructions','notes']
    const sets = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`).join(', ')
    const vals = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f])
    const ids = req.userBrandIds!
    await executeQuery(`UPDATE new_clients SET ${sets} WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [...vals, id, ...ids])
    const updated = await executeQuery('SELECT c.*, b.name as brand_name FROM new_clients c JOIN brands b ON c.brand_id = b.id WHERE c.id = ?', [id])
    res.json({ success: true, data: updated[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function deleteClient(req: AuthRequest, res: Response) {
  try {
    const ids = req.userBrandIds!
    await executeQuery(`UPDATE new_clients SET is_active = 0 WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [req.params.id, ...ids])
    res.json({ success: true, message: 'Client deactivated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
