import type { ComponentType } from 'react'
import {
  FileText, TrendingUp, Truck, ClipboardCheck, PackageSearch, Boxes, ArrowLeftRight,
  PackageCheck, Receipt, Send, IndianRupee, Filter, AlarmClock,
} from 'lucide-react'

import OpenPurchaseOrders from './OpenPurchaseOrders'
import ProcurementSpend from './ProcurementSpend'
import VendorPerformance from './VendorPerformance'
import RequisitionSla from './RequisitionSla'
import ReorderReport from './ReorderReport'
import InventoryValuation from './InventoryValuation'
import StockMovement from './StockMovement'
import Fulfillment from './Fulfillment'
import SalesRegister from './SalesRegister'
import DispatchRegister from './DispatchRegister'
import Receivables from './Receivables'
import SalesFunnel from './SalesFunnel'
import ExpiringOffers from './ExpiringOffers'

export type ReportRole = 'super_admin' | 'admin' | 'requisition_admin' | 'quotation_admin' | 'user' | 'accounts'

export interface ReportDef {
  slug: string
  title: string
  description: string
  section: string
  icon: ComponentType<any>
  component: ComponentType<any>
  roles: ReportRole[]
}

const PROC: ReportRole[] = ['super_admin', 'admin', 'requisition_admin', 'accounts']
const SALES: ReportRole[] = ['super_admin', 'admin', 'accounts']

export const REPORTS: ReportDef[] = [
  // Procurement & Vendors
  { slug: 'open-purchase-orders', title: 'Open Purchase Orders', description: 'Confirmed POs awaiting full goods receipt', section: 'Procurement & Vendors', icon: FileText, component: OpenPurchaseOrders, roles: PROC },
  { slug: 'procurement-spend', title: 'Procurement Spend', description: 'Purchase value by month, vendor and machine area', section: 'Procurement & Vendors', icon: TrendingUp, component: ProcurementSpend, roles: PROC },
  { slug: 'vendor-performance', title: 'Vendor Performance', description: 'Lead time and on-time reliability per vendor', section: 'Procurement & Vendors', icon: Truck, component: VendorPerformance, roles: PROC },
  { slug: 'requisition-sla', title: 'Requisition Cycle Time', description: 'Approval turnaround and overdue indents', section: 'Procurement & Vendors', icon: ClipboardCheck, component: RequisitionSla, roles: PROC },

  // Inventory & Fulfillment
  { slug: 'reorder', title: 'Low Stock / Reorder', description: 'Items below minimum with suggested reorder', section: 'Inventory & Fulfillment', icon: PackageSearch, component: ReorderReport, roles: PROC },
  { slug: 'inventory-valuation', title: 'Inventory Valuation', description: 'Stock value and aging across item types', section: 'Inventory & Fulfillment', icon: Boxes, component: InventoryValuation, roles: PROC },
  { slug: 'stock-movement', title: 'Stock Movement', description: 'Inventory ledger and fastest-moving items', section: 'Inventory & Fulfillment', icon: ArrowLeftRight, component: StockMovement, roles: PROC },
  { slug: 'fulfillment', title: 'Order Fulfillment', description: 'Delivery progress and overdue shipments', section: 'Inventory & Fulfillment', icon: PackageCheck, component: Fulfillment, roles: SALES },

  // Sales & Revenue
  { slug: 'sales-register', title: 'Sales Register', description: 'Revenue by month, client and product', section: 'Sales & Revenue', icon: Receipt, component: SalesRegister, roles: SALES },
  { slug: 'dispatch-register', title: 'Dispatch Register', description: 'Delivery challans with tracking details', section: 'Sales & Revenue', icon: Send, component: DispatchRegister, roles: SALES },

  // Receivables & Pipeline
  { slug: 'receivables', title: 'Receivables', description: 'Unpaid order balances and aging', section: 'Receivables & Pipeline', icon: IndianRupee, component: Receivables, roles: SALES },
  { slug: 'sales-funnel', title: 'Sales Funnel', description: 'Enquiry to order conversion by source', section: 'Receivables & Pipeline', icon: Filter, component: SalesFunnel, roles: SALES },
  { slug: 'expiring-offers', title: 'Expiring Offers', description: 'Quotations expiring soon — follow-ups due', section: 'Receivables & Pipeline', icon: AlarmClock, component: ExpiringOffers, roles: SALES },
]

export const REPORT_SECTIONS = [
  'Procurement & Vendors',
  'Inventory & Fulfillment',
  'Sales & Revenue',
  'Receivables & Pipeline',
]

export function reportsForRole(role: string): ReportDef[] {
  return REPORTS.filter(r => r.roles.includes(role as ReportRole))
}
