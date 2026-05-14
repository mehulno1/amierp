import { Router } from 'express'
import { getRequisitions, getRequisition, createRequisition, updateRequisitionStatus, addVendorQuotation, selectQuotation, hardDeleteRequisition, updateRequisitionItems, deleteVendorQuotation } from '../controllers/requisitionController'
import { authenticateToken, requireBrandContext, requireRequisitionAdmin, requireSuperAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getRequisitions)
router.get('/:id', getRequisition)
router.post('/', createRequisition)
router.patch('/:id/status', requireRequisitionAdmin, updateRequisitionStatus)
router.put('/:id/items', requireSuperAdmin, updateRequisitionItems)
router.post('/:id/quotations', requireRequisitionAdmin, addVendorQuotation)
router.post('/:id/quotations/:quotationId/select', requireRequisitionAdmin, selectQuotation)
router.delete('/:id/quotations/:quotationId', requireSuperAdmin, deleteVendorQuotation)
router.delete('/:id', requireSuperAdmin, hardDeleteRequisition)
export default router
