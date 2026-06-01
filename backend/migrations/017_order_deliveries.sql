-- AMI ERP: Sales order multi-delivery / delivery challan tracking (Part A).
-- A sales order can now be shipped in several deliveries (challans). Each delivery records
-- its own logistics info and per-line quantities; order_items carries a cached running total
-- (delivered_pcs/kgs) so list/detail views can show fulfilment without re-aggregating.

-- 1) Extend new_orders.status: add 'partially_dispatched' between 'ready_for_dispatch' and
-- 'dispatched'. MySQL needs the full enum restated. (003_orders.sql is the only prior
-- definition of this column; no later migration alters it.)
ALTER TABLE new_orders MODIFY COLUMN status
  ENUM('new_order','processing','ready_for_dispatch','partially_dispatched','dispatched','completed','cancelled')
  DEFAULT 'new_order';

-- 2) Per-line cached delivered quantities on order_items.
ALTER TABLE order_items ADD COLUMN delivered_pcs INT NOT NULL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN delivered_kgs DECIMAL(10,3) NOT NULL DEFAULT 0;

-- 3) Delivery header (one challan per dispatch event).
CREATE TABLE IF NOT EXISTS order_deliveries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  delivery_no INT NOT NULL,
  delivery_date DATE NOT NULL,
  dispatched_by VARCHAR(200),
  courier_name VARCHAR(200),
  transporter VARCHAR(200),
  awb_number VARCHAR(100),
  awb_link VARCHAR(512),
  lr_link VARCHAR(512),
  vehicle_no VARCHAR(100),
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_order_delivery_no (order_id, delivery_no),
  INDEX idx_order_deliveries_order (order_id),
  FOREIGN KEY (order_id) REFERENCES new_orders(id) ON DELETE CASCADE
);

-- 4) Per-delivery line quantities.
CREATE TABLE IF NOT EXISTS order_delivery_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  delivery_id INT NOT NULL,
  order_item_id INT NOT NULL,
  quantity_pcs INT NOT NULL DEFAULT 0,
  quantity_kgs DECIMAL(10,3) NOT NULL DEFAULT 0,
  FOREIGN KEY (delivery_id) REFERENCES order_deliveries(id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
);

-- 5) Backfill: every already-dispatched order (dispatch_details.dispatch_date set) that does
-- not yet have a delivery row gets a single delivery #1 carrying the legacy logistics fields,
-- with one delivery item per order line at its FULL ordered quantity. Idempotent: the NOT
-- EXISTS guard means re-running this migration inserts nothing for orders already migrated.
-- dispatch_details has: dispatch_date, dispatched_by, awb_number, awb_link, lr_link,
-- courier_name, notes (no transporter / vehicle_no columns), so only those are copied.
INSERT INTO order_deliveries
  (order_id, delivery_no, delivery_date, dispatched_by, courier_name, awb_number, awb_link, lr_link, notes, created_at)
SELECT dd.order_id, 1, dd.dispatch_date, dd.dispatched_by, dd.courier_name, dd.awb_number, dd.awb_link, dd.lr_link, dd.notes, dd.created_at
FROM dispatch_details dd
WHERE dd.dispatch_date IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM order_deliveries od WHERE od.order_id = dd.order_id);

INSERT INTO order_delivery_items (delivery_id, order_item_id, quantity_pcs, quantity_kgs)
SELECT od.id, oi.id, oi.quantity_pcs, oi.quantity_kgs
FROM order_deliveries od
JOIN order_items oi ON oi.order_id = od.order_id
WHERE od.delivery_no = 1
  AND NOT EXISTS (
    SELECT 1 FROM order_delivery_items di
    WHERE di.delivery_id = od.id AND di.order_item_id = oi.id
  );

-- 6) Seed the per-line cache from the delivery items (recompute from scratch).
UPDATE order_items oi SET
  delivered_pcs = (SELECT COALESCE(SUM(di.quantity_pcs),0) FROM order_delivery_items di WHERE di.order_item_id = oi.id),
  delivered_kgs = (SELECT COALESCE(SUM(di.quantity_kgs),0) FROM order_delivery_items di WHERE di.order_item_id = oi.id);
