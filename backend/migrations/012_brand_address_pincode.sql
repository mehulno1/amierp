-- AMI ERP: Append the pin code (833220) to the Ami brand addresses so it shows
-- in the document header (Quotation / PO / PI). The original seed omitted it.

UPDATE brands
SET address = 'Plot No: 64-71, Vill- Kamalpur Post- Kolabira, Seraikela - Kharsawan 833220'
WHERE address = 'Plot No: 64-71, Vill- Kamalpur Post- Kolabira, Seraikela - Kharsawan';
