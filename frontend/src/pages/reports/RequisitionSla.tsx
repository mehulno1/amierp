import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { BarCard } from './_shared/Charts'
import { exportSheet } from './_shared/exportSheet'
import { num } from './_shared/chartTheme'
import { fmtDate } from '../../utils/formatDate'

export default function RequisitionSla() {
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'requisition-sla'],
    queryFn: () => reportsApi.requisitionSla().then(r => r.data.data),
  })
  const rows: any[] = data?.rows || []
  const totals = data?.totals || {}
  const obp = data?.overdue_by_priority || {}
  const priorityData = ['critical', 'urgent', 'normal'].map(p => ({ priority: p, count: Number(obp[p] || 0) }))

  const columns: Column<any>[] = [
    { key: 'indent_no', label: 'Indent' },
    { key: 'created_by_name', label: 'Raised by' },
    { key: 'priority', label: 'Priority', render: r => <span className="capitalize">{r.priority}</span> },
    { key: 'status', label: 'Status', render: r => <span className="capitalize">{String(r.status).replace(/_/g, ' ')}</span> },
    { key: 'created_at', label: 'Raised', render: r => fmtDate(r.created_at) },
    { key: 'approval_days', label: 'Approval (days)', align: 'right', render: r => r.approval_days ?? '—' },
    { key: 'overdue_days', label: 'Overdue (days)', align: 'right', render: r => Number(r.overdue_days) > 0 ? <span className="text-red-600">{r.overdue_days}</span> : '—' },
  ]

  const onExport = () => exportSheet('requisition_sla.xlsx', 'Requisitions', rows.map(r => ({
    Indent: r.indent_no, 'Raised by': r.created_by_name, Priority: r.priority, Status: r.status,
    Raised: fmtDate(r.created_at), Approved: fmtDate(r.approved_at), 'Approval Days': r.approval_days ?? '', 'Overdue Days': Number(r.overdue_days) > 0 ? r.overdue_days : '',
  })))

  return (
    <ReportShell
      title="Requisition Cycle Time"
      subtitle="Approval turnaround, procurement lead and overdue indents"
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[
        { label: 'Pending Approval', value: num(totals.pending_approval) },
        { label: 'Overdue', value: num(totals.overdue) },
        { label: 'Avg Approval', value: totals.avg_approval_days == null ? '—' : `${totals.avg_approval_days}d` },
        { label: 'Avg Procurement', value: totals.avg_procurement_days == null ? '—' : `${totals.avg_procurement_days}d` },
      ]} />
      <div className="mb-6">
        <BarCard title="Overdue indents by priority" data={priorityData} xKey="priority" bars={[{ key: 'count', name: 'Overdue' }]} height={220} />
      </div>
      <SortableTable rows={rows} columns={columns} defaultSort="overdue_days" defaultDir="desc" empty="No requisitions" minWidth={760} maxHeight={560} />
    </ReportShell>
  )
}
