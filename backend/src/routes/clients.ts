import { Router } from 'express'
import { getClients, createClient, updateClient, deleteClient } from '../controllers/clientController'
import { authenticateToken, requireBrandContext, requireAdmin } from '../middleware/auth'

const router = Router()
router.use(authenticateToken, requireBrandContext)
router.get('/', getClients)
router.post('/', requireAdmin, createClient)
router.put('/:id', requireAdmin, updateClient)
router.delete('/:id', requireAdmin, deleteClient)
export default router
