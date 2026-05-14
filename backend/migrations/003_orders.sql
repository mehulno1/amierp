-- AMI ERP: Orders, order items (pcs + kgs), financials, dispatch, status history

CREATE TABLE IF NOT EXISTS new_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  client_id INT NOT NULL,
  order_type ENUM('domestic','export') DEFAULT 'domestic',
  delivery_mode VARCHAR(100),
  delivery_date DATE,
  order_date DATE NOT NULL,
  status ENUM('new_order','processing','ready_for_dispatch','dispatched','completed','cancelled') DEFAULT 'new_order',
  prepared_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (client_id) REFERENCES new_clients(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  product_variant_id INT NULL,
  product_name VARCHAR(300),
  variant_name VARCHAR(200),
  description TEXT,
  quantity_pcs INT DEFAULT 0,
  quantity_kgs DECIMAL(10,3) DEFAULT 0,
  uom VARCHAR(20) DEFAULT 'pcs',
  rate DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES new_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_financials (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL UNIQUE,
  basic_amount DECIMAL(12,2) DEFAULT 0,
  gst_percent DECIMAL(5,2) DEFAULT 18,
  gst_amount DECIMAL(12,2) DEFAULT 0,
  delivery_charges DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  payment_received DECIMAL(12,2) DEFAULT 0,
  payment_date DATE,
  payment_method VARCHAR(50),
  invoice_no VARCHAR(100),
  invoice_link VARCHAR(500),
  payment_link VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES new_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dispatch_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL UNIQUE,
  dispatch_date DATE,
  dispatched_by VARCHAR(200),
  awb_number VARCHAR(100),
  awb_link VARCHAR(500),
  lr_link VARCHAR(500),
  courier_name VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES new_orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES new_orders(id) ON DELETE CASCADE
);
