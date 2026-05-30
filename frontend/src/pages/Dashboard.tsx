import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/ui/PageHeader'
import MetricCard from '../components/ui/MetricCard'
import StatusPill from '../components/ui/StatusPill'
import MonoEyebrow from '../components/ui/MonoEyebrow'
import { statusMap, humanize } from '../components/ui/statusMap'
import { ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const isUser = user?.role === 'user'

  const { data: masterData, isLoading: masterLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getMasterStats().then((r) => r.data.data),
  })
  const { data: reqStats, isLoading: reqLoading } = useQuery({
    queryKey: ['requisition-stats'],
    queryFn: () => dashboardApi.getRequisitionStats().then((r) => r.data.data),
  })
  const { data: quotStats, isLoading: quotLoading } = useQuery({
    queryKey: ['quotation-stats'],
    queryFn: () => dashboardApi.getQuotationStats().then((r) => r.data.data),
    enabled: !isUser,
  })

  if (masterLoading || reqLoading || (!isUser && quotLoading)) return <LoadingSpinner />

  const {
    orders,
    requisitions,
    enquiries,
    po_this_month,
    recent_orders = [],
    overdue_requisitions = [],
  } = masterData || {}
  const overdue = (reqStats?.overdue?.length ? reqStats.overdue : overdue_requisitions) as any[]
  const expiringOffers: any[] = quotStats?.expiring_offers || []
  const recentEnquiries: any[] = quotStats?.recent_enquiries || []

  return (
    <div>
      <PageHeader
        breadcrumb={['Ami Enterprises', 'Dashboard']}
        title="Operations · this week"
        subtitle="Live snapshot of sales, procurement, and enquiry pipelines."
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Link to="/orders" style={{ textDecoration: 'none' }}>
          <MetricCard
            label="Open orders"
            value={orders?.total_orders ?? 0}
            sub={
              <span className="flex gap-2 flex-wrap mt-1">
                {orders?.new_orders > 0 && <StatusPill kind="open" label={`${orders.new_orders} new`} />}
                {orders?.processing > 0 && <StatusPill kind="review" label={`${orders.processing} processing`} />}
                {orders?.dispatched > 0 && <StatusPill kind="confirmed" label={`${orders.dispatched} dispatched`} />}
              </span>
            }
          />
        </Link>
        <Link to="/requisitions" style={{ textDecoration: 'none' }}>
          <MetricCard
            label="Open requisitions"
            value={requisitions?.total ?? 0}
            sub={
              <span className="flex gap-2 flex-wrap mt-1">
                {requisitions?.pending > 0 && <StatusPill kind="draft" label={`${requisitions.pending} pending`} />}
                {requisitions?.po_raised > 0 && <StatusPill kind="hot" label={`${requisitions.po_raised} PO raised`} />}
                {requisitions?.critical > 0 && <StatusPill kind="overdue" label={`${requisitions.critical} critical`} />}
              </span>
            }
          />
        </Link>
        {!isUser && (
          <Link to="/quotations" style={{ textDecoration: 'none' }}>
            <MetricCard
              label="Open enquiries"
              value={enquiries?.total ?? 0}
              sub={
                <span className="flex gap-2 flex-wrap mt-1">
                  {enquiries?.new_enquiries > 0 && <StatusPill kind="hot" label={`${enquiries.new_enquiries} new`} />}
                  {enquiries?.offer_sent > 0 && <StatusPill kind="review" label={`${enquiries.offer_sent} offer sent`} />}
                </span>
              }
            />
          </Link>
        )}
        {!isUser && (
          <Link to="/purchase-orders" style={{ textDecoration: 'none' }}>
            <MetricCard label="POs this month" value={po_this_month ?? 0} sub="across plants" />
          </Link>
        )}
      </div>

      {/* Two-column: overdue + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <PanelCard
          title="Overdue indents"
          to="/requisitions"
          empty={overdue.length === 0}
          emptyLabel="No overdue requisitions"
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: '110px 1fr 90px 70px',
              padding: '10px 0',
              gap: 12,
              borderBottom: '1px solid var(--rule-lt)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--mute-lt)',
            }}
          >
            <span>Indent No.</span>
            <span>Area</span>
            <span>Priority</span>
            <span>Days due</span>
          </div>
          {overdue.slice(0, 5).map((r: any) => (
            <div
              key={r.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '110px 1fr 90px 70px',
                padding: '12px 0',
                gap: 12,
                borderBottom: '1px solid var(--rule-lt)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--color-warm-dk)',
                  fontWeight: 600,
                }}
              >
                {r.indent_no}
              </span>
              <span style={{ fontSize: 13 }}>{r.machine_area || '—'}</span>
              <StatusPill kind={statusMap.priority(r.priority)} label={r.priority} />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-danger)',
                }}
              >
                {r.days_overdue != null ? `${r.days_overdue}d` : '—'}
              </span>
            </div>
          ))}
        </PanelCard>

        <PanelCard
          title="Recent orders"
          to="/orders"
          empty={recent_orders.length === 0}
          emptyLabel="No orders yet"
        >
          {recent_orders.slice(0, 8).map((o: any) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="grid items-center"
              style={{
                gridTemplateColumns: '1fr 130px',
                padding: '11px 0',
                gap: 12,
                borderBottom: '1px solid var(--rule-lt)',
                textDecoration: 'none',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-warm-dk)',
                    fontWeight: 600,
                  }}
                >
                  {o.order_id}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mute-lt)', marginTop: 2 }}>
                  {o.client_name} · {o.order_date}
                </div>
              </div>
              <StatusPill kind={statusMap.order(o.status)} label={humanize(o.status)} />
            </Link>
          ))}
        </PanelCard>
      </div>

      {/* Expiring offers */}
      {!isUser && expiringOffers.length > 0 && (
        <section className="mb-6">
          <PanelCard title="Expiring offers · next 7 days" to="/quotations">
            <div
              className="grid"
              style={{
                gridTemplateColumns: '120px 1fr 110px 80px',
                padding: '10px 0',
                gap: 12,
                borderBottom: '1px solid var(--rule-lt)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: 'var(--mute-lt)',
              }}
            >
              <span>Offer No.</span>
              <span>Customer</span>
              <span>Valid until</span>
              <span>Days left</span>
            </div>
            {expiringOffers.map((o) => (
              <div
                key={o.id}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '120px 1fr 110px 80px',
                  padding: '11px 0',
                  gap: 12,
                  borderBottom: '1px solid var(--rule-lt)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-warm-dk)',
                    fontWeight: 600,
                  }}
                >
                  {o.offer_no}
                </span>
                <span style={{ fontSize: 13 }}>{o.customer_name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--mute-lt)' }}>
                  {o.validity_date}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 600,
                    color: o.days_left <= 2 ? 'var(--color-danger)' : 'var(--color-warm-dk)',
                  }}
                >
                  {o.days_left}d
                </span>
              </div>
            ))}
          </PanelCard>
        </section>
      )}

      {/* Recent enquiries */}
      {!isUser && recentEnquiries.length > 0 && (
        <section>
          <PanelCard title="Recent enquiries" to="/quotations">
            <div
              className="grid"
              style={{
                gridTemplateColumns: '130px 1fr 90px 110px',
                padding: '10px 0',
                gap: 12,
                borderBottom: '1px solid var(--rule-lt)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: 'var(--mute-lt)',
              }}
            >
              <span>Enquiry No.</span>
              <span>Customer</span>
              <span>Source</span>
              <span>Status</span>
            </div>
            {recentEnquiries.slice(0, 5).map((e) => (
              <div
                key={e.id}
                className="grid items-center"
                style={{
                  gridTemplateColumns: '130px 1fr 90px 110px',
                  padding: '11px 0',
                  gap: 12,
                  borderBottom: '1px solid var(--rule-lt)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--color-warm-dk)',
                    fontWeight: 600,
                  }}
                >
                  {e.enquiry_no}
                </span>
                <span style={{ fontSize: 13 }}>{e.customer_name}</span>
                <span
                  className="capitalize"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--mute-lt)' }}
                >
                  {e.source}
                </span>
                <StatusPill kind={statusMap.enquiry(e.status)} label={humanize(e.status)} />
              </div>
            ))}
          </PanelCard>
        </section>
      )}
    </div>
  )
}

function PanelCard({
  title,
  to,
  children,
  empty = false,
  emptyLabel,
}: {
  title: string
  to?: string
  children: React.ReactNode
  empty?: boolean
  emptyLabel?: string
}) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--rule-lt)',
        padding: 20,
      }}
    >
      <div className="flex items-end justify-between mb-2">
        <MonoEyebrow>{title}</MonoEyebrow>
        {to && (
          <Link
            to={to}
            className="inline-flex items-center gap-1"
            style={{ fontSize: 12, color: 'var(--color-warm-dk)', textDecoration: 'none' }}
          >
            View all <ArrowRight size={12} />
          </Link>
        )}
      </div>
      {empty ? (
        <p
          className="py-6 text-center"
          style={{ fontSize: 13, color: 'var(--mute-lt)' }}
        >
          {emptyLabel ?? 'No data'}
        </p>
      ) : (
        children
      )}
    </div>
  )
}
