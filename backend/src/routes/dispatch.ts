import { Router } from 'express'
import { Response } from 'express'
import { executeQuery } from '../config/database'
import { authenticateToken, requireBrandContext, requireAdmin } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()
router.use(authenticateToken, requireBrandContext)

router.put('/:order_id', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { order_id } = req.params
    const { dispatch_date, dispatched_by, awb_number, awb_link, lr_link, courier_name, notes } = req.body
    await executeQuery(
      'UPDATE dispatch_details SET dispatch_date=?, dispatched_by=?, awb_number=?, awb_link=?, lr_link=?, courier_name=?, notes=? WHERE order_id=?',
      [dispatch_date ?? null, dispatched_by ?? null, awb_number ?? null, awb_link ?? null, lr_link ?? null, courier_name ?? null, notes ?? null, order_id]
    )
    // Only advance to dispatched if dispatch_date is set and order is not already dispatched/completed
    if (dispatch_date) {
      const ids = req.userBrandIds!
      await executeQuery(
        `UPDATE new_orders SET status='dispatched' WHERE id=? AND status NOT IN ('dispatched','completed','cancelled') AND brand_id IN (${ids.map(() => '?').join(',')})`,
        [order_id, ...ids]
      )
    }
    res.json({ success: true, message: 'Dispatch details updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
})

export default router
