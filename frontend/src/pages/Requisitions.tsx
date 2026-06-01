import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { requisitionsApi, vendorsApi, inventoryApi } from '../services/api'
import { Plus, Eye, Download, Trash2, Pencil, Check, ShoppingCart } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { RequisitionStatus, RequisitionPriority } from '../types'
import * as XLSX from 'xlsx'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import StatusPill from '../components/ui/StatusPill'
import { statusMap, humanize } from '../components/ui/statusMap'
import { fmtDate } from '../utils/formatDate'

// Used inside the (still legacy-styled) modal — kept to avoid restyling the heavy detail form here.
const statusColors: Record<RequisitionStatus, string> = {
  pending_approval: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
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

const TABS: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending_approval', label: 'Awaiting approval' },
  { value: 'pending', label: 'Pending' },
  { value: 'quotation_received', label: 'Quoted' },
  { value: 'po_raised', label: 'PO raised' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'rejected', label: 'Rejected' },
]

// Requisition item row — picks from the spare-parts inventory rather than free text.
// On selection we mirror the spare part's name into `description` and its UOM into the
// UOM field so the backend never receives a row without enough info to display.
// Live stock from inventory is shown beside the picker as a hint for the requester.
function RequisitionItemRow({ index, control, register, setValue, spareParts, fmtAvail, onRemove, canRemove }: {
  index: number
  control: any
  register: any
  setValue: any
  spareParts: any[]
  fmtAvail: (sp: any) => string
  onRemove: () => void
  canRemove: boolean
}) {
  const sparePartId = useWatch({ control, name: `items.${index}.spare_part_id` })
  const selected = spareParts.find(sp => String(sp.id) === String(sparePartId))

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Spare Part *</label>
          <select
            className="input-field"
            {...register(`items.${index}.spare_part_id`, { required: true })}
            onChange={(e) => {
              const id = e.target.value
              setValue(`items.${index}.spare_part_id`, id)
              const sp = spareParts.find(p => String(p.id) === String(id))
              if (sp) {
                setValue(`items.${index}.description`, sp.item_name)
                setValue(`items.${index}.uom`, sp.uom || 'nos')
              }
            }}
          >
            <option value="">— select from spare parts inventory —</option>
            {spareParts.map(sp => (
              <option key={sp.id} value={sp.id}>
                {sp.item_name}{sp.item_code ? ` (${sp.item_code})` : ''} — {fmtAvail(sp)}
              </option>
            ))}
          </select>
          {/* Mirror description into a hidden field — the backend still relies on it for legacy
              reads (PI/PO line text, exports). Kept hidden so the requester doesn't see two
              "what" fields and re-type the part name. */}
          <input type="hidden" {...register(`items.${index}.description`)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Available</label>
          <div className="input-field bg-gray-50 text-gray-600 text-xs" style={{ lineHeight: '1.65' }}>
            {selected ? fmtAvail(selected) : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Qty *</label>
          <input type="number" step="0.001" min="0" className="input-field" {...register(`items.${index}.qty`, { required: true })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">UOM</label>
          <select className="input-field" {...register(`items.${index}.uom`)}>
            <option value="nos">Nos</option><option value="pcs">Pcs</option><option value="kgs">Kgs</option><option value="mtr">Mtr</option><option value="set">Set</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Urgency (days)</label>
          <input type="number" min="1" className="input-field" {...register(`items.${index}.no_of_days`)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Machine / Area</label>
          <input className="input-field" placeholder="e.g. Heat exchanger" {...register(`items.${index}.area`)} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Comments (make, model, vendor preference, other details)</label>
        <input className="input-field" placeholder="e.g. ABB make, model XYZ-12, prefer Singh & Co" {...register(`items.${index}.notes`)} />
      </div>

      {canRemove && (
        <div className="flex justify-end">
          <button type="button" onClick={onRemove} className="text-red-500 text-xs hover:text-red-700 flex items-center gap-1">
            <Trash2 size={11} /> Remove
          </button>
        </div>
      )}
    </div>
  )
}

function CreateRequisitionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { brands } = useAuth()
  const defaultBrandId = String(
    (brands.find((b: any) => b.name.toLowerCase().includes('ami enterprise')) || brands[0])?.id || ''
  )
  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      brand_id: defaultBrandId,
      machine_area: '', priority: 'normal', reminder_date: '', notes: '',
      items: [{ spare_part_id: '', description: '', area: '', qty: 1, uom: 'nos', no_of_days: 7, notes: '' }]
    }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const selectedBrandId = parseInt(watch('brand_id') || '0')

  // Spare parts for the selected company. The picker hard-fails (required) if there are
  // none — the user wanted to retire free-form descriptions specifically because they
  // couldn't track stock against them.
  const { data: spareParts = [] } = useQuery({
    queryKey: ['inventory', 'spare_parts', selectedBrandId],
    queryFn: () => inventoryApi.getByType('spare_parts').then(r =>
      (r.data.data as any[]).filter(it => !selectedBrandId || it.brand_id === selectedBrandId)
    ),
    enabled: !!selectedBrandId,
  })

  const fmtAvail = (sp: any) => {
    const avail = Number(sp.current_stock || 0) - Number(sp.reserved_stock || 0)
    return `${avail} ${sp.uom || ''} in stock`
  }

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      // Bundle the per-item comments into description so existing list views and PDFs
      // (which read description) still surface them. Backend keeps spare_part_id as the
      // structured link used for inventory crediting on receipt.
      const items = data.items.map((it: any) => {
        const sp = spareParts.find(p => String(p.id) === String(it.spare_part_id))
        const baseName = sp?.item_name || it.description || ''
        const description = it.notes ? `${baseName} — ${it.notes}` : baseName
        return {
          spare_part_id: it.spare_part_id ? parseInt(it.spare_part_id) : null,
          description,
          area: it.area || null,
          qty: parseFloat(it.qty) || 0,
          uom: it.uom || sp?.uom || 'nos',
          no_of_days: it.no_of_days ? parseInt(it.no_of_days) : null,
        }
      })
      await requisitionsApi.create({ ...data, brand_id: parseInt(data.brand_id), items })
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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Machine / Area (overall)</label><input className="input-field" placeholder="e.g. 250 KW Heat Exchanger" {...register('machine_area')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input-field" {...register('priority')}>
                <option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critical">Critical</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reminder Date</label><input type="date" className="input-field" {...register('reminder_date')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes (whole requisition)</label><input className="input-field" {...register('notes')} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Items Required</h3>
              <button type="button" onClick={() => append({ spare_part_id: '', description: '', area: '', qty: 1, uom: 'nos', no_of_days: 7, notes: '' })} className="btn-secondary py-1 text-xs flex items-center gap-1"><Plus size={12} />Add Item</button>
            </div>
            {spareParts.length === 0 && selectedBrandId ? (
              <div className="border border-amber-200 bg-amber-50 text-amber-800 text-sm rounded-lg p-3 mb-3">
                No spare parts are recorded in inventory for this company yet. Add them under <strong>Inventory → Spare parts</strong> before raising an indent.
              </div>
            ) : null}
            <div className="space-y-3">
              {fields.map((field, idx) => (
                <RequisitionItemRow
                  key={field.id}
                  index={idx}
                  control={control}
                  register={register}
                  setValue={setValue}
                  spareParts={spareParts}
                  fmtAvail={fmtAvail}
                  onRemove={() => remove(idx)}
                  canRemove={fields.length > 1}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading || (!!selectedBrandId && spareParts.length === 0)} className="btn-primary">{loading ? 'Submitting...' : 'Submit Requisition'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ViewRequisitionModal({ requisitionId, onClose }: { requisitionId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { isRequisitionAdmin, isSuperAdmin, canApproveRequisitions, user } = useAuth()
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
      spare_part_id: item.spare_part_id ?? null,
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

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['requisition', requisitionId] })
    qc.invalidateQueries({ queryKey: ['requisitions'] })
  }

  const approve = async () => {
    try {
      await requisitionsApi.approve(requisitionId)
      refresh()
      toast.success('Requisition approved')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const reject = async () => {
    const reason = window.prompt('Reason for rejection (the creator will see this):')
    if (reason === null) return
    if (!reason.trim()) { toast.error('A reason is required'); return }
    try {
      await requisitionsApi.reject(requisitionId, reason.trim())
      refresh()
      toast.success('Requisition rejected')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const resubmit = async () => {
    try {
      await requisitionsApi.resubmit(requisitionId)
      refresh()
      toast.success('Resubmitted for approval')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const generatePO = (quotation: any) => {
    const items = (req?.items || []).map((ri: any) => {
      const qi = (quotation.items || []).find((q: any) => q.requisition_item_id === ri.id)
      return {
        material_no: '',
        description: ri.description || '',
        qty: ri.qty || 0,
        uom: qi?.uom || ri.uom || 'nos',
        rate: qi?.rate || 0,
        total: parseFloat(((ri.qty || 0) * (qi?.rate || 0)).toFixed(2)),
      }
    })
    onClose()
    navigate('/purchase-orders', {
      state: {
        fromRequisition: true,
        vendor_id: quotation.vendor_id,
        requisition_id: requisitionId,
        items,
      },
    })
  }

  if (isLoading) return null

  const isPendingApproval = req?.status === 'pending_approval'
  const isRejected = req?.status === 'rejected'
  const preApproval = isPendingApproval || isRejected      // gates all downstream procurement UI
  const isCreator = req?.created_by === user?.id
  const canEditItems = isSuperAdmin() || (preApproval && isCreator)

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
            {req?.reminder_date && <span className="badge-status bg-blue-100 text-blue-700">Reminder: {fmtDate(req.reminder_date)}</span>}
          </div>

          {/* Received / balance summary — aggregated from the requisition line items
              (each carries qty ordered + received_qty credited on PO goods receipts). */}
          {(() => {
            const lines = req?.items || []
            const ordered = lines.reduce((s: number, it: any) => s + (Number(it.qty) || 0), 0)
            const received = lines.reduce((s: number, it: any) => s + (Number(it.received_qty) || 0), 0)
            if (ordered <= 0) return null
            const balance = Math.max(ordered - received, 0)
            const pct = Math.min((received / ordered) * 100, 100)
            const done = balance <= 0
            return (
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">Received against indent</span>
                  <span className={done ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                    {received} / {ordered}{balance > 0 ? ` · ${balance} pending` : ' · complete'}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()}

          {/* Approval gate — banner + actions */}
          {isPendingApproval && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-amber-800">This requisition is awaiting approval before procurement can begin.</p>
              {canApproveRequisitions() && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={approve} className="btn-primary text-sm py-1.5">Approve</button>
                  <button onClick={reject} className="btn-secondary text-sm py-1.5 text-red-600">Reject</button>
                </div>
              )}
            </div>
          )}
          {isRejected && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center justify-between gap-3">
              <div className="text-sm text-red-800">
                <span className="font-medium">Rejected.</span> {req?.rejection_reason || 'No reason provided.'}
              </div>
              {(isCreator || isSuperAdmin()) && (
                <button onClick={resubmit} className="btn-primary text-sm py-1.5 shrink-0">Resubmit for approval</button>
              )}
            </div>
          )}

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Items Required</h3>
              {canEditItems && !editingItems && <button onClick={startEditItems} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><Pencil size={14} /></button>}
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
                        {q.status === 'selected' && (
                          <button
                            onClick={() => generatePO(q)}
                            className="inline-flex items-center gap-1 text-xs py-1 px-2"
                            style={{
                              background: 'rgba(34,139,34,.08)',
                              color: '#228b22',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              fontWeight: 600,
                              border: '1px solid rgba(34,139,34,.2)',
                            }}
                            title="Generate Purchase Order for this vendor"
                          >
                            <ShoppingCart size={12} /> Generate PO
                          </button>
                        )}
                        {isSuperAdmin() && (
                          <button onClick={() => deleteQuotation(q.id)} className="text-red-400 hover:text-red-600" title="Delete quotation"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{fmtDate(q.quotation_date)}{q.validity_date && ` · valid till ${fmtDate(q.validity_date)}`}</div>
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

          {isRequisitionAdmin() && req?.status && !preApproval && (
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

          {isRequisitionAdmin() && !preApproval && req?.status !== 'cancelled' && req?.status !== 'delivered' && (
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

  const firstDesc = (r: any) => (r.items?.[0]?.description) || '—'

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(requisitions.map((r: any) => ({
      'Indent No': r.indent_no, 'Description': firstDesc(r), 'Priority': r.priority,
      'Status': r.status, 'Due Date': fmtDate(r.reminder_date),
      'Created By': r.created_by_name, 'Date': fmtDate(r.created_at),
    })))
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Requisitions'); XLSX.writeFile(wb, 'requisitions.xlsx')
  }

  return (
    <div>
      <PageHeader
        breadcrumb={['Ami Enterprises', 'Requisitions']}
        title="Purchase requisitions"
        actions={
          <>
            <Button variant="secondary" leadingIcon={<Download size={14} />} onClick={exportExcel}>
              Export
            </Button>
            <Button variant="primary" leadingIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              New indent
            </Button>
          </>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {TABS.map((t) => {
          const active = status === t.value
          return (
            <button
              key={t.value || 'all'}
              onClick={() => setStatus(t.value)}
              style={{
                padding: '8px 14px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 500,
                background: active ? 'var(--color-ink)' : '#fff',
                color: active ? 'var(--color-paper)' : 'var(--mute-lt)',
                border: `1px solid ${active ? 'var(--color-ink)' : 'var(--rule-lt-md)'}`,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--rule-lt)' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div
              className="hidden md:grid"
              style={{
                gridTemplateColumns: '120px 1.6fr 90px 130px 110px 110px 110px 80px',
                padding: '12px 20px',
                gap: 14,
                background: 'var(--color-paper-alt)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: 'var(--mute-lt)',
              }}
            >
              <span>Indent No.</span>
              <span>Description</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Due date</span>
              <span>Created by</span>
              <span>Date</span>
              <span></span>
            </div>

            {requisitions.length === 0 ? (
              <p
                className="py-12 text-center"
                style={{ fontSize: 13, color: 'var(--mute-lt)' }}
              >
                No requisitions found
              </p>
            ) : (
              requisitions.map((r: any, i: number) => (
                <div
                  key={r.id}
                  className="grid md:items-center hover:bg-[var(--color-paper-alt)] transition-colors"
                  style={{
                    gridTemplateColumns: '120px 1.6fr 90px 130px 110px 110px 110px 80px',
                    padding: '14px 20px',
                    gap: 14,
                    borderTop: i > 0 ? '1px solid var(--rule-lt)' : '1px solid var(--rule-lt)',
                  }}
                >
                  <button
                    onClick={() => setViewId(r.id)}
                    className="text-left"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--color-warm-dk)',
                      fontWeight: 600,
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {r.indent_no}
                  </button>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{firstDesc(r)}</div>
                    {r.items?.length > 1 && (
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--mute-lt)',
                          marginTop: 2,
                        }}
                      >
                        +{r.items.length - 1} more
                      </div>
                    )}
                  </div>
                  <StatusPill kind={statusMap.priority(r.priority)} label={r.priority} />
                  <StatusPill kind={statusMap.requisition(r.status)} label={humanize(r.status)} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--mute-lt)',
                    }}
                  >
                    {fmtDate(r.reminder_date)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--mute-lt)' }}>{r.created_by_name}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--mute-lt)',
                    }}
                  >
                    {fmtDate(r.created_at)}
                  </span>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setViewId(r.id)}
                      style={{ color: 'var(--color-warm-dk)' }}
                      title="View"
                    >
                      <Eye size={15} />
                    </button>
                    {isSuperAdmin() && (
                      <button
                        onClick={() => deleteRequisition(r.id, r.indent_no)}
                        style={{ color: 'var(--mute-lt)' }}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {showCreate && (
        <CreateRequisitionModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            qc.invalidateQueries({ queryKey: ['requisitions'] })
            toast.success('Requisition submitted')
          }}
        />
      )}
      {viewId && <ViewRequisitionModal requisitionId={viewId} onClose={() => setViewId(null)} />}
    </div>
  )
}
