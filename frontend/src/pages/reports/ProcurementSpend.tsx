import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip, type DateRange } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { LineCard, BarCard, DonutCard } from './_shared/Charts'
import { exportSheet } from './_shared/exportSheet'
import { inr, inrShort, num, monthLabel, last12Months } from './_shared/chartTheme'

export default function ProcurementSpend() {
  const [range, setRange] = useState<DateRange>(last12Months())
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'procurement-spend', range],
    queryFn: () => reportsApi.procurementSpend(range).then(r => r.data.data),
  })
  const monthly = (data?.monthly || []).map((m: any) => ({ ...m, label: monthLabel(m.ym), basic: Number(m.basic) }))
  const byVendor: any[] = (data?.by_vendor || []).map((v: any) => ({ ...v, basic: Number(v.basic), po_count: Number(v.po_count) }))
  const byArea: any[] = data?.by_area || []

  const vCols: Column<any>[] = [
    { key: 'vendor', label: 'Vendor' },
    { key: 'po_count', label: 'POs', align: 'right', render: r => num(r.po_count) },
    { key: 'basic', label: 'Spend ₹', align: 'right', render: r => inr(r.basic) },
  ]

  const onExport = () => exportSheet('procurement_spend.xlsx', 'By Vendor', byVendor.map(v => ({
    Vendor: v.vendor, POs: v.po_count, Spend: v.basic,
  })))

  return (
    <ReportShell
      title="Procurement Spend"
      subtitle="Purchase value by month, vendor and machine area"
      range={{ value: range, onChange: setRange }}
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[{ label: 'Total Spend', value: inr(data?.totals?.spend) }]} />
      <div className="mb-6">
        <LineCard title="Monthly spend" data={monthly} xKey="label" lines={[{ key: 'basic', name: 'Spend ₹' }]} tickFmt={inrShort} valueFmt={inr} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarCard title="Top vendors by spend" data={byVendor.slice(0, 10)} xKey="vendor" bars={[{ key: 'basic', name: 'Spend ₹' }]} horizontal tickFmt={inrShort} valueFmt={inr} />
        <DonutCard title="Spend by machine area" data={byArea.map(a => ({ name: a.area, value: Number(a.basic) }))} valueFmt={inr} />
      </div>
      <SortableTable title="Vendor breakdown" rows={byVendor} columns={vCols} defaultSort="basic" defaultDir="desc" empty="No purchases in range" minWidth={480} />
    </ReportShell>
  )
}
