-- AMI ERP: Requisition approval flow.
-- A normal user raises a requisition; it now starts as 'pending_approval' and must be
-- approved by a user with the can_approve_requisitions right before procurement
-- (quotations -> PO) can begin. Rejection carries a reason and is resubmittable.

-- Per-user "can approve requisitions" permission, layered on top of the existing role.
ALTER TABLE new_users ADD COLUMN can_approve_requisitions TINYINT(1) NOT NULL DEFAULT 0 AFTER role;

-- Extend the requisition status enum with the two new gate states. MySQL needs the
-- full enum restated. New requisitions default to 'pending_approval'.
ALTER TABLE requisitions MODIFY COLUMN status
  ENUM('pending_approval','pending','quotation_pending','quotation_received','po_raised','partially_delivered','delivered','cancelled','rejected')
  NOT NULL DEFAULT 'pending_approval';

-- Approval metadata.
ALTER TABLE requisitions ADD COLUMN approved_by INT NULL AFTER status;
ALTER TABLE requisitions ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by;
ALTER TABLE requisitions ADD COLUMN rejection_reason TEXT NULL AFTER approved_at;
ALTER TABLE requisitions ADD CONSTRAINT fk_requisition_approved_by FOREIGN KEY (approved_by) REFERENCES new_users(id);
