import { Router } from 'express'
import { Response } from 'express'
import { executeQuery } from '../config/database'
import { authenticateToken, requireBrandContext, requireAdmin } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()
router.use(authenticateToken, requireBrandContext)

router.get('/', async (req, res) => {
  try {
    const authReq = req as AuthRequest
    const sp = await executeQuery('SELECT * FROM stockpoints WHERE brand_id = ? AND is_active = 1', [authReq.brandId])
    res.json({ success: true, data: sp })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

router.post('/', requireAdmin, async (req: any, res: any) => {
  try {
    const authReq = req as AuthRequest
    const { name, address } = authReq.body
    const result = await executeQuery<any>('INSERT INTO stockpoints (brand_id, name, address) VALUES (?,?,?)', [authReq.brandId, name, address])
    const sp = await executeQuery('SELECT * FROM stockpoints WHERE id = ?', [(result as any).insertId])
    res.status(201).json({ success: true, data: sp[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

export default router
