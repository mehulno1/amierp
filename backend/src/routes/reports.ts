import { Router } from 'express'
import {
  openPurchaseOrders, procurementSpend, vendorPerformance, requisitionSla,
  reorderReport, inventoryValuation, stockMovement, fulfillment,
  salesRegister, dispatchRegister, receivables, salesFunnel, expiringOffers,
} from '../controllers/reportsController'
import { authenticateToken, requireBrandContext } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)

// Procurement & vendors
router.get('/open-purchase-orders', openPurchaseOrders)
router.get('/procurement-spend', procurementSpend)
router.get('/vendor-performance', vendorPerformance)
router.get('/requisition-sla', requisitionSla)

// Inventory & fulfillment
router.get('/reorder', reorderReport)
router.get('/inventory-valuation', inventoryValuation)
router.get('/stock-movement', stockMovement)
router.get('/fulfillment', fulfillment)

// Sales & revenue
router.get('/sales-register', salesRegister)
router.get('/dispatch-register', dispatchRegister)

// Receivables & pipeline
router.get('/receivables', receivables)
router.get('/sales-funnel', salesFunnel)
router.get('/expiring-offers', expiringOffers)

export default router
