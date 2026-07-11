import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import MonoEyebrow from '../components/ui/MonoEyebrow'
import { useAuth } from '../hooks/useAuth'
import { REPORT_SECTIONS, reportsForRole } from './reports/registry'

export default function Reports() {
  const { user } = useAuth()
  const available = reportsForRole(user?.role || 'user')

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Operational and management reports across procurement, inventory, sales and receivables"
      />
      <div className="space-y-8">
        {REPORT_SECTIONS.map((section) => {
          const items = available.filter((r) => r.section === section)
          if (items.length === 0) return null
          return (
            <div key={section}>
              <div className="mb-3"><MonoEyebrow>{section}</MonoEyebrow></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--rule-lt)' }}>
                {items.map((r) => {
                  const Icon = r.icon
                  return (
                    <Link
                      key={r.slug}
                      to={`/reports/${r.slug}`}
                      className="group flex items-start gap-3.5 p-5 transition-colors duration-150"
                      style={{ background: '#fff', textDecoration: 'none' }}
                    >
                      <div
                        className="inline-flex items-center justify-center shrink-0"
                        style={{ width: 38, height: 38, background: 'rgba(217,114,71,.1)', color: 'var(--color-warm-dk)', borderRadius: 2 }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>
                            {r.title}
                          </span>
                          <ChevronRight size={15} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-warm-dk)' }} />
                        </div>
                        <p className="mt-1 mb-0" style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--mute-lt)', lineHeight: 1.4 }}>
                          {r.description}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
