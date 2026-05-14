import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { requisitionsApi, vendorsApi } from '../services/api'
import { Plus, Eye, Download, Trash2, Pencil, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { RequisitionStatus, RequisitionPriority } from '../types'
import * as XLSX from 'xlsx'

const statusColors: Record<RequisitionStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  quotation_pending: 'bg-yellow-100 text-yellow-700',
  quotation_received: 'bg-blue-100 text-blue-700',
  po_raised: 'bg-purple-100 text-purple-700',
  partially_delivered: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const priorityColors: Record<RequisitionPriority, string> = {
  critical: 'bg-red-100 text-red-700',
  urgent: 'bg-orange-100 text-orange-700',
  normal: 'bg-gray-100 text-gray-700',
}

function CreateRequisitionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { brands } = useAuth()
  const defaultBrandId = String(
    (brands.find((b: any) => b.name.toLowerCase().includes('ami enterprise')) || brands[0])?.id || ''
  )
  const { register, control, handleSubmit } = useForm({
    defaultValues: { brand_id: defaultBrandId, machine_area: '', priority: 'normal', reminder_date: '', notes: '', items: [{ description: '', area: '', qty: 1, uom: 'nos', no_of_days: 7 }] }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await requisitionsApi.create({ ...data, brand_id: parseInt(data.brand_id) })
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">New Requisition / Indent</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {brands.length > 1 && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <select className="input-field" {...register('brand_id', { required: true })}>
                  <option value="">Select company</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Machine / Area</label><input className="input-field" placeholder="e.g. 250 KW Heat Exchanger" {...register('machine_area')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input-field" {...register('priority')}>
                <option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critical">Critical</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reminder Date</label><input type="date" className="input-field" {...register('reminder_date')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><input className="input-field" {...register('notes')} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Items Required</h3>
              <button type="button" onClick={() => append({ description: '', area: '', qty: 1, uom: 'nos', no_of_days: 7 })} className="btn-secondary py-1 text-xs flex items-center gap-1"><Plus size={12} />Add Item</button>
            </div>
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Description (make, model, size) *</label><input className="input-field" {...register(`items.${idx}.description`, { required: true })} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Area / Machine</label><input className="input-field" {...register(`items.${idx}.area`)} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Urgency (days)</label><input type="number" min="1" className="input-field" {...register(`items.${idx}.no_of_days`)} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Qty *</label><input type="number" step="0.001" min="0" className="input-field" {...register(`items.${idx}.qty`, { required: true })} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">UOM</label>
                      <select className="input-field" {...register(`items.${idx}.uom`)}>
                        <option value="nos">Nos</option><option value="pcs">Pcs</option><option value="kgs">Kgs</option><option value="mtr">Mtr</option><option value="set">Set</option>
                      </select>
                    </div>
                    {fields.length > 1 && <div className="flex items-end"><button type="button" onClick={() => remove(idx)} className="text-red-500 text-xs hover:text-red-700 mb-1">Remove</button></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Submitting...' : 'Submit Requisition'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ViewRequisitionModal({ requisitionId, onClose }: { requisitionId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const { isRequisitionAdmin, isSuperAdmin } = useAuth()
  const [showAddQuote, setShowAddQuote] = useState(false)
  const [editingItems, setEditingItems] = useState(false)
  const [editRows, setEditRows] = useState<any[]>([])
  const [savingItems, setSavingItems] = useState(false)
  const { data: vendors = [] } = useQuery({ queryKey: ['vendors'], queryFn: () => vendorsApi.list().then(r => r.data.data) })
  const { data: req, isLoading } = useQuery({ queryKey: ['requisition', requisitionId], queryFn: () => requisitionsApi.get(requisitionId).then(r => r.data.data) })

  const { register, handleSubmit } = useForm({
    defaultValues: { vendor_id: '', quotation_date: new Date().toISOString().split('T')[0], validity_date: '', notes: '', items: [] }
  })

  const onAddQuote = async (data: any) => {
    try {
      const items = (req?.items || []).map((ri: any, idx: number) => ({ requisition_item_id: ri.id, rate: parseFloat(data[`rate_${idx}`] || 0), uom: ri.uom, delivery_days: parseInt(data[`days_${idx}`] || 0), remarks: data[`remarks_${idx}`] || '' }))
      await requisitionsApi.addQuotation(requisitionId, { ...data, vendor_id: parseInt(data.vendor_id), items })
      qc.invalidateQueries({ queryKey: ['requisition', requisitionId] })
      toast.success('Quotation added')
      setShowAddQuote(false)
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const selectQuotation = async (quotationId: number) => {
    try {
      await requisitionsApi.selectQuotation(requisitionId, quotationId)
      qc.invalidateQueries({ queryKey: ['requisition', requisitionId] })
      toast.success('Quotation selected — PO can now be raised')
    } catch { toast.error('Failed') }
  }

  const startEditItems = () => {
    setEditRows((req?.items || []).map((item: any) => ({
      description: item.description || '',
      area: item.area || '',
      qty: item.qty ?? 1,
      uom: item.uom || 'nos',
      no_of_days: item.no_of_days ?? '',
    })))
    setEditingItems(true)
  }

  const saveItems = async () => {
    setSavingItems(true)
    try {
      await requisitionsApi.updateItems(requisitionId, editRows)
      qc.invalidateQueries({ queryKey: ['requisition', requisitionId] })
      setEditingItems(false)
      toast.success('Items updated')
    } catch { toast.error('Failed to save') }
    finally { setSavingItems(false) }
  }

  const deleteQuotation = async (quotationId: number) => {
    if (!window.confirm('Delete this vendor quotation?')) return
    try {
      await requisitionsApi.deleteQuotation(requisitionId, quotationId)
      qc.invalidateQueries({ queryKey: ['requisition', requisitionId] })
      toast.success('Quotation deleted')
    } catch { toast.error('Failed') }
  }

  const changeStatus = async (status: string) => {
    if (!status) return
    try {
      await requisitionsApi.updateStatus(requisitionId, { status })
      qc.invalidateQueries({ queryKey: ['requisition', requisitionId] })
      qc.invalidateQueries({ queryKey: ['requisitions'] })
      toast.success(`Status updated to ${status.replace(/_/g, ' ')}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update status')
    }
  }

  if (isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">{req?.indent_no}</h2>
            <p className="text-sm text-gray-500">{req?.machine_area}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex gap-3 flex-wrap">
            <span className={`badge-status ${statusColors[req?.status as RequisitionStatus]}`}>{req?.status?.replace(/_/g, ' ')}</span>
            <span className={`badge-status ${priorityColors[req?.priority as RequisitionPriority]}`}>{req?.priority}</span>
            {req?.reminder_date && <span className="badge-status bg-blue-100 text-blue-700">Reminder: {new Date(req.reminder_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Items Required</h3>
              {isSuperAdmin() && !editingItems && <button onClick={startEditItems} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><Pencil size={14} /></button>}
            </div>
            {editingItems ? (
              <div className="space-y-2">
                {editRows.map((row, idx) => (
                  <div key={idx} className="border border-gray-100 rounded p-3 grid grid-cols-5 gap-2 text-xs">
                    <div className="col-span-2"><label className="block text-gray-500 mb-0.5">Description</label><input className="input-field text-xs" value={row.description} onChange={e => setEditRows(r => r.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} /></div>
                    <div><label className="block text-gray-500 mb-0.5">Area</label><input className="input-field text-xs" value={row.area} onChange={e => setEditRows(r => r.map((x, i) => i === idx ? { ...x, area: e.target.value } : x))} /></div>
                    <div><label className="block text-gray-500 mb-0.5">Qty</label><input type="number" step="0.001" className="input-field text-xs" value={row.qty} onChange={e => setEditRows(r => r.map((x, i) => i === idx ? { ...x, qty: e.target.value } : x))} /></div>
                    <div><label className="block text-gray-500 mb-0.5">UOM</label>
                      <select className="input-field text-xs" value={row.uom} onChange={e => setEditRows(r => r.map((x, i) => i === idx ? { ...x, uom: e.target.value } : x))}>
                        <option value="nos">Nos</option><option value="pcs">Pcs</option><option value="kgs">Kgs</option><option value="mtr">Mtr</option><option value="set">Set</option>
                      </select>
                    </div>
                    {editRows.length > 1 && <div className="col-span-5 flex justify-end"><button type="button" onClick={() => setEditRows(r => r.filter((_, i) => i !== idx))} className="text-red-400 text-xs hover:text-red-600 flex items-center gap-1"><Trash2 size={11} />Remove</button></div>}
                  </div>
                ))}
                <button type="button" onClick={() => setEditRows(r => [...r, { description: '', area: '', qty: 1, uom: 'nos', no_of_days: '' }])} className="text-blue-500 text-xs hover:text-blue-700 flex items-center gap-1"><Plus size={11} />Add Item</button>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveItems} disabled={savingItems} className="btn-primary text-xs py-1.5 flex items-center gap-1"><Check size={12} />{savingItems ? 'Saving…' : 'Save'}</button>
                  <button onClick={() => setEditingItems(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left border-b border-gray-100">
                  <th className="pb-2 text-gray-500 font-medium">Sl.</th><th className="pb-2 text-gray-500 font-medium">Description</th>
                  <th className="pb-2 text-gray-500 font-medium">Area</th><th className="pb-2 text-gray-500 font-medium">Qty</th>
                  <th className="pb-2 text-gray-500 font-medium">UOM</th><th className="pb-2 text-gray-500 font-medium">Days</th><th className="pb-2 text-gray-500 font-medium">Received</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(req?.items || []).map((item: any, idx: number) => (
                    <tr key={item.id}>
                      <td className="py-2 text-gray-500">{idx+1}</td>
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-gray-500">{item.area || '—'}</td>
                      <td className="py-2">{item.qty}</td>
                      <td className="py-2 text-gray-500">{item.uom}</td>
                      <td className="py-2 text-gray-500">{item.no_of_days || '—'}</td>
                      <td className="py-2 text-green-600">{item.received_qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Vendor Quotations */}
          {req?.quotations?.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Vendor Quotations</h3>
              <div className="space-y-3">
                {req.quotations.map((q: any) => (
                  <div key={q.id} className={`border rounded-lg p-4 ${q.status === 'selected' ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{q.vendor_name}</div>
                      <div className="flex items-center gap-2">
                        <span className={`badge-status ${q.status === 'selected' ? 'bg-green-100 text-green-700' : q.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{q.status}</span>
                        {isRequisitionAdmin() && q.status === 'pending' && (
                          <button onClick={() => selectQuotation(q.id)} className="btn-primary text-xs py-1">Select</button>
                        )}
                        {isSuperAdmin() && (
                          <button onClick={() => deleteQuotation(q.id)} className="text-red-400 hover:text-red-600" title="Delete quotation"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{q.quotation_date}{q.validity_date && ` · valid till ${q.validity_date}`}</div>
                    {q.items?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.items.map((qi: any) => <div key={qi.id} className="text-sm">Rate: ₹{qi.rate} / {qi.uom} {qi.delivery_days && `· ${qi.delivery_days} days`} {qi.remarks && `· ${qi.remarks}`}</div>)}
                      </div>
                    )}
                    {q.notes && <div className="text-xs text-gray-500 mt-1">{q.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isRequisitionAdmin() && req?.status && (
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Change status:</span>
              <select
                className="input-field w-56 text-sm"
                defaultValue=""
                onChange={e => changeStatus(e.target.value)}
              >
                <option value="" disabled>Select new status…</option>
                {['pending','quotation_pending','quotation_received','po_raised','partially_delivered','delivered','cancelled']
                  .filter(s => s !== req.status)
                  .map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))
                }
              </select>
            </div>
          )}

          {isRequisitionAdmin() && req?.status !== 'cancelled' && req?.status !== 'delivered' && (
            <div className="flex gap-3">
              {!showAddQuote ? (
                <button onClick={() => setShowAddQuote(true)} className="btn-secondary text-sm">+ Add Vendor Quotation</button>
              ) : (
                <form onSubmit={handleSubmit(onAddQuote)} className="w-full border border-gray-200 rounded-lg p-4 space-y-4">
                  <h3 className="font-medium text-gray-900">Add Vendor Quotation</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Vendor</label>
                      <select className="input-field" {...register('vendor_id', { required: true })}>
                        <option value="">Select</option>
                        {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Quote Date</label><input type="date" className="input-field" {...register('quotation_date')} /></div>
                    <div><label className="block text-xs font-medium text-gray-600 mb-1">Valid Till</label><input type="date" className="input-field" {...register('validity_date')} /></div>
                  </div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label><input className="input-field" {...register('notes')} /></div>
                  {(req?.items || []).map((item: any, idx: number) => (
                    <div key={item.id} className="border-l-2 border-blue-200 pl-3 space-y-2">
                      <div className="text-xs font-medium text-gray-700">{item.description}</div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><label className="block text-xs text-gray-500 mb-1">Rate (₹)</label><input type="number" step="0.01" className="input-field" {...register(`rate_${idx}` as any)} /></div>
                        <div><label className="block text-xs text-gray-500 mb-1">Delivery Days</label><input type="number" className="input-field" {...register(`days_${idx}` as any)} /></div>
                        <div><label className="block text-xs text-gray-500 mb-1">Remarks</label><input className="input-field" {...register(`remarks_${idx}` as any)} /></div>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm">Save Quotation</button>
                    <button type="button" onClick={() => setShowAddQuote(false)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Requisitions() {
  const qc = useQueryClient()
  const { isSuperAdmin } = useAuth()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [showCreate, setShowCreate] = useState(false)
  const [viewId, setViewId] = useState<number | null>(null)

  const deleteRequisition = async (id: number, indentNo: string) => {
    if (!window.confirm(`Permanently delete ${indentNo}? This cannot be undone.`)) return
    try {
      await requisitionsApi.delete(id)
      qc.invalidateQueries({ queryKey: ['requisitions'] })
      toast.success('Requisition deleted')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const { data: requisitions = [], isLoading } = useQuery({
    queryKey: ['requisitions', status],
    queryFn: () => requisitionsApi.list({ status }).then(r => r.data.data),
  })

  const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const firstDesc = (r: any) => (r.items?.[0]?.description) || '—'

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(requisitions.map((r: any) => ({
      'Indent No': r.indent_no, 'Description': firstDesc(r), 'Priority': r.priority,
      'Status': r.status, 'Due Date': fmtDate(r.reminder_date),
      'Created By': r.created_by_name, 'Date': r.created_at?.split('T')[0],
    })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Requisitions'); XLSX.writeFile(wb, 'requisitions.xlsx')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn-secondary text-sm flex items-center justify-center gap-1 flex-1 sm:flex-initial"><Download size={14} />Export</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"><Plus size={16} />New Indent</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'pending', 'quotation_received', 'po_raised', 'delivered'].map(s => (
          <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-sm border transition-colors whitespace-nowrap shrink-0 ${status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b border-gray-100">
                <th className="pb-3 text-gray-500 font-medium">Indent No</th>
                <th className="pb-3 text-gray-500 font-medium">Description</th>
                <th className="pb-3 text-gray-500 font-medium">Priority</th>
                <th className="pb-3 text-gray-500 font-medium">Status</th>
                <th className="pb-3 text-gray-500 font-medium">Due Date</th>
                <th className="pb-3 text-gray-500 font-medium">Created By</th>
                <th className="pb-3 text-gray-500 font-medium">Date</th>
                <th className="pb-3 text-gray-500 font-medium">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {requisitions.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-blue-600 cursor-pointer" onClick={() => setViewId(r.id)}>{r.indent_no}</td>
                    <td className="py-3 text-gray-700">{firstDesc(r)}{r.items?.length > 1 && <span className="text-gray-400 text-xs ml-1">+{r.items.length - 1} more</span>}</td>
                    <td className="py-3"><span className={`badge-status ${priorityColors[r.priority as RequisitionPriority] || ''}`}>{r.priority}</span></td>
                    <td className="py-3"><span className={`badge-status ${statusColors[r.status as RequisitionStatus] || ''}`}>{r.status.replace(/_/g, ' ')}</span></td>
                    <td className="py-3 text-gray-500">{fmtDate(r.reminder_date)}</td>
                    <td className="py-3 text-gray-500">{r.created_by_name}</td>
                    <td className="py-3 text-gray-500">{r.created_at?.split('T')[0]}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewId(r.id)} className="text-blue-500 hover:text-blue-700"><Eye size={15} /></button>
                        {isSuperAdmin() && <button onClick={() => deleteRequisition(r.id, r.indent_no)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {requisitions.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">No requisitions found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && <CreateRequisitionModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['requisitions'] }); toast.success('Requisition submitted') }} />}
      {viewId && <ViewRequisitionModal requisitionId={viewId} onClose={() => setViewId(null)} />}
    </div>
  )
}
