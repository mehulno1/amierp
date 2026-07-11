import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportShell, { KpiStrip } from './_shared/ReportShell'
import SortableTable, { type Column } from './_shared/SortableTable'
import { exportSheet } from './_shared/exportSheet'
import { num } from './_shared/chartTheme'
import { fmtDate } from '../../utils/formatDate'

export default function ExpiringOffers() {
  const { data, isLoading } = useQuery({
    queryKey: ['report', 'expiring-offers'],
    queryFn: () => reportsApi.expiringOffers({ days: 30 }).then(r => r.data.data),
  })
  const rows: any[] = data?.rows || []
  const totals = data?.totals || {}

  const columns: Column<any>[] = [
    { key: 'offer_no', label: 'Offer' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'contact_person', label: 'Contact', render: r => r.contact_person || '—' },
    { key: 'mobile', label: 'Mobile', render: r => r.mobile || '—' },
    { key: 'offer_date', label: 'Sent', render: r => fmtDate(r.offer_date) },
    { key: 'validity_date', label: 'Valid till', render: r => fmtDate(r.validity_date) },
    { key: 'days_left', label: 'Days left', align: 'right', render: r => (
      <span className={Number(r.days_left) < 0 ? 'text-red-600' : Number(r.days_left) <= 3 ? 'text-orange-600' : ''}>
        {Number(r.days_left) < 0 ? `${Math.abs(r.days_left)} overdue` : r.days_left}
      </span>
    ) },
  ]

  const onExport = () => exportSheet('expiring_offers.xlsx', 'Offers', rows.map(r => ({
    Offer: r.offer_no, Customer: r.customer_name, Contact: r.contact_person, Mobile: r.mobile,
    Sent: fmtDate(r.offer_date), 'Valid Till': fmtDate(r.validity_date), 'Days Left': r.days_left,
  })))

  return (
    <ReportShell
      title="Expiring Offers"
      subtitle="Sent quotations expiring within 30 days — follow-ups due"
      onExport={onExport}
      loading={isLoading}
    >
      <KpiStrip items={[
        { label: 'Total', value: num(totals.total) },
        { label: 'Expiring Soon', value: num(totals.expiring_soon) },
        { label: 'Already Expired', value: num(totals.expired) },
      ]} />
      <SortableTable rows={rows} columns={columns} defaultSort="days_left" empty="No offers expiring soon" minWidth={780} />
    </ReportShell>
  )
}
