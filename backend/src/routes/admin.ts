import { Router } from 'express'
import { Response } from 'express'
import bcrypt from 'bcryptjs'
import { executeQuery, pool } from '../config/database'
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()
router.use(authenticateToken)

// ── Brands (company masters) ────────────────────────────────────────────────
// Admin + super_admin can read/edit/delete. User & creation stay super_admin only —
// adding a new company touches document_sequences and brand assignments globally.
router.get('/brands', requireAdmin, async (_req, res: Response) => {
  const brands = await executeQuery('SELECT * FROM brands ORDER BY name')
  res.json({ success: true, data: brands })
})

router.post('/brands', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, address, city, state, phone, email, gstin, pan, iec } = req.body
    const result = await executeQuery<any>(
      'INSERT INTO brands (name, code, address, city, state, phone, email, gstin, pan, iec) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [name, code, address, city, state, phone, email, gstin, pan, iec ?? null]
    )
    const brand = await executeQuery('SELECT * FROM brands WHERE id = ?', [(result as any).insertId])
    const sequences = ['AEPL/OFF', 'AEPL/IND', 'AEPL/ENQ']
    for (const prefix of sequences) {
      await executeQuery('INSERT IGNORE INTO document_sequences (brand_id, prefix, next_number) VALUES (?,?,1)', [(result as any).insertId, prefix])
    }
    res.status(201).json({ success: true, data: brand[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

router.put('/brands/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const fields = ['name','code','address','city','state','phone','email','gstin','pan','iec','is_active']
    const sets = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`).join(', ')
    const vals = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f])
    if (!sets) return res.json({ success: true, message: 'Nothing to update' })
    await executeQuery(`UPDATE brands SET ${sets} WHERE id = ?`, [...vals, id])
    res.json({ success: true, message: 'Brand updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

// Soft delete — flips is_active. Hard delete would cascade through orders/PI/clients,
// which we never want from an admin screen.
router.delete('/brands/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await executeQuery('UPDATE brands SET is_active = 0 WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'Company deactivated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

// ── Bank accounts per brand ────────────────────────────────────────────────
router.get('/brands/:brandId/banks', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const banks = await executeQuery(
      'SELECT * FROM brand_banks WHERE brand_id = ? AND is_active = 1 ORDER BY is_default DESC, bank_name',
      [req.params.brandId]
    )
    res.json({ success: true, data: banks })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

router.post('/brands/:brandId/banks', requireAdmin, async (req: AuthRequest, res: Response) => {
  const conn = await pool.getConnection()
  try {
    const { brandId } = req.params
    const { account_name, bank_name, account_no, ifsc_code, swift_code, branch, is_default } = req.body
    await conn.beginTransaction()
    if (is_default) await conn.execute('UPDATE brand_banks SET is_default = 0 WHERE brand_id = ?', [brandId])
    const [result] = await conn.execute(
      'INSERT INTO brand_banks (brand_id, account_name, bank_name, account_no, ifsc_code, swift_code, branch, is_default) VALUES (?,?,?,?,?,?,?,?)',
      [brandId, account_name, bank_name, account_no, ifsc_code ?? null, swift_code ?? null, branch ?? null, is_default ? 1 : 0]
    ) as any[]
    await conn.commit()
    conn.release()
    const banks = await executeQuery('SELECT * FROM brand_banks WHERE id = ?', [result.insertId])
    res.status(201).json({ success: true, data: banks[0] })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/brands/:brandId/banks/:bankId', requireAdmin, async (req: AuthRequest, res: Response) => {
  const conn = await pool.getConnection()
  try {
    const { brandId, bankId } = req.params
    const fields = ['account_name','bank_name','account_no','ifsc_code','swift_code','branch','is_default','is_active']
    const sets = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`).join(', ')
    const vals = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f])
    if (!sets) { conn.release(); return res.json({ success: true, message: 'Nothing to update' }) }
    await conn.beginTransaction()
    if (req.body.is_default) {
      await conn.execute('UPDATE brand_banks SET is_default = 0 WHERE brand_id = ? AND id <> ?', [brandId, bankId])
    }
    await conn.execute(`UPDATE brand_banks SET ${sets} WHERE id = ? AND brand_id = ?`, [...vals, bankId, brandId])
    await conn.commit()
    conn.release()
    res.json({ success: true, message: 'Bank updated' })
  } catch (err: any) {
    await conn.rollback(); conn.release()
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/brands/:brandId/banks/:bankId', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await executeQuery('UPDATE brand_banks SET is_active = 0 WHERE id = ? AND brand_id = ?', [req.params.bankId, req.params.brandId])
    res.json({ success: true, message: 'Bank removed' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

// ── Users ──────────────────────────────────────────────────────────────────
router.get('/users', requireSuperAdmin, async (_req, res: Response) => {
  const users = await executeQuery<any>(
    `SELECT u.id, u.username, u.email, u.name, u.role, u.can_approve_requisitions, u.is_active, u.created_at,
      GROUP_CONCAT(b.name ORDER BY b.name SEPARATOR ', ') as brands
     FROM new_users u
     LEFT JOIN user_brands ub ON u.id = ub.user_id
     LEFT JOIN brands b ON ub.brand_id = b.id
     GROUP BY u.id ORDER BY u.name`
  )
  res.json({ success: true, data: users })
})

router.post('/users', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, name, role, can_approve_requisitions } = req.body
    const hash = await bcrypt.hash(password, 10)
    const result = await executeQuery<any>(
      'INSERT INTO new_users (username, password_hash, email, name, role, can_approve_requisitions) VALUES (?,?,?,?,?,?)',
      [username, hash, email, name, role, can_approve_requisitions ? 1 : 0]
    )
    const userId = (result as any).insertId
    const allBrands = await executeQuery<any>('SELECT id FROM brands WHERE is_active = 1')
    for (const b of allBrands) {
      await executeQuery('INSERT IGNORE INTO user_brands (user_id, brand_id) VALUES (?,?)', [userId, b.id])
    }
    res.status(201).json({ success: true, message: 'User created' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

router.put('/users/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { email, name, role, is_active, brand_ids, password, can_approve_requisitions } = req.body
    const canApprove = can_approve_requisitions ? 1 : 0
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      await executeQuery('UPDATE new_users SET email=?, name=?, role=?, can_approve_requisitions=?, is_active=?, password_hash=? WHERE id=?', [email, name, role, canApprove, is_active, hash, id])
    } else {
      await executeQuery('UPDATE new_users SET email=?, name=?, role=?, can_approve_requisitions=?, is_active=? WHERE id=?', [email, name, role, canApprove, is_active, id])
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

router.delete('/users/:id', requireSuperAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await executeQuery('UPDATE new_users SET is_active = 0 WHERE id = ?', [req.params.id])
    res.json({ success: true, message: 'User deactivated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

export default router
