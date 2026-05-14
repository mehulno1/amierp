-- AMI ERP: Proforma Invoices — auto-generated on order entry

CREATE TABLE IF NOT EXISTS proforma_invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  pi_no VARCHAR(30) NOT NULL,
  order_id INT NOT NULL,
  pi_date DATE NOT NULL,
  po_no VARCHAR(100),
  po_date DATE,
  status ENUM('generated','sent','revised') DEFAULT 'generated',
  gst_percent DECIMAL(5,2) DEFAULT 18,
  basic_total DECIMAL(12,2) DEFAULT 0,
  gst_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  amount_in_words TEXT,
  bank_name VARCHAR(200),
  account_name VARCHAR(200),
  account_no VARCHAR(50),
  ifsc_code VARCHAR(20),
  swift_code VARCHAR(20),
  sent_at TIMESTAMP NULL,
  sent_to_email VARCHAR(200),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (order_id) REFERENCES new_orders(id)
);

CREATE TABLE IF NOT EXISTS pi_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pi_id INT NOT NULL,
  material_no VARCHAR(50),
  description TEXT NOT NULL,
  quantity_pcs INT DEFAULT 0,
  quantity_kgs DECIMAL(10,3) DEFAULT 0,
  uom VARCHAR(20) NOT NULL,
  rate DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (pi_id) REFERENCES proforma_invoices(id) ON DELETE CASCADE
);
