-- AMI ERP: Initial schema — brands, users, clients, products, variants

CREATE TABLE IF NOT EXISTS brands (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(200),
  gstin VARCHAR(20),
  pan VARCHAR(20),
  bank_name VARCHAR(200),
  account_name VARCHAR(200),
  account_no VARCHAR(50),
  ifsc_code VARCHAR(20),
  swift_code VARCHAR(20),
  logo_url VARCHAR(500),
  features JSON DEFAULT ('{}'),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS new_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(200),
  name VARCHAR(200) NOT NULL,
  role ENUM('super_admin','admin','requisition_admin','quotation_admin','user','accounts') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_brands (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  brand_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_brand (user_id, brand_id),
  FOREIGN KEY (user_id) REFERENCES new_users(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS new_clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  name VARCHAR(300) NOT NULL,
  contact_person VARCHAR(200),
  mobile VARCHAR(20),
  mobile2 VARCHAR(20),
  email VARCHAR(200),
  gstin VARCHAR(20),
  billing_address TEXT,
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_zip VARCHAR(20),
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(100),
  shipping_zip VARCHAR(20),
  dispatch_instructions TEXT,
  notes TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE TABLE IF NOT EXISTS new_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  item_code VARCHAR(100),
  item_name VARCHAR(300) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE TABLE IF NOT EXISTS product_variants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  variant_name VARCHAR(200) NOT NULL,
  uom VARCHAR(20) DEFAULT 'pcs',
  client_rate DECIMAL(12,2),
  mrp_rate DECIMAL(12,2),
  weight_kg DECIMAL(10,3),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES new_products(id) ON DELETE CASCADE
);
