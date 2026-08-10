-- Backfill PO statuses: POs created before status was set at creation time all sat at
-- the DB default 'draft'. A saved PO is a placed PO, so promote drafts to 'confirmed'
-- (displayed as "PO placed"), or further if goods have already been received.

UPDATE purchase_orders po
SET po.status = (
  SELECT CASE
    WHEN COALESCE(SUM(i.received_qty), 0) = 0 THEN 'confirmed'
    WHEN SUM(CASE WHEN i.received_qty < i.qty THEN 1 ELSE 0 END) = 0 THEN 'delivered'
    ELSE 'partially_delivered'
  END
  FROM purchase_order_items i WHERE i.po_id = po.id
)
WHERE po.status = 'draft'
  AND EXISTS (SELECT 1 FROM purchase_order_items i2 WHERE i2.po_id = po.id);

-- POs with no line items at all: just mark placed.
UPDATE purchase_orders SET status = 'confirmed' WHERE status = 'draft';
