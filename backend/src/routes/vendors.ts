import { Router } from 'express'
import { getVendors, createVendor, updateVendor, deleteVendor } from '../controllers/vendorController'
import { authenticateToken, requireBrandContext, requireRequisitionAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getVendors)
router.post('/', requireRequisitionAdmin, createVendor)
router.put('/:id', requireRequisitionAdmin, updateVendor)
router.delete('/:id', requireRequisitionAdmin, deleteVendor)
export default router
