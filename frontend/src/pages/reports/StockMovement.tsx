import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip, type DateRange } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { BarCard } from './_shared/Charts'
import { exportSheet } from './_shared/exportSheet'
import { num, last12Months } from './_shared/chartTheme'
import { fmtDate } from '../../utils/formatDate'

const typeLabel = (t: string) => String(t).replace(/_/g, ' ')

export default function StockMovement() {
  const [range, setRange] = useState<DateRange>(last12Months())
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'stock-movement', range],
    queryFn: () => reportsApi.stockMovement(range).then(r => r.data.data),
  })
  const rows: any[] = data?.rows || []
  const totals = data?.totals || {}
  const movers: any[] = (data?.top_movers || []).map((m: any) => ({ ...m, qty_out: Number(m.qty_out) }))

  const columns: Column<any>[] = [
    { key: 'created_at', label: 'Date', render: r => fmtDate(r.created_at) },
    { key: 'item_name', label: 'Item' },
    { key: 'transaction_type', label: 'Type', render: r => <span className="capitalize">{typeLabel(r.transaction_type)}</span> },
    { key: 'quantity', label: 'Qty', align: 'right', render: r => num(r.quantity) },
    { key: 'stock_before', label: 'Before', align: 'right', render: r => r.stock_before == null ? '—' : num(r.stock_before) },
    { key: 'stock_after', label: 'After', align: 'right', render: r => r.stock_after == null ? '—' : num(r.stock_after) },
    { key: 'reference_type', label: 'Ref', render: r => r.reference_type || '—' },
  ]

  const onExport = () => exportSheet('stock_movement.xlsx', 'Ledger', rows.map(r => ({
    Date: fmtDate(r.created_at), Code: r.item_code, Item: r.item_name, Type: typeLabel(r.transaction_type),
    Qty: r.quantity, Before: r.stock_before, After: r.stock_after, Ref: r.reference_type, Notes: r.notes,
  })))

  return (
    <ReportShell
      title="Stock Movement Ledger"
      subtitle="Inventory transactions and fastest-moving items"
      range={{ value: range, onChange: setRange }}
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[
        { label: 'Transactions', value: num(totals.count) },
        { label: 'Total Inflow', value: num(totals.inflow) },
        { label: 'Total Outflow', value: num(totals.outflow) },
      ]} />
      {movers.length > 0 && (
        <div className="mb-6">
          <BarCard title="Top outbound movers (dispatch + deductions)" data={movers} xKey="item_name" bars={[{ key: 'qty_out', name: 'Qty out' }]} horizontal />
        </div>
      )}
      <SortableTable rows={rows} columns={columns} defaultSort="" empty="No transactions in range" minWidth={760} maxHeight={560} />
    </ReportShell>
  )
}
