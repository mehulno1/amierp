import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip, type DateRange } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { exportSheet } from './_shared/exportSheet'
import { num, last12Months } from './_shared/chartTheme'
import { fmtDate } from '../../utils/formatDate'

export default function DispatchRegister() {
  const [range, setRange] = useState<DateRange>(last12Months())
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'dispatch-register', range],
    queryFn: () => reportsApi.dispatchRegister(range).then(r => r.data.data),
  })
  const rows: any[] = data?.rows || []

  const columns: Column<any>[] = [
    { key: 'delivery_date', label: 'Date', render: r => fmtDate(r.delivery_date) },
    { key: 'order_id', label: 'Order' },
    { key: 'delivery_no', label: 'Challan #', align: 'right', render: r => num(r.delivery_no) },
    { key: 'client_name', label: 'Client' },
    { key: 'courier_name', label: 'Courier', render: r => r.courier_name || r.transporter || '—' },
    { key: 'awb_number', label: 'AWB / LR', render: r => r.awb_number || (r.lr_link ? 'LR' : '—') },
    { key: 'vehicle_no', label: 'Vehicle', render: r => r.vehicle_no || '—' },
    { key: 'dispatched_by', label: 'By', render: r => r.dispatched_by || '—' },
  ]

  const onExport = () => exportSheet('dispatch_register.xlsx', 'Dispatches', rows.map(r => ({
    Date: fmtDate(r.delivery_date), Order: r.order_id, 'Challan #': r.delivery_no, Client: r.client_name,
    Courier: r.courier_name, Transporter: r.transporter, AWB: r.awb_number, Vehicle: r.vehicle_no, By: r.dispatched_by,
  })))

  return (
    <ReportShell
      title="Dispatch Register"
      subtitle="Delivery challans with courier and tracking details"
      range={{ value: range, onChange: setRange }}
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[{ label: 'Deliveries', value: num(data?.totals?.deliveries) }]} />
      <SortableTable rows={rows} columns={columns} defaultSort="delivery_date" defaultDir="desc" empty="No dispatches in range" minWidth={840} maxHeight={620} />
    </ReportShell>
  )
}
