import { Response } from 'express'
import { executeQuery } from '../config/database'
import { AuthRequest } from '../types'

const UOM_MAP: Record<string, string> = { mt: 'kgs', mtr: 'mtr', pcs: 'pcs', kgs: 'kgs', nos: 'nos', set: 'set', gms: 'gms', ltr: 'ltr', ml: 'ml' }

async function syncVariantToInventory(brandId: number, itemCode: string | null, itemName: string, variantName: string, uom: string, variantId?: number) {
  const inventoryName = `${itemName} - ${variantName}`
  const mappedUom = UOM_MAP[uom] || 'pcs'
  const existing = await executeQuery<any>(
    `SELECT id FROM inventory_items WHERE (product_variant_id=? OR (brand_id=? AND item_name=?)) AND item_type='finished_goods' AND is_active=1`,
    [variantId || 0, brandId, inventoryName]
  )
  if (!existing.length) {
    await executeQuery(
      'INSERT INTO inventory_items (brand_id, product_variant_id, item_type, item_code, item_name, uom, current_stock) VALUES (?,?,?,?,?,?,?)',
      [brandId, variantId || null, 'finished_goods', itemCode || null, inventoryName, mappedUom, 0]
    )
  } else if (variantId && !existing[0].product_variant_id) {
    await executeQuery('UPDATE inventory_items SET product_variant_id=? WHERE id=?', [variantId, existing[0].id])
  }
}

export async function getProducts(req: AuthRequest, res: Response) {
  try {
    const ids = req.brandId ? [req.brandId] : req.userBrandIds!
    const products = await executeQuery<any>(
      `SELECT p.*, b.name as brand_name FROM new_products p JOIN brands b ON p.brand_id = b.id WHERE p.brand_id IN (${ids.map(() => '?').join(',')}) AND p.is_active = 1 ORDER BY p.item_name`,
      ids
    )
    for (const p of products) {
      p.variants = await executeQuery('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1', [p.id])
    }
    res.json({ success: true, data: products })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createProduct(req: AuthRequest, res: Response) {
  try {
    const { brand_id, item_code, item_name, category, description, variants } = req.body
    const effectiveBrandId = Number(brand_id || req.brandId)
    if (!effectiveBrandId || !req.userBrandIds!.includes(effectiveBrandId)) {
      return res.status(400).json({ success: false, error: 'Valid company required' })
    }
    const result = await executeQuery<any>(
      'INSERT INTO new_products (brand_id, item_code, item_name, category, description) VALUES (?,?,?,?,?)',
      [effectiveBrandId, item_code, item_name, category, description]
    )
    const productId = (result as any).insertId
    if (variants?.length) {
      for (const v of variants) {
        await executeQuery(
          'INSERT INTO product_variants (product_id, variant_name, uom, client_rate, mrp_rate, weight_kg) VALUES (?,?,?,?,?,?)',
          [productId, v.variant_name, v.uom || 'pcs', v.client_rate, v.mrp_rate, v.weight_kg]
        )
        const vRes = await executeQuery<any>('SELECT id FROM product_variants WHERE product_id=? AND variant_name=? ORDER BY id DESC LIMIT 1', [productId, v.variant_name])
        await syncVariantToInventory(effectiveBrandId, item_code, item_name, v.variant_name, v.uom || 'pcs', vRes[0]?.id)
      }
    }
    const product = await executeQuery('SELECT * FROM new_products WHERE id = ?', [productId])
    const variantData = await executeQuery('SELECT * FROM product_variants WHERE product_id = ?', [productId])
    res.status(201).json({ success: true, data: { ...product[0], variants: variantData } })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updateProduct(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params
    const { item_code, item_name, category, description } = req.body
    const ids = req.userBrandIds!
    await executeQuery(
      `UPDATE new_products SET item_code=?, item_name=?, category=?, description=? WHERE id=? AND brand_id IN (${ids.map(() => '?').join(',')})`,
      [item_code, item_name, category, description, id, ...ids]
    )
    res.json({ success: true, message: 'Product updated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function deleteProduct(req: AuthRequest, res: Response) {
  try {
    const ids2 = req.userBrandIds!
    await executeQuery(`UPDATE new_products SET is_active = 0 WHERE id = ? AND brand_id IN (${ids2.map(() => '?').join(',')})`, [req.params.id, ...ids2])
    res.json({ success: true, message: 'Product deactivated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function createVariant(req: AuthRequest, res: Response) {
  try {
    const { product_id } = req.params
    const { variant_name, uom, client_rate, mrp_rate, weight_kg } = req.body
    const result = await executeQuery<any>(
      'INSERT INTO product_variants (product_id, variant_name, uom, client_rate, mrp_rate, weight_kg) VALUES (?,?,?,?,?,?)',
      [product_id, variant_name, uom || 'pcs', client_rate, mrp_rate, weight_kg]
    )
    const variant = await executeQuery('SELECT * FROM product_variants WHERE id = ?', [(result as any).insertId])

    const products = await executeQuery<any>('SELECT * FROM new_products WHERE id = ?', [product_id])
    if (products.length) {
      const p = products[0]
      await syncVariantToInventory(p.brand_id, p.item_code, p.item_name, variant_name, uom || 'pcs', (result as any).insertId)
    }

    res.status(201).json({ success: true, data: variant[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function updateVariant(req: AuthRequest, res: Response) {
  try {
    const { variant_id } = req.params
    const { variant_name, uom, client_rate, mrp_rate, weight_kg } = req.body
    await executeQuery(
      'UPDATE product_variants SET variant_name=?, uom=?, client_rate=?, mrp_rate=?, weight_kg=? WHERE id=?',
      [variant_name, uom, client_rate, mrp_rate, weight_kg, variant_id]
    )
    const variant = await executeQuery('SELECT * FROM product_variants WHERE id = ?', [variant_id])
    res.json({ success: true, data: variant[0] })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}

export async function deleteVariant(req: AuthRequest, res: Response) {
  try {
    await executeQuery('UPDATE product_variants SET is_active = 0 WHERE id = ?', [req.params.variant_id])
    res.json({ success: true, message: 'Variant deactivated' })
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }) }
}
