import { Response } from 'express'
import { executeQuery } from '../config/database'
import { AuthRequest } from '../types'

export async function getMasterStats(req: AuthRequest, res: Response) {
  try {
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const ph = ids.map(() => '?').join(',')

    const [orderStats] = await executeQuery<any>(
      `SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'new_order' THEN 1 ELSE 0 END) as new_orders,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'ready_for_dispatch' THEN 1 ELSE 0 END) as ready_for_dispatch,
        SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END) as dispatched
       FROM new_orders WHERE brand_id IN (${ph}) AND status NOT IN ('completed','cancelled')`,
      ids
    )

    const [reqStats] = await executeQuery<any>(
      `SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'po_raised' THEN 1 ELSE 0 END) as po_raised,
        SUM(CASE WHEN priority = 'critical' AND status NOT IN ('delivered','cancelled') THEN 1 ELSE 0 END) as critical
       FROM requisitions WHERE brand_id IN (${ph}) AND status NOT IN ('delivered','cancelled')`,
      ids
    )

    const [enquiryStats] = await executeQuery<any>(
      `SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_enquiries,
        SUM(CASE WHEN status = 'offer_sent' THEN 1 ELSE 0 END) as offer_sent,
        SUM(CASE WHEN status = 'negotiation' THEN 1 ELSE 0 END) as negotiation
       FROM enquiries WHERE brand_id IN (${ph}) AND status NOT IN ('order_received','lost','expired')`,
      ids
    )

    const [poThisMonth] = await executeQuery<any>(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE brand_id IN (${ph}) AND MONTH(po_date) = MONTH(CURDATE()) AND YEAR(po_date) = YEAR(CURDATE())`,
      ids
    )

    const recentOrders = await executeQuery(
      `SELECT o.id, o.order_id, o.status, o.order_date, o.order_type, c.name as client_name, b.name as brand_name
       FROM new_orders o JOIN new_clients c ON o.client_id = c.id JOIN brands b ON o.brand_id = b.id
       WHERE o.brand_id IN (${ph}) ORDER BY o.created_at DESC LIMIT 10`,
      ids
    )

    const overdueRequisitions = await executeQuery(
      `SELECT r.*, u.name as created_by_name, b.name as brand_name FROM requisitions r
       JOIN new_users u ON r.created_by = u.id JOIN brands b ON r.brand_id = b.id
       WHERE r.brand_id IN (${ph}) AND r.status NOT IN ('delivered','cancelled')
         AND DATE_ADD(r.created_at, INTERVAL COALESCE((SELECT MAX(ri.no_of_days) FROM requisition_items ri WHERE ri.requisition_id = r.id),7) DAY) < CURDATE()
       ORDER BY r.priority DESC LIMIT 5`,
      ids
    )

    res.json({
      success: true,
      data: {
        orders: orderStats,
        requisitions: reqStats,
        enquiries: enquiryStats,
        po_this_month: poThisMonth.count,
        recent_orders: recentOrders,
        overdue_requisitions: overdueRequisitions
      }
    })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function getRequisitionStats(req: AuthRequest, res: Response) {
  try {
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const ph = ids.map(() => '?').join(',')

    const pipelineRows = await executeQuery<any>(
      `SELECT status, COUNT(*) as count FROM requisitions WHERE brand_id IN (${ph}) AND status NOT IN ('cancelled') GROUP BY status`,
      ids
    )
    const pipeline: Record<string, number> = {}
    for (const row of pipelineRows) pipeline[row.status] = Number(row.count)

    const overdue = await executeQuery(
      `SELECT r.*, u.name as created_by_name,
         DATEDIFF(CURDATE(), DATE_ADD(r.created_at, INTERVAL COALESCE((SELECT MAX(ri.no_of_days) FROM requisition_items ri WHERE ri.requisition_id = r.id),7) DAY)) as days_overdue
       FROM requisitions r
       JOIN new_users u ON r.created_by = u.id
       WHERE r.brand_id IN (${ph}) AND r.status NOT IN ('delivered','cancelled')
         AND DATE_ADD(r.created_at, INTERVAL COALESCE((SELECT MAX(ri.no_of_days) FROM requisition_items ri WHERE ri.requisition_id = r.id),7) DAY) < CURDATE()
       ORDER BY r.priority DESC`,
      ids
    )

    const recentPos = await executeQuery(
      `SELECT po.*, v.name as vendor_name FROM purchase_orders po
       JOIN vendors v ON po.vendor_id = v.id
       WHERE po.brand_id IN (${ph})
       ORDER BY po.created_at DESC LIMIT 10`,
      ids
    )

    const [poCount] = await executeQuery<any>(
      `SELECT COUNT(*) as count FROM purchase_orders WHERE brand_id IN (${ph}) AND MONTH(po_date) = MONTH(CURDATE()) AND YEAR(po_date) = YEAR(CURDATE())`,
      ids
    )

    res.json({ success: true, data: { pipeline, overdue, recent_pos: recentPos, pos_this_month: Number(poCount.count) } })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function getQuotationStats(req: AuthRequest, res: Response) {
  try {
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const ph = ids.map(() => '?').join(',')

    const pipelineRows = await executeQuery<any>(
      `SELECT status, COUNT(*) as count FROM enquiries WHERE brand_id IN (${ph}) GROUP BY status`,
      ids
    )
    const enquiry_pipeline: Record<string, number> = {}
    for (const row of pipelineRows) enquiry_pipeline[row.status] = Number(row.count)

    const expiring_offers = await executeQuery(
      `SELECT o.*, e.customer_name, DATEDIFF(o.validity_date, CURDATE()) as days_left FROM offers o JOIN enquiries e ON o.enquiry_id = e.id
       WHERE o.brand_id IN (${ph}) AND o.status = 'sent' AND o.validity_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       ORDER BY o.validity_date ASC`,
      ids
    )

    const [conv] = await executeQuery<any>(
      `SELECT
        COUNT(DISTINCT CASE WHEN status = 'order_received' THEN id END) as won,
        COUNT(DISTINCT CASE WHEN status = 'lost' THEN id END) as lost,
        COUNT(*) as total
       FROM enquiries WHERE brand_id IN (${ph})`,
      ids
    )
    const conversion_rate = conv.total > 0 ? Math.round((conv.won / conv.total) * 100) : 0

    const recent_enquiries = await executeQuery(
      `SELECT e.*, u.name as assigned_to_name FROM enquiries e
       LEFT JOIN new_users u ON e.assigned_to = u.id
       WHERE e.brand_id IN (${ph})
       ORDER BY e.created_at DESC LIMIT 10`,
      ids
    )

    res.json({ success: true, data: { enquiry_pipeline, expiring_offers, conversion_rate, recent_enquiries } })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
