import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '.env') })

interface SeedResult {
  vendors: number[]
  requisitions: string[]
  vendorQuotations: number[]
  purchaseOrders: string[]
}

async function seed(): Promise<SeedResult> {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'ami',
    user: process.env.DB_USER || 'dbusr_ami',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

  const result: SeedResult = {
    vendors: [],
    requisitions: [],
    vendorQuotations: [],
    purchaseOrders: [],
  }

  try {
    console.log('Connecting to database...')

    // Get brand_id
    const [brands] = await pool.execute<any[]>(
      'SELECT id FROM brands WHERE is_active = 1 LIMIT 1'
    )
    if (!brands || brands.length === 0) {
      throw new Error('No active brands found. Please create at least one brand first.')
    }
    const brand_id = brands[0].id
    console.log(`Using brand_id: ${brand_id}`)

    // Get user_id
    const [users] = await pool.execute<any[]>(
      'SELECT id FROM new_users WHERE is_active = 1 LIMIT 1'
    )
    if (!users || users.length === 0) {
      throw new Error('No active users found. Please create at least one user first.')
    }
    const user_id = users[0].id
    console.log(`Using user_id: ${user_id}`)

    console.log('\nCreating vendors...')

    // Create vendors
    const vendorData = [
      {
        name: 'Precision Tools Industries',
        contact_person: 'Rajesh Kumar',
        mobile: '+91-9876543210',
        email: 'sales@precisiontools.in',
        address: '42, Industrial Estate Road, Bangalore',
        city: 'Bangalore',
        gstin: '29AABCP1234A1Z0',
      },
      {
        name: 'Hydraulic Solutions Pvt Ltd',
        contact_person: 'Amit Sharma',
        mobile: '+91-9823456789',
        email: 'order@hydraulicsolutions.in',
        address: '156, Mahavir Enclave, New Delhi',
        city: 'New Delhi',
        gstin: '07AABCU1234K1Z5',
      },
      {
        name: 'Chennai Industrial Supplies',
        contact_person: 'Vijay Reddy',
        mobile: '+91-9898765432',
        email: 'supplies@chennaiindustrial.com',
        address: '78, Kathipara, Chennai',
        city: 'Chennai',
        gstin: '33AABCS1234J1Z8',
      },
    ]

    const vendor_ids: number[] = []
    for (const vendor of vendorData) {
      const [vendorResult] = await pool.execute<any>(
        `INSERT INTO vendors (brand_id, name, contact_person, mobile, email, address, city, gstin, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
        [brand_id, vendor.name, vendor.contact_person, vendor.mobile, vendor.email, vendor.address, vendor.city, vendor.gstin]
      )
      vendor_ids.push(vendorResult.insertId)
      result.vendors.push(vendorResult.insertId)
      console.log(`  Created vendor: ${vendor.name} (ID: ${vendorResult.insertId})`)
    }

    // Get next indent numbers
    const [maxIndent] = await pool.execute<any[]>(
      "SELECT MAX(CAST(SUBSTRING(indent_no, -5) AS UNSIGNED)) as max_num FROM requisitions WHERE indent_no LIKE 'IND-%'"
    )
    let indentNum = 1001
    if (maxIndent && maxIndent[0] && maxIndent[0].max_num) {
      indentNum = maxIndent[0].max_num + 1
    }

    // Get next PO numbers
    const [maxPO] = await pool.execute<any[]>(
      "SELECT MAX(CAST(SUBSTRING(po_no, -5) AS UNSIGNED)) as max_num FROM purchase_orders WHERE po_no LIKE 'PO-%'"
    )
    let poNum = 2001
    if (maxPO && maxPO[0] && maxPO[0].max_num) {
      poNum = maxPO[0].max_num + 1
    }

    console.log(`\nCreating requisitions...`)

    // Requisition 1: PENDING status
    const indent_no_1 = `IND-${indentNum++}`
    const [result1] = await pool.execute<any>(
      `INSERT INTO requisitions (brand_id, indent_no, created_by, status, machine_area, priority, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        brand_id,
        indent_no_1,
        user_id,
        'pending',
        'Extrusion Unit',
        'normal',
        'Initial requisition for extrusion unit maintenance parts',
      ]
    )
    const req_id_1 = result1.insertId
    result.requisitions.push(indent_no_1)
    console.log(`Created Requisition 1: ${indent_no_1} (pending)`)

    // Add items to Requisition 1
    await pool.execute(
      `INSERT INTO requisition_items (requisition_id, description, area, qty, uom, no_of_days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req_id_1,
        'Heating Element - Ceramic (2000W)',
        'Extrusion Unit',
        2,
        'nos',
        7,
      ]
    )
    await pool.execute(
      `INSERT INTO requisition_items (requisition_id, description, area, qty, uom, no_of_days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req_id_1, 'Temperature Sensor - PT100', 'Control Panel', 1, 'nos', 7]
    )
    console.log(`  Added 2 items to ${indent_no_1}`)

    // Requisition 2: QUOTATION_RECEIVED status (with vendor quotation)
    const indent_no_2 = `IND-${indentNum++}`
    const [result2] = await pool.execute<any>(
      `INSERT INTO requisitions (brand_id, indent_no, created_by, status, machine_area, priority, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        brand_id,
        indent_no_2,
        user_id,
        'quotation_received',
        'Drawing & Machining',
        'urgent',
        'Spare parts for drawing machine - quotations received from vendors',
      ]
    )
    const req_id_2 = result2.insertId
    result.requisitions.push(indent_no_2)
    console.log(`Created Requisition 2: ${indent_no_2} (quotation_received)`)

    // Add items to Requisition 2
    const [item2_1] = await pool.execute<any>(
      `INSERT INTO requisition_items (requisition_id, description, area, qty, uom, no_of_days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req_id_2,
        'Draw Plate Spindle - Hardened Steel (38mm diameter)',
        'Drawing Unit',
        1,
        'nos',
        14,
      ]
    )
    const item2_1_id = item2_1.insertId

    const [item2_2] = await pool.execute<any>(
      `INSERT INTO requisition_items (requisition_id, description, area, qty, uom, no_of_days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req_id_2,
        'Cooling Lubricant - ISO VG 46 (High Performance)',
        'Drawing Unit',
        50,
        'liters',
        14,
      ]
    )
    const item2_2_id = item2_2.insertId
    console.log(`  Added 2 items to ${indent_no_2}`)

    // Create vendor quotation for Requisition 2
    const [quotation2] = await pool.execute<any>(
      `INSERT INTO vendor_quotations (brand_id, requisition_id, vendor_id, quotation_date, validity_date, status, notes, created_by, created_at)
       VALUES (?, ?, ?, ?, DATE_ADD(?, INTERVAL 30 DAY), ?, ?, ?, NOW())`,
      [
        brand_id,
        req_id_2,
        vendor_ids[0],
        new Date().toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
        'pending',
        'Quotation valid for 30 days. Delivery: 10 days.',
        user_id,
      ]
    )
    const quote_id_2 = quotation2.insertId
    result.vendorQuotations.push(quote_id_2)
    console.log(`  Created vendor quotation ID ${quote_id_2}`)

    // Add quotation items
    await pool.execute(
      `INSERT INTO vendor_quotation_items (quotation_id, requisition_item_id, rate, uom, delivery_days, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [quote_id_2, item2_1_id, 45000.0, 'nos', 10, 'High precision spindle. Stock available.']
    )
    await pool.execute(
      `INSERT INTO vendor_quotation_items (quotation_id, requisition_item_id, rate, uom, delivery_days, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [quote_id_2, item2_2_id, 850.0, 'liters', 5, 'Premium grade lubricant. Bulk discount available.']
    )

    // Requisition 3: PO_RAISED status (with vendor quotation + purchase order)
    const indent_no_3 = `IND-${indentNum++}`
    const [result3] = await pool.execute<any>(
      `INSERT INTO requisitions (brand_id, indent_no, created_by, status, machine_area, priority, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        brand_id,
        indent_no_3,
        user_id,
        'po_raised',
        'Lancing Unit',
        'critical',
        'Critical spare parts for lancing machine - PO already raised',
      ]
    )
    const req_id_3 = result3.insertId
    result.requisitions.push(indent_no_3)
    console.log(`Created Requisition 3: ${indent_no_3} (po_raised)`)

    // Add items to Requisition 3
    const [item3_1] = await pool.execute<any>(
      `INSERT INTO requisition_items (requisition_id, description, area, qty, uom, no_of_days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req_id_3,
        'Lancing Die - Carbide Tipped (Advanced Grade)',
        'Lancing Unit',
        4,
        'nos',
        3,
      ]
    )
    const item3_1_id = item3_1.insertId

    const [item3_2] = await pool.execute<any>(
      `INSERT INTO requisition_items (requisition_id, description, area, qty, uom, no_of_days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req_id_3, 'Hydraulic Fluid - Grade ISO 46 (Premium)', 'Hydraulic System', 200, 'liters', 3]
    )
    const item3_2_id = item3_2.insertId

    const [item3_3] = await pool.execute<any>(
      `INSERT INTO requisition_items (requisition_id, description, area, qty, uom, no_of_days)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req_id_3,
        'Pressure Relief Valve - 280 bar (Pilot Operated)',
        'Hydraulic System',
        1,
        'nos',
        3,
      ]
    )
    const item3_3_id = item3_3.insertId
    console.log(`  Added 3 items to ${indent_no_3}`)

    // Create vendor quotation for Requisition 3
    const [quotation3] = await pool.execute<any>(
      `INSERT INTO vendor_quotations (brand_id, requisition_id, vendor_id, quotation_date, validity_date, status, notes, created_by, created_at)
       VALUES (?, ?, ?, ?, DATE_ADD(?, INTERVAL 30 DAY), ?, ?, ?, NOW())`,
      [
        brand_id,
        req_id_3,
        vendor_ids[1],
        new Date().toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
        'selected',
        'Selected for purchase order. Payment: Net 30 days.',
        user_id,
      ]
    )
    const quote_id_3 = quotation3.insertId
    result.vendorQuotations.push(quote_id_3)
    console.log(`  Created vendor quotation ID ${quote_id_3}`)

    // Add quotation items for Requisition 3
    await pool.execute(
      `INSERT INTO vendor_quotation_items (quotation_id, requisition_item_id, rate, uom, delivery_days, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        quote_id_3,
        item3_1_id,
        18500.0,
        'nos',
        5,
        'Premium carbide tips. AISI D2 backing. Precision ground.',
      ]
    )
    await pool.execute(
      `INSERT INTO vendor_quotation_items (quotation_id, requisition_item_id, rate, uom, delivery_days, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [quote_id_3, item3_2_id, 920.0, 'liters', 7, 'ISO 46 premium hydraulic fluid. Bulk purchase.']
    )
    await pool.execute(
      `INSERT INTO vendor_quotation_items (quotation_id, requisition_item_id, rate, uom, delivery_days, remarks)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        quote_id_3,
        item3_3_id,
        28000.0,
        'nos',
        7,
        'Pilot operated relief valve. Tested and certified.',
      ]
    )

    // Create Purchase Order for Requisition 3
    const po_no_3 = `PO-${poNum++}`
    const [poResult] = await pool.execute<any>(
      `INSERT INTO purchase_orders (brand_id, po_no, requisition_id, vendor_quotation_id, vendor_id, po_date, quotation_no, status, gst_percent, terms_gst, terms_delivery, terms_delivery_instructions, terms_supply_basis, terms_payment, notes, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        brand_id,
        po_no_3,
        req_id_3,
        quote_id_3,
        vendor_ids[1],
        new Date().toISOString().split('T')[0],
        `QT-${brand_id}-${quote_id_3}`,
        'confirmed',
        18,
        'GST as per applicable rates',
        'Within 10 days from dispatch',
        'Deliver to Lancing Unit. Inspect on receipt.',
        'FOB Chennai Port',
        'Net 30 days from invoice date',
        'Rush order - Critical spares. Please expedite.',
        user_id,
      ]
    )
    const po_id_3 = poResult.insertId
    result.purchaseOrders.push(po_no_3)
    console.log(`  Created Purchase Order ${po_no_3}`)

    // Add PO items
    await pool.execute(
      `INSERT INTO purchase_order_items (po_id, material_no, description, qty, uom, rate, total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [po_id_3, 'LP-DIE-001', 'Lancing Die - Carbide Tipped (Advanced Grade)', 4, 'nos', 18500.0, 74000.0]
    )
    await pool.execute(
      `INSERT INTO purchase_order_items (po_id, material_no, description, qty, uom, rate, total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [po_id_3, 'HYD-OIL-046', 'Hydraulic Fluid - Grade ISO 46 (Premium)', 200, 'liters', 920.0, 184000.0]
    )
    await pool.execute(
      `INSERT INTO purchase_order_items (po_id, material_no, description, qty, uom, rate, total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        po_id_3,
        'PR-VAL-280',
        'Pressure Relief Valve - 280 bar (Pilot Operated)',
        1,
        'nos',
        28000.0,
        28000.0,
      ]
    )
    console.log(`  Added 3 items to ${po_no_3}`)

    console.log('\n=======================================')
    console.log('SEED DATA CREATED SUCCESSFULLY!')
    console.log('=======================================')
    console.log('\nVendors created:')
    result.vendors.forEach((id) => console.log(`  - ID: ${id}`))
    console.log('\nRequisitions created:')
    result.requisitions.forEach((ind) => console.log(`  - ${ind}`))
    console.log('\nVendor Quotations created:')
    result.vendorQuotations.forEach((id) => console.log(`  - ID: ${id}`))
    console.log('\nPurchase Orders created:')
    result.purchaseOrders.forEach((po) => console.log(`  - ${po}`))

    await pool.end()
  } catch (error) {
    console.error('Error seeding database:', error)
    await pool.end()
    process.exit(1)
  }
}

seed().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
