import { Router } from 'express'
import { Response } from 'express'
import bcrypt from 'bcryptjs'
import { executeQuery } from '../config/database'
import { authenticateToken, requireSuperAdmin } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()
router.use(authenticateToken, requireSuperAdmin)

// Brands
router.get('/brands', async (_req, res: Response) => {
  const brands = await executeQuery('SELECT * FROM brands ORDER BY name')
  res.json({ success: true, data: brands })
})

router.post('/brands', async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, address, city, state, phone, email, gstin, pan, bank_name, account_name, account_no, ifsc_code } = req.body
    const result = await executeQuery<any>(
      'INSERT INTO brands (name, code, address, city, state, phone, email, gstin, pan, bank_name, account_name, account_no, ifsc_code) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [name, code, address, city, state, phone, email, gstin, pan, bank_name, account_name, account_no, ifsc_code]
    )
    const brand = await executeQuery('SELECT * FROM brands WHERE id = ?', [(result as any).insertId])
    // seed document sequences
    const sequences = ['AEPL/OFF', 'AEPL/IND', 'AEPL/ENQ']
    for (const prefix of sequences) {
      await executeQuery('INSERT IGNORE INTO document_sequences (brand_id, prefix, next_number) VALUES (?,?,1)', [(result as any).insertId, prefix])
    }
    res.status(201).json({ success: true, data: brand[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

router.put('/brands/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const fields = ['name','code','address','city','state','phone','email','gstin','pan','bank_name','account_name','account_no','ifsc_code','swift_code','is_active']
    const sets = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`).join(', ')
    const vals = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f])
    await executeQuery(`UPDATE brands SET ${sets} WHERE id = ?`, [...vals, id])
    res.json({ success: true, message: 'Brand updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

// Users
router.get('/users', async (_req, res: Response) => {
  const users = await executeQuery<any>(
    `SELECT u.id, u.username, u.email, u.name, u.role, u.is_active, u.created_at,
      GROUP_CONCAT(b.name ORDER BY b.name SEPARATOR ', ') as brands
     FROM new_users u
     LEFT JOIN user_brands ub ON u.id = ub.user_id
     LEFT JOIN brands b ON ub.brand_id = b.id
     GROUP BY u.id ORDER BY u.name`
  )
  res.json({ success: true, data: users })
})

router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, name, role } = req.body
    const hash = await bcrypt.hash(password, 10)
    const result = await executeQuery<any>(
      'INSERT INTO new_users (username, password_hash, email, name, role) VALUES (?,?,?,?,?)',
      [username, hash, email, name, role]
    )
    const userId = (result as any).insertId
    // auto-assign all active brands
    const allBrands = await executeQuery<any>('SELECT id FROM brands WHERE is_active = 1')
    for (const b of allBrands) {
      await executeQuery('INSERT IGNORE INTO user_brands (user_id, brand_id) VALUES (?,?)', [userId, b.id])
    }
    res.status(201).json({ success: true, message: 'User created' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { email, name, role, is_active, brand_ids, password } = req.body
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      await executeQuery('UPDATE new_users SET email=?, name=?, role=?, is_active=?, password_hash=? WHERE id=?', [email, name, role, is_active, hash, id])
    } else {
      await executeQuery('UPDATE new_users SET email=?, name=?, role=?, is_active=? WHERE id=?', [email, name, role, is_active, id])
    }
    if (brand_ids !== undefined) {
      await executeQuery('DELETE FROM user_brands WHERE user_id = ?', [id])
      for (const bid of brand_ids) {
        await executeQuery('INSERT IGNORE INTO user_brands (user_id, brand_id) VALUES (?,?)', [id, bid])
      }
    }
    res.json({ success: true, message: 'User updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    await executeQuery('UPDATE new_users SET is_active = 0 WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'User deactivated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

export default router
