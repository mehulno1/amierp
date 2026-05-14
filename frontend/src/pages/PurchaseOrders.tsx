import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { purchaseOrdersApi, vendorsApi } from '../services/api'
import { Plus, FileText, Download, Search } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { PurchaseOrder } from '../types'
import PODocument from '../components/PODocument'
import { useAuth } from '../hooks/useAuth'
import { useSortable } from '../hooks/useSortable'
import { SortIcon, thSort } from '../components/SortIcon'
import * as XLSX from 'xlsx'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const part = d.split('T')[0]
  const [y, m, day] = part.split('-')
  return `${day}/${m}/${y}`
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  partially_delivered: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function CreatePOModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { brands } = useAuth()
  const defaultBrandId = brands.length === 1 ? String(brands[0].id) : ''
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: () => vendorsApi.list().then(r => r.data.data) })
  const { register, control, handleSubmit, watch } = useForm({
    defaultValues: {
      brand_id: defaultBrandId, vendor_id: '', po_date: new Date().toISOString().split('T')[0], quotation_no: '', quotation_date: '',
      gst_percent: 18, terms_gst: 'Extra @ 18% (IGST)', terms_delivery: 'Immediate',
      terms_supply_basis: 'By Courier', terms_payment: 'Within 30 days from receipt of materials',
      terms_delivery_instructions: '', notes: '',
      items: [{ material_no: '', description: '', qty: 1, uom: 'nos', rate: 0, total: 0 }]
    }
  })
  const { fields, append } = useFieldArray({ control, name: 'items' })
  const selectedBrandId = parseInt(watch('brand_id') || '0')
  const filteredVendors = selectedBrandId ? (vendors as any[]).filter((v: any) => v.brand_id === selectedBrandId) : vendors

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const items = data.items.map((i: any) => ({ ...i, qty: parseFloat(i.qty), rate: parseFloat(i.rate), total: parseFloat(i.total) }))
      await purchaseOrdersApi.create({ ...data, brand_id: parseInt(data.brand_id), vendor_id: parseInt(data.vendor_id), items })
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">New Purchase Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {brands.length > 1 && (
              <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <select className="input-field" {...register('brand_id', { required: true })}>
                  <option value="">Select company</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
              <select className="input-field" {...register('vendor_id', { required: true })}>
                <option value="">Select vendor</option>
                {(filteredVendors as any[]).map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">PO Date *</label><input type="date" className="input-field" {...register('po_date', { required: true })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Quotation No.</label><input className="input-field" placeholder="Verbal / quote ref" {...register('quotation_no')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Quotation Date</label><input type="date" className="input-field" {...register('quotation_date')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">GST %</label><input type="number" step="0.01" className="input-field" {...register('gst_percent')} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Items</h3>
              <button type="button" onClick={() => append({ material_no: '', description: '', qty: 1, uom: 'nos', rate: 0, total: 0 })} className="btn-secondary py-1 text-xs flex items-center gap-1"><Plus size={12} />Add Row</button>
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-6 gap-3 mb-3 items-end">
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Description *</label><input className="input-field" {...register(`items.${idx}.description`, { required: true })} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Qty</label><input type="number" step="0.001" className="input-field" {...register(`items.${idx}.qty`)} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">UOM</label>
                  <select className="input-field" {...register(`items.${idx}.uom`)}>
                    <option value="nos">Nos</option><option value="pcs">Pcs</option><option value="kgs">Kgs</option><option value="mtr">Mtr</option><option value="set">Set</option>
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Rate (₹)</label><input type="number" step="0.01" className="input-field" {...register(`items.${idx}.rate`)} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Total (₹)</label><input type="number" step="0.01" className="input-field" {...register(`items.${idx}.total`)} /></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Terms — GST</label><input className="input-field" {...register('terms_gst')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Terms — Delivery</label><input className="input-field" {...register('terms_delivery')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Instructions</label><input className="input-field" {...register('terms_delivery_instructions')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Supply Basis</label><input className="input-field" {...register('terms_supply_basis')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label><input className="input-field" {...register('terms_payment')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><input className="input-field" {...register('notes')} /></div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create PO'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PurchaseOrders() {
  const qc = useQueryClient()
  const { brands } = useAuth()
  const showCompany = brands.length > 1
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [viewPO, setViewPO] = useState<number | null>(null)

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ['purchase-orders', status],
    queryFn: () => purchaseOrdersApi.list({ status }).then(r => r.data.data),
  })

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return (pos as any[]).filter((p: any) =>
      !s || p.po_no.toLowerCase().includes(s) || (p.vendor_name || '').toLowerCase().includes(s)
    )
  }, [pos, search])

  const { sorted, sortCol, sortDir, toggle } = useSortable(filtered, 'po_date', 'desc')
  const si = (col: string) => <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(pos.map((p: PurchaseOrder) => ({ 'PO No': p.po_no, 'Vendor': p.vendor_name, 'Date': p.po_date, 'Quotation No': p.quotation_no || '', 'Status': p.status, 'GST%': p.gst_percent })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'PurchaseOrders'); XLSX.writeFile(wb, 'purchase_orders.xlsx')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn-secondary text-sm flex items-center justify-center gap-1 flex-1 sm:flex-initial"><Download size={14} />Export</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"><Plus size={16} />New PO</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'draft', 'confirmed', 'partially_delivered', 'delivered'].map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors whitespace-nowrap shrink-0 ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search PO no, vendor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="text-left border-b border-gray-100">
              <th className={thSort} onClick={() => toggle('po_no')}>PO No. {si('po_no')}</th>
              {showCompany && <th className="pb-3 text-gray-500 font-medium">Company</th>}
              <th className={thSort} onClick={() => toggle('vendor_name')}>Vendor {si('vendor_name')}</th>
              <th className={thSort} onClick={() => toggle('po_date')}>Date {si('po_date')}</th>
              <th className={thSort} onClick={() => toggle('quotation_no')}>Quotation Ref {si('quotation_no')}</th>
              <th className={thSort} onClick={() => toggle('status')}>Status {si('status')}</th>
              <th className="pb-3 text-gray-500 font-medium">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-blue-600 cursor-pointer" onClick={() => setViewPO(p.id)}>{p.po_no}</td>
                  {showCompany && <td className="py-3"><span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{p.brand_name}</span></td>}
                  <td className="py-3 text-gray-900">{p.vendor_name}</td>
                  <td className="py-3 text-gray-500">{fmtDate(p.po_date)}</td>
                  <td className="py-3 text-gray-500">{p.quotation_no || '—'}</td>
                  <td className="py-3"><span className={`badge-status ${statusColors[p.status]}`}>{p.status.replace(/_/g, ' ')}</span></td>
                  <td className="py-3"><button onClick={() => setViewPO(p.id)} className="text-blue-500 hover:text-blue-700"><FileText size={15} /></button></td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={showCompany ? 7 : 6} className="py-8 text-center text-gray-400">{search ? 'No results found' : 'No purchase orders'}</td></tr>}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showCreate && <CreatePOModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); toast.success('PO created') }} />}
      {viewPO && <PODocument poId={viewPO} onClose={() => setViewPO(null)} />}
    </div>
  )
}
