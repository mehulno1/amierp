// Idempotent application of 019_inventory_dual_uom.sql
// Adds pcs+kgs dual-unit tracking to inventory and runs the one-time weight backfill.
// Usage: node scripts/applyDualUom.js   (run from backend/)
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
    return false
  }
  await conn.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
  console.log(`  + added ${table}.${column}`)
  return true
}

;(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: +process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
  })
  try {
    // First run is detected by the absence of the marker column.
    const firstRun = !(await hasColumn(conn, 'inventory_items', 'current_stock_kgs'))

    console.log('inventory_items:')
    await addColumn(conn, 'inventory_items', 'current_stock_kgs', 'current_stock_kgs DECIMAL(12,3) NOT NULL DEFAULT 0')
    await addColumn(conn, 'inventory_items', 'reserved_kgs', 'reserved_kgs DECIMAL(12,3) NOT NULL DEFAULT 0')
    await addColumn(conn, 'inventory_items', 'minimum_stock_kgs', 'minimum_stock_kgs DECIMAL(12,3) NULL')
    await addColumn(conn, 'inventory_items', 'maximum_stock_kgs', 'maximum_stock_kgs DECIMAL(12,3) NULL')

    console.log('inventory_transactions:')
    await addColumn(conn, 'inventory_transactions', 'quantity_kgs', 'quantity_kgs DECIMAL(12,3) NOT NULL DEFAULT 0')
    await addColumn(conn, 'inventory_transactions', 'stock_before_kgs', 'stock_before_kgs DECIMAL(12,3) NULL')
    await addColumn(conn, 'inventory_transactions', 'stock_after_kgs', 'stock_after_kgs DECIMAL(12,3) NULL')

    if (firstRun) {
      const [r] = await conn.query(
        `UPDATE inventory_items
            SET current_stock_kgs = current_stock,
                reserved_kgs      = reserved_stock,
                minimum_stock_kgs = minimum_stock,
                maximum_stock_kgs = maximum_stock,
                current_stock     = 0,
                reserved_stock    = 0,
                minimum_stock     = NULL,
                maximum_stock     = NULL
          WHERE uom IN ('kgs', 'gms')`
      )
      console.log(`backfill: moved ${r.affectedRows} weight-unit item(s) into the kgs dimension`)
    } else {
      console.log('backfill: skipped (columns already existed)')
    }
    console.log('Done.')
  } finally {
    await conn.end()
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1) })
