import { Router } from 'express'
import { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, updatePOStatus } from '../controllers/purchaseOrderController'
import { getReceipts, createReceipt, updateReceipt, deleteReceipt } from '../controllers/poReceiptController'
import { authenticateToken, requireBrandContext, requireAdmin, requireRequisitionAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getPurchaseOrders)
router.get('/:id', getPurchaseOrder)
router.post('/', requireRequisitionAdmin, createPurchaseOrder)
router.put('/:id', requireAdmin, updatePurchaseOrder)
router.delete('/:id', requireAdmin, deletePurchaseOrder)
router.patch('/:id/status', requireRequisitionAdmin, updatePOStatus)
// Goods-receipt notes (GRN) — partial receipt tracking.
router.get('/:id/receipts', getReceipts)
router.post('/:id/receipts', requireRequisitionAdmin, createReceipt)
router.put('/:id/receipts/:receiptId', requireRequisitionAdmin, updateReceipt)
router.delete('/:id/receipts/:receiptId', requireRequisitionAdmin, deleteReceipt)
export default router
