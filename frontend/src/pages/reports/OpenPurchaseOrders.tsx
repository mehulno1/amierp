import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { BarCard } from './_shared/Charts'
import { exportSheet } from './_shared/exportSheet'
import { inr, num, inrShort } from './_shared/chartTheme'
import { fmtDate } from '../../utils/formatDate'

export default function OpenPurchaseOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'open-pos'],
    queryFn: () => reportsApi.openPurchaseOrders().then(r => r.data.data),
  })
  const rows: any[] = data?.rows || []
  const totals = data?.totals || {}

  const columns: Column<any>[] = [
    { key: 'po_no', label: 'PO No.' },
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'po_date', label: 'Date', render: r => fmtDate(r.po_date) },
    { key: 'status', label: 'Status', render: r => <span className="capitalize">{String(r.status).replace(/_/g, ' ')}</span> },
    { key: 'ordered_qty', label: 'Ordered', align: 'right', render: r => num(r.ordered_qty) },
    { key: 'received_qty', label: 'Received', align: 'right', render: r => num(r.received_qty) },
    { key: 'pending_value', label: 'Pending ₹', align: 'right', render: r => inr(r.pending_value) },
    { key: 'age_days', label: 'Age (days)', align: 'right', render: r => num(r.age_days) },
  ]

  const onExport = () => exportSheet('open_purchase_orders.xlsx', 'Open POs', rows.map(r => ({
    'PO No': r.po_no, Vendor: r.vendor_name, Date: fmtDate(r.po_date), Status: r.status,
    Ordered: r.ordered_qty, Received: r.received_qty, 'PO Value': r.po_value, 'Pending Value': r.pending_value, 'Age (days)': r.age_days,
  })))

  return (
    <ReportShell
      title="Open Purchase Orders"
      subtitle="Confirmed POs awaiting full goods receipt"
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[
        { label: 'Open POs', value: num(totals.open_pos) },
        { label: 'Pending Value', value: inr(totals.pending_value) },
      ]} />
      {data?.vendor_pending?.length > 0 && (
        <div className="mb-6">
          <BarCard
            title="Pending value by vendor"
            data={data.vendor_pending.slice(0, 10)}
            xKey="vendor" bars={[{ key: 'value', name: 'Pending ₹' }]}
            horizontal tickFmt={inrShort} valueFmt={inr}
          />
        </div>
      )}
      <SortableTable rows={rows} columns={columns} defaultSort="age_days" defaultDir="desc" empty="No open purchase orders" minWidth={820} />
    </ReportShell>
  )
}
