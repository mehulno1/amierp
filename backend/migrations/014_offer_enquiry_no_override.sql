-- AMI ERP: Allow a manually-entered Enquiry No. on a quotation/offer. When set,
-- it overrides the linked enquiry's auto-generated number on the PDF. When blank,
-- the quotation falls back to the enquiry's own number.

ALTER TABLE offers ADD COLUMN enquiry_no_override VARCHAR(50) NULL AFTER enquiry_id;
