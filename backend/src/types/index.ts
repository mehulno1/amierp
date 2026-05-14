import type { Request as ExpressRequest } from 'express'

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
  bank_name?: string
  account_name?: string
  account_no?: string
  ifsc_code?: string
  swift_code?: string
  logo_url?: string
  features: Record<string, boolean>
  is_active: boolean
  created_at: string
}

export interface User {
  id: number
  username: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'requisition_admin' | 'quotation_admin' | 'user' | 'accounts'
  is_active: boolean
  created_at: string
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
  is_active: boolean
  created_at: string
}

export interface Product {
  id: number
  brand_id: number
  item_code: string
  item_name: string
  category?: string
  description?: string
  is_active: boolean
  created_at: string
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
  is_active: boolean
}

export type InventoryType = 'finished_goods' | 'raw_material' | 'spare_parts' | 'packing_material'
export type InventoryUnit = 'pcs' | 'kgs' | 'gms' | 'mtr' | 'ltr' | 'ml' | 'nos' | 'set'

export interface InventoryItem {
  id: number
  brand_id: number
  stockpoint_id?: number
  item_type: InventoryType
  item_code: string
  item_name: string
  uom: InventoryUnit
  current_stock: number
  reserved_stock: number
  available_stock: number
  minimum_stock?: number
  maximum_stock?: number
  is_active: boolean
  created_at: string
}

export type OrderStatus = 'new_order' | 'processing' | 'ready_for_dispatch' | 'dispatched' | 'completed' | 'cancelled'
export type OrderType = 'domestic' | 'export'

export interface Order {
  id: number
  brand_id: number
  order_id: string
  client_id: number
  client_name?: string
  order_type: OrderType
  delivery_mode?: string
  delivery_date?: string
  order_date: string
  status: OrderStatus
  prepared_by: number
  notes?: string
  created_at: string
  items?: OrderItem[]
  financials?: OrderFinancials
  dispatch?: DispatchDetails
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
}

export interface OrderFinancials {
  id: number
  order_id: number
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
  payment_link?: string
}

export interface DispatchDetails {
  id: number
  order_id: number
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
  created_at: string
}

export interface Stockpoint {
  id: number
  brand_id: number
  name: string
  address?: string
  is_active: boolean
}

// Requisition types
export type RequisitionStatus = 'pending' | 'quotation_pending' | 'quotation_received' | 'po_raised' | 'partially_delivered' | 'delivered' | 'cancelled'
export type RequisitionPriority = 'normal' | 'urgent' | 'critical'

export interface Requisition {
  id: number
  brand_id: number
  indent_no: string
  created_by: number
  created_by_name?: string
  status: RequisitionStatus
  machine_area?: string
  priority: RequisitionPriority
  reminder_date?: string
  notes?: string
  created_at: string
  updated_at: string
  items?: RequisitionItem[]
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
  created_by: number
  created_at: string
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
  brand_id: number
  po_no: string
  requisition_id?: number
  vendor_quotation_id?: number
  vendor_id: number
  vendor_name?: string
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
  created_by: number
  created_at: string
  updated_at: string
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: number
  po_id: number
  material_no?: string
  description: string
  qty: number
  uom: string
  rate: number
  total: number
  received_qty: number
}

// Enquiry / Offer types
export type EnquiryStatus = 'new' | 'offer_sent' | 'negotiation' | 'order_received' | 'lost' | 'expired'
export type EnquirySource = 'phone' | 'email' | 'walk_in' | 'referral' | 'website' | 'other'

export interface Enquiry {
  id: number
  brand_id: number
  enquiry_no: string
  assigned_to?: number
  assigned_to_name?: string
  customer_name: string
  contact_person?: string
  mobile?: string
  email?: string
  customer_city?: string
  source: EnquirySource
  status: EnquiryStatus
  due_date?: string
  notes?: string
  created_at: string
  updated_at: string
  items?: EnquiryItem[]
}

export interface EnquiryItem {
  id: number
  enquiry_id: number
  product_id?: number
  description: string
  qty: number
  uom: string
  notes?: string
}

export interface Offer {
  id: number
  brand_id: number
  offer_no: string
  enquiry_id: number
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
  created_by: number
  sent_at?: string
  created_at: string
  updated_at: string
  items?: OfferItem[]
}

export interface OfferItem {
  id: number
  offer_id: number
  material_no?: string
  description: string
  qty: number
  uom: string
  rate: number
  remarks?: string
}

// Proforma Invoice
export interface ProformaInvoice {
  id: number
  brand_id: number
  pi_no: string
  order_id: number
  pi_date: string
  po_no?: string
  po_date?: string
  status: 'generated' | 'sent' | 'revised'
  gst_percent: number
  basic_total: number
  gst_amount: number
  total_amount: number
  amount_in_words?: string
  bank_name?: string
  account_name?: string
  account_no?: string
  ifsc_code?: string
  swift_code?: string
  sent_at?: string
  sent_to_email?: string
  created_by: number
  created_at: string
  updated_at: string
  items?: ProformaInvoiceItem[]
}

export interface ProformaInvoiceItem {
  id: number
  pi_id: number
  material_no?: string
  description: string
  quantity_pcs: number
  quantity_kgs: number
  uom: string
  rate: number
  total: number
}

export interface AuthRequest extends ExpressRequest {
  user?: User
  brandId?: number
  userBrandIds?: number[]
  brand?: any
}
