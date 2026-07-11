// Idempotent demo-data seeder for the Reports module.
//
// Generates a coherent set of clients, orders (with financials + deliveries), inventory
// (with costs + aging), requisitions, purchase orders (with receipts + quotations),
// enquiries and offers — all spread across the last ~9 months on brand 1 (AEPL) — so every
// report renders with realistic charts.
//
// Re-runnable: every row it creates is marked with a "DEMO" prefix; the script deletes those
// (in FK-dependency order) before re-inserting. It never touches non-DEMO data.
//
//   node scripts/seedDemoReports.js
require('dotenv').config()
const mysql = require('mysql2/promise')

const BRAND = 1
const SUPER = 1            // superadmin user id
const USER = 2             // 'ravi' user id
const VENDORS = [1, 2, 3]  // existing vendor ids
const VARIANTS = [{ id: 1, name: '8mm', rate: 32000 }, { id: 2, name: '4X6mm', rate: 28000 }]

const pick = (arr, i) => arr[i % arr.length]
const pad = (n) => String(n).padStart(3, '0')
const ymd = (d) => d.toISOString().slice(0, 10)
const dt = (d) => d.toISOString().slice(0, 19).replace('T', ' ')
function daysAgo(n) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d }
function monthsAgo(m, day = 15) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setMonth(d.getMonth() - m, day); return d }

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost', port: +(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'ami', user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    multipleStatements: false,
  })
  const ins = async (sql, params) => { const [r] = await c.query(sql, params); return r.insertId }

  // ---- 1. Clear prior DEMO rows (children cascade via FK ON DELETE CASCADE) -------------
  console.log('Clearing previous DEMO rows…')
  const demoInv = await c.query("SELECT id FROM inventory_items WHERE item_code LIKE 'DEMO-%'").then(([r]) => r.map(x => x.id))
  await c.query("DELETE FROM new_orders WHERE order_id LIKE 'DEMO-%'")
  await c.query("DELETE FROM purchase_orders WHERE po_no LIKE 'DEMO-%'")
  // requisitions: vendor_quotation_items FK→requisition_items has no cascade, so clear the
  // quotation side explicitly before deleting requisitions (which cascades requisition_items).
  const demoReqs = await c.query("SELECT id FROM requisitions WHERE indent_no LIKE 'DEMO-%'").then(([r]) => r.map(x => x.id))
  if (demoReqs.length) {
    await c.query('DELETE vqi FROM vendor_quotation_items vqi JOIN vendor_quotations vq ON vq.id = vqi.quotation_id WHERE vq.requisition_id IN (?)', [demoReqs])
    await c.query('DELETE FROM vendor_quotations WHERE requisition_id IN (?)', [demoReqs])
    await c.query('DELETE FROM requisitions WHERE id IN (?)', [demoReqs])
  }
  await c.query("DELETE FROM enquiries WHERE enquiry_no LIKE 'DEMO-%'")
  if (demoInv.length) {
    await c.query('DELETE FROM inventory_transactions WHERE inventory_item_id IN (?)', [demoInv])
    await c.query('DELETE FROM inventory_stock_lots WHERE inventory_item_id IN (?)', [demoInv])
    await c.query('DELETE FROM inventory_items WHERE id IN (?)', [demoInv])
  }
  await c.query("DELETE FROM new_clients WHERE name LIKE 'DEMO %'")

  // ---- 2. Clients ----------------------------------------------------------------------
  console.log('Seeding clients…')
  const clientNames = ['DEMO Apex Industries', 'DEMO Bharat Engineering', 'DEMO Crescent Traders', 'DEMO Deccan Fabricators']
  const cities = [['Pune', 'Maharashtra'], ['Ahmedabad', 'Gujarat'], ['Chennai', 'Tamil Nadu'], ['Indore', 'Madhya Pradesh']]
  const clients = []
  for (let i = 0; i < clientNames.length; i++) {
    const id = await ins(
      'INSERT INTO new_clients (brand_id,name,contact_person,mobile,email,billing_city,billing_state) VALUES (?,?,?,?,?,?,?)',
      [BRAND, clientNames[i], 'Mr. ' + ['Sharma', 'Patel', 'Reddy', 'Jain'][i], '98200000' + pad(i + 10),
        clientNames[i].split(' ')[1].toLowerCase() + '@example.com', cities[i][0], cities[i][1]]
    )
    clients.push(id)
  }

  // ---- 3. Orders + financials + deliveries ---------------------------------------------
  console.log('Seeding orders…')
  // statuses across the lifecycle; paid flag drives receivables.
  const orderPlan = [
    // monthsAgo, status, paidFraction, type
    [8, 'completed', 1.0, 'domestic'], [8, 'completed', 1.0, 'export'],
    [7, 'completed', 1.0, 'domestic'], [7, 'dispatched', 0.5, 'domestic'],
    [6, 'completed', 1.0, 'domestic'], [6, 'completed', 0.7, 'export'],
    [5, 'dispatched', 0.0, 'domestic'], [5, 'completed', 1.0, 'domestic'],
    [4, 'dispatched', 0.5, 'export'], [4, 'completed', 1.0, 'domestic'],
    [3, 'dispatched', 0.0, 'domestic'], [3, 'completed', 1.0, 'domestic'],
    [2, 'partially_dispatched', 0.3, 'domestic'], [2, 'dispatched', 1.0, 'export'],
    [1, 'processing', 0.0, 'domestic'], [1, 'dispatched', 0.0, 'domestic'],
    [0, 'new_order', 0.0, 'domestic'], [0, 'ready_for_dispatch', 0.0, 'export'],
  ]
  const couriers = ['Blue Dart', 'Gati', 'VRL Logistics', 'TCI Express']
  let oseq = 0
  for (const [mo, status, paid, type] of orderPlan) {
    oseq++
    const odate = monthsAgo(mo, 5 + (oseq % 20))
    const clientId = pick(clients, oseq)
    const variant = pick(VARIANTS, oseq)
    const pcs = 50 * (1 + (oseq % 5))
    const lineTotal = pcs * variant.rate
    const delivered = ['completed', 'dispatched'].includes(status) ? pcs
      : status === 'partially_dispatched' ? Math.floor(pcs * 0.4) : 0
    const ddate = new Date(odate); ddate.setDate(ddate.getDate() + 12)
    const newOrderId = await ins(
      'INSERT INTO new_orders (brand_id,order_id,client_id,order_type,delivery_mode,delivery_date,order_date,status,prepared_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [BRAND, `DEMO-ORD-${pad(oseq)}`, clientId, type, 'Road', ymd(ddate), ymd(odate), status, USER, dt(odate)]
    )
    const oiId = await ins(
      'INSERT INTO order_items (order_id,product_variant_id,product_name,variant_name,quantity_pcs,quantity_kgs,uom,rate,total,delivered_pcs,delivered_kgs) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [newOrderId, variant.id, 'Lancing Pipes', variant.name, pcs, 0, 'pcs', variant.rate, lineTotal, delivered, 0]
    )
    const gst = Math.round(lineTotal * 0.18)
    const total = lineTotal + gst
    const recv = Math.round(total * paid)
    const payDate = paid > 0 ? ymd(new Date(odate.getTime() + 20 * 86400000)) : null
    await c.query(
      'INSERT INTO order_financials (order_id,basic_amount,gst_percent,gst_amount,delivery_charges,total_amount,payment_received,payment_date,payment_method,invoice_no) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [newOrderId, lineTotal, 18, gst, 0, total, recv, payDate, paid > 0 ? 'NEFT' : null, ['completed', 'dispatched', 'partially_dispatched'].includes(status) ? `DEMO-INV-${pad(oseq)}` : null]
    )
    if (delivered > 0) {
      const delId = await ins(
        'INSERT INTO order_deliveries (order_id,delivery_no,delivery_date,dispatched_by,courier_name,transporter,awb_number,vehicle_no,created_by) VALUES (?,?,?,?,?,?,?,?,?)',
        [newOrderId, 1, ymd(new Date(odate.getTime() + 10 * 86400000)), 'Dispatch Desk', pick(couriers, oseq), pick(couriers, oseq), 'AWB' + (100000 + oseq), 'MH12-' + (1000 + oseq), USER]
      )
      await c.query('INSERT INTO order_delivery_items (delivery_id,order_item_id,quantity_pcs,quantity_kgs) VALUES (?,?,?,?)', [delId, oiId, delivered, 0])
    }
  }

  // ---- 4. Inventory items (spare/raw/packing costed via POs; finished uncosted) ---------
  console.log('Seeding inventory…')
  const invPlan = [
    // type, name, uom, stock, min, max, ageDays
    ['spare_parts', 'Hydraulic Seal Kit', 'set', 8, 15, 40, 12],
    ['spare_parts', 'Ball Bearing 6204', 'nos', 120, 50, 200, 40],
    ['spare_parts', 'V-Belt B-75', 'nos', 6, 20, 60, 200],
    ['spare_parts', 'Gear Coupling GC-90', 'nos', 30, 10, 50, 75],
    ['raw_material', 'MS Round Bar 40mm', 'kgs', 850, 500, 2000, 25],
    ['raw_material', 'SS 304 Sheet 2mm', 'kgs', 180, 300, 1000, 95],
    ['packing_material', 'Export Wooden Crate', 'nos', 14, 25, 80, 8],
    ['packing_material', 'Stretch Wrap Roll', 'nos', 40, 20, 100, 150],
    ['finished_goods', 'Lancing Pipe Bundle', 'nos', 60, 30, 150, 18],
  ]
  const invItems = []
  let icode = 0
  for (const [type, name, uom, stock, min, max, age] of invPlan) {
    icode++
    const reserved = type === 'finished_goods' ? Math.floor(stock * 0.2) : 0
    const id = await ins(
      'INSERT INTO inventory_items (brand_id,stockpoint_id,item_type,item_code,item_name,uom,current_stock,reserved_stock,minimum_stock,maximum_stock,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,1)',
      [BRAND, null, type, `DEMO-${type.slice(0, 2).toUpperCase()}-${pad(icode)}`, name, uom, stock, reserved, min, max]
    )
    invItems.push({ id, type, name, uom, stock, age })
    // opening stock txn, backdated for aging
    const od = daysAgo(age)
    await c.query(
      'INSERT INTO inventory_transactions (brand_id,inventory_item_id,transaction_type,quantity,reference_type,notes,created_by,created_at,stock_before,stock_after) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [BRAND, id, 'opening_stock', stock, 'seed', 'Opening stock', SUPER, dt(od), 0, stock]
    )
  }
  // movement transactions over the last few months (drives stock-movement + top movers)
  let running = {}
  invItems.forEach(it => { running[it.id] = it.stock })
  for (let m = 5; m >= 0; m--) {
    for (let k = 0; k < invItems.length; k++) {
      const it = invItems[(m + k) % invItems.length]
      const out = 3 + ((m + k) % 6)
      const before = running[it.id]
      const after = Math.max(before - out, 0)
      running[it.id] = after
      await c.query(
        'INSERT INTO inventory_transactions (brand_id,inventory_item_id,transaction_type,quantity,reference_type,notes,created_by,created_at,stock_before,stock_after) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [BRAND, it.id, k % 3 === 0 ? 'dispatch' : 'manual_deduct', out, 'seed', 'Demo movement', USER, dt(monthsAgo(m, 10 + k)), before, after]
      )
    }
  }
  const spareById = invItems.filter(i => ['spare_parts', 'raw_material', 'packing_material'].includes(i.type))

  // ---- 5. Requisitions + quotations + purchase orders + receipts -----------------------
  console.log('Seeding requisitions & purchase orders…')
  const areas = ['Lancing Unit', 'Pipe Mill', 'Cylinder Shop', 'Utilities']
  const priorities = ['normal', 'urgent', 'critical']
  // [monthsAgo, reqStatus, approved, poStatus|null, leadDays|null, promisedDays|null]
  const procPlan = [
    [8, 'delivered', true, 'delivered', 9, 12],
    [7, 'delivered', true, 'delivered', 14, 10],   // late
    [6, 'delivered', true, 'delivered', 7, 10],
    [5, 'partially_delivered', true, 'partially_delivered', null, 12],
    [4, 'po_raised', true, 'confirmed', null, 15],
    [3, 'delivered', true, 'delivered', 11, 12],
    [2, 'po_raised', true, 'confirmed', null, 10],
    [1, 'pending', false, null, null, null],
    [1, 'pending_approval', false, null, null, null],
    [0, 'pending_approval', false, null, null, null],
  ]
  let pseq = 0
  for (const [mo, reqStatus, approved, poStatus, leadDays, promised] of procPlan) {
    pseq++
    const created = monthsAgo(mo, 3 + (pseq % 10))
    const area = pick(areas, pseq)
    const approvedAt = approved ? dt(new Date(created.getTime() + (1 + (pseq % 3)) * 86400000)) : null
    const reqId = await ins(
      'INSERT INTO requisitions (brand_id,indent_no,created_by,status,approved_by,approved_at,machine_area,priority,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [BRAND, `DEMO-IND-${pad(pseq)}`, USER, reqStatus, approved ? SUPER : null, approvedAt, area, pick(priorities, pseq), 'Demo requisition', dt(created)]
    )
    const item = pick(spareById, pseq)
    const reqQty = 20 + (pseq % 5) * 10
    const reqItemId = await ins(
      'INSERT INTO requisition_items (requisition_id,spare_part_id,description,area,qty,uom,no_of_days,received_qty) VALUES (?,?,?,?,?,?,?,?)',
      [reqId, item.id, item.name, area, reqQty, item.uom, 7, ['delivered'].includes(reqStatus) ? reqQty : reqStatus === 'partially_delivered' ? Math.floor(reqQty / 2) : 0]
    )

    if (poStatus) {
      const vendorId = pick(VENDORS, pseq)
      const rate = 500 + (pseq % 7) * 250
      // selected vendor quotation with promised delivery days → enables on-time %
      const quoteId = await ins(
        'INSERT INTO vendor_quotations (brand_id,requisition_id,vendor_id,quotation_date,validity_date,status,created_by) VALUES (?,?,?,?,?,?,?)',
        [BRAND, reqId, vendorId, ymd(created), ymd(new Date(created.getTime() + 30 * 86400000)), 'selected', USER]
      )
      await c.query(
        'INSERT INTO vendor_quotation_items (quotation_id,requisition_item_id,rate,uom,delivery_days,remarks) VALUES (?,?,?,?,?,?)',
        [quoteId, reqItemId, rate, item.uom, promised, null]
      )
      const poDate = new Date(created.getTime() + 3 * 86400000)
      const poTotal = reqQty * rate
      const received = poStatus === 'delivered' ? reqQty : poStatus === 'partially_delivered' ? Math.floor(reqQty / 2) : 0
      const poId = await ins(
        'INSERT INTO purchase_orders (brand_id,po_no,requisition_id,vendor_quotation_id,vendor_id,po_date,quotation_no,quotation_date,status,gst_percent,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [BRAND, `DEMO-PO-${pad(pseq)}`, reqId, quoteId, vendorId, ymd(poDate), `DEMO-Q-${pad(pseq)}`, ymd(created), poStatus, 18, USER, dt(poDate)]
      )
      const poItemId = await ins(
        'INSERT INTO purchase_order_items (po_id,material_no,description,qty,uom,rate,total,received_qty,spare_part_id) VALUES (?,?,?,?,?,?,?,?,?)',
        [poId, `M-${pad(pseq)}`, item.name, reqQty, item.uom, rate, poTotal, received, item.id]
      )
      if (received > 0 && leadDays != null) {
        const recDate = new Date(poDate.getTime() + leadDays * 86400000)
        const recId = await ins(
          'INSERT INTO po_receipts (brand_id,po_id,receipt_no,receipt_date,received_by,transporter,vendor_invoice_no) VALUES (?,?,?,?,?,?,?)',
          [BRAND, poId, `DEMO-GRN-${pad(pseq)}`, ymd(recDate), USER, 'Road Transport', `VINV-${pad(pseq)}`]
        )
        await c.query('INSERT INTO po_receipt_items (receipt_id,po_item_id,received_qty) VALUES (?,?,?)', [recId, poItemId, received])
      } else if (received > 0) {
        // partial receipt without a recorded lead time
        const recId = await ins(
          'INSERT INTO po_receipts (brand_id,po_id,receipt_no,receipt_date,received_by,transporter) VALUES (?,?,?,?,?,?)',
          [BRAND, poId, `DEMO-GRN-${pad(pseq)}`, ymd(new Date(poDate.getTime() + 8 * 86400000)), USER, 'Road Transport']
        )
        await c.query('INSERT INTO po_receipt_items (receipt_id,po_item_id,received_qty) VALUES (?,?,?)', [recId, poItemId, received])
      }
    }
  }

  // ---- 6. Enquiries + offers -----------------------------------------------------------
  console.log('Seeding enquiries & offers…')
  const sources = ['phone', 'email', 'website', 'referral', 'walk_in']
  // [monthsAgo, source, status, makeOffer, offerStatus, validityDaysFromToday|null]
  const enqPlan = [
    [6, 'website', 'order_received', true, 'accepted', null],
    [6, 'phone', 'lost', true, 'rejected', null],
    [5, 'email', 'order_received', true, 'accepted', null],
    [5, 'referral', 'lost', false, null, null],
    [4, 'website', 'order_received', true, 'accepted', null],
    [4, 'phone', 'negotiation', true, 'sent', 40],
    [3, 'email', 'order_received', true, 'accepted', null],
    [3, 'walk_in', 'offer_sent', true, 'sent', 5],     // expiring soon
    [2, 'website', 'offer_sent', true, 'sent', 2],      // expiring very soon
    [2, 'phone', 'lost', false, null, null],
    [1, 'email', 'offer_sent', true, 'sent', -3],       // already expired
    [1, 'referral', 'new', false, null, null],
    [0, 'website', 'new', false, null, null],
    [0, 'phone', 'offer_sent', true, 'sent', 25],
  ]
  let eseq = 0
  for (const [mo, source, status, makeOffer, offerStatus, validDays] of enqPlan) {
    eseq++
    const created = monthsAgo(mo, 6 + (eseq % 12))
    const enqId = await ins(
      'INSERT INTO enquiries (brand_id,enquiry_no,assigned_to,customer_name,contact_person,mobile,email,customer_city,source,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [BRAND, `DEMO-ENQ-${pad(eseq)}`, USER, `DEMO Lead ${pad(eseq)}`, 'Procurement Head', '99000000' + pad(eseq), `lead${eseq}@example.com`, pick(['Pune', 'Surat', 'Nashik', 'Rajkot'], eseq), source, status, dt(created)]
    )
    await c.query('INSERT INTO enquiry_items (enquiry_id,product_id,description,qty,uom) VALUES (?,?,?,?,?)', [enqId, 1, 'Lancing Pipes enquiry', 100, 'pcs'])
    if (makeOffer) {
      const offerDate = new Date(created.getTime() + 2 * 86400000)
      const validity = validDays != null ? ymd(daysAgo(-validDays)) : ymd(new Date(offerDate.getTime() + 30 * 86400000))
      const offId = await ins(
        'INSERT INTO offers (brand_id,offer_no,enquiry_id,offer_date,validity_date,status,created_by,sent_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
        [BRAND, `DEMO-OFF-${pad(eseq)}`, enqId, ymd(offerDate), validity, offerStatus, USER, offerStatus !== 'draft' ? dt(offerDate) : null, dt(offerDate)]
      )
      await c.query('INSERT INTO offer_items (offer_id,material_no,description,qty,uom,rate) VALUES (?,?,?,?,?,?)', [offId, 'M-1', 'Lancing Pipes 8mm', 100, 'pcs', 32000])
    }
  }

  console.log('\n✔ Demo data seeded for brand', BRAND)
  console.log('  clients:', clients.length, '| orders:', orderPlan.length, '| inventory:', invItems.length,
    '| requisitions:', procPlan.length, '| enquiries:', enqPlan.length)
  await c.end()
}

main().catch(e => { console.error('SEED FAILED:', e.message); process.exit(1) })
