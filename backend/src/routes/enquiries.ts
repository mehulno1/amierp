import { Router } from 'express'
import { getEnquiries, getEnquiry, createEnquiry, updateEnquiryStatus, deleteEnquiry } from '../controllers/enquiryController'
import { authenticateToken, requireBrandContext, requireQuotationAdmin, requireSuperAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getEnquiries)
router.get('/:id', getEnquiry)
router.post('/', requireQuotationAdmin, createEnquiry)
router.patch('/:id/status', requireQuotationAdmin, updateEnquiryStatus)
router.delete('/:id', requireSuperAdmin, deleteEnquiry)
export default router
