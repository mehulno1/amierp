import { Response } from 'express'
import { executeQuery } from '../config/database'
import { AuthRequest } from '../types'

export async function getInventoryByType(req: AuthRequest, res: Response) {
  try {
    const { type } = req.params
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const items = await executeQuery(
      `SELECT i.*, s.name as stockpoint_name, b.name as brand_name,
        CASE WHEN i.product_variant_id IS NOT NULL THEN
          COALESCE((
            SELECT SUM(CASE WHEN oi.uom IN ('kgs','gms','mt') THEN oi.quantity_kgs ELSE oi.quantity_pcs END)
            FROM order_items oi
            JOIN new_orders o ON oi.order_id = o.id
            WHERE oi.product_variant_id = i.product_variant_id
              AND o.status IN ('new_order','processing','ready_for_dispatch')
          ), 0)
        ELSE i.reserved_stock END as reserved_stock
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
    const { brand_id, item_type, item_code, item_name, uom, current_stock, minimum_stock, maximum_stock, stockpoint_id } = req.body
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
    const opening = current_stock !== undefined && current_stock !== '' ? parseFloat(current_stock) || 0 : 0
    const minStock = minimum_stock !== undefined && minimum_stock !== '' ? parseFloat(minimum_stock) : null
    const maxStock = maximum_stock !== undefined && maximum_stock !== '' ? parseFloat(maximum_stock) : null
    const code = item_code != null && item_code !== '' ? item_code : null
    const stockpoint = stockpoint_id != null && stockpoint_id !== '' ? parseInt(stockpoint_id) : null

    const result = await executeQuery<any>(
      'INSERT INTO inventory_items (brand_id, stockpoint_id, item_type, item_code, item_name, uom, current_stock, minimum_stock, maximum_stock) VALUES (?,?,?,?,?,?,?,?,?)',
      [effectiveBrandId, stockpoint, item_type, code, item_name, uom || 'pcs', opening, minStock, maxStock]
    )
    const itemId = (result as any).insertId
    if (opening > 0) {
      await executeQuery(
        'INSERT INTO inventory_transactions (brand_id, inventory_item_id, transaction_type, quantity, notes, created_by, stock_before, stock_after) VALUES (?,?,?,?,?,?,?,?)',
        [effectiveBrandId, itemId, 'opening_stock', opening, 'Initial stock', req.user!.id, 0, opening]
      )
    }
    const item = await executeQuery('SELECT * FROM inventory_items WHERE id = ?', [itemId])
    res.status(201).json({ success: true, data: item[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function adjustInventory(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { adjustment_type, quantity, notes } = req.body
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const items = await executeQuery<any>(`SELECT * FROM inventory_items WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`, [id, ...ids])
    if (!items.length) return res.status(404).json({ success: false, error: 'Item not found' })

    const item = items[0]
    const stockBefore = parseFloat(item.current_stock)
    let newStock = stockBefore
    let txType: string

    if (adjustment_type === 'add') {
      newStock += parseFloat(quantity)
      txType = 'manual_add'
    } else if (adjustment_type === 'subtract') {
      newStock -= parseFloat(quantity)
      if (newStock < 0) return res.status(400).json({ success: false, error: 'Insufficient stock' })
      txType = 'manual_deduct'
    } else {
      newStock = parseFloat(quantity)
      txType = 'adjustment'
    }

    await executeQuery('UPDATE inventory_items SET current_stock = ? WHERE id = ?', [newStock, id])
    await executeQuery(
      'INSERT INTO inventory_transactions (brand_id, inventory_item_id, transaction_type, quantity, notes, created_by, stock_before, stock_after) VALUES (?,?,?,?,?,?,?,?)',
      [item.brand_id, id, txType, quantity, notes, req.user!.id, stockBefore, newStock]
    )
    res.json({ success: true, message: 'Inventory adjusted' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updateStockLevels(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { minimum_stock, maximum_stock } = req.body
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    await executeQuery(
      `UPDATE inventory_items SET minimum_stock=?, maximum_stock=? WHERE id=? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [minimum_stock || null, maximum_stock || null, id, ...ids]
    )
    res.json({ success: true, message: 'Stock levels updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function getTransactionHistory(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const txns = await executeQuery(
      `SELECT t.*, u.name as created_by_name FROM inventory_transactions t
       LEFT JOIN new_users u ON t.created_by = u.id
       WHERE t.inventory_item_id = ? ORDER BY t.created_at DESC LIMIT 200`,
      [id]
    )
    res.json({ success: true, data: txns })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updateInventoryItem(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { item_name, item_code, uom } = req.body
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    if (!item_name) return res.status(400).json({ success: false, error: 'Item name is required' })
    const items = await executeQuery<any>(
      `SELECT * FROM inventory_items WHERE id = ? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [id, ...ids]
    )
    if (!items.length) return res.status(404).json({ success: false, error: 'Item not found' })
    await executeQuery(
      'UPDATE inventory_items SET item_name = ?, item_code = ?, uom = ? WHERE id = ?',
      [item_name, item_code || null, uom || items[0].uom, id]
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
