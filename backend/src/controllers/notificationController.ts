import { Response } from 'express'
import { executeQuery } from '../config/database'
import { AuthRequest } from '../types'

// Fire-and-forget helper other controllers call AFTER their transaction commits —
// a failed notification must never roll back or fail the business operation.
export async function createNotification(n: {
  brand_id: number
  user_id: number
  type: string
  title: string
  body?: string | null
  reference_type?: string | null
  reference_id?: number | null
}) {
  try {
    await executeQuery(
      `INSERT INTO notifications (brand_id, user_id, type, title, body, reference_type, reference_id)
       VALUES (?,?,?,?,?,?,?)`,
      [n.brand_id, n.user_id, n.type, n.title, n.body ?? null, n.reference_type ?? null, n.reference_id ?? null]
    )
  } catch (err) {
    console.error('createNotification failed:', err)
  }
}

export async function getMyNotifications(req: AuthRequest, res: Response) {
  try {
    const rows = await executeQuery<any>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50',
      [req.user!.id]
    )
    const unread = await executeQuery<any>(
      'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user!.id]
    )
    res.json({ success: true, data: { notifications: rows, unread: unread[0].cnt } })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    await executeQuery('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user!.id])
    res.json({ success: true })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response) {
  try {
    await executeQuery('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user!.id])
    res.json({ success: true })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
