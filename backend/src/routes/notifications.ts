import { Router } from 'express'
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notificationController'
import { authenticateToken } from '../middleware/auth'

const router = Router()
router.use(authenticateToken)
router.get('/', getMyNotifications)
router.post('/read-all', markAllNotificationsRead)
router.post('/:id/read', markNotificationRead)
export default router
