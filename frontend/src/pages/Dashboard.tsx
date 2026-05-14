import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../services/api'
import { ShoppingCart, ClipboardList, MessageSquare, FileText, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'

const orderStatusColors: Record<string, string> = {
  new_order: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  ready_for_dispatch: 'bg-orange-100 text-orange-700',
  dispatched: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  urgent: 'bg-orange-100 text-orange-700',
  normal: 'bg-gray-100 text-gray-700',
}

const REQ_PIPELINE = [
  { key: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700', border: 'border-gray-200' },
  { key: 'quotation_pending', label: 'Quot. Pending', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  { key: 'quotation_received', label: 'Quot. Received', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  { key: 'po_raised', label: 'PO Raised', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  { key: 'partially_delivered', label: 'Part. Delivered', color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  { key: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
]

const ENQ_PIPELINE = [
  { key: 'new', label: 'New', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  { key: 'offer_sent', label: 'Offer Sent', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  { key: 'order_received', label: 'Won', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  { key: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700', border: 'border-red-200' },
  { key: 'expired', label: 'Expired', color: 'bg-gray-100 text-gray-500', border: 'border-gray-200' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const isUser = user?.role === 'user'

  const { data: masterData, isLoading: masterLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getMasterStats().then(r => r.data.data),
  })
  const { data: reqStats, isLoading: reqLoading } = useQuery({
    queryKey: ['requisition-stats'],
    queryFn: () => dashboardApi.getRequisitionStats().then(r => r.data.data),
  })
  const { data: quotStats, isLoading: quotLoading } = useQuery({
    queryKey: ['quotation-stats'],
    queryFn: () => dashboardApi.getQuotationStats().then(r => r.data.data),
    enabled: !isUser,
  })

  if (masterLoading || reqLoading || (!isUser && quotLoading)) return <LoadingSpinner />

  const { orders, requisitions, enquiries, po_this_month, recent_orders = [], overdue_requisitions = [] } = masterData || {}
  const reqPipeline = reqStats?.pipeline || {}
  const overdue = reqStats?.overdue || []
  const enqPipeline = quotStats?.enquiry_pipeline || {}
  const expiringOffers = quotStats?.expiring_offers || []
  const recentEnquiries = quotStats?.recent_enquiries || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/orders" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{orders?.total_orders || 0}</div>
              <div className="text-xs text-gray-500">Open Orders</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            {orders?.new_orders > 0 && <span className="badge-status bg-blue-100 text-blue-700">{orders.new_orders} New</span>}
            {orders?.processing > 0 && <span className="badge-status bg-yellow-100 text-yellow-700">{orders.processing} Processing</span>}
            {orders?.dispatched > 0 && <span className="badge-status bg-purple-100 text-purple-700">{orders.dispatched} Dispatched</span>}
          </div>
        </Link>

        <Link to="/requisitions" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <ClipboardList size={20} className="text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{requisitions?.total || 0}</div>
              <div className="text-xs text-gray-500">Open Requisitions</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            {requisitions?.pending > 0 && <span className="badge-status bg-gray-100 text-gray-700">{requisitions.pending} Pending</span>}
            {requisitions?.po_raised > 0 && <span className="badge-status bg-blue-100 text-blue-700">{requisitions.po_raised} PO Raised</span>}
            {requisitions?.critical > 0 && <span className="badge-status bg-red-100 text-red-700">{requisitions.critical} Critical</span>}
          </div>
        </Link>

        {!isUser && (
          <Link to="/quotations" className="card hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{enquiries?.total || 0}</div>
                <div className="text-xs text-gray-500">Open Enquiries</div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mt-2">
              {enquiries?.new_enquiries > 0 && <span className="badge-status bg-blue-100 text-blue-700">{enquiries.new_enquiries} New</span>}
              {enquiries?.offer_sent > 0 && <span className="badge-status bg-yellow-100 text-yellow-700">{enquiries.offer_sent} Offer Sent</span>}
            </div>
          </Link>
        )}

        {!isUser && (
          <Link to="/purchase-orders" className="card hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{po_this_month || 0}</div>
                <div className="text-xs text-gray-500">POs This Month</div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Requisition Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Procurement Pipeline</h2>
          <Link to="/requisitions" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {REQ_PIPELINE.map(({ key, label, color, border }) => (
            <Link
              key={key}
              to={`/requisitions?status=${key}`}
              className={`card text-center py-4 border ${border} hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="text-2xl font-bold text-gray-900">{reqPipeline[key] || 0}</div>
              <div className={`mt-1 px-2 py-0.5 rounded text-xs font-medium ${color} inline-block`}>{label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Enquiry Pipeline */}
      {!isUser && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sales Pipeline</h2>
            <Link to="/quotations" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {ENQ_PIPELINE.map(({ key, label, color, border }) => (
              <Link
                key={key}
                to={`/quotations?status=${key}`}
                className={`card text-center py-4 border ${border} hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="text-2xl font-bold text-gray-900">{enqPipeline[key] || 0}</div>
                <div className={`mt-1 px-2 py-0.5 rounded text-xs font-medium ${color} inline-block`}>{label}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Requisitions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Overdue Indents
            </h2>
            <Link to="/requisitions" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {(overdue.length === 0 && overdue_requisitions.length === 0) ? (
            <p className="text-gray-400 text-sm text-center py-4">No overdue requisitions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 text-gray-500 font-medium">Indent No.</th>
                    <th className="pb-2 text-gray-500 font-medium">Area</th>
                    <th className="pb-2 text-gray-500 font-medium">Priority</th>
                    <th className="pb-2 text-gray-500 font-medium">Days Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(overdue.length > 0 ? overdue : overdue_requisitions).slice(0, 5).map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-blue-600">{r.indent_no}</td>
                      <td className="py-2 text-gray-700">{r.machine_area || '—'}</td>
                      <td className="py-2">
                        <span className={`badge-status ${priorityColors[r.priority] || 'bg-gray-100 text-gray-600'}`}>{r.priority}</span>
                      </td>
                      <td className="py-2 text-red-600 font-medium">{r.days_overdue != null ? `${r.days_overdue}d` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/orders" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {recent_orders.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No orders yet</p>
          ) : (
            <div className="space-y-1">
              {recent_orders.slice(0, 8).map((o: any) => (
                <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg group">
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{o.order_id}</div>
                    <div className="text-xs text-gray-500">{o.client_name} · {o.order_date}</div>
                  </div>
                  <span className={`badge-status ${orderStatusColors[o.status] || 'bg-gray-100 text-gray-700'}`}>
                    {o.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expiring Offers */}
      {!isUser && expiringOffers.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Expiring Offers (Next 7 Days)
            </h2>
            <Link to="/quotations" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-2 text-gray-500 font-medium">Offer No.</th>
                <th className="pb-2 text-gray-500 font-medium">Customer</th>
                <th className="pb-2 text-gray-500 font-medium">Valid Until</th>
                <th className="pb-2 text-gray-500 font-medium">Days Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expiringOffers.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="py-2 font-medium text-blue-600">{o.offer_no}</td>
                  <td className="py-2 text-gray-700">{o.customer_name}</td>
                  <td className="py-2 text-gray-500">{o.validity_date}</td>
                  <td className="py-2">
                    <span className={`font-medium ${o.days_left <= 2 ? 'text-red-600' : 'text-orange-600'}`}>{o.days_left}d</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Enquiries */}
      {!isUser && recentEnquiries.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Enquiries</h2>
            <Link to="/quotations" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-2 text-gray-500 font-medium">Enquiry No.</th>
                <th className="pb-2 text-gray-500 font-medium">Customer</th>
                <th className="pb-2 text-gray-500 font-medium">Source</th>
                <th className="pb-2 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentEnquiries.slice(0, 5).map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="py-2 font-medium text-blue-600">{e.enquiry_no}</td>
                  <td className="py-2 text-gray-700">{e.customer_name}</td>
                  <td className="py-2 text-gray-500 capitalize">{e.source}</td>
                  <td className="py-2 capitalize text-gray-500">{e.status?.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
