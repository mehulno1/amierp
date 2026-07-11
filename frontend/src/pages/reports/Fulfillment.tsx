import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { BarCard } from './_shared/Charts'
import { exportSheet } from './_shared/exportSheet'
import { num, pct } from './_shared/chartTheme'
import { fmtDate } from '../../utils/formatDate'

export default function Fulfillment() {
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'fulfillment'],
    queryFn: () => reportsApi.fulfillment().then(r => r.data.data),
  })
  const rows: any[] = data?.rows || []
  const totals = data?.totals || {}
  const byStatus = Object.entries(data?.by_status || {}).map(([status, count]) => ({ status: String(status).replace(/_/g, ' '), count: Number(count) }))

  const columns: Column<any>[] = [
    { key: 'order_id', label: 'Order' },
    { key: 'client_name', label: 'Client' },
    { key: 'order_date', label: 'Ordered', render: r => fmtDate(r.order_date) },
    { key: 'delivery_date', label: 'Due', render: r => r.overdue ? <span className="text-red-600">{fmtDate(r.delivery_date)}</span> : fmtDate(r.delivery_date) },
    { key: 'status', label: 'Status', render: r => <span className="capitalize">{String(r.status).replace(/_/g, ' ')}</span> },
    { key: 'fulfilment_pct', label: 'Fulfilled', align: 'right', render: r => (
      <div className="flex items-center justify-end gap-2">
        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(r.fulfilment_pct, 100)}%`, background: 'var(--color-warm)' }} />
        </div>
        <span className="tabular-nums">{pct(r.fulfilment_pct)}</span>
      </div>
    ) },
  ]

  const onExport = () => exportSheet('order_fulfillment.xlsx', 'Fulfillment', rows.map(r => ({
    Order: r.order_id, Client: r.client_name, Ordered: fmtDate(r.order_date), Due: fmtDate(r.delivery_date),
    Status: r.status, 'Ordered Pcs': r.ordered_pcs, 'Delivered Pcs': r.delivered_pcs,
    'Ordered Kgs': r.ordered_kgs, 'Delivered Kgs': r.delivered_kgs, 'Fulfilled %': r.fulfilment_pct, Overdue: r.overdue ? 'Yes' : '',
  })))

  return (
    <ReportShell
      title="Order Fulfillment"
      subtitle="Open orders, delivery progress and overdue shipments"
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[
        { label: 'Open Orders', value: num(totals.open_orders) },
        { label: 'Overdue Delivery', value: num(totals.overdue) },
      ]} />
      {byStatus.length > 0 && (
        <div className="mb-6">
          <BarCard title="Open orders by status" data={byStatus} xKey="status" bars={[{ key: 'count', name: 'Orders' }]} height={220} />
        </div>
      )}
      <SortableTable rows={rows} columns={columns} defaultSort="delivery_date" empty="No open orders" minWidth={760} maxHeight={560} />
    </ReportShell>
  )
}
