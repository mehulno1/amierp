import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { enquiriesApi, offersApi } from '../services/api'
import { Plus, Eye, Download, Trash2 } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Enquiry, Offer } from '../types'
import OfferDocument from '../components/OfferDocument'
import { useAuth } from '../hooks/useAuth'
import * as XLSX from 'xlsx'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import StatusPill from '../components/ui/StatusPill'
import MonoEyebrow from '../components/ui/MonoEyebrow'
import { statusMap, humanize } from '../components/ui/statusMap'

const ENQ_TABS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'offer_sent', label: 'Offer sent' },
  { value: 'negotiation', label: 'Negotiating' },
  { value: 'order_received', label: 'Won' },
  { value: 'lost', label: 'Lost' },
]

function CreateEnquiryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { brands } = useAuth()
  const defaultBrandId = String(
    (brands.find((b: any) => b.name.toLowerCase().includes('ami enterprise')) || brands[0])?.id || ''
  )
  const { register, control, handleSubmit } = useForm({
    defaultValues: { brand_id: defaultBrandId, customer_name: '', contact_person: '', customer_address: '', mobile: '', email: '', customer_city: '', source: 'phone', due_date: '', notes: '', items: [{ description: '', qty: 0, uom: 'mtr', notes: '' }] }
  })
  const { fields, append } = useFieldArray({ control, name: 'items' })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try { await enquiriesApi.create({ ...data, brand_id: parseInt(data.brand_id) }); onSuccess() }
    catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">New Enquiry</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {brands.length > 1 && (
              <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <select className="input-field" {...register('brand_id', { required: true })}>
                  <option value="">Select company</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label><input className="input-field" {...register('customer_name', { required: true })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label><input className="input-field" {...register('contact_person')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label><input className="input-field" {...register('mobile')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className="input-field" {...register('email')} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea rows={2} className="input-field" {...register('customer_address')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input className="input-field" {...register('customer_city')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select className="input-field" {...register('source')}>
                <option value="phone">Phone</option><option value="email">Email</option><option value="referral">Referral</option><option value="walk_in">Walk-in</option><option value="website">Website</option><option value="other">Other</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" className="input-field" {...register('due_date')} /></div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 text-sm">Items Enquired</h3>
              <button type="button" onClick={() => append({ description: '', qty: 0, uom: 'mtr', notes: '' })} className="btn-secondary py-0.5 text-xs flex items-center gap-1"><Plus size={12} />Add</button>
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-4 gap-3 mb-3">
                <div className="col-span-2"><input className="input-field" placeholder="Description" {...register(`items.${idx}.description`, { required: true })} /></div>
                <div><input type="number" step="0.001" className="input-field" placeholder="Qty" {...register(`items.${idx}.qty`)} /></div>
                <div><select className="input-field" {...register(`items.${idx}.uom`)}>
                  <option value="mtr">Mtr</option><option value="pcs">Pcs</option><option value="kgs">Kgs</option><option value="mt">MT</option><option value="nos">Nos</option>
                </select></div>
              </div>
            ))}
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea className="input-field" rows={2} {...register('notes')} /></div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Enquiry'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateOfferModal({ enquiry, onClose, onSuccess }: { enquiry: Enquiry; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      enquiry_id: enquiry.id, enquiry_no: enquiry.enquiry_no || '', offer_date: new Date().toISOString().split('T')[0], validity_date: '', notes: '',
      terms_gst: 'Extra @ 18% (IGST)', terms_price_validity: `For placement of P.O. by ${new Date(Date.now() + 7*86400000).toLocaleDateString('en-IN')}`,
      terms_delivery: 'Ready stock subject to prior sale', terms_supply_basis: 'FOR your works for total quantity in a single lot',
      terms_weight_tolerance: 'Weighbridge variation tolerance of 0.5 % to be allowed',
      terms_force_majure: 'We shall not be liable for any penal clause for non-delivery attribute to reasons beyond our control',
      terms_payment: 'Against PI prior to despatch',
      items: (enquiry.items || []).map(i => ({ material_no: '', description: i.description, qty: i.qty || 0, uom: i.uom || 'mtr', rate: 0, remarks: '' }))
    }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const items = data.items.map((i: any) => ({ ...i, qty: parseFloat(i.qty), rate: parseFloat(i.rate) }))
      await offersApi.create({ ...data, items })
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div><h2 className="text-lg font-semibold">Create Offer / Quotation</h2><p className="text-sm text-gray-500">for {enquiry.customer_name}</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Offer Date</label><input type="date" className="input-field" {...register('offer_date')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Validity Date</label><input type="date" className="input-field" {...register('validity_date')} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Enquiry No.</label><input className="input-field" placeholder="Enquiry / customer ref" {...register('enquiry_no')} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Items</h3>
              <button type="button" onClick={() => append({ material_no: '', description: '', qty: 0, uom: 'mtr', rate: 0, remarks: '' })} className="btn-secondary py-1 text-xs flex items-center gap-1"><Plus size={12} />Add Row</button>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500 text-xs border-b border-gray-100">
                <th className="pb-2">Mat. No.</th><th className="pb-2">Description</th><th className="pb-2">Qty</th><th className="pb-2">UOM</th><th className="pb-2">Rate (₹)</th><th className="pb-2">Remarks</th><th></th>
              </tr></thead>
              <tbody>
                {fields.map((field, idx) => (
                  <tr key={field.id}>
                    <td className="py-1 pr-2"><input className="input-field text-xs" {...register(`items.${idx}.material_no`)} /></td>
                    <td className="py-1 pr-2"><input className="input-field text-xs" {...register(`items.${idx}.description`, { required: true })} /></td>
                    <td className="py-1 pr-2 w-20"><input type="number" step="0.001" className="input-field text-xs" {...register(`items.${idx}.qty`)} /></td>
                    <td className="py-1 pr-2 w-20"><select className="input-field text-xs" {...register(`items.${idx}.uom`)}><option value="mtr">Mtr</option><option value="mt">MTs</option><option value="kgs">Kgs</option><option value="pcs">Pcs</option><option value="nos">Nos</option></select></td>
                    <td className="py-1 pr-2 w-24"><input type="number" step="0.01" className="input-field text-xs" {...register(`items.${idx}.rate`)} /></td>
                    <td className="py-1 pr-2"><input className="input-field text-xs" {...register(`items.${idx}.remarks`)} /></td>
                    <td><button type="button" onClick={() => remove(idx)} className="text-red-400 text-xs">✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><label className="block font-medium text-gray-700 mb-1">GST Terms</label><input className="input-field" {...register('terms_gst')} /></div>
            <div><label className="block font-medium text-gray-700 mb-1">Price Validity</label><input className="input-field" {...register('terms_price_validity')} /></div>
            <div><label className="block font-medium text-gray-700 mb-1">Delivery</label><input className="input-field" {...register('terms_delivery')} /></div>
            <div><label className="block font-medium text-gray-700 mb-1">Supply Basis</label><input className="input-field" {...register('terms_supply_basis')} /></div>
            <div><label className="block font-medium text-gray-700 mb-1">Weight Tolerance</label><input className="input-field" {...register('terms_weight_tolerance')} /></div>
            <div><label className="block font-medium text-gray-700 mb-1">Payment</label><input className="input-field" {...register('terms_payment')} /></div>
            <div className="col-span-2"><label className="block font-medium text-gray-700 mb-1">Force Majure</label><input className="input-field" {...register('terms_force_majure')} /></div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Create Offer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Quotations() {
  const qc = useQueryClient()
  const { isSuperAdmin } = useAuth()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
  const [viewOffer, setViewOffer] = useState<number | null>(null)

  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ['enquiries', status],
    queryFn: () => enquiriesApi.list({ status }).then(r => r.data.data),
  })

  const updateStatus = async (id: number, s: string) => {
    await enquiriesApi.updateStatus(id, { status: s })
    qc.invalidateQueries({ queryKey: ['enquiries'] })
    toast.success('Status updated')
  }

  const updateOfferStatus = async (offerId: number, s: string) => {
    try {
      await offersApi.updateStatus(offerId, { status: s })
      qc.invalidateQueries({ queryKey: ['enquiries'] })
      toast.success('Offer status updated')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const deleteEnquiry = async (id: number, customer: string) => {
    if (!window.confirm(`Delete enquiry for ${customer}? This will also delete all associated offers.`)) return
    try {
      await enquiriesApi.delete(id)
      qc.invalidateQueries({ queryKey: ['enquiries'] })
      toast.success('Enquiry deleted')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(enquiries.map((e: Enquiry) => ({
      'Enquiry No': e.enquiry_no, 'Customer': e.customer_name, 'Contact': e.contact_person,
      'Mobile': e.mobile, 'City': e.customer_city, 'Source': e.source, 'Status': e.status,
      'Due Date': e.due_date || '', 'Date': e.created_at?.split('T')[0],
    })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Enquiries'); XLSX.writeFile(wb, 'enquiries.xlsx')
  }


  return (
    <div>
      <PageHeader
        breadcrumb={['Ami Enterprises', 'Sales & Quotations']}
        title="Enquiries"
        actions={
          <>
            <Button variant="secondary" leadingIcon={<Download size={14} />} onClick={exportExcel}>
              Export
            </Button>
            <Button variant="primary" leadingIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              New enquiry
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <div
        className="flex gap-0 mb-5 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--rule-lt)' }}
      >
        {ENQ_TABS.map((t) => {
          const active = status === t.value
          const count = t.value
            ? enquiries.filter((e: Enquiry) => e.status === t.value).length
            : enquiries.length
          return (
            <button
              key={t.value || 'all'}
              onClick={() => setStatus(t.value)}
              className="inline-flex items-center gap-2 whitespace-nowrap"
              style={{
                padding: '12px 18px',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                color: active ? 'var(--color-ink)' : 'var(--mute-lt)',
                borderBottom: `2px solid ${active ? 'var(--color-warm)' : 'transparent'}`,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {t.label}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--mute-lt)',
                  letterSpacing: '.05em',
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      <div style={{ background: '#fff', border: '1px solid var(--rule-lt)' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : enquiries.length === 0 ? (
          <p className="py-12 text-center" style={{ fontSize: 13, color: 'var(--mute-lt)' }}>
            No enquiries found
          </p>
        ) : (
          enquiries.map((e: Enquiry, i: number) => (
            <div
              key={e.id}
              style={{
                padding: '18px 20px',
                borderTop: i > 0 ? '1px solid var(--rule-lt)' : 'none',
              }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
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
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 16,
                        fontWeight: 500,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {e.customer_name}
                    </span>
                    <StatusPill kind={statusMap.enquiry(e.status)} label={humanize(e.status)} />
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--mute-lt)',
                      letterSpacing: '.02em',
                    }}
                  >
                    {e.contact_person && `${e.contact_person} · `}
                    {e.mobile}
                    {e.customer_city && ` · ${e.customer_city}`}
                  </div>
                  {(e.items || []).slice(0, 3).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: 13,
                        color: 'var(--color-ink)',
                        marginTop: 6,
                      }}
                    >
                      · {item.description}
                      {item.qty ? (
                        <span style={{ color: 'var(--mute-lt)' }}>
                          {' '}
                          ({item.qty} {item.uom})
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      leadingIcon={<Plus size={12} />}
                      onClick={() => setSelectedEnquiry(e)}
                    >
                      Offer
                    </Button>
                    {isSuperAdmin() && (
                      <button
                        onClick={() => deleteEnquiry(e.id, e.customer_name)}
                        className="p-1.5"
                        style={{ color: 'var(--mute-lt)' }}
                        title="Delete enquiry"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {['new', 'offer_sent', 'negotiation', 'order_received', 'lost']
                      .filter((s) => s !== e.status)
                      .map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(e.id, s)}
                          className="uppercase"
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            letterSpacing: '.12em',
                            padding: '4px 8px',
                            color: 'var(--mute-lt)',
                            background: 'transparent',
                            border: '1px solid var(--rule-lt-md)',
                          }}
                        >
                          {humanize(s)}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {(e.offers || []).length > 0 && (
                <div className="mt-4 space-y-2">
                  <MonoEyebrow tone="mute">Offers ({e.offers!.length})</MonoEyebrow>
                  {e.offers!.map((o: Offer) => (
                    <div key={o.id} className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setViewOffer(o.id)}
                        className="inline-flex items-center gap-1.5"
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(217,114,71,.08)',
                          color: 'var(--color-warm-dk)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '.08em',
                        }}
                      >
                        <Eye size={12} /> {o.offer_no}
                      </button>
                      <StatusPill kind={statusMap.offer(o.status)} label={humanize(o.status)} />
                      <div className="flex flex-wrap gap-1">
                        {['draft', 'sent', 'accepted', 'rejected', 'revised']
                          .filter((s) => s !== o.status)
                          .map((s) => (
                            <button
                              key={s}
                              onClick={() => updateOfferStatus(o.id, s)}
                              className="uppercase"
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                letterSpacing: '.12em',
                                padding: '3px 7px',
                                color: 'var(--mute-lt)',
                                background: 'transparent',
                                border: '1px solid var(--rule-lt-md)',
                              }}
                              title={`Mark as ${humanize(s)}`}
                            >
                              {humanize(s)}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <CreateEnquiryModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            qc.invalidateQueries({ queryKey: ['enquiries'] })
            toast.success('Enquiry saved')
          }}
        />
      )}
      {selectedEnquiry && (
        <CreateOfferModal
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          onSuccess={() => {
            setSelectedEnquiry(null)
            qc.invalidateQueries({ queryKey: ['enquiries'] })
            toast.success('Offer created')
          }}
        />
      )}
      {viewOffer && <OfferDocument offerId={viewOffer} onClose={() => setViewOffer(null)} />}
    </div>
  )
}
