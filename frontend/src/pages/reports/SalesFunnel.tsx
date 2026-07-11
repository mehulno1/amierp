import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip, type DateRange } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { BarCard } from './_shared/Charts'
import { exportSheet } from './_shared/exportSheet'
import { num, pct, last12Months } from './_shared/chartTheme'

export default function SalesFunnel() {
  const [range, setRange] = useState<DateRange>(last12Months())
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'sales-funnel', range],
    queryFn: () => reportsApi.salesFunnel(range).then(r => r.data.data),
  })
  const funnel: any[] = data?.funnel || []
  const bySource: any[] = data?.by_source || []
  const totals = data?.totals || {}

  const sCols: Column<any>[] = [
    { key: 'source', label: 'Source', render: r => <span className="capitalize">{String(r.source).replace(/_/g, ' ')}</span> },
    { key: 'total', label: 'Enquiries', align: 'right', render: r => num(r.total) },
    { key: 'won', label: 'Won', align: 'right', render: r => num(r.won) },
    { key: 'conversion', label: 'Conversion', align: 'right', render: r => pct(r.conversion) },
  ]

  const onExport = () => exportSheet('sales_funnel.xlsx', 'By Source', bySource.map(s => ({
    Source: s.source, Enquiries: s.total, Won: s.won, 'Conversion %': s.conversion,
  })))

  return (
    <ReportShell
      title="Sales Funnel"
      subtitle="Enquiry → offer → order conversion by source"
      range={{ value: range, onChange: setRange }}
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[
        { label: 'Enquiries', value: num(totals.enquiries) },
        { label: 'Won', value: num(totals.won) },
        { label: 'Lost', value: num(totals.lost) },
        { label: 'Conversion', value: pct(totals.conversion) },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarCard title="Conversion funnel" data={funnel} xKey="stage" bars={[{ key: 'count', name: 'Count' }]} height={260} />
        <BarCard title="Enquiries by source" data={bySource} xKey="source" bars={[{ key: 'total', name: 'Enquiries' }, { key: 'won', name: 'Won' }]} height={260} />
      </div>
      <SortableTable title="Source breakdown" rows={bySource} columns={sCols} defaultSort="total" defaultDir="desc" empty="No enquiries in range" minWidth={480} />
    </ReportShell>
  )
}
