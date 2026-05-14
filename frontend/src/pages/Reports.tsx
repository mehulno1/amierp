import { useQuery } from '@tanstack/react-query'
import { ordersApi, inventoryApi } from '../services/api'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Reports() {
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['orders-report'],
    queryFn: () => ordersApi.list({ limit: 500 }).then(r => r.data.data),
  })

  const { data: finGoods = [] } = useQuery({
    queryKey: ['inventory', 'finished_goods'],
    queryFn: () => inventoryApi.getByType('finished_goods').then(r => r.data.data),
  })

  const { data: spareParts = [] } = useQuery({
    queryKey: ['inventory', 'spare_parts'],
    queryFn: () => inventoryApi.getByType('spare_parts').then(r => r.data.data),
  })

  const exportOrders = () => {
    const ws = XLSX.utils.json_to_sheet(orders.map((o: any) => ({
      'Order ID': o.order_id, 'Client': o.client_name, 'Date': o.order_date,
      'Delivery Date': o.delivery_date || '', 'Type': o.order_type, 'Status': o.status,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Orders')
    XLSX.writeFile(wb, 'orders_report.xlsx')
  }

  const exportInventory = () => {
    const wb = XLSX.utils.book_new()
    const fgWs = XLSX.utils.json_to_sheet(finGoods.map((i: any) => ({ Code: i.item_code, Name: i.item_name, UOM: i.uom, Stock: i.current_stock, Reserved: i.reserved_stock, Available: i.current_stock - i.reserved_stock })))
    const spWs = XLSX.utils.json_to_sheet(spareParts.map((i: any) => ({ Code: i.item_code, Name: i.item_name, UOM: i.uom, Stock: i.current_stock })))
    XLSX.utils.book_append_sheet(wb, fgWs, 'Finished Goods')
    XLSX.utils.book_append_sheet(wb, spWs, 'Spare Parts')
    XLSX.writeFile(wb, 'inventory_report.xlsx')
  }

  const statusCounts: Record<string, number> = {}
  orders.forEach((o: any) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Order Summary</h2>
            <button onClick={exportOrders} className="btn-secondary text-xs flex items-center gap-1"><Download size={13} />Export</button>
          </div>
          {loadingOrders ? <LoadingSpinner size="sm" /> : (
            <div className="space-y-3">
              <div className="text-3xl font-bold text-gray-900">{orders.length}</div>
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="space-y-2 mt-4">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{status.replace(/_/g, ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Inventory Summary</h2>
            <button onClick={exportInventory} className="btn-secondary text-xs flex items-center gap-1"><Download size={13} />Export</button>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Finished Goods Items</span>
              <span className="font-medium">{finGoods.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Spare Parts Items</span>
              <span className="font-medium">{spareParts.length}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Low Stock (Finished Goods)</span>
              <span className="font-medium">{finGoods.filter((i: any) => i.minimum_stock && (i.current_stock - i.reserved_stock) < i.minimum_stock).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
