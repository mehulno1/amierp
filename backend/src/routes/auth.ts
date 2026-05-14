import { Router } from 'express'
import { login, getProfile, changePassword } from '../controllers/authController'
import { authenticateToken } from '../middleware/auth'

const router = Router()
router.post('/login', login)
router.get('/profile', authenticateToken, getProfile)
router.post('/change-password', authenticateToken, changePassword)
export default router
