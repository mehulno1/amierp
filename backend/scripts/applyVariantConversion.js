// Idempotent application of 020_variant_order_conversion.sql
// Adds per-piece conversion factors to variants/inventory and billable qty to order/PI lines.
// Usage: node scripts/applyVariantConversion.js   (run from backend/)
const mysql = require('mysql2/promise')
require('dotenv').config()

async function hasColumn(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  )
  return rows[0].c > 0
}

async function addColumn(conn, table, column, ddl) {
  if (await hasColumn(conn, table, column)) {
    console.log(`  = ${table}.${column} already exists`)
    return
  }
  await conn.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
  console.log(`  + added ${table}.${column}`)
}

;(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: +process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  try {
    console.log('product_variants:')
    await addColumn(conn, 'product_variants', 'length_per_piece_mtr', 'length_per_piece_mtr DECIMAL(10,3) NULL')

    console.log('inventory_items:')
    await addColumn(conn, 'inventory_items', 'length_per_piece_mtr', 'length_per_piece_mtr DECIMAL(10,3) NULL')
    await addColumn(conn, 'inventory_items', 'weight_per_piece_kgs', 'weight_per_piece_kgs DECIMAL(10,3) NULL')

    console.log('order_items:')
    await addColumn(conn, 'order_items', 'billable_quantity', 'billable_quantity DECIMAL(12,3) NOT NULL DEFAULT 0')
    await addColumn(conn, 'order_items', 'billing_uom', 'billing_uom VARCHAR(20) NULL')

    console.log('pi_items:')
    await addColumn(conn, 'pi_items', 'billable_quantity', 'billable_quantity DECIMAL(12,3) NOT NULL DEFAULT 0')
    await addColumn(conn, 'pi_items', 'billing_uom', 'billing_uom VARCHAR(20) NULL')

    console.log('Done.')
  } finally {
    await conn.end()
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1) })
