-- Short close: an order whose remaining balance cannot be supplied (e.g. 996 of
-- 1000 mtrs despatched, last 4 mtrs not producible) can be closed as completed
-- with the balance written off, instead of sitting at partially_dispatched forever.
ALTER TABLE new_orders
  ADD COLUMN short_closed TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN short_close_note VARCHAR(255) NULL,
  ADD COLUMN short_closed_at DATETIME NULL;
