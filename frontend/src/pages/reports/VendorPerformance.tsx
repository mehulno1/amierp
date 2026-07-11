import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { BarCard } from './_shared/Charts'
import { exportSheet } from './_shared/exportSheet'
import { inr, num, pct } from './_shared/chartTheme'

export default function VendorPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'vendor-performance'],
    queryFn: () => reportsApi.vendorPerformance().then(r => r.data.data),
  })
  const rows: any[] = data?.rows || []
  const rated = rows.filter(r => r.avg_lead_days != null)
  const avgLead = rated.length ? Math.round((rated.reduce((s, r) => s + r.avg_lead_days, 0) / rated.length) * 10) / 10 : null

  const columns: Column<any>[] = [
    { key: 'name', label: 'Vendor' },
    { key: 'total_pos', label: 'POs', align: 'right', render: r => num(r.total_pos) },
    { key: 'total_value', label: 'Value ₹', align: 'right', render: r => inr(r.total_value) },
    { key: 'avg_lead_days', label: 'Avg lead (days)', align: 'right', render: r => r.avg_lead_days ?? '—' },
    { key: 'on_time_pct', label: 'On-time %', align: 'right', render: r => r.on_time_pct == null ? '—' : pct(r.on_time_pct) },
  ]

  const onExport = () => exportSheet('vendor_performance.xlsx', 'Vendors', rows.map(r => ({
    Vendor: r.name, POs: r.total_pos, Value: r.total_value, 'Avg Lead Days': r.avg_lead_days ?? '', 'On-time %': r.on_time_pct ?? '',
  })))

  return (
    <ReportShell
      title="Vendor Performance"
      subtitle="Spend, delivery lead time and on-time reliability per vendor"
      onExport={onExport}
      loading={isLoading}
      note="Lead time = days from PO date to last goods-receipt for delivered POs. On-time % compares actual lead time against the quoted delivery days where a vendor quotation is linked; vendors without quoted delivery dates show “—”."
    >
      <KpiStrip items={[
        { label: 'Vendors', value: num(rows.length) },
        { label: 'Avg Lead Time', value: avgLead == null ? '—' : `${avgLead}d` },
      ]} />
      {rated.length > 0 && (
        <div className="mb-6">
          <BarCard
            title="Average lead time by vendor (days)"
            data={[...rated].sort((a, b) => a.avg_lead_days - b.avg_lead_days).slice(0, 12)}
            xKey="name" bars={[{ key: 'avg_lead_days', name: 'Days' }]} horizontal
          />
        </div>
      )}
      <SortableTable rows={rows} columns={columns} defaultSort="total_value" defaultDir="desc" empty="No vendor activity" minWidth={620} />
    </ReportShell>
  )
}
