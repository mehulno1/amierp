import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersApi, clientsApi, productsApi } from '../services/api'
import { Plus, Search, Eye, Download, FileText, Trash2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSortable } from '../hooks/useSortable'
import { SortIcon, thSort } from '../components/SortIcon'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import CreateOrderModal from '../components/CreateOrderModal'
import PIDocument from '../components/PIDocument'
import * as XLSX from 'xlsx'
import { fmtDate } from '../utils/formatDate'

const statusColors: Record<string, string> = {
  new_order: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  ready_for_dispatch: 'bg-orange-100 text-orange-700',
  dispatched: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function Orders() {
  const { brands, isAdmin, isSuperAdmin, user } = useAuth()
  const isUser = user?.role === 'user'
  const qc = useQueryClient()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [viewPiId, setViewPiId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['orders', search, status, page],
    queryFn: () => ordersApi.list({ search, status, page, limit: 20 }).then(r => r.data),
  })

  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.list().then(r => r.data.data), enabled: isAdmin() })
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => productsApi.list().then(r => r.data.data), enabled: isAdmin() })

  const rawOrders = data?.data || []
  const total = data?.total || 0
  const { sorted: orders, sortCol, sortDir, toggle } = useSortable(rawOrders, 'order_date', 'desc')
  const si = (col: string) => <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />

  const deleteOrder = async (id: number, orderRef: string) => {
    if (!window.confirm(`Permanently delete order ${orderRef}? This cannot be undone.`)) return
    try {
      await ordersApi.delete(id)
      qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order deleted')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to delete') }
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(orders.map((o: any, i: number) => ({
      'S#': i + 1 + (page - 1) * 20,
      'Order No': o.order_id,
      'Order Date': fmtDate(o.order_date),
      'Client': o.client_name,
      'Delivery By': fmtDate(o.delivery_date),
      'Order By': o.prepared_by_name || '',
      'Status': o.status.replace(/_/g, ' '),
      ...(!isUser && { 'Invoice Amount': o.total_amount || '' }),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Orders')
    XLSX.writeFile(wb, 'orders.xlsx')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all orders ({total} total)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2 flex-1 sm:flex-initial justify-center"><Download size={16} />Export</button>
          {isAdmin() && (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 flex-1 sm:flex-initial justify-center"><Plus size={16} />New Order</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search orders, clients..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="input-field sm:w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            <option value="new_order">New Order</option>
            <option value="processing">Processing</option>
            <option value="ready_for_dispatch">Ready for Dispatch</option>
            <option value="dispatched">Dispatched</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">S#</th>
                  <th className={thSort + ' text-xs uppercase tracking-wider'} onClick={() => toggle('order_id')}>Order No {si('order_id')}</th>
                  <th className={thSort + ' text-xs uppercase tracking-wider'} onClick={() => toggle('order_date')}>Order Date {si('order_date')}</th>
                  <th className={thSort + ' text-xs uppercase tracking-wider'} onClick={() => toggle('client_name')}>Client Name {si('client_name')}</th>
                  <th className={thSort + ' text-xs uppercase tracking-wider'} onClick={() => toggle('delivery_date')}>Delivery By {si('delivery_date')}</th>
                  <th className={thSort + ' text-xs uppercase tracking-wider'} onClick={() => toggle('prepared_by_name')}>Order By {si('prepared_by_name')}</th>
                  <th className={thSort + ' text-xs uppercase tracking-wider'} onClick={() => toggle('status')}>Order State {si('status')}</th>
                  {!isUser && <th className={thSort + ' text-xs uppercase tracking-wider'} onClick={() => toggle('total_amount')}>Invoice Amount {si('total_amount')}</th>}
                  <th className="pb-3 text-xs text-gray-500 font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o: any, idx: number) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-400 text-xs">{(page - 1) * 20 + idx + 1}</td>
                    <td className="py-3 font-medium text-blue-600">
                      <Link to={`/orders/${o.id}`}>{o.order_id.replace('ORD-', '').slice(0, 10)}</Link>
                    </td>
                    <td className="py-3 text-gray-700">{fmtDate(o.order_date)}</td>
                    <td className="py-3 text-gray-900 max-w-[200px] truncate">{o.client_name}</td>
                    <td className="py-3 text-gray-700">{fmtDate(o.delivery_date)}</td>
                    <td className="py-3 text-gray-600 text-xs">{o.prepared_by_name || '—'}</td>
                    <td className="py-3">
                      <span className={`badge-status ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    {!isUser && (
                      <td className="py-3">
                        {o.total_amount
                          ? <span className="font-medium text-gray-900">₹{parseFloat(o.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          : <span className="text-gray-400 text-xs">Not set</span>}
                        {o.payment_received > 0 && (
                          <div className="text-xs text-green-600">Paid ₹{parseFloat(o.payment_received).toLocaleString('en-IN')}</div>
                        )}
                      </td>
                    )}
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/orders/${o.id}`} className="text-blue-500 hover:text-blue-700" title="View Order"><Eye size={15} /></Link>
                        {!isUser && o.pi_id && (
                          <button onClick={() => setViewPiId(o.pi_id)} className="text-purple-500 hover:text-purple-700" title="View PI"><FileText size={15} /></button>
                        )}
                        {isSuperAdmin() && (
                          <button onClick={() => deleteOrder(o.id, o.order_id)} className="text-red-400 hover:text-red-600" title="Delete Order"><Trash2 size={15} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={isUser ? 8 : 9} className="py-8 text-center text-gray-400">No orders found</td></tr>
                )}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">Showing {Math.min((page-1)*20+1, total)}–{Math.min(page*20, total)} of {total}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary py-1 px-3 text-xs disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => p+1)} disabled={page * 20 >= total} className="btn-secondary py-1 px-3 text-xs disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreate && isAdmin() && (
        <CreateOrderModal
          brands={brands}
          clients={clients || []}
          products={products || []}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['orders'] }); toast.success('Order created') }}
        />
      )}

      {viewPiId && <PIDocument piId={viewPiId} onClose={() => setViewPiId(null)} />}
    </div>
  )
}
