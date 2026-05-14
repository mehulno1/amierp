-- AMI ERP: Requisitions (indents), vendor quotations, purchase orders

CREATE TABLE IF NOT EXISTS requisitions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  indent_no VARCHAR(30) NOT NULL,
  created_by INT NOT NULL,
  status ENUM('pending','quotation_pending','quotation_received','po_raised','partially_delivered','delivered','cancelled') DEFAULT 'pending',
  machine_area VARCHAR(200),
  priority ENUM('normal','urgent','critical') DEFAULT 'normal',
  reminder_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (created_by) REFERENCES new_users(id)
);

CREATE TABLE IF NOT EXISTS requisition_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  requisition_id INT NOT NULL,
  spare_part_id INT NULL,
  description TEXT NOT NULL,
  area VARCHAR(200),
  qty DECIMAL(10,3) NOT NULL,
  uom VARCHAR(20) DEFAULT 'nos',
  no_of_days INT,
  received_qty DECIMAL(10,3) DEFAULT 0,
  FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vendor_quotations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  requisition_id INT NOT NULL,
  vendor_id INT NOT NULL,
  quotation_date DATE NOT NULL,
  validity_date DATE,
  status ENUM('pending','selected','rejected') DEFAULT 'pending',
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (requisition_id) REFERENCES requisitions(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (created_by) REFERENCES new_users(id)
);

CREATE TABLE IF NOT EXISTS vendor_quotation_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quotation_id INT NOT NULL,
  requisition_item_id INT NOT NULL,
  rate DECIMAL(12,2) NOT NULL,
  uom VARCHAR(20),
  delivery_days INT,
  remarks TEXT,
  FOREIGN KEY (quotation_id) REFERENCES vendor_quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (requisition_item_id) REFERENCES requisition_items(id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  po_no VARCHAR(30) NOT NULL,
  requisition_id INT NULL,
  vendor_quotation_id INT NULL,
  vendor_id INT NOT NULL,
  po_date DATE NOT NULL,
  quotation_no VARCHAR(100),
  quotation_date DATE,
  status ENUM('draft','confirmed','partially_delivered','delivered','cancelled') DEFAULT 'draft',
  gst_percent DECIMAL(5,2) DEFAULT 18,
  terms_gst TEXT,
  terms_delivery TEXT,
  terms_delivery_instructions TEXT,
  terms_supply_basis TEXT,
  terms_payment TEXT,
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id),
  FOREIGN KEY (created_by) REFERENCES new_users(id)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  po_id INT NOT NULL,
  material_no VARCHAR(50),
  description TEXT NOT NULL,
  qty DECIMAL(10,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  rate DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  received_qty DECIMAL(10,3) DEFAULT 0,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);
