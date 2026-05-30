-- AMI ERP: Add IEC (Import Export Code) to the company master. Shown on the PI
-- footer (below PAN & GSTIN) for export orders only.

ALTER TABLE brands ADD COLUMN iec VARCHAR(20) NULL AFTER pan;

UPDATE brands SET iec = '0296025496' WHERE code = 'AEPL';
