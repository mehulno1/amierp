-- AMI ERP: Bank masters per company + bank selection on order
--
-- A single company often has multiple bank accounts that may be used on PI/invoice
-- depending on the customer or order. brand_banks captures every account; new_orders
-- carries the chosen bank_id so PI generation can copy the snapshot at order time.

CREATE TABLE IF NOT EXISTS brand_banks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  bank_name VARCHAR(200) NOT NULL,
  account_no VARCHAR(50) NOT NULL,
  ifsc_code VARCHAR(20),
  swift_code VARCHAR(20),
  branch VARCHAR(200),
  is_default TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  INDEX idx_brand_banks_brand (brand_id)
);

-- Backfill: lift the single bank columns already stored on each brand into brand_banks
-- so existing PIs/orders keep their bank context once they're regenerated.
INSERT INTO brand_banks (brand_id, account_name, bank_name, account_no, ifsc_code, swift_code, is_default, is_active)
SELECT id, COALESCE(account_name, name), bank_name, account_no, ifsc_code, swift_code, 1, 1
FROM brands
WHERE bank_name IS NOT NULL AND account_no IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM brand_banks bb WHERE bb.brand_id = brands.id);

-- new_orders.bank_id — chosen bank account at order entry. Nullable so historical orders
-- don't trip an FK; PI generation falls back to the brand's default bank when null.
SET @col_exists := (SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_schema = DATABASE() AND table_name = 'new_orders' AND column_name = 'bank_id');
SET @alter_sql := IF(@col_exists = 0,
                     'ALTER TABLE new_orders ADD COLUMN bank_id INT NULL, ADD INDEX idx_orders_bank (bank_id)',
                     'SELECT 1');
PREPARE alter_stmt FROM @alter_sql; EXECUTE alter_stmt; DEALLOCATE PREPARE alter_stmt;

-- proforma_invoices.bank_id — snapshot the chosen bank on the PI for traceability. The
-- bank text fields stay on the PI row so even if the bank record is later edited or
-- deleted, the historical PI keeps the values it was generated with.
SET @col_exists := (SELECT COUNT(*) FROM information_schema.columns
                    WHERE table_schema = DATABASE() AND table_name = 'proforma_invoices' AND column_name = 'bank_id');
SET @alter_sql := IF(@col_exists = 0,
                     'ALTER TABLE proforma_invoices ADD COLUMN bank_id INT NULL, ADD INDEX idx_pi_bank (bank_id)',
                     'SELECT 1');
PREPARE alter_stmt FROM @alter_sql; EXECUTE alter_stmt; DEALLOCATE PREPARE alter_stmt;
