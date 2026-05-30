import { Router } from 'express'
import { getRequisitions, getRequisition, createRequisition, updateRequisitionStatus, addVendorQuotation, selectQuotation, hardDeleteRequisition, updateRequisitionItems, deleteVendorQuotation, approveRequisition, rejectRequisition, resubmitRequisition } from '../controllers/requisitionController'
import { authenticateToken, requireBrandContext, requireRequisitionAdmin, requireRequisitionApprover, requireSuperAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getRequisitions)
router.get('/:id', getRequisition)
router.post('/', createRequisition)
router.patch('/:id/status', requireRequisitionAdmin, updateRequisitionStatus)
// Items editable by super_admin (any state) or the creator while awaiting approval / rejected — enforced in the controller.
router.put('/:id/items', updateRequisitionItems)
router.post('/:id/approve', requireRequisitionApprover, approveRequisition)
router.post('/:id/reject', requireRequisitionApprover, rejectRequisition)
router.post('/:id/resubmit', resubmitRequisition)
router.post('/:id/quotations', requireRequisitionAdmin, addVendorQuotation)
router.post('/:id/quotations/:quotationId/select', requireRequisitionAdmin, selectQuotation)
router.delete('/:id/quotations/:quotationId', requireSuperAdmin, deleteVendorQuotation)
router.delete('/:id', requireSuperAdmin, hardDeleteRequisition)
export default router
