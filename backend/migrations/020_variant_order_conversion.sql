-- 020_variant_order_conversion.sql
-- Variant rework + Mtr/Kgs order entry with auto pcs/weight conversion.
--
-- A product variant now carries per-piece conversion factors:
--   length_per_piece_mtr (new) and weight_kg (existing, = weight per piece).
-- Its single price stays in client_rate (mrp_rate is left in place but unused).
--
-- Order/PI lines now also store the BILLABLE quantity in the variant's own UOM
-- (e.g. meters for a per-metre pipe) plus that billing_uom, so Qty x Rate = Total
-- reconciles regardless of whether the client ordered in Mtr, Kgs or Pcs.
--
-- These per-piece factors are mirrored onto finished-goods inventory rows.
--
-- Additive only — applied idempotently via backend/scripts/applyVariantConversion.js.

ALTER TABLE product_variants ADD COLUMN length_per_piece_mtr DECIMAL(10,3) NULL;

ALTER TABLE inventory_items ADD COLUMN length_per_piece_mtr DECIMAL(10,3) NULL;
ALTER TABLE inventory_items ADD COLUMN weight_per_piece_kgs DECIMAL(10,3) NULL;

ALTER TABLE order_items ADD COLUMN billable_quantity DECIMAL(12,3) NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN billing_uom VARCHAR(20) NULL;

ALTER TABLE pi_items ADD COLUMN billable_quantity DECIMAL(12,3) NOT NULL DEFAULT 0;
ALTER TABLE pi_items ADD COLUMN billing_uom VARCHAR(20) NULL;
