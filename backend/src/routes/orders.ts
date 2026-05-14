import { Router } from 'express'
import { getOrders, getOrder, createOrder, updateOrder, updateBilling, updatePayment, cancelOrder, hardDeleteOrder, updateOrderItems } from '../controllers/orderController'
import { authenticateToken, requireBrandContext, requireAdmin, requireSuperAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getOrders)
router.get('/:id', getOrder)
router.post('/', createOrder)
router.put('/:id', updateOrder)
router.put('/:id/billing', requireAdmin, updateBilling)
router.put('/:id/payment', requireAdmin, updatePayment)
router.put('/:id/items', requireSuperAdmin, updateOrderItems)
router.patch('/:id/cancel', requireAdmin, cancelOrder)
router.delete('/:id', requireSuperAdmin, hardDeleteOrder)
export default router
