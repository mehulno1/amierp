import { Router } from 'express'
import { Response } from 'express'
import { executeQuery } from '../config/database'
import { authenticateToken } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()
router.use(authenticateToken)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    let brands
    if (req.user!.role === 'super_admin') {
      brands = await executeQuery('SELECT * FROM brands WHERE is_active = 1 ORDER BY name')
    } else {
      brands = await executeQuery(
        'SELECT b.* FROM brands b JOIN user_brands ub ON b.id = ub.brand_id WHERE ub.user_id = ? AND b.is_active = 1',
        [req.user!.id]
      )
    }
    res.json({ success: true, data: brands })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

// Bank accounts for a brand — needed at order entry time so the user can pick the
// bank that will be stamped onto the PI. Scoped to brands the user can access.
router.get('/:id/banks', async (req: AuthRequest, res: Response) => {
  try {
    const brandId = parseInt(req.params.id)
    if (req.user!.role !== 'super_admin') {
      const allowed = await executeQuery<any>('SELECT 1 FROM user_brands WHERE user_id = ? AND brand_id = ?', [req.user!.id, brandId])
      if (!allowed.length) return res.status(403).json({ success: false, error: 'No access to this brand' })
    }
    const banks = await executeQuery(
      'SELECT id, brand_id, account_name, bank_name, account_no, ifsc_code, swift_code, branch, is_default FROM brand_banks WHERE brand_id = ? AND is_active = 1 ORDER BY is_default DESC, bank_name',
      [brandId]
    )
    res.json({ success: true, data: banks })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

export default router
