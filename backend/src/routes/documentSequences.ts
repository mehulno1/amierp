import { Router } from 'express'
import { Response } from 'express'
import { getNextDocumentNumber } from '../utils/documentSequence'
import { authenticateToken, requireBrandContext } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()
router.use(authenticateToken, requireBrandContext)

router.get('/next/:prefix(*)', async (req, res) => {
  try {
    const authReq = req as AuthRequest
    const prefix = decodeURIComponent(authReq.params.prefix)
    const brandId = authReq.brandId || authReq.userBrandIds![0]
    const number = await getNextDocumentNumber(brandId, prefix)
    res.json({ success: true, data: number })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

export default router
