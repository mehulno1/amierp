-- AMI ERP: Enquiries (inbound customer enquiries) and Offers/Quotations sent to customers

CREATE TABLE IF NOT EXISTS enquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  enquiry_no VARCHAR(30) NOT NULL,
  assigned_to INT NULL,
  customer_name VARCHAR(300) NOT NULL,
  contact_person VARCHAR(200),
  mobile VARCHAR(20),
  email VARCHAR(200),
  customer_city VARCHAR(100),
  source ENUM('phone','email','walk_in','referral','website','other') DEFAULT 'phone',
  status ENUM('new','offer_sent','negotiation','order_received','lost','expired') DEFAULT 'new',
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (assigned_to) REFERENCES new_users(id)
);

CREATE TABLE IF NOT EXISTS enquiry_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  enquiry_id INT NOT NULL,
  product_id INT NULL,
  description TEXT NOT NULL,
  qty DECIMAL(10,3),
  uom VARCHAR(20),
  notes TEXT,
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES new_products(id)
);

CREATE TABLE IF NOT EXISTS offers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  offer_no VARCHAR(30) NOT NULL,
  enquiry_id INT NOT NULL,
  offer_date DATE NOT NULL,
  validity_date DATE,
  status ENUM('draft','sent','accepted','rejected','revised') DEFAULT 'draft',
  terms_gst TEXT,
  terms_price_validity TEXT,
  terms_delivery TEXT,
  terms_supply_basis TEXT,
  terms_weight_tolerance TEXT,
  terms_force_majure TEXT,
  terms_payment TEXT,
  notes TEXT,
  created_by INT NOT NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES new_users(id)
);

CREATE TABLE IF NOT EXISTS offer_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  offer_id INT NOT NULL,
  material_no VARCHAR(50),
  description TEXT NOT NULL,
  qty DECIMAL(10,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  rate DECIMAL(12,2) NOT NULL,
  remarks TEXT,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE
);
