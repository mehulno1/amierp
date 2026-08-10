import { Router } from 'express'
import { getOrders, getOrder, createOrder, updateOrder, updateBilling, updatePayment, cancelOrder, hardDeleteOrder, updateOrderItems, shortCloseOrder } from '../controllers/orderController'
import { listDeliveries, createDelivery, updateDelivery, deleteDelivery } from '../controllers/orderDeliveryController'
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
// Multi-delivery challans (Part A). Reads open to brand context; writes gated by requireAdmin.
router.get('/:id/deliveries', listDeliveries)
router.post('/:id/deliveries', requireAdmin, createDelivery)
router.put('/:id/deliveries/:deliveryId', requireAdmin, updateDelivery)
router.delete('/:id/deliveries/:deliveryId', requireAdmin, deleteDelivery)
router.patch('/:id/cancel', requireAdmin, cancelOrder)
router.patch('/:id/short-close', requireAdmin, shortCloseOrder)
router.delete('/:id', requireSuperAdmin, hardDeleteOrder)
export default router
