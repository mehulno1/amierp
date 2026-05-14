-- AMI ERP: Vendors and role permissions

CREATE TABLE IF NOT EXISTS vendors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  name VARCHAR(300) NOT NULL,
  contact_person VARCHAR(200),
  mobile VARCHAR(20),
  email VARCHAR(200),
  address TEXT,
  city VARCHAR(100),
  gstin VARCHAR(20),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role ENUM('super_admin','admin','requisition_admin','quotation_admin','user','accounts') NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  brand_id INT NULL,
  UNIQUE KEY uniq_perm (role, resource, action),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);
