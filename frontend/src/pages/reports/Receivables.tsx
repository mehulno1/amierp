import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { BarCard, DonutCard } from './_shared/Charts'
import { exportSheet } from './_shared/exportSheet'
import { inr, inrShort, num } from './_shared/chartTheme'
import { fmtDate } from '../../utils/formatDate'

export default function Receivables() {
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'receivables'],
    queryFn: () => reportsApi.receivables().then(r => r.data.data),
  })
  const rows: any[] = data?.rows || []
  const totals = data?.totals || {}
  const aging = Object.entries(data?.aging || {}).map(([bucket, value]) => ({ bucket, value: Number(value) }))
  const byClient: any[] = data?.by_client || []

  const columns: Column<any>[] = [
    { key: 'order_id', label: 'Order' },
    { key: 'client_name', label: 'Client' },
    { key: 'order_date', label: 'Order date', render: r => fmtDate(r.order_date) },
    { key: 'invoice_no', label: 'Invoice', render: r => r.invoice_no || '—' },
    { key: 'total_amount', label: 'Billed ₹', align: 'right', render: r => inr(r.total_amount) },
    { key: 'payment_received', label: 'Received ₹', align: 'right', render: r => inr(r.payment_received) },
    { key: 'outstanding', label: 'Outstanding ₹', align: 'right', render: r => <span className="font-medium">{inr(r.outstanding)}</span> },
    { key: 'age_bucket', label: 'Age', render: r => r.age_bucket },
  ]

  const onExport = () => exportSheet('receivables.xlsx', 'Receivables', rows.map(r => ({
    Order: r.order_id, Client: r.client_name, 'Order Date': fmtDate(r.order_date), Invoice: r.invoice_no,
    Billed: r.total_amount, Received: r.payment_received, Outstanding: r.outstanding, 'Age Days': r.age_days, Bucket: r.age_bucket,
  })))

  return (
    <ReportShell
      title="Receivables / Outstanding"
      subtitle="Unpaid order balances and aging"
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[
        { label: 'Total Outstanding', value: inr(totals.outstanding) },
        { label: 'Open Invoices', value: num(totals.invoices) },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarCard title="Outstanding by age" data={aging} xKey="bucket" bars={[{ key: 'value', name: 'Outstanding ₹' }]} tickFmt={inrShort} valueFmt={inr} height={260} />
        <DonutCard title="Outstanding by client" data={byClient.slice(0, 8).map(c => ({ name: c.client, value: c.value }))} valueFmt={inr} />
      </div>
      <SortableTable rows={rows} columns={columns} defaultSort="outstanding" defaultDir="desc" empty="No outstanding payments" minWidth={860} maxHeight={560} />
    </ReportShell>
  )
}
