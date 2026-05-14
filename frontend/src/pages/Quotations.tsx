import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { enquiriesApi, offersApi } from '../services/api'
import { Plus, Eye, Download, Trash2 } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Enquiry, EnquiryStatus, Offer } from '../types'
import OfferDocument from '../components/OfferDocument'
import { useAuth } from '../hooks/useAuth'
import * as XLSX from 'xlsx'

const statusColors: Record<EnquiryStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  offer_sent: 'bg-yellow-100 text-yellow-700',
  negotiation: 'bg-orange-100 text-orange-700',
  order_received: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-700',
}

function CreateEnquiryModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { brands } = useAuth()
  const defaultBrandId = String(
    (brands.find((b: any) => b.name.toLowerCase().includes('ami enterprise')) || brands[0])?.id || ''
  )
  const { register, control, handleSubmit } = useForm({
    defaultValues: { brand_id: defaultBrandId, customer_name: '', contact_person: '', mobile: '', email: '', customer_city: '', source: 'phone', due_date: '', notes: '', items: [{ description: '', qty: 0, uom: 'mtr', notes: '' }] }
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
      enquiry_id: enquiry.id, offer_date: new Date().toISOString().split('T')[0], validity_date: '', notes: '',
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Enquiries & Quotations</h1>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn-secondary text-sm flex items-center justify-center gap-1 flex-1 sm:flex-initial"><Download size={14} />Export</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"><Plus size={16} />New Enquiry</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'new', 'offer_sent', 'negotiation', 'order_received', 'lost'].map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors whitespace-nowrap shrink-0 ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading ? <LoadingSpinner /> : (
          <div className="space-y-3">
            {enquiries.map((e: Enquiry) => (
              <div key={e.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{e.customer_name}</span>
                      <span className="text-xs text-gray-500">{e.enquiry_no}</span>
                      <span className={`badge-status ${statusColors[e.status]}`}>{e.status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-sm text-gray-500">{e.contact_person && `${e.contact_person} · `}{e.mobile}{e.customer_city && ` · ${e.customer_city}`}</div>
                    {e.items?.map((item, idx) => <div key={idx} className="text-xs text-gray-600 mt-1">• {item.description} {item.qty ? `(${item.qty} ${item.uom})` : ''}</div>)}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedEnquiry(e)} className="btn-secondary text-xs flex items-center gap-1"><Plus size={12} />Offer</button>
                      {isSuperAdmin() && <button onClick={() => deleteEnquiry(e.id, e.customer_name)} className="text-red-400 hover:text-red-600 p-1" title="Delete enquiry"><Trash2 size={14} /></button>}
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {['new','offer_sent','negotiation','order_received','lost'].filter(s => s !== e.status).map(s => (
                        <button key={s} onClick={() => updateStatus(e.id, s)} className="text-xs border border-gray-200 text-gray-500 px-2 py-0.5 rounded hover:bg-gray-50">{s.replace(/_/g, ' ')}</button>
                      ))}
                    </div>
                  </div>
                </div>
                {(e.offers || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {e.offers!.map((o: Offer) => (
                      <button key={o.id} onClick={() => setViewOffer(o.id)} className="flex items-center gap-1 text-xs border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50">
                        <Eye size={12} /> {o.offer_no} <span className="text-gray-400">({o.status})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {enquiries.length === 0 && <p className="text-center text-gray-400 py-8">No enquiries found</p>}
          </div>
        )}
      </div>

      {showCreate && <CreateEnquiryModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['enquiries'] }); toast.success('Enquiry saved') }} />}
      {selectedEnquiry && <CreateOfferModal enquiry={selectedEnquiry} onClose={() => setSelectedEnquiry(null)} onSuccess={() => { setSelectedEnquiry(null); qc.invalidateQueries({ queryKey: ['enquiries'] }); toast.success('Offer created') }} />}
      {viewOffer && <OfferDocument offerId={viewOffer} onClose={() => setViewOffer(null)} />}
    </div>
  )
}
