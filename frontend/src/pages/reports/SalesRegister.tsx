import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip, type DateRange } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { LineCard, BarCard, DonutCard } from './_shared/Charts'
import { exportSheets } from './_shared/exportSheet'
import { inr, inrShort, num, monthLabel, last12Months } from './_shared/chartTheme'

export default function SalesRegister() {
  const [range, setRange] = useState<DateRange>(last12Months())
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'sales-register', range],
    queryFn: () => reportsApi.salesRegister(range).then(r => r.data.data),
  })

  // Pivot monthly rows (one per month × order_type) into one row per month for the chart.
  const monthly = useMemo(() => {
    const map: Record<string, any> = {}
    for (const m of data?.monthly || []) {
      const row = (map[m.ym] ||= { ym: m.ym, label: monthLabel(m.ym), domestic: 0, export: 0, total: 0 })
      row[m.order_type] = Number(m.total)
      row.total += Number(m.total)
    }
    return Object.values(map).sort((a: any, b: any) => a.ym.localeCompare(b.ym))
  }, [data])

  const byClient: any[] = (data?.by_client || []).map((c: any) => ({ ...c, total: Number(c.total), orders: Number(c.orders) }))
  const byProduct: any[] = (data?.by_product || []).map((p: any) => ({ ...p, total: Number(p.total) }))

  const cCols: Column<any>[] = [
    { key: 'client', label: 'Client' },
    { key: 'orders', label: 'Orders', align: 'right', render: r => num(r.orders) },
    { key: 'total', label: 'Revenue ₹', align: 'right', render: r => inr(r.total) },
  ]

  const onExport = () => exportSheets('sales_register.xlsx', [
    { name: 'Monthly', rows: monthly.map((m: any) => ({ Month: m.label, Domestic: m.domestic, Export: m.export, Total: m.total })) },
    { name: 'By Client', rows: byClient.map(c => ({ Client: c.client, Orders: c.orders, Revenue: c.total })) },
    { name: 'By Product', rows: byProduct.map(p => ({ Product: p.product, Revenue: p.total })) },
  ])

  return (
    <ReportShell
      title="Sales Register"
      subtitle="Revenue trend by month, client and product"
      range={{ value: range, onChange: setRange }}
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[
        { label: 'Total Revenue', value: inr(data?.totals?.total) },
        { label: 'Basic', value: inr(data?.totals?.basic) },
        { label: 'GST', value: inr(data?.totals?.gst) },
      ]} />
      <div className="mb-6">
        <LineCard title="Monthly revenue (domestic vs export)" data={monthly} xKey="label"
          lines={[{ key: 'domestic', name: 'Domestic' }, { key: 'export', name: 'Export' }]} tickFmt={inrShort} valueFmt={inr} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarCard title="Top clients by revenue" data={byClient.slice(0, 10)} xKey="client" bars={[{ key: 'total', name: 'Revenue ₹' }]} horizontal tickFmt={inrShort} valueFmt={inr} />
        <DonutCard title="Revenue by product" data={byProduct.slice(0, 8).map(p => ({ name: p.product, value: Number(p.total) }))} valueFmt={inr} />
      </div>
      <SortableTable title="Client breakdown" rows={byClient} columns={cCols} defaultSort="total" defaultDir="desc" empty="No sales in range" minWidth={480} />
    </ReportShell>
  )
}
