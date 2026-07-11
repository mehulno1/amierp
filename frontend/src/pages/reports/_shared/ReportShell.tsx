import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Download, Info } from 'lucide-react'
import PageHeader from '../../../components/ui/PageHeader'
import MetricCard from '../../../components/ui/MetricCard'
import LoadingSpinner from '../../../components/LoadingSpinner'

export interface DateRange { from: string; to: string }

interface ReportShellProps {
  title: string
  subtitle?: ReactNode
  range?: { value: DateRange; onChange: (r: DateRange) => void }
  onExport?: () => void
  note?: ReactNode
  loading?: boolean
  children: ReactNode
}

const dateInput =
  'border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-gray-400'

export default function ReportShell({ title, subtitle, range, onExport, note, loading, children }: ReportShellProps) {
  const actions = (
    <>
      {range && (
        <div className="flex items-center gap-1.5">
          <input
            type="date" className={dateInput} value={range.value.from}
            onChange={(e) => range.onChange({ ...range.value, from: e.target.value })}
          />
          <span className="text-gray-400 text-xs">→</span>
          <input
            type="date" className={dateInput} value={range.value.to}
            onChange={(e) => range.onChange({ ...range.value, to: e.target.value })}
          />
        </div>
      )}
      {onExport && (
        <button onClick={onExport} className="btn-secondary text-xs flex items-center gap-1">
          <Download size={13} /> Export
        </button>
      )}
    </>
  )

  return (
    <div>
      <PageHeader
        breadcrumb={[<Link key="r" to="/reports" className="hover:underline">Reports</Link>, title]}
        title={title}
        subtitle={subtitle}
        actions={actions}
      />
      {note && (
        <div
          className="flex items-start gap-2 mb-5 px-3.5 py-2.5 text-xs"
          style={{ background: 'rgba(74,144,217,.08)', color: 'var(--color-info)', border: '1px solid rgba(74,144,217,.18)' }}
        >
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>{note}</span>
        </div>
      )}
      {loading ? <LoadingSpinner size="lg" /> : children}
    </div>
  )
}

export function KpiStrip({ items }: { items: { label: string; value: ReactNode; sub?: ReactNode }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-6" style={{ background: 'var(--rule-lt)' }}>
      {items.map((it, i) => (
        <MetricCard key={i} label={it.label} value={it.value} sub={it.sub} />
      ))}
    </div>
  )
}
