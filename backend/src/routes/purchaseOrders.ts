import { Router } from 'express'
import { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePOStatus, updateReceivedQty } from '../controllers/purchaseOrderController'
import { authenticateToken, requireBrandContext, requireRequisitionAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getPurchaseOrders)
router.get('/:id', getPurchaseOrder)
router.post('/', requireRequisitionAdmin, createPurchaseOrder)
router.patch('/:id/status', requireRequisitionAdmin, updatePOStatus)
router.patch('/:id/items/:item_id/received', requireRequisitionAdmin, updateReceivedQty)
export default router
