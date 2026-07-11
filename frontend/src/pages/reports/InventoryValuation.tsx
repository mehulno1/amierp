import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { DonutCard, BarCard } from './_shared/Charts'
import { exportSheet } from './_shared/exportSheet'
import { inr, inrShort, num } from './_shared/chartTheme'

const typeLabel = (t: string) => String(t).replace(/_/g, ' ')
const sourceLabel: Record<string, string> = {
  last_purchase: 'Last purchase', variant_price: 'Variant price (proxy)', none: 'No cost',
}

export default function InventoryValuation() {
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'inventory-valuation'],
    queryFn: () => reportsApi.inventoryValuation().then(r => r.data.data),
  })
  const rows: any[] = data?.rows || []
  const totals = data?.totals || {}
  const valueByType = Object.entries(data?.value_by_type || {}).map(([type, value]) => ({ name: typeLabel(type), value: Number(value) }))
  const valueByAge = Object.entries(data?.value_by_age || {}).map(([bucket, value]) => ({ bucket, value: Number(value) }))

  const columns: Column<any>[] = [
    { key: 'item_code', label: 'Code', render: r => r.item_code || '—' },
    { key: 'item_name', label: 'Item' },
    { key: 'item_type', label: 'Type', render: r => <span className="capitalize">{typeLabel(r.item_type)}</span> },
    { key: 'current_stock', label: 'Stock', align: 'right', render: r => `${num(r.current_stock)} ${r.uom}` },
    { key: 'unit_cost', label: 'Unit cost', align: 'right', render: r => r.unit_cost == null ? '—' : inr(r.unit_cost) },
    { key: 'value', label: 'Value ₹', align: 'right', render: r => r.value == null ? '—' : inr(r.value) },
    { key: 'age_days', label: 'Age (days)', align: 'right', render: r => r.age_days ?? '—' },
    { key: 'cost_source', label: 'Cost basis', render: r => <span className="text-xs text-gray-500">{sourceLabel[r.cost_source] || r.cost_source}</span> },
  ]

  const onExport = () => exportSheet('inventory_valuation.xlsx', 'Valuation', rows.map(r => ({
    Code: r.item_code, Item: r.item_name, Type: typeLabel(r.item_type), Stock: r.current_stock, UOM: r.uom,
    'Unit Cost': r.unit_cost ?? '', Value: r.value ?? '', 'Age (days)': r.age_days ?? '', 'Cost Basis': sourceLabel[r.cost_source] || r.cost_source,
  })))

  return (
    <ReportShell
      title="Inventory Valuation & Aging"
      subtitle="Stock value and age across all item types"
      onExport={onExport}
      loading={isLoading}
      note={`Valuation is approximate. Spare/raw/packing items are valued at their last purchase rate; finished goods use a same-named product variant's selling price as a proxy. ${totals.uncosted_items || 0} item(s) have no derivable cost and are excluded from totals.`}
    >
      <KpiStrip items={[
        { label: 'Total Value', value: inr(totals.value) },
        { label: 'Valued Items', value: num(totals.valued_items) },
        { label: 'Uncosted Items', value: num(totals.uncosted_items) },
      ]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DonutCard title="Value by item type" data={valueByType} valueFmt={inr} />
        <BarCard title="Value by stock age" data={valueByAge} xKey="bucket" bars={[{ key: 'value', name: 'Value ₹' }]} tickFmt={inrShort} valueFmt={inr}
          height={260} />
      </div>
      <SortableTable rows={rows} columns={columns} defaultSort="value" defaultDir="desc" empty="No stock on hand" minWidth={860} maxHeight={560} />
    </ReportShell>
  )
}
