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

export default router
