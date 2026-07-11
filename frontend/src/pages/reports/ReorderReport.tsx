import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { BarCard } from './_shared/Charts'
import { exportSheet } from './_shared/exportSheet'
import { num } from './_shared/chartTheme'

const typeLabel = (t: string) => String(t).replace(/_/g, ' ')

export default function ReorderReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'reorder'],
    queryFn: () => reportsApi.reorder().then(r => r.data.data),
  })
  const rows: any[] = data?.rows || []
  const byType = data?.by_type || {}
  const typeData = Object.entries(byType).map(([type, count]) => ({ type: typeLabel(type), count: Number(count) }))

  const columns: Column<any>[] = [
    { key: 'item_code', label: 'Code', render: r => r.item_code || '—' },
    { key: 'item_name', label: 'Item' },
    { key: 'item_type', label: 'Type', render: r => <span className="capitalize">{typeLabel(r.item_type)}</span> },
    { key: 'available', label: 'Available', align: 'right', render: r => `${num(r.available)} ${r.uom}` },
    { key: 'minimum_stock', label: 'Min', align: 'right', render: r => num(r.minimum_stock) },
    { key: 'suggested_reorder', label: 'Suggested reorder', align: 'right', render: r => <span className="font-medium">{num(r.suggested_reorder)}</span> },
  ]

  const onExport = () => exportSheet('reorder_report.xlsx', 'Reorder', rows.map(r => ({
    Code: r.item_code, Item: r.item_name, Type: typeLabel(r.item_type), Available: r.available, UOM: r.uom,
    Min: r.minimum_stock, Max: r.maximum_stock, 'Suggested Reorder': r.suggested_reorder,
  })))

  return (
    <ReportShell
      title="Low Stock / Reorder"
      subtitle="Items below minimum available stock, with suggested reorder quantity"
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[{ label: 'Items Below Min', value: num(rows.length) }]} />
      {typeData.length > 0 && (
        <div className="mb-6">
          <BarCard title="Low-stock items by type" data={typeData} xKey="type" bars={[{ key: 'count', name: 'Items' }]} height={220} />
        </div>
      )}
      <SortableTable rows={rows} columns={columns} defaultSort="suggested_reorder" defaultDir="desc" empty="All items above minimum stock" minWidth={680} />
    </ReportShell>
  )
}
