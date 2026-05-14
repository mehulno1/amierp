-- AMI ERP: Seed data — 4 companies, super_admin user, document sequences

INSERT IGNORE INTO brands (name, code, address, city, state, phone, email, gstin, pan, bank_name, account_name, account_no, ifsc_code, swift_code, features) VALUES
('Ami Enterprises Pvt. Ltd.', 'AEPL', 'Plot No: 64-71, Vill- Kamalpur Post- Kolabira, Seraikela - Kharsawan', 'Jamshedpur', 'Jharkhand', '94313-00011 / 94313 82886', 'info@amiglobal.in', '20AACCA1723B1ZS', 'AACCA1723B', 'HDFC Bank Ltd. Jamshedpur', 'AMI ENTERPRISES PRIVATE LIMITED', '50200104603835', 'HDFC0001066', NULL, '{"multiStockpoint": false}'),
('Ami Pipes', 'AMIP', 'Plot No: 64-71, Vill- Kamalpur Post- Kolabira, Seraikela - Kharsawan', 'Jamshedpur', 'Jharkhand', '94313-00011', 'info@amiglobal.in', NULL, NULL, 'HDFC Bank Ltd. Jamshedpur', 'AMI PIPES', '50200104603835', 'HDFC0001066', NULL, '{}'),
('Ami Cylinders', 'AMIC', 'Plot No: 64-71, Vill- Kamalpur Post- Kolabira, Seraikela - Kharsawan', 'Jamshedpur', 'Jharkhand', '94313-00011', 'info@amiglobal.in', NULL, NULL, 'HDFC Bank Ltd. Jamshedpur', 'AMI CYLINDERS', '50200104603835', 'HDFC0001066', NULL, '{}'),
('Zatakia Commercials', 'ZATC', 'Jamshedpur', 'Jamshedpur', 'Jharkhand', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '{}');

-- super_admin password: Admin@123
INSERT IGNORE INTO new_users (username, password_hash, email, name, role) VALUES
('superadmin', '$2a$10$ncRoahGtFcS.iBmFux9XWe2f5PgGJSVP5s3dx0i81d4531TWS5ugu', 'admin@amiglobal.in', 'Super Admin', 'super_admin');

-- assign super_admin to all brands
INSERT IGNORE INTO user_brands (user_id, brand_id)
SELECT u.id, b.id FROM new_users u CROSS JOIN brands b WHERE u.username = 'superadmin';

-- document sequences for each brand
INSERT IGNORE INTO document_sequences (brand_id, prefix, next_number)
SELECT b.id, 'AEPL/OFF', 1 FROM brands b;

INSERT IGNORE INTO document_sequences (brand_id, prefix, next_number)
SELECT b.id, 'AEPL/IND', 1 FROM brands b;

INSERT IGNORE INTO document_sequences (brand_id, prefix, next_number)
SELECT b.id, 'AEPL/ENQ', 1 FROM brands b;
