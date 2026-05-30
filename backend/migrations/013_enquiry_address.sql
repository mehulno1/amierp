-- AMI ERP: Add a full address field to enquiries so quotations can show the
-- customer's address (previously only city was captured).

ALTER TABLE enquiries ADD COLUMN customer_address TEXT NULL AFTER contact_person;
