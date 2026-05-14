import { Router } from 'express'
import { getOffers, getOffer, createOffer, sendOffer } from '../controllers/offerController'
import { authenticateToken, requireBrandContext, requireQuotationAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getOffers)
router.get('/:id', getOffer)
router.post('/', requireQuotationAdmin, createOffer)
router.post('/:id/send', requireQuotationAdmin, sendOffer)
export default router
