-- 019_inventory_dual_uom.sql
-- Track inventory on TWO dimensions for every item: pieces (pcs) and weight (kgs).
--
-- The existing single-quantity columns are reused as the PCS dimension:
--   current_stock / reserved_stock / minimum_stock / maximum_stock  ->  PCS
-- and parallel *_kgs columns are added for the WEIGHT dimension.
--
-- The item's `uom` is left untouched: it still drives client docs / PI / invoice
-- (e.g. 'mtr'). Inventory on-hand is now always shown & adjusted as pcs + kgs.
--
-- One-time backfill: items whose selling unit is a weight unit ('kgs','gms') have
-- their existing stock moved from the pcs columns into the kgs columns, so a raw
-- material like "MS Round Bar" (850 kgs) reads 0 pcs / 850 kgs. Everything else
-- (pcs, mtr, ltr, nos, set, ml) keeps its value in the pcs column.
--
-- Applied idempotently via backend/scripts/applyDualUom.js (no migration runner here).

-- inventory_items: weight dimension
ALTER TABLE inventory_items ADD COLUMN current_stock_kgs DECIMAL(12,3) NOT NULL DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN reserved_kgs      DECIMAL(12,3) NOT NULL DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN minimum_stock_kgs DECIMAL(12,3) NULL;
ALTER TABLE inventory_items ADD COLUMN maximum_stock_kgs DECIMAL(12,3) NULL;

-- inventory_transactions: weight dimension (existing quantity/stock_before/stock_after = pcs)
ALTER TABLE inventory_transactions ADD COLUMN quantity_kgs     DECIMAL(12,3) NOT NULL DEFAULT 0;
ALTER TABLE inventory_transactions ADD COLUMN stock_before_kgs DECIMAL(12,3) NULL;
ALTER TABLE inventory_transactions ADD COLUMN stock_after_kgs  DECIMAL(12,3) NULL;

-- One-time backfill (move weight-unit items into the kgs dimension)
UPDATE inventory_items
   SET current_stock_kgs = current_stock,
       reserved_kgs      = reserved_stock,
       minimum_stock_kgs = minimum_stock,
       maximum_stock_kgs = maximum_stock,
       current_stock     = 0,
       reserved_stock    = 0,
       minimum_stock     = NULL,
       maximum_stock     = NULL
 WHERE uom IN ('kgs', 'gms');
