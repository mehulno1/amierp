import { Router } from 'express'
import { getProformaInvoices, getProformaInvoice, sendPI, regeneratePI, deletePI } from '../controllers/proformaInvoiceController'
import { authenticateToken, requireBrandContext, requireAdmin, requireSuperAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getProformaInvoices)
router.get('/:id', getProformaInvoice)
router.post('/:id/send', requireAdmin, sendPI)
router.post('/order/:order_id/regenerate', requireAdmin, regeneratePI)
router.delete('/:id', requireSuperAdmin, deletePI)
export default router
