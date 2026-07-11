import { Response } from 'express'
import { executeQuery } from '../config/database'
import { AuthRequest } from '../types'

// ---- helpers ---------------------------------------------------------------

// Brand scope: a specific brand (x-brand-id header) when set, else all of the
// user's brands. Mirrors dashboardController.
function scope(req: AuthRequest) {
  const ids = req.brandId ? [req.brandId] : req.userBrandIds!
  const ph = ids.map(() => '?').join(',')
  return { ids, ph }
}

// Resolve a [from,to] date window from query params, defaulting to the last 12
// months. Returns YYYY-MM-DD strings safe to bind into queries.
function dateRange(req: AuthRequest): { from: string; to: string } {
  const isDate = (s: any) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
  const to = isDate(req.query.to) ? (req.query.to as string) : new Date().toISOString().slice(0, 10)
  let from = req.query.from as string
  if (!isDate(from)) {
    const d = new Date()
    d.setMonth(d.getMonth() - 11, 1)
    from = d.toISOString().slice(0, 10)
  }
  return { from, to }
}

function fail(res: Response, err: any) {
  res.status(500).json({ success: false, error: err?.message || 'Report failed' })
}

// ---- 1. Open POs / GRN pending --------------------------------------------

export async function openPurchaseOrders(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    const rows = await executeQuery<any>(
      `SELECT po.id, po.po_no, po.po_date, po.status, v.name AS vendor_name,
         COALESCE(SUM(poi.qty),0)          AS ordered_qty,
         COALESCE(SUM(poi.received_qty),0) AS received_qty,
         COALESCE(SUM(poi.total),0)        AS po_value,
         COALESCE(SUM(poi.rate * GREATEST(poi.qty - poi.received_qty, 0)),0) AS pending_value,
         DATEDIFF(CURDATE(), po.po_date)   AS age_days
       FROM purchase_orders po
       JOIN vendors v ON v.id = po.vendor_id
       LEFT JOIN purchase_order_items poi ON poi.po_id = po.id
       WHERE po.brand_id IN (${ph}) AND po.status IN ('confirmed','partially_delivered')
       GROUP BY po.id, po.po_no, po.po_date, po.status, v.name
       ORDER BY age_days DESC`,
      ids
    )
    const byVendor: Record<string, number> = {}
    let pendingValue = 0
    for (const r of rows) {
      pendingValue += Number(r.pending_value)
      byVendor[r.vendor_name] = (byVendor[r.vendor_name] || 0) + Number(r.pending_value)
    }
    const vendor_pending = Object.entries(byVendor)
      .map(([vendor, value]) => ({ vendor, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value)
    res.json({
      success: true,
      data: {
        rows,
        vendor_pending,
        totals: { open_pos: rows.length, pending_value: Math.round(pendingValue) },
      },
    })
  } catch (err) { fail(res, err) }
}

// ---- 2. Procurement spend --------------------------------------------------

export async function procurementSpend(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    const { from, to } = dateRange(req)

    const monthly = await executeQuery<any>(
      `SELECT DATE_FORMAT(po.po_date,'%Y-%m') AS ym, COALESCE(SUM(poi.total),0) AS basic
       FROM purchase_orders po JOIN purchase_order_items poi ON poi.po_id = po.id
       WHERE po.brand_id IN (${ph}) AND po.status <> 'cancelled' AND po.po_date BETWEEN ? AND ?
       GROUP BY ym ORDER BY ym`,
      [...ids, from, to]
    )
    const byVendor = await executeQuery<any>(
      `SELECT v.name AS vendor, COUNT(DISTINCT po.id) AS po_count, COALESCE(SUM(poi.total),0) AS basic
       FROM purchase_orders po JOIN vendors v ON v.id = po.vendor_id
       JOIN purchase_order_items poi ON poi.po_id = po.id
       WHERE po.brand_id IN (${ph}) AND po.status <> 'cancelled' AND po.po_date BETWEEN ? AND ?
       GROUP BY v.name ORDER BY basic DESC LIMIT 15`,
      [...ids, from, to]
    )
    const byArea = await executeQuery<any>(
      `SELECT COALESCE(NULLIF(TRIM(r.machine_area),''),'Unassigned') AS area, COALESCE(SUM(poi.total),0) AS basic
       FROM purchase_orders po
       LEFT JOIN requisitions r ON r.id = po.requisition_id
       JOIN purchase_order_items poi ON poi.po_id = po.id
       WHERE po.brand_id IN (${ph}) AND po.status <> 'cancelled' AND po.po_date BETWEEN ? AND ?
       GROUP BY area ORDER BY basic DESC`,
      [...ids, from, to]
    )
    const total = monthly.reduce((s: number, r: any) => s + Number(r.basic), 0)
    res.json({
      success: true,
      data: { monthly, by_vendor: byVendor, by_area: byArea, totals: { spend: Math.round(total) }, range: { from, to } },
    })
  } catch (err) { fail(res, err) }
}

// ---- 3. Vendor performance -------------------------------------------------

export async function vendorPerformance(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)

    const base = await executeQuery<any>(
      `SELECT v.id, v.name,
         COUNT(DISTINCT po.id) AS total_pos,
         COALESCE(SUM(poi.total),0) AS total_value,
         SUM(CASE WHEN po.status = 'delivered' THEN 1 ELSE 0 END) AS delivered_lines
       FROM vendors v
       LEFT JOIN purchase_orders po ON po.vendor_id = v.id AND po.status <> 'cancelled' AND po.brand_id IN (${ph})
       LEFT JOIN purchase_order_items poi ON poi.po_id = po.id
       WHERE v.brand_id IN (${ph})
       GROUP BY v.id, v.name`,
      [...ids, ...ids]
    )

    // Lead time + promised days per delivered PO.
    const lead = await executeQuery<any>(
      `SELECT po.vendor_id,
         DATEDIFF(MAX(pr.receipt_date), po.po_date) AS lead_days,
         (SELECT MAX(vqi.delivery_days) FROM vendor_quotation_items vqi
            WHERE vqi.quotation_id = po.vendor_quotation_id) AS promised_days
       FROM purchase_orders po JOIN po_receipts pr ON pr.po_id = po.id
       WHERE po.brand_id IN (${ph}) AND po.status = 'delivered'
       GROUP BY po.vendor_id, po.id, po.po_date, po.vendor_quotation_id`,
      ids
    )
    const agg: Record<number, { sum: number; n: number; onTime: number; promised: number }> = {}
    for (const l of lead) {
      const a = (agg[l.vendor_id] ||= { sum: 0, n: 0, onTime: 0, promised: 0 })
      if (l.lead_days != null) { a.sum += Number(l.lead_days); a.n += 1 }
      if (l.promised_days != null && l.lead_days != null) {
        a.promised += 1
        if (Number(l.lead_days) <= Number(l.promised_days)) a.onTime += 1
      }
    }

    const rows = base
      .map((v: any) => {
        const a = agg[v.id]
        return {
          id: v.id,
          name: v.name,
          total_pos: Number(v.total_pos),
          total_value: Math.round(Number(v.total_value)),
          avg_lead_days: a && a.n ? Math.round((a.sum / a.n) * 10) / 10 : null,
          on_time_pct: a && a.promised ? Math.round((a.onTime / a.promised) * 100) : null,
          rated_pos: a ? a.n : 0,
        }
      })
      .filter((v: any) => v.total_pos > 0)
      .sort((a: any, b: any) => b.total_value - a.total_value)

    res.json({ success: true, data: { rows } })
  } catch (err) { fail(res, err) }
}

// ---- 4. Requisition cycle-time / approval SLA ------------------------------

export async function requisitionSla(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    const rows = await executeQuery<any>(
      `SELECT r.id, r.indent_no, r.status, r.priority, r.created_at, r.approved_at,
         u.name AS created_by_name,
         (SELECT MIN(po.created_at) FROM purchase_orders po WHERE po.requisition_id = r.id) AS first_po_at,
         CASE WHEN r.approved_at IS NOT NULL THEN DATEDIFF(r.approved_at, r.created_at) END AS approval_days,
         DATEDIFF(CURDATE(), DATE_ADD(r.created_at,
            INTERVAL COALESCE((SELECT MAX(ri.no_of_days) FROM requisition_items ri WHERE ri.requisition_id = r.id),7) DAY)) AS overdue_days
       FROM requisitions r
       JOIN new_users u ON u.id = r.created_by
       WHERE r.brand_id IN (${ph}) AND r.status <> 'cancelled'
       ORDER BY r.created_at DESC`,
      ids
    )
    let appSum = 0, appN = 0, procSum = 0, procN = 0, pendingApproval = 0, overdue = 0
    const overdueByPriority: Record<string, number> = { normal: 0, urgent: 0, critical: 0 }
    for (const r of rows) {
      if (r.approval_days != null) { appSum += Number(r.approval_days); appN += 1 }
      if (r.approved_at && r.first_po_at) {
        const d = Math.round((new Date(r.first_po_at).getTime() - new Date(r.approved_at).getTime()) / 86400000)
        if (d >= 0) { procSum += d; procN += 1 }
      }
      if (r.status === 'pending_approval') pendingApproval += 1
      if (Number(r.overdue_days) > 0 && !['delivered'].includes(r.status)) {
        overdue += 1
        overdueByPriority[r.priority] = (overdueByPriority[r.priority] || 0) + 1
      }
    }
    res.json({
      success: true,
      data: {
        rows,
        overdue_by_priority: overdueByPriority,
        totals: {
          total: rows.length,
          pending_approval: pendingApproval,
          overdue,
          avg_approval_days: appN ? Math.round((appSum / appN) * 10) / 10 : null,
          avg_procurement_days: procN ? Math.round((procSum / procN) * 10) / 10 : null,
        },
      },
    })
  } catch (err) { fail(res, err) }
}

// ---- 5. Low stock / reorder ------------------------------------------------

export async function reorderReport(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    // Inventory is dual-unit; report on the dimension matching each item's uom
    // (weight units -> kgs columns, everything else -> pcs columns).
    const CUR = `(CASE WHEN uom IN ('kgs','gms') THEN current_stock_kgs ELSE current_stock END)`
    const RSV = `(CASE WHEN uom IN ('kgs','gms') THEN reserved_kgs ELSE reserved_stock END)`
    const MIN = `(CASE WHEN uom IN ('kgs','gms') THEN minimum_stock_kgs ELSE minimum_stock END)`
    const MAX = `(CASE WHEN uom IN ('kgs','gms') THEN maximum_stock_kgs ELSE maximum_stock END)`
    const rows = await executeQuery<any>(
      `SELECT id, item_type, item_code, item_name, uom,
         ${CUR} AS current_stock, ${RSV} AS reserved_stock,
         ${MIN} AS minimum_stock, ${MAX} AS maximum_stock,
         (${CUR} - ${RSV}) AS available,
         GREATEST(COALESCE(${MAX}, ${MIN}) - (${CUR} - ${RSV}), 0) AS suggested_reorder
       FROM inventory_items
       WHERE brand_id IN (${ph}) AND is_active = 1 AND ${MIN} IS NOT NULL
         AND (${CUR} - ${RSV}) < ${MIN}
       ORDER BY (${CUR} - ${RSV} - ${MIN}) ASC`,
      ids
    )
    const byType: Record<string, number> = {}
    for (const r of rows) byType[r.item_type] = (byType[r.item_type] || 0) + 1
    res.json({ success: true, data: { rows, by_type: byType, totals: { items: rows.length } } })
  } catch (err) { fail(res, err) }
}

// ---- 6. Inventory valuation & aging ----------------------------------------

const AGE_BUCKETS = ['0-30', '31-90', '91-180', '180+']
function ageBucket(days: number | null): string {
  if (days == null) return 'unknown'
  if (days <= 30) return '0-30'
  if (days <= 90) return '31-90'
  if (days <= 180) return '91-180'
  return '180+'
}

export async function inventoryValuation(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    // Value the dimension matching each item's uom (weight -> kgs column, else pcs).
    const items = await executeQuery<any>(
      `SELECT id, item_type, item_code, item_name, uom,
         (CASE WHEN uom IN ('kgs','gms') THEN current_stock_kgs ELSE current_stock END) AS current_stock
       FROM inventory_items WHERE brand_id IN (${ph}) AND is_active = 1
         AND (CASE WHEN uom IN ('kgs','gms') THEN current_stock_kgs ELSE current_stock END) <> 0`,
      ids
    )
    // Last purchase rate per spare-linked inventory item (latest PO first).
    const purchaseRates = await executeQuery<any>(
      `SELECT poi.spare_part_id AS inv_id, poi.rate, po.po_date
       FROM purchase_order_items poi JOIN purchase_orders po ON po.id = poi.po_id
       WHERE po.brand_id IN (${ph}) AND poi.spare_part_id IS NOT NULL AND po.status <> 'cancelled'
       ORDER BY po.po_date DESC, po.id DESC`,
      ids
    )
    const costMap: Record<number, number> = {}
    for (const p of purchaseRates) if (costMap[p.inv_id] == null) costMap[p.inv_id] = Number(p.rate)

    // Finished-goods proxy: selling rate from a same-named product variant.
    const variantRates = await executeQuery<any>(
      `SELECT pv.variant_name, pv.client_rate FROM product_variants pv
       JOIN new_products p ON p.id = pv.product_id WHERE p.brand_id IN (${ph})`,
      ids
    )
    const variantMap: Record<string, number> = {}
    for (const v of variantRates) {
      const k = String(v.variant_name || '').trim().toLowerCase()
      if (k && variantMap[k] == null) variantMap[k] = Number(v.client_rate)
    }
    // Last inbound date per item for aging.
    const lastIn = await executeQuery<any>(
      `SELECT inventory_item_id, MAX(created_at) AS last_in
       FROM inventory_transactions
       WHERE brand_id IN (${ph}) AND transaction_type IN ('purchase','opening_stock','set_opening','manual_add')
       GROUP BY inventory_item_id`,
      ids
    )
    const ageMap: Record<number, string> = {}
    for (const a of lastIn) ageMap[a.inventory_item_id] = a.last_in

    const now = Date.now()
    const rows = items.map((it: any) => {
      let unitCost: number | null = null
      let costSource = 'none'
      if (costMap[it.id] != null) { unitCost = costMap[it.id]; costSource = 'last_purchase' }
      else if (it.item_type === 'finished_goods') {
        const k = String(it.item_name || '').trim().toLowerCase()
        if (variantMap[k] != null) { unitCost = variantMap[k]; costSource = 'variant_price' }
      }
      const value = unitCost != null ? Math.round(unitCost * Number(it.current_stock)) : null
      const li = ageMap[it.id]
      const ageDays = li ? Math.floor((now - new Date(li).getTime()) / 86400000) : null
      return {
        id: it.id, item_type: it.item_type, item_code: it.item_code, item_name: it.item_name,
        uom: it.uom, current_stock: Number(it.current_stock),
        unit_cost: unitCost, value, cost_source: costSource,
        age_days: ageDays, age_bucket: ageBucket(ageDays),
      }
    })

    const valueByType: Record<string, number> = {}
    const buckets: Record<string, number> = Object.fromEntries(AGE_BUCKETS.map(b => [b, 0]))
    let totalValue = 0, valuedItems = 0, uncosted = 0
    for (const r of rows) {
      if (r.value != null) {
        totalValue += r.value; valuedItems += 1
        valueByType[r.item_type] = (valueByType[r.item_type] || 0) + r.value
        if (r.age_bucket in buckets) buckets[r.age_bucket] += r.value
      } else uncosted += 1
    }
    rows.sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
    res.json({
      success: true,
      data: {
        rows, value_by_type: valueByType, value_by_age: buckets,
        totals: { value: totalValue, valued_items: valuedItems, uncosted_items: uncosted },
      },
    })
  } catch (err) { fail(res, err) }
}

// ---- 7. Stock movement ledger ----------------------------------------------

export async function stockMovement(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    const { from, to } = dateRange(req)
    const rows = await executeQuery<any>(
      `SELECT it.id, ii.item_code, ii.item_name, ii.item_type, it.transaction_type,
         it.quantity, it.stock_before, it.stock_after, it.reference_type, it.notes, it.created_at
       FROM inventory_transactions it JOIN inventory_items ii ON ii.id = it.inventory_item_id
       WHERE it.brand_id IN (${ph}) AND DATE(it.created_at) BETWEEN ? AND ?
       ORDER BY it.created_at DESC LIMIT 1000`,
      [...ids, from, to]
    )
    const topOut = await executeQuery<any>(
      `SELECT ii.item_name, ii.item_type, COALESCE(SUM(it.quantity),0) AS qty_out
       FROM inventory_transactions it JOIN inventory_items ii ON ii.id = it.inventory_item_id
       WHERE it.brand_id IN (${ph}) AND it.transaction_type IN ('dispatch','manual_deduct')
         AND DATE(it.created_at) BETWEEN ? AND ?
       GROUP BY ii.item_name, ii.item_type ORDER BY qty_out DESC LIMIT 12`,
      [...ids, from, to]
    )
    const inflowTypes = ['purchase', 'opening_stock', 'set_opening', 'manual_add', 'release']
    let inflow = 0, outflow = 0
    for (const r of rows) {
      if (inflowTypes.includes(r.transaction_type)) inflow += Number(r.quantity)
      else outflow += Number(r.quantity)
    }
    res.json({
      success: true,
      data: { rows, top_movers: topOut, totals: { inflow, outflow, count: rows.length }, range: { from, to } },
    })
  } catch (err) { fail(res, err) }
}

// ---- 8. Order fulfillment tracker ------------------------------------------

export async function fulfillment(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    const rows = await executeQuery<any>(
      `SELECT o.id, o.order_id, o.order_date, o.delivery_date, o.status, o.order_type,
         c.name AS client_name,
         COALESCE(SUM(oi.quantity_pcs),0) AS ordered_pcs, COALESCE(SUM(oi.delivered_pcs),0) AS delivered_pcs,
         COALESCE(SUM(oi.quantity_kgs),0) AS ordered_kgs, COALESCE(SUM(oi.delivered_kgs),0) AS delivered_kgs,
         CASE WHEN o.delivery_date IS NOT NULL AND o.delivery_date < CURDATE() THEN 1 ELSE 0 END AS overdue
       FROM new_orders o JOIN new_clients c ON c.id = o.client_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.brand_id IN (${ph}) AND o.status NOT IN ('completed','cancelled')
       GROUP BY o.id, o.order_id, o.order_date, o.delivery_date, o.status, o.order_type, c.name
       ORDER BY o.delivery_date IS NULL, o.delivery_date ASC`,
      ids
    )
    const byStatus: Record<string, number> = {}
    let overdue = 0
    for (const r of rows) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1
      const op = Number(r.ordered_pcs), dp = Number(r.delivered_pcs)
      const ok = Number(r.ordered_kgs), dk = Number(r.delivered_kgs)
      r.fulfilment_pct = op > 0 ? Math.round((dp / op) * 100) : ok > 0 ? Math.round((dk / ok) * 100) : 0
      if (r.overdue) overdue += 1
    }
    res.json({ success: true, data: { rows, by_status: byStatus, totals: { open_orders: rows.length, overdue } } })
  } catch (err) { fail(res, err) }
}

// ---- 9. Sales register & revenue trend -------------------------------------

export async function salesRegister(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    const { from, to } = dateRange(req)
    const monthly = await executeQuery<any>(
      `SELECT DATE_FORMAT(o.order_date,'%Y-%m') AS ym, o.order_type,
         COALESCE(SUM(f.basic_amount),0) AS basic, COALESCE(SUM(f.gst_amount),0) AS gst,
         COALESCE(SUM(f.total_amount),0) AS total
       FROM new_orders o JOIN order_financials f ON f.order_id = o.id
       WHERE o.brand_id IN (${ph}) AND o.status <> 'cancelled' AND o.order_date BETWEEN ? AND ?
       GROUP BY ym, o.order_type ORDER BY ym`,
      [...ids, from, to]
    )
    const byClient = await executeQuery<any>(
      `SELECT c.name AS client, COUNT(DISTINCT o.id) AS orders, COALESCE(SUM(f.total_amount),0) AS total
       FROM new_orders o JOIN order_financials f ON f.order_id = o.id JOIN new_clients c ON c.id = o.client_id
       WHERE o.brand_id IN (${ph}) AND o.status <> 'cancelled' AND o.order_date BETWEEN ? AND ?
       GROUP BY c.name ORDER BY total DESC LIMIT 15`,
      [...ids, from, to]
    )
    const byProduct = await executeQuery<any>(
      `SELECT COALESCE(NULLIF(TRIM(oi.product_name),''),'—') AS product, COALESCE(SUM(oi.total),0) AS total
       FROM new_orders o JOIN order_items oi ON oi.order_id = o.id
       WHERE o.brand_id IN (${ph}) AND o.status <> 'cancelled' AND o.order_date BETWEEN ? AND ?
       GROUP BY product ORDER BY total DESC LIMIT 15`,
      [...ids, from, to]
    )
    let total = 0, gst = 0, basic = 0
    for (const m of monthly) { total += Number(m.total); gst += Number(m.gst); basic += Number(m.basic) }
    res.json({
      success: true,
      data: {
        monthly, by_client: byClient, by_product: byProduct,
        totals: { total: Math.round(total), gst: Math.round(gst), basic: Math.round(basic) },
        range: { from, to },
      },
    })
  } catch (err) { fail(res, err) }
}

// ---- 10. Dispatch / delivery register --------------------------------------

export async function dispatchRegister(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    const { from, to } = dateRange(req)
    const rows = await executeQuery<any>(
      `SELECT od.id, od.delivery_no, od.delivery_date, o.order_id, c.name AS client_name,
         od.courier_name, od.transporter, od.awb_number, od.lr_link, od.vehicle_no, od.dispatched_by
       FROM order_deliveries od JOIN new_orders o ON o.id = od.order_id JOIN new_clients c ON c.id = o.client_id
       WHERE o.brand_id IN (${ph}) AND od.delivery_date BETWEEN ? AND ?
       ORDER BY od.delivery_date DESC, od.id DESC`,
      [...ids, from, to]
    )
    res.json({ success: true, data: { rows, totals: { deliveries: rows.length }, range: { from, to } } })
  } catch (err) { fail(res, err) }
}

// ---- 11. Receivables / outstanding -----------------------------------------

export async function receivables(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    const rows = await executeQuery<any>(
      `SELECT o.id, o.order_id, o.order_date, c.name AS client_name,
         f.total_amount, f.payment_received, f.invoice_no,
         (f.total_amount - f.payment_received) AS outstanding,
         DATEDIFF(CURDATE(), o.order_date) AS age_days
       FROM new_orders o JOIN order_financials f ON f.order_id = o.id JOIN new_clients c ON c.id = o.client_id
       WHERE o.brand_id IN (${ph}) AND o.status <> 'cancelled' AND (f.total_amount - f.payment_received) > 0.5
       ORDER BY age_days DESC`,
      ids
    )
    const buckets: Record<string, number> = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
    const byClient: Record<string, number> = {}
    let outstanding = 0
    for (const r of rows) {
      const o = Number(r.outstanding), a = Number(r.age_days)
      outstanding += o
      const b = a <= 30 ? '0-30' : a <= 60 ? '31-60' : a <= 90 ? '61-90' : '90+'
      r.age_bucket = b
      buckets[b] += o
      byClient[r.client_name] = (byClient[r.client_name] || 0) + o
    }
    const by_client = Object.entries(byClient)
      .map(([client, value]) => ({ client, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value).slice(0, 15)
    res.json({
      success: true,
      data: {
        rows, aging: buckets, by_client,
        totals: { outstanding: Math.round(outstanding), invoices: rows.length },
      },
    })
  } catch (err) { fail(res, err) }
}

// ---- 12. Sales funnel / conversion -----------------------------------------

export async function salesFunnel(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    const { from, to } = dateRange(req)

    const [counts] = await executeQuery<any>(
      `SELECT
         COUNT(*) AS enquiries,
         SUM(CASE WHEN status IN ('offer_sent','negotiation','order_received') THEN 1 ELSE 0 END) AS offered,
         SUM(CASE WHEN status = 'order_received' THEN 1 ELSE 0 END) AS won,
         SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) AS lost
       FROM enquiries WHERE brand_id IN (${ph}) AND created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)`,
      [...ids, from, to]
    )
    const bySource = await executeQuery<any>(
      `SELECT COALESCE(source,'unknown') AS source, COUNT(*) AS total,
         SUM(CASE WHEN status = 'order_received' THEN 1 ELSE 0 END) AS won
       FROM enquiries WHERE brand_id IN (${ph}) AND created_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)
       GROUP BY source ORDER BY total DESC`,
      [...ids, from, to]
    )
    const enquiries = Number(counts.enquiries)
    const funnel = [
      { stage: 'Enquiries', count: enquiries },
      { stage: 'Offered', count: Number(counts.offered) },
      { stage: 'Won', count: Number(counts.won) },
    ]
    res.json({
      success: true,
      data: {
        funnel,
        by_source: bySource.map((s: any) => ({
          source: s.source, total: Number(s.total), won: Number(s.won),
          conversion: Number(s.total) ? Math.round((Number(s.won) / Number(s.total)) * 100) : 0,
        })),
        totals: {
          enquiries, won: Number(counts.won), lost: Number(counts.lost),
          conversion: enquiries ? Math.round((Number(counts.won) / enquiries) * 100) : 0,
        },
        range: { from, to },
      },
    })
  } catch (err) { fail(res, err) }
}

// ---- 13. Expiring offers / follow-ups --------------------------------------

export async function expiringOffers(req: AuthRequest, res: Response) {
  try {
    const { ids, ph } = scope(req)
    const days = Number.isFinite(Number(req.query.days)) ? Number(req.query.days) : 30
    const rows = await executeQuery<any>(
      `SELECT o.id, o.offer_no, o.offer_date, o.validity_date, o.status,
         e.customer_name, e.contact_person, e.mobile,
         DATEDIFF(o.validity_date, CURDATE()) AS days_left
       FROM offers o JOIN enquiries e ON e.id = o.enquiry_id
       WHERE o.brand_id IN (${ph}) AND o.status = 'sent' AND o.validity_date IS NOT NULL
         AND o.validity_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY o.validity_date ASC`,
      [...ids, days]
    )
    let expired = 0, soon = 0
    for (const r of rows) { if (Number(r.days_left) < 0) expired += 1; else soon += 1 }
    res.json({ success: true, data: { rows, totals: { total: rows.length, expired, expiring_soon: soon }, window_days: days } })
  } catch (err) { fail(res, err) }
}
