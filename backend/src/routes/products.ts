import { Router } from 'express'
import { getProducts, createProduct, updateProduct, deleteProduct, createVariant, updateVariant, deleteVariant } from '../controllers/productController'
import { authenticateToken, requireBrandContext, requireAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getProducts)
router.post('/', requireAdmin, createProduct)
router.put('/:id', requireAdmin, updateProduct)
router.delete('/:id', requireAdmin, deleteProduct)
router.post('/:product_id/variants', requireAdmin, createVariant)
router.put('/:product_id/variants/:variant_id', requireAdmin, updateVariant)
router.delete('/:product_id/variants/:variant_id', requireAdmin, deleteVariant)
export default router
