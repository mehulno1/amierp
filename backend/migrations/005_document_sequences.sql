-- AMI ERP: Document sequences — AEPL/OFF (shared: PI, PO, Offer), AEPL/IND (Indent), AEPL/ENQ (Enquiry)

CREATE TABLE IF NOT EXISTS document_sequences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand_id INT NOT NULL,
  prefix VARCHAR(30) NOT NULL,
  next_number INT NOT NULL DEFAULT 1,
  UNIQUE KEY uniq_seq (brand_id, prefix),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);
