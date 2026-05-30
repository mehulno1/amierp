-- AMI ERP: link inventory_items to product_variants for auto-sync of finished goods.
--
-- Background:
--   productController.syncVariantToInventory writes/reads inventory_items.product_variant_id,
--   and inventoryController.getInventoryByType reads it to compute reserved stock from open
--   orders. The column was never declared in 002_inventory.sql, so the application has been
--   throwing on every variant create and on every finished-goods list. This migration adds the
--   column and backfills rows for variants that were created while the link was broken.

-- Add column + index, idempotently (the EC2 DB already has this column from an out-of-band hotfix;
-- the local dev DB and any fresh installs don't, so guard before altering).
SET @col_exists := (SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_schema = DATABASE() AND table_name = 'inventory_items' AND column_name = 'product_variant_id');
SET @alter_sql := IF(@col_exists = 0,
                     'ALTER TABLE inventory_items ADD COLUMN product_variant_id INT NULL AFTER stockpoint_id',
                     'SELECT 1');
PREPARE alter_stmt FROM @alter_sql; EXECUTE alter_stmt; DEALLOCATE PREPARE alter_stmt;

SET @idx_exists := (SELECT COUNT(*) FROM information_schema.statistics
                    WHERE table_schema = DATABASE() AND table_name = 'inventory_items' AND index_name = 'idx_inv_variant');
SET @idx_sql := IF(@idx_exists = 0,
                   'CREATE INDEX idx_inv_variant ON inventory_items (product_variant_id)',
                   'SELECT 1');
PREPARE idx_stmt FROM @idx_sql; EXECUTE idx_stmt; DEALLOCATE PREPARE idx_stmt;

-- Link any pre-existing inventory rows whose item_name matches the synthesized
-- "{product.item_name} - {variant.variant_name}" pattern used by the sync function.
UPDATE inventory_items i
JOIN product_variants pv ON pv.is_active = 1
JOIN new_products p ON pv.product_id = p.id AND p.is_active = 1
SET i.product_variant_id = pv.id
WHERE i.product_variant_id IS NULL
  AND i.item_type = 'finished_goods'
  AND i.is_active = 1
  AND i.brand_id = p.brand_id
  AND i.item_name = CONCAT(p.item_name, ' - ', pv.variant_name);

-- Backfill an inventory_items row for every active variant that still has no link.
-- Mirrors syncVariantToInventory:
--   - item_type = 'finished_goods'
--   - item_name = '{product.item_name} - {variant.variant_name}'
--   - item_code = product.item_code
--   - uom mapped through UOM_MAP (only 'mt' needs collapsing to 'kgs'; the rest match the enum)
--   - current_stock = 0
INSERT INTO inventory_items (brand_id, product_variant_id, item_type, item_code, item_name, uom, current_stock)
SELECT
  p.brand_id,
  pv.id,
  'finished_goods',
  p.item_code,
  CONCAT(p.item_name, ' - ', pv.variant_name),
  CASE WHEN pv.uom = 'mt' THEN 'kgs' ELSE pv.uom END,
  0
FROM product_variants pv
JOIN new_products p ON pv.product_id = p.id
WHERE pv.is_active = 1
  AND p.is_active = 1
  AND NOT EXISTS (
    SELECT 1 FROM inventory_items i
    WHERE i.product_variant_id = pv.id
      AND i.item_type = 'finished_goods'
      AND i.is_active = 1
  );
