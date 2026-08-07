import { Response } from 'express'
import { executeQuery } from '../config/database'
import { AuthRequest } from '../types'

export async function getInventoryByType(req: AuthRequest, res: Response) {
  try {
    const { type } = req.params
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    // Inventory is tracked on two dimensions: pcs (current_stock / reserved_stock)
    // and weight (current_stock_kgs / reserved_kgs). For finished goods linked to a
    // product variant, reserved is computed live from open orders — pcs from
    // quantity_pcs and kgs from quantity_kgs, independently.
    const items = await executeQuery(
      `SELECT i.*, s.name as stockpoint_name, b.name as brand_name,
        CASE WHEN i.product_variant_id IS NOT NULL THEN
          COALESCE((
            SELECT SUM(oi.quantity_pcs)
            FROM order_items oi
            JOIN new_orders o ON oi.order_id = o.id
            WHERE oi.product_variant_id = i.product_variant_id
              AND o.status IN ('new_order','processing','ready_for_dispatch')
          ), 0)
        ELSE i.reserved_stock END as reserved_stock,
        CASE WHEN i.product_variant_id IS NOT NULL THEN
          COALESCE((
            SELECT SUM(oi.quantity_kgs)
            FROM order_items oi
            JOIN new_orders o ON oi.order_id = o.id
            WHERE oi.product_variant_id = i.product_variant_id
              AND o.status IN ('new_order','processing','ready_for_dispatch')
          ), 0)
        ELSE i.reserved_kgs END as reserved_kgs
       FROM inventory_items i
       LEFT JOIN stockpoints s ON i.stockpoint_id = s.id
       JOIN brands b ON i.brand_id = b.id
       WHERE i.brand_id IN (${ids.map(() => '?').join(',')}) AND i.item_type = ? AND i.is_active = 1 ORDER BY i.item_name`,
      [...ids, type]
    )
    res.json({ success: true, data: items })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createInventoryItem(req: AuthRequest, res: Response) {
  try {
    const { brand_id, item_type, item_code, item_name, uom, current_stock, current_stock_pcs, current_stock_kgs,
            minimum_stock, minimum_stock_kgs, maximum_stock, maximum_stock_kgs, stockpoint_id,
            length_per_piece_mtr, weight_per_piece_kgs } = req.body
    const effectiveBrandId = Number(brand_id || req.brandId)
    if (!effectiveBrandId || !req.userBrandIds!.includes(effectiveBrandId)) {
      return res.status(400).json({ success: false, error: 'Valid company required' })
    }
    if (!item_name || !item_type) {
      return res.status(400).json({ success: false, error: 'Item name and type are required' })
    }
    // mysql2 rejects `undefined` parameters with "Bind parameters must not contain undefined".
    // Inventory's AddItemModal omits some columns entirely (no max-stock field at all), so
    // we coerce every nullable column here rather than relying on each caller to do it.
    // Inventory is dual-unit: pcs columns + kgs columns. `current_stock_pcs` falls back to
    // the legacy `current_stock` field for older callers.
    const num = (v: any) => (v !== undefined && v !== null && v !== '' ? parseFloat(v) || 0 : 0)
    const nullNum = (v: any) => (v !== undefined && v !== null && v !== '' ? parseFloat(v) : null)
    const openingPcs = num(current_stock_pcs !== undefined ? current_stock_pcs : current_stock)
    const openingKgs = num(current_stock_kgs)
    const minStock = nullNum(minimum_stock)
    const minStockKgs = nullNum(minimum_stock_kgs)
    const maxStock = nullNum(maximum_stock)
    const maxStockKgs = nullNum(maximum_stock_kgs)
    const code = item_code != null && item_code !== '' ? item_code : null
    const stockpoint = stockpoint_id != null && stockpoint_id !== '' ? parseInt(stockpoint_id) : null

    const result = await executeQuery<any>(
      `INSERT INTO inventory_items
        (brand_id, stockpoint_id, item_type, item_code, item_name, uom,
         current_stock, current_stock_kgs, minimum_stock, minimum_stock_kgs, maximum_stock, maximum_stock_kgs,
         length_per_piece_mtr, weight_per_piece_kgs)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [effectiveBrandId, stockpoint, item_type, code, item_name, uom || 'pcs',
       openingPcs, openingKgs, minStock, minStockKgs, maxStock, maxStockKgs,
       nullNum(length_per_piece_mtr), nullNum(weight_per_piece_kgs)]
    )
    const itemId = (result as any).insertId
    if (openingPcs > 0 || openingKgs > 0) {
      await executeQuery(
        `INSERT INTO inventory_transactions
          (brand_id, inventory_item_id, transaction_type, quantity, quantity_kgs, notes, created_by,
           stock_before, stock_after, stock_before_kgs, stock_after_kgs)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [effectiveBrandId, itemId, 'opening_stock', openingPcs, openingKgs, 'Initial stock', req.user!.id, 0, openingPcs, 0, openingKgs]
      )
    }
    const item = await executeQuery('SELECT * FROM inventory_items WHERE id = ?', [itemId])
    res.status(201).json({ success: true, data: item[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function adjustInventory(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    // Dual-unit adjustment: caller may supply quantity_pcs and/or quantity_kgs.
    // `quantity` is kept as a legacy alias for the pcs amount.
    const { adjustment_type, quantity, quantity_pcs, quantity_kgs, notes } = req.body
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const items = await executeQuery<any>(`SELECT * FROM inventory_items WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [id, ...ids])
    if (!items.length) return res.status(404).json({ success: false, error: 'Item not found' })

    const item = items[0]
    const qtyPcs = parseFloat(quantity_pcs !== undefined ? quantity_pcs : quantity) || 0
    const qtyKgs = parseFloat(quantity_kgs) || 0
    if (qtyPcs <= 0 && qtyKgs <= 0) {
      return res.status(400).json({ success: false, error: 'Enter a pcs and/or kgs quantity' })
    }

    const beforePcs = parseFloat(item.current_stock)
    const beforeKgs = parseFloat(item.current_stock_kgs)
    let newPcs = beforePcs
    let newKgs = beforeKgs
    let txType: string

    if (adjustment_type === 'add') {
      newPcs += qtyPcs
      newKgs += qtyKgs
      txType = 'manual_add'
    } else if (adjustment_type === 'subtract') {
      newPcs -= qtyPcs
      newKgs -= qtyKgs
      if (newPcs < 0 || newKgs < 0) return res.status(400).json({ success: false, error: 'Insufficient stock' })
      txType = 'manual_deduct'
    } else {
      // 'set' only overwrites a dimension the caller actually provided a value for.
      if (quantity_pcs !== undefined || quantity !== undefined) newPcs = qtyPcs
      if (quantity_kgs !== undefined) newKgs = qtyKgs
      txType = 'adjustment'
    }

    await executeQuery('UPDATE inventory_items SET current_stock = ?, current_stock_kgs = ? WHERE id = ?', [newPcs, newKgs, id])
    await executeQuery(
      `INSERT INTO inventory_transactions
        (brand_id, inventory_item_id, transaction_type, quantity, quantity_kgs, notes, created_by,
         stock_before, stock_after, stock_before_kgs, stock_after_kgs)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [item.brand_id, id, txType, qtyPcs, qtyKgs, notes ?? null, req.user!.id, beforePcs, newPcs, beforeKgs, newKgs]
    )
    res.json({ success: true, message: 'Inventory adjusted' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updateStockLevels(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { minimum_stock, maximum_stock, minimum_stock_kgs, maximum_stock_kgs } = req.body
    const lvl = (v: any) => (v !== undefined && v !== null && v !== '' ? parseFloat(v) : null)
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    await executeQuery(
      `UPDATE inventory_items SET minimum_stock=?, maximum_stock=?, minimum_stock_kgs=?, maximum_stock_kgs=?
       WHERE id=? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [lvl(minimum_stock), lvl(maximum_stock), lvl(minimum_stock_kgs), lvl(maximum_stock_kgs), id, ...ids]
    )
    res.json({ success: true, message: 'Stock levels updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

// Per-item incoming/outgoing totals over a window (default 30 days), both dimensions.
// Types follow reportsController.stockMovement: purchase/opening/manual_add/release are
// inflow; everything else (dispatch, manual_deduct, reserved, transfer, adjustment) outflow.
export async function getMovementSummary(req: AuthRequest, res: Response) {
  try {
    const days = Math.max(1, Math.min(365, parseInt(String(req.query.days)) || 30))
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const rows = await executeQuery<any>(
      `SELECT inventory_item_id,
         SUM(CASE WHEN transaction_type IN ('purchase','opening_stock','set_opening','manual_add','release') THEN quantity ELSE 0 END) AS in_qty,
         SUM(CASE WHEN transaction_type IN ('purchase','opening_stock','set_opening','manual_add','release') THEN COALESCE(quantity_kgs,0) ELSE 0 END) AS in_kgs,
         SUM(CASE WHEN transaction_type NOT IN ('purchase','opening_stock','set_opening','manual_add','release') THEN quantity ELSE 0 END) AS out_qty,
         SUM(CASE WHEN transaction_type NOT IN ('purchase','opening_stock','set_opening','manual_add','release') THEN COALESCE(quantity_kgs,0) ELSE 0 END) AS out_kgs
       FROM inventory_transactions
       WHERE brand_id IN (${ids.map(() => '?').join(',')}) AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY inventory_item_id`,
      [...ids, days]
    )
    res.json({ success: true, data: rows, days })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function getTransactionHistory(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const txns = await executeQuery(
      `SELECT t.*, u.name as created_by_name FROM inventory_transactions t
       LEFT JOIN new_users u ON t.created_by = u.id
       WHERE t.inventory_item_id = ? ORDER BY t.created_at DESC, t.id DESC LIMIT 200`,
      [id]
    )
    res.json({ success: true, data: txns })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updateInventoryItem(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { item_name, item_code, uom, length_per_piece_mtr, weight_per_piece_kgs } = req.body
    const nn = (v: any) => (v !== undefined && v !== null && v !== '' ? parseFloat(v) : null)
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    if (!item_name) return res.status(400).json({ success: false, error: 'Item name is required' })
    const items = await executeQuery<any>(
      `SELECT * FROM inventory_items WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!items.length) return res.status(404).json({ success: false, error: 'Item not found' })
    await executeQuery(
      'UPDATE inventory_items SET item_name = ?, item_code = ?, uom = ?, length_per_piece_mtr = ?, weight_per_piece_kgs = ? WHERE id = ?',
      [item_name, item_code || null, uom || items[0].uom,
       length_per_piece_mtr !== undefined ? nn(length_per_piece_mtr) : items[0].length_per_piece_mtr,
       weight_per_piece_kgs !== undefined ? nn(weight_per_piece_kgs) : items[0].weight_per_piece_kgs, id]
    )
    const updated = await executeQuery('SELECT * FROM inventory_items WHERE id = ?', [id])
    res.json({ success: true, data: updated[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function deleteInventoryItem(req: AuthRequest, res: Response) {
  try {
    await executeQuery('UPDATE inventory_items SET is_active = 0 WHERE id = ? AND brand_id = ?', [req.params.id, req.brandId])
    res.json({ success: true, message: 'Item deactivated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
