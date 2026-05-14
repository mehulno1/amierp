-- AMI ERP: Inventory tables (finished_goods, raw_material, spare_parts, packing_material)

CREATE TABLE IF NOT EXISTS stockpoints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  stockpoint_id INT NULL,
  item_type ENUM('finished_goods','raw_material','spare_parts','packing_material') NOT NULL,
  item_code VARCHAR(100),
  item_name VARCHAR(300) NOT NULL,
  uom ENUM('pcs','kgs','gms','mtr','ltr','ml','nos','set') NOT NULL DEFAULT 'pcs',
  current_stock DECIMAL(12,3) DEFAULT 0,
  reserved_stock DECIMAL(12,3) DEFAULT 0,
  minimum_stock DECIMAL(12,3),
  maximum_stock DECIMAL(12,3),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_inv (brand_id, item_type, item_name, stockpoint_id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (stockpoint_id) REFERENCES stockpoints(id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  inventory_item_id INT NOT NULL,
  transaction_type ENUM('opening_stock','set_opening','purchase','manual_add','manual_deduct','adjustment','reserved','dispatch','transfer','release') NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  reference_id VARCHAR(100),
  reference_type VARCHAR(50),
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);

CREATE TABLE IF NOT EXISTS inventory_stock_lots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  inventory_item_id INT NOT NULL,
  vendor_lot_code VARCHAR(100),
  quantity_remaining DECIMAL(12,3) NOT NULL,
  received_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id)
);
