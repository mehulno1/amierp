-- AMI ERP: Purchase goods-receipt notes (GRN) — partial receipt tracking.
-- A PO can be received in several deliveries; each GRN (po_receipts header + lines)
-- is an immutable-ish event log. purchase_order_items.received_qty becomes a recomputed
-- cache = SUM(po_receipt_items.received_qty). Inventory is credited exactly once per
-- receipt line via a per-receipt delta (transaction_type='purchase').

-- 0) Inventory ledger needs before/after snapshots for every credit/debit. These columns
-- are referenced by existing code (inventoryController) and by the new GRN credit path, but
-- were missing from 002_inventory.sql. Add them here (idempotent) so a clean migration build
-- — and any already-migrated environment — both end up with the columns. MySQL has no
-- ADD COLUMN IF NOT EXISTS, so guard via information_schema + a prepared statement.
SET @add_sb := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'inventory_transactions' AND column_name = 'stock_before');
SET @ddl := IF(@add_sb = 0,
  'ALTER TABLE inventory_transactions ADD COLUMN stock_before DECIMAL(12,3) NULL',
  'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @add_sa := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'inventory_transactions' AND column_name = 'stock_after');
SET @ddl := IF(@add_sa = 0,
  'ALTER TABLE inventory_transactions ADD COLUMN stock_after DECIMAL(12,3) NULL',
  'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 1) Carry the spare-part link onto PO items so a GRN can credit the right inventory row.
-- Idempotent: skip the ADD COLUMN when it already exists.
SET @add_spi := (SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'purchase_order_items' AND column_name = 'spare_part_id');
SET @ddl := IF(@add_spi = 0,
  'ALTER TABLE purchase_order_items ADD COLUMN spare_part_id INT NULL',
  'DO 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Best-effort backfill: a PO is linked to a requisition via purchase_orders.requisition_id.
-- PO items have no direct FK to requisition_items, so match each PO item to its source
-- requisition line by requisition_id + TRIM(description). Only copy spare_part_id when the
-- match is unambiguous (exactly one requisition line with that trimmed description and a
-- non-null spare_part_id); leave NULL otherwise.
UPDATE purchase_order_items poi
JOIN purchase_orders po ON po.id = poi.po_id
SET poi.spare_part_id = (
  -- MAX() (not a bare column) keeps this valid under ONLY_FULL_GROUP_BY; the HAVING below
  -- guarantees a single distinct spare_part_id, so MAX is exact, not a heuristic.
  SELECT MAX(ri.spare_part_id)
  FROM requisition_items ri
  WHERE ri.requisition_id = po.requisition_id
    AND TRIM(ri.description) = TRIM(poi.description)
    AND ri.spare_part_id IS NOT NULL
  GROUP BY TRIM(ri.description)
  HAVING COUNT(DISTINCT ri.spare_part_id) = 1
  LIMIT 1
)
WHERE po.requisition_id IS NOT NULL
  AND poi.spare_part_id IS NULL;

-- 2) GRN header.
CREATE TABLE IF NOT EXISTS po_receipts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  po_id INT NOT NULL,
  receipt_no VARCHAR(30) NOT NULL,
  receipt_date DATE NOT NULL,
  received_by INT NULL,
  transporter VARCHAR(200),
  lr_number VARCHAR(100),
  vehicle_no VARCHAR(50),
  vendor_invoice_no VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_po_receipts_po (po_id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES new_users(id)
);

-- 3) GRN lines.
CREATE TABLE IF NOT EXISTS po_receipt_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  receipt_id INT NOT NULL,
  po_item_id INT NOT NULL,
  received_qty DECIMAL(10,3) NOT NULL DEFAULT 0,
  FOREIGN KEY (receipt_id) REFERENCES po_receipts(id) ON DELETE CASCADE,
  FOREIGN KEY (po_item_id) REFERENCES purchase_order_items(id) ON DELETE CASCADE
);

-- Note: inventory_transactions.transaction_type already includes 'purchase' (002), so no
-- enum change is required for GRN inventory credits.
