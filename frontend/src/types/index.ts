export interface Brand {
  id: number
  name: string
  code: string
  address?: string
  city?: string
  state?: string
  phone?: string
  email?: string
  gstin?: string
  pan?: string
  iec?: string
  bank_name?: string
  account_name?: string
  account_no?: string
  ifsc_code?: string
  swift_code?: string
  features?: Record<string, boolean>
  is_active: boolean
}

export interface User {
  id: number
  username: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'requisition_admin' | 'quotation_admin' | 'user' | 'accounts'
  can_approve_requisitions?: boolean
  is_active: boolean
}

export interface Client {
  id: number
  brand_id: number
  name: string
  contact_person?: string
  mobile?: string
  mobile2?: string
  email?: string
  gstin?: string
  billing_address?: string
  billing_city?: string
  billing_state?: string
  billing_zip?: string
  shipping_address?: string
  shipping_city?: string
  shipping_state?: string
  shipping_zip?: string
  dispatch_instructions?: string
  notes?: string
}

export interface Product {
  id: number
  brand_id: number
  item_code?: string
  item_name: string
  category?: string
  description?: string
  variants?: ProductVariant[]
}

export interface ProductVariant {
  id: number
  product_id: number
  variant_name: string
  uom: string
  client_rate?: number
  mrp_rate?: number
  weight_kg?: number
}

export type InventoryType = 'finished_goods' | 'raw_material' | 'spare_parts' | 'packing_material'

export interface InventoryItem {
  id: number
  brand_id: number
  item_type: InventoryType
  item_code?: string
  item_name: string
  uom: string
  current_stock: number
  reserved_stock: number
  available_stock?: number
  minimum_stock?: number
  maximum_stock?: number
  stockpoint_name?: string
}

export type OrderStatus = 'new_order' | 'processing' | 'ready_for_dispatch' | 'partially_dispatched' | 'dispatched' | 'completed' | 'cancelled'

export interface Order {
  id: number
  order_id: string
  client_id: number
  client_name?: string
  order_type: 'domestic' | 'export'
  delivery_mode?: string
  delivery_date?: string
  order_date: string
  status: OrderStatus
  notes?: string
  items?: OrderItem[]
  financials?: OrderFinancials
  dispatch?: DispatchDetails
  pi?: { pi_no: string; pi_date: string; status: string }
  deliveries?: OrderDelivery[]
  tot_pcs?: number | null
  tot_kgs?: number | null
  del_pcs?: number | null
  del_kgs?: number | null
}

export interface OrderItem {
  id: number
  order_id: number
  product_variant_id?: number
  product_name?: string
  variant_name?: string
  description?: string
  quantity_pcs: number
  quantity_kgs: number
  uom: string
  rate: number
  total: number
  delivered_pcs: number
  delivered_kgs: number
}

export interface OrderDeliveryItem {
  id: number
  delivery_id: number
  order_item_id: number
  quantity_pcs: number
  quantity_kgs: number
  description?: string
  product_name?: string
  variant_name?: string
  uom?: string
  ordered_pcs?: number
  ordered_kgs?: number
}

export interface OrderDelivery {
  id: number
  order_id: number
  delivery_no: number
  delivery_date: string
  dispatched_by?: string | null
  courier_name?: string | null
  transporter?: string | null
  awb_number?: string | null
  awb_link?: string | null
  lr_link?: string | null
  vehicle_no?: string | null
  notes?: string | null
  created_by?: number | null
  created_at?: string
  updated_at?: string
  items: OrderDeliveryItem[]
}

export interface OrderFinancials {
  basic_amount: number
  gst_percent: number
  gst_amount: number
  delivery_charges: number
  total_amount: number
  payment_received: number
  payment_date?: string
  payment_method?: string
  invoice_no?: string
  invoice_link?: string
}

export interface DispatchDetails {
  dispatch_date?: string
  dispatched_by?: string
  awb_number?: string
  awb_link?: string
  lr_link?: string
  courier_name?: string
  notes?: string
}

export interface Vendor {
  id: number
  brand_id: number
  name: string
  contact_person?: string
  mobile?: string
  email?: string
  address?: string
  city?: string
  gstin?: string
  is_active: boolean
}

// Requisition types
export type RequisitionStatus = 'pending_approval' | 'pending' | 'quotation_pending' | 'quotation_received' | 'po_raised' | 'partially_delivered' | 'delivered' | 'cancelled' | 'rejected'
export type RequisitionPriority = 'normal' | 'urgent' | 'critical'

export interface Requisition {
  id: number
  indent_no: string
  created_by: number
  created_by_name?: string
  status: RequisitionStatus
  machine_area?: string
  priority: RequisitionPriority
  reminder_date?: string
  notes?: string
  approved_by?: number
  approved_by_name?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  items?: RequisitionItem[]
  quotations?: VendorQuotation[]
}

export interface RequisitionItem {
  id: number
  requisition_id: number
  spare_part_id?: number
  description: string
  area?: string
  qty: number
  uom: string
  no_of_days?: number
  received_qty: number
}

export interface VendorQuotation {
  id: number
  requisition_id: number
  vendor_id: number
  vendor_name?: string
  quotation_date: string
  validity_date?: string
  status: 'pending' | 'selected' | 'rejected'
  notes?: string
  items?: VendorQuotationItem[]
}

export interface VendorQuotationItem {
  id: number
  quotation_id: number
  requisition_item_id: number
  rate: number
  uom: string
  delivery_days?: number
  remarks?: string
}

export interface PurchaseOrder {
  id: number
  po_no: string
  vendor_id: number
  vendor_name?: string
  vendor_address?: string
  vendor_city?: string
  vendor_mobile?: string
  vendor_gstin?: string
  po_date: string
  quotation_no?: string
  quotation_date?: string
  status: 'draft' | 'confirmed' | 'partially_delivered' | 'delivered' | 'cancelled'
  gst_percent: number
  terms_gst?: string
  terms_delivery?: string
  terms_delivery_instructions?: string
  terms_supply_basis?: string
  terms_payment?: string
  notes?: string
  items?: PurchaseOrderItem[]
  ordered_qty?: number | null
  received_qty_total?: number | null
}

export interface PurchaseOrderItem {
  id: number
  material_no?: string
  spare_part_id?: number | null
  description: string
  qty: number
  uom: string
  rate: number
  total: number
  received_qty: number
}

export interface PoReceiptItem {
  id?: number
  receipt_id?: number
  po_item_id: number
  received_qty: number
  description?: string
  uom?: string
  ordered_qty?: number
  line_received_qty?: number
}

export interface PoReceipt {
  id: number
  brand_id?: number
  po_id: number
  receipt_no: string
  receipt_date: string
  received_by?: number | null
  received_by_name?: string | null
  transporter?: string | null
  lr_number?: string | null
  vehicle_no?: string | null
  vendor_invoice_no?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
  items: PoReceiptItem[]
}

export type EnquiryStatus = 'new' | 'offer_sent' | 'negotiation' | 'order_received' | 'lost' | 'expired'
export type EnquirySource = 'phone' | 'email' | 'walk_in' | 'referral' | 'website' | 'other'

export interface Enquiry {
  id: number
  enquiry_no: string
  assigned_to?: number
  assigned_to_name?: string
  customer_name: string
  contact_person?: string
  customer_address?: string
  mobile?: string
  email?: string
  customer_city?: string
  source: EnquirySource
  status: EnquiryStatus
  due_date?: string
  notes?: string
  created_at: string
  items?: EnquiryItem[]
  offers?: Offer[]
}

export interface EnquiryItem {
  id: number
  enquiry_id: number
  product_id?: number
  description: string
  qty?: number
  uom?: string
  notes?: string
}

export interface Offer {
  id: number
  offer_no: string
  enquiry_id: number
  customer_name?: string
  customer_email?: string
  offer_date: string
  validity_date?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'revised'
  terms_gst?: string
  terms_price_validity?: string
  terms_delivery?: string
  terms_supply_basis?: string
  terms_weight_tolerance?: string
  terms_force_majure?: string
  terms_payment?: string
  notes?: string
  items?: OfferItem[]
}

export interface OfferItem {
  id: number
  material_no?: string
  description: string
  qty: number
  uom: string
  rate: number
  remarks?: string
}

export interface ProformaInvoice {
  id: number
  pi_no: string
  order_id: number
  order_ref?: string
  pi_date: string
  po_no?: string
  po_date?: string
  status: 'generated' | 'sent' | 'revised'
  order_type?: 'domestic' | 'export'
  gst_type?: 'cgst_sgst' | 'igst' | 'none'
  gst_percent: number
  basic_total: number
  gst_amount: number
  total_amount: number
  amount_in_words?: string
  client_name?: string
  client_email?: string
  billing_address?: string
  billing_city?: string
  billing_state?: string
  billing_zip?: string
  client_gstin?: string
  brand_name?: string
  brand_address?: string
  brand_phone?: string
  brand_email?: string
  brand_gstin?: string
  brand_pan?: string
  brand_iec?: string
  bank_name?: string
  account_name?: string
  account_no?: string
  ifsc_code?: string
  sent_at?: string
  sent_to_email?: string
  items?: ProformaInvoiceItem[]
}

export interface ProformaInvoiceItem {
  id: number
  material_no?: string
  description: string
  quantity_pcs: number
  quantity_kgs: number
  uom: string
  rate: number
  total: number
}
