import { Router } from 'express'
import { getMasterStats, getRequisitionStats, getQuotationStats } from '../controllers/dashboardController'
import { authenticateToken, requireBrandContext } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/stats', getMasterStats)
router.get('/requisition-stats', getRequisitionStats)
router.get('/quotation-stats', getQuotationStats)
export default router
