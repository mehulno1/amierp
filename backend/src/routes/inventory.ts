import { Router } from 'express'
import { getInventoryByType, createInventoryItem, updateInventoryItem, adjustInventory, updateStockLevels, getTransactionHistory, deleteInventoryItem } from '../controllers/inventoryController'
import { authenticateToken, requireBrandContext, requireAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/type/:type', getInventoryByType)
router.post('/', requireAdmin, createInventoryItem)
router.put('/:id', requireAdmin, updateInventoryItem)
router.post('/:id/adjust', adjustInventory)
router.patch('/:id/levels', requireAdmin, updateStockLevels)
router.get('/:id/transactions', getTransactionHistory)
router.delete('/:id', requireAdmin, deleteInventoryItem)
export default router
