// One-off: clear test/transactional data before client go-live.
// KEEPS: brands, brand_banks, new_clients, vendors, new_users, user_brands, role_permissions.
// EMPTIES the transactional tables below, and resets document_sequences.next_number = 1
// (so the first real document of every brand/prefix is numbered /1).
//
// Run from backend/:  node scripts/cleanTestData.js          (dry run — counts only)
//                     node scripts/cleanTestData.js --apply  (perform the deletes)
const mysql = require('mysql2/promise')
require('dotenv').config()

// Child tables first (FK checks are disabled anyway, but this keeps intent clear).
const EMPTY = [
  'order_status_history', 'order_delivery_items', 'order_deliveries', 'order_financials',
  'order_items', 'dispatch_details', 'new_orders',
  'pi_items', 'proforma_invoices',
  'po_receipt_items', 'po_receipts', 'purchase_order_items', 'purchase_orders',
  'requisition_items', 'requisitions',
  'enquiry_items', 'enquiries',
  'offer_items', 'offers',
  'vendor_quotation_items', 'vendor_quotations',
  'inventory_transactions', 'inventory_stock_lots', 'inventory_items', 'stockpoints',
  'product_variants', 'new_products',
]
const KEEP = ['brands', 'brand_banks', 'new_clients', 'vendors', 'new_users', 'user_brands', 'role_permissions']

;(async () => {
  const apply = process.argv.includes('--apply')
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: +process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  const count = async (t) => (await c.query(`SELECT COUNT(*) AS n FROM \`${t}\``))[0][0].n

  console.log(`Mode: ${apply ? 'APPLY (deleting)' : 'DRY RUN (no changes)'}`)
  console.log('\n-- KEEP (untouched) --')
  for (const t of KEEP) console.log(String(await count(t)).padStart(6), t)

  console.log('\n-- EMPTY --')
  const before = {}
  for (const t of EMPTY) before[t] = await count(t)
  for (const t of EMPTY) console.log(String(before[t]).padStart(6), t)

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to delete.')
    await c.end(); return
  }

  await c.query('SET FOREIGN_KEY_CHECKS=0')
  for (const t of EMPTY) {
    await c.query(`DELETE FROM \`${t}\``)
    await c.query(`ALTER TABLE \`${t}\` AUTO_INCREMENT = 1`)
  }
  // Reset numbering: next document = /1 for every existing brand+prefix.
  const [r] = await c.query('UPDATE document_sequences SET next_number = 1')
  await c.query('SET FOREIGN_KEY_CHECKS=1')
  console.log(`\nReset document_sequences.next_number=1 for ${r.affectedRows} row(s).`)

  console.log('\n-- AFTER --')
  let ok = true
  for (const t of EMPTY) { const n = await count(t); if (n !== 0) ok = false; console.log(String(n).padStart(6), t) }
  console.log('\n-- KEEP still intact --')
  for (const t of KEEP) console.log(String(await count(t)).padStart(6), t)
  console.log(ok ? '\nAll target tables empty. Done.' : '\nWARNING: some target tables are not empty!')
  await c.end()
})().catch(e => { console.error('ERR', e.message); process.exit(1) })
