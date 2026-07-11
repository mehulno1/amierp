import { useState, useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { purchaseOrdersApi, vendorsApi } from '../services/api'
import { Plus, FileText, Download, Search, Edit2, Trash2, Trash, Truck, X } from 'lucide-react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { PurchaseOrder } from '../types'
import PODocument from '../components/PODocument'
import POReceipts from '../components/POReceipts'
import { useAuth } from '../hooks/useAuth'
import { useSortable } from '../hooks/useSortable'
import { SortIcon, thSort } from '../components/SortIcon'
import * as XLSX from 'xlsx'
import { fmtDate, toIsoDate } from '../utils/formatDate'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  partially_delivered: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

// Auto-computing item row. Watches qty + rate via react-hook-form and writes back the
// derived total whenever either changes, so the displayed total field always matches
// what's stored — and the PO summary at the bottom of the modal can sum without drift.
function POItemRow({ index, control, register, setValue, onRemove, canRemove }: {
  index: number
  control: any
  register: any
  setValue: any
  onRemove: () => void
  canRemove: boolean
}) {
  const qty = useWatch({ control, name: `items.${index}.qty` })
  const rate = useWatch({ control, name: `items.${index}.rate` })

  useEffect(() => {
    const q = parseFloat(qty) || 0
    const r = parseFloat(rate) || 0
    setValue(`items.${index}.total`, parseFloat((q * r).toFixed(2)))
  }, [qty, rate, index, setValue])

  return (
    <div className="grid grid-cols-7 gap-3 mb-3 items-end">
      <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Description *</label><input className="input-field" {...register(`items.${index}.description`, { required: true })} /></div>
      <div><label className="block text-xs font-medium text-gray-600 mb-1">Mat. No.</label><input className="input-field" {...register(`items.${index}.material_no`)} /></div>
      <div><label className="block text-xs font-medium text-gray-600 mb-1">Qty</label><input type="number" step="0.001" className="input-field" {...register(`items.${index}.qty`)} /></div>
      <div><label className="block text-xs font-medium text-gray-600 mb-1">UOM</label>
        <select className="input-field" {...register(`items.${index}.uom`)}>
          <option value="nos">Nos</option><option value="pcs">Pcs</option><option value="kgs">Kgs</option><option value="mtr">Mtr</option><option value="ltr">Ltr</option><option value="set">Set</option>
        </select>
      </div>
      <div><label className="block text-xs font-medium text-gray-600 mb-1">Rate (₹)</label><input type="number" step="0.01" className="input-field" {...register(`items.${index}.rate`)} /></div>
      <div className="flex items-end gap-2">
        <div className="flex-1"><label className="block text-xs font-medium text-gray-600 mb-1">Total (₹)</label>
          <input type="number" readOnly className="input-field bg-gray-50" {...register(`items.${index}.total`)} />
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 pb-2" title="Remove">
            <Trash size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

function POFormModal({ po, onClose, onSuccess }: { po?: any; onClose: () => void; onSuccess: () => void }) {
  const fromRequisition = po?._fromRequisition
  const isEdit = !!po && !fromRequisition
  const [loading, setLoading] = useState(false)
  const { brands } = useAuth()
  const defaultBrandId = isEdit
    ? String(po.brand_id)
    : (brands.length === 1 ? String(brands[0].id) : '')
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: () => vendorsApi.list().then(r => r.data.data) })

  const prefillItems = fromRequisition && po.items?.length
    ? po.items.map((i: any) => ({
        material_no: i.material_no || '',
        description: i.description || '',
        qty: i.qty || 0,
        uom: i.uom || 'nos',
        rate: i.rate || 0,
        total: i.total || 0,
      }))
    : null

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: isEdit ? {
      brand_id: defaultBrandId,
      vendor_id: String(po.vendor_id || ''),
      po_date: toIsoDate(po.po_date),
      quotation_no: po.quotation_no || '',
      quotation_date: toIsoDate(po.quotation_date),
      gst_percent: po.gst_percent ?? 18,
      terms_gst: po.terms_gst || 'Extra @ 18% (IGST)',
      terms_delivery: po.terms_delivery || 'Immediate',
      terms_supply_basis: po.terms_supply_basis || 'By Courier',
      terms_payment: po.terms_payment || 'Within 30 days from receipt of materials',
      terms_delivery_instructions: po.terms_delivery_instructions || '',
      notes: po.notes || '',
      items: (po.items || []).map((i: any) => ({
        material_no: i.material_no || '',
        description: i.description || '',
        qty: i.qty,
        uom: i.uom || 'nos',
        rate: i.rate,
        total: i.total,
      })),
    } : {
      brand_id: defaultBrandId,
      vendor_id: fromRequisition ? String(po.vendor_id || '') : '',
      po_date: new Date().toISOString().split('T')[0],
      quotation_no: '', quotation_date: '',
      gst_percent: 18, terms_gst: 'Extra @ 18% (IGST)', terms_delivery: 'Immediate',
      terms_supply_basis: 'By Courier', terms_payment: 'Within 30 days from receipt of materials',
      terms_delivery_instructions: '', notes: '',
      items: prefillItems || [{ material_no: '', description: '', qty: 1, uom: 'nos', rate: 0, total: 0 }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const selectedBrandId = parseInt(watch('brand_id') || '0')
  const filteredVendors = selectedBrandId ? (vendors as any[]).filter((v: any) => v.brand_id === selectedBrandId) : vendors

  // Grand total — derived in real time from all item totals plus GST. Watching the whole
  // items array is cheap here because the table is small and the alternative (subscribing
  // per field individually outside the row component) would duplicate the row's own
  // useWatch wiring.
  const items = useWatch({ control, name: 'items' }) || []
  const gstPercent = parseFloat(watch('gst_percent') as any) || 0
  const basic = items.reduce((s: number, it: any) => s + (parseFloat(it?.total) || 0), 0)
  const gst = (basic * gstPercent) / 100
  const grand = basic + gst
  const fmtMoney = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const items = data.items.map((i: any) => {
        const qty = parseFloat(i.qty) || 0
        const rate = parseFloat(i.rate) || 0
        return { ...i, qty, rate, total: parseFloat((qty * rate).toFixed(2)) }
      })
      const payload = { ...data, brand_id: parseInt(data.brand_id), vendor_id: parseInt(data.vendor_id), items }
      if (isEdit) await purchaseOrdersApi.update(po.id, payload)
      else await purchaseOrdersApi.create(payload)
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{isEdit ? `Edit ${po.po_no}` : 'New Purchase Order'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {brands.length > 1 && (
              <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <select className="input-field" {...register('brand_id', { required: true })} disabled={isEdit}>
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
              <POItemRow
                key={field.id}
                index={idx}
                control={control}
                register={register}
                setValue={setValue}
                onRemove={() => remove(idx)}
                canRemove={fields.length > 1}
              />
            ))}
            <div className="flex justify-end mt-2">
              <div className="text-sm w-72 border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between"><span className="text-gray-600">Basic total</span><span className="font-medium">₹ {fmtMoney(basic)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">GST @ {gstPercent || 0}%</span><span>₹ {fmtMoney(gst)}</span></div>
                <div className="flex justify-between border-t border-gray-300 mt-1 pt-1 font-semibold"><span>Grand total</span><span>₹ {fmtMoney(grand)}</span></div>
              </div>
            </div>
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
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create PO')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Goods-receipt (GRN) drawer for a PO. Loads the full PO (line items carry received_qty)
// then hands it to POReceipts, which owns the receipt history + record form.
function POReceiptsModal({ poId, onClose }: { poId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: () => purchaseOrdersApi.get(poId).then(r => r.data.data),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">Goods Receipts — {po?.po_no || `PO #${poId}`}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">
          {isLoading || !po ? <LoadingSpinner /> : (
            <POReceipts po={po} onChanged={() => qc.invalidateQueries({ queryKey: ['purchase-orders'] })} />
          )}
        </div>
      </div>
    </div>
  )
}

// "Received X/Y" balance badge for the PO list, guarding null totals.
function ReceivedBadge({ po }: { po: any }) {
  const ordered = po.ordered_qty
  const received = po.received_qty_total
  if (ordered == null || Number(ordered) === 0) return <span className="text-gray-400">—</span>
  const r = Number(received) || 0
  const o = Number(ordered)
  const done = r >= o
  return (
    <span className={`badge-status ${done ? 'bg-green-100 text-green-700' : r > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
      {r}/{o}
    </span>
  )
}

export default function PurchaseOrders() {
  const qc = useQueryClient()
  const location = useLocation()
  const { brands, isAdmin } = useAuth()
  const showCompany = brands.length > 1
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [formModal, setFormModal] = useState<{ open: boolean; po?: any }>({ open: false })
  const [viewPO, setViewPO] = useState<number | null>(null)
  const [receiptsPO, setReceiptsPO] = useState<number | null>(null)
  const [editLoadingId, setEditLoadingId] = useState<number | null>(null)

  useEffect(() => {
    const state = location.state as any
    if (state?.fromRequisition) {
      setFormModal({
        open: true,
        po: {
          _fromRequisition: true,
          vendor_id: state.vendor_id || '',
          requisition_id: state.requisition_id || null,
          items: state.items || [],
        },
      })
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const openEdit = async (id: number) => {
    setEditLoadingId(id)
    try {
      const full = await purchaseOrdersApi.get(id).then(r => r.data.data)
      setFormModal({ open: true, po: full })
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to load PO') }
    finally { setEditLoadingId(null) }
  }

  const deletePO = async (p: any) => {
    if (!window.confirm(`Permanently delete ${p.po_no}? This removes the PO and all line items.`)) return
    try {
      await purchaseOrdersApi.delete(p.id)
      qc.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('PO deleted')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

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
          <button onClick={() => setFormModal({ open: true })} className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"><Plus size={16} />New PO</button>
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
              <th className="pb-3 text-gray-500 font-medium">Received</th>
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
                  <td className="py-3"><ReceivedBadge po={p} /></td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewPO(p.id)} className="text-blue-500 hover:text-blue-700" title="View / print"><FileText size={15} /></button>
                      <button onClick={() => setReceiptsPO(p.id)} className="text-emerald-600 hover:text-emerald-800" title="Goods receipts"><Truck size={15} /></button>
                      {isAdmin() && (
                        <>
                          <button onClick={() => openEdit(p.id)} disabled={editLoadingId === p.id} className="text-gray-500 hover:text-gray-800" title="Edit"><Edit2 size={14} /></button>
                          <button onClick={() => deletePO(p)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={showCompany ? 8 : 7} className="py-8 text-center text-gray-400">{search ? 'No results found' : 'No purchase orders'}</td></tr>}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {formModal.open && (
        <POFormModal
          po={formModal.po}
          onClose={() => setFormModal({ open: false })}
          onSuccess={() => {
            const wasEdit = !!formModal.po
            setFormModal({ open: false })
            qc.invalidateQueries({ queryKey: ['purchase-orders'] })
            toast.success(wasEdit ? 'PO updated' : 'PO created')
          }}
        />
      )}
      {viewPO && <PODocument poId={viewPO} onClose={() => setViewPO(null)} />}
      {receiptsPO && <POReceiptsModal poId={receiptsPO} onClose={() => setReceiptsPO(null)} />}
    </div>
  )
}
