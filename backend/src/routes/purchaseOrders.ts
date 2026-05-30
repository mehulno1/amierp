import { Router } from 'express'
import { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, updatePOStatus, updateReceivedQty } from '../controllers/purchaseOrderController'
import { authenticateToken, requireBrandContext, requireAdmin, requireRequisitionAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getPurchaseOrders)
router.get('/:id', getPurchaseOrder)
router.post('/', requireRequisitionAdmin, createPurchaseOrder)
router.put('/:id', requireAdmin, updatePurchaseOrder)
router.delete('/:id', requireAdmin, deletePurchaseOrder)
router.patch('/:id/status', requireRequisitionAdmin, updatePOStatus)
router.patch('/:id/items/:item_id/received', requireRequisitionAdmin, updateReceivedQty)
export default router
