import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Truck, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { purchaseOrdersApi } from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { fmtDate } from '../utils/formatDate'
import type { PurchaseOrder, PoReceipt } from '../types'

const num = (v: any) => Number(v) || 0

// Per-line progress bar (received-to-date / ordered).
function ItemProgress({ item }: { item: any }) {
  const ordered = num(item.qty)
  const received = num(item.received_qty)
  const balance = Math.max(ordered - received, 0)
  const pct = ordered > 0 ? Math.min((received / ordered) * 100, 100) : 0
  const done = balance <= 0 && ordered > 0
  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{item.description}</div>
          <div className="text-xs text-gray-500">{item.uom}</div>
        </div>
        <div className="text-right shrink-0 text-xs">
          <div className="text-gray-900 font-medium">{received} / {ordered}</div>
          <div className={balance > 0 ? 'text-orange-600' : 'text-green-600'}>
            {balance > 0 ? `${balance} pending` : 'Complete'}
          </div>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// Record / edit a GRN. `receipt` set => edit mode (prefilled).
function ReceiptForm({
  po,
  receipt,
  onClose,
  onSaved,
}: {
  po: PurchaseOrder
  receipt?: PoReceipt
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!receipt
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const items = po.items || []

  // For edit, pre-existing received qty on a line excludes this receipt's own contribution
  // so the cap correctly allows re-saving the same numbers.
  const ownQty = (poItemId: number) =>
    isEdit ? num(receipt!.items?.find(ri => ri.po_item_id === poItemId)?.received_qty) : 0

  const { register, handleSubmit } = useForm({
    defaultValues: {
      receipt_date: isEdit ? (receipt!.receipt_date || '').slice(0, 10) : new Date().toISOString().split('T')[0],
      received_by: '',
      transporter: isEdit ? receipt!.transporter || '' : '',
      lr_number: isEdit ? receipt!.lr_number || '' : '',
      vehicle_no: isEdit ? receipt!.vehicle_no || '' : '',
      vendor_invoice_no: isEdit ? receipt!.vendor_invoice_no || '' : '',
      notes: isEdit ? receipt!.notes || '' : '',
      ...Object.fromEntries(
        items.map(it => [`qty_${it.id}`, isEdit ? String(ownQty(it.id)) : ''])
      ),
    } as any,
  })

  const onSubmit = async (data: any) => {
    setServerError('')
    const payloadItems = items
      .map(it => ({ po_item_id: it.id, received_qty: parseFloat(data[`qty_${it.id}`]) || 0 }))
      .filter(r => r.received_qty > 0)
    if (payloadItems.length === 0) {
      setServerError('Enter a received quantity on at least one line.')
      return
    }
    const payload: any = {
      receipt_date: data.receipt_date,
      received_by: data.received_by ? parseInt(data.received_by) : undefined,
      transporter: data.transporter || undefined,
      lr_number: data.lr_number || undefined,
      vehicle_no: data.vehicle_no || undefined,
      vendor_invoice_no: data.vendor_invoice_no || undefined,
      notes: data.notes || undefined,
      items: payloadItems,
    }
    setLoading(true)
    try {
      if (isEdit) await purchaseOrdersApi.updateReceipt(po.id, receipt!.id, payload)
      else await purchaseOrdersApi.createReceipt(po.id, payload)
      onSaved()
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to save goods receipt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
      <h4 className="font-medium text-gray-900">{isEdit ? `Edit ${receipt!.receipt_no}` : 'Record Goods Receipt'}</h4>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Receipt Date *</label><input type="date" className="input-field" {...register('receipt_date', { required: true })} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Vendor Invoice No.</label><input className="input-field" {...register('vendor_invoice_no')} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Transporter</label><input className="input-field" {...register('transporter')} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">LR No.</label><input className="input-field" {...register('lr_number')} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Vehicle No.</label><input className="input-field" {...register('vehicle_no')} /></div>
        <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label><input className="input-field" {...register('notes')} /></div>
      </div>

      <div>
        <div className="text-xs font-medium text-gray-600 mb-2">Receiving now</div>
        <div className="space-y-2">
          {items.map(it => {
            const ordered = num(it.qty)
            const alreadyElsewhere = num(it.received_qty) - ownQty(it.id)
            const balance = Math.max(ordered - alreadyElsewhere, 0)
            return (
              <div key={it.id} className="grid grid-cols-12 gap-2 items-center text-sm">
                <div className="col-span-7 min-w-0">
                  <div className="truncate text-gray-900">{it.description}</div>
                  <div className="text-xs text-gray-400">balance {balance} {it.uom}</div>
                </div>
                <div className="col-span-5">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={balance}
                    className="input-field"
                    placeholder="0"
                    {...register(`qty_${it.id}` as any, {
                      onChange: (e) => {
                        const v = parseFloat(e.target.value)
                        if (!isNaN(v) && v > balance) e.target.value = String(balance)
                        if (!isNaN(v) && v < 0) e.target.value = '0'
                      },
                    })}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {serverError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{serverError}</div>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary text-sm">
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Record Receipt'}
        </button>
      </div>
    </form>
  )
}

function ReceiptCard({
  po,
  receipt,
  canWrite,
  onChanged,
}: {
  po: PurchaseOrder
  receipt: PoReceipt
  canWrite: boolean
  onChanged: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)

  const remove = async () => {
    if (!window.confirm(`Delete goods receipt ${receipt.receipt_no}? Received quantities will be reversed.`)) return
    try {
      await purchaseOrdersApi.deleteReceipt(po.id, receipt.id)
      onChanged()
      toast.success('Receipt deleted')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete')
    }
  }

  if (editing) {
    return (
      <ReceiptForm
        po={po}
        receipt={receipt}
        onClose={() => setEditing(false)}
        onSaved={() => { setEditing(false); onChanged(); toast.success('Receipt updated') }}
      />
    )
  }

  const logistics = [
    receipt.transporter && `Transporter: ${receipt.transporter}`,
    receipt.lr_number && `LR: ${receipt.lr_number}`,
    receipt.vehicle_no && `Vehicle: ${receipt.vehicle_no}`,
  ].filter(Boolean).join(' · ')

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <button onClick={() => setExpanded(e => !e)} className="flex items-start gap-2 text-left min-w-0">
          {expanded ? <ChevronDown size={15} className="mt-0.5 text-gray-400 shrink-0" /> : <ChevronRight size={15} className="mt-0.5 text-gray-400 shrink-0" />}
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900">{receipt.receipt_no}</div>
            <div className="text-xs text-gray-500">
              {fmtDate(receipt.receipt_date)}
              {receipt.vendor_invoice_no && ` · Inv ${receipt.vendor_invoice_no}`}
              {receipt.received_by_name && ` · by ${receipt.received_by_name}`}
            </div>
          </div>
        </button>
        {canWrite && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-gray-800" title="Edit"><Edit2 size={14} /></button>
            <button onClick={remove} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 size={14} /></button>
          </div>
        )}
      </div>
      {expanded && (
        <div className="mt-3 pl-6 space-y-2">
          {logistics && <div className="text-xs text-gray-500">{logistics}</div>}
          {receipt.notes && <div className="text-xs text-gray-500">Notes: {receipt.notes}</div>}
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 text-xs border-b border-gray-100">
              <th className="pb-1 font-medium">Description</th>
              <th className="pb-1 font-medium text-right">Received</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {(receipt.items || []).map((ri, i) => (
                <tr key={ri.id ?? i}>
                  <td className="py-1.5">{ri.description || (po.items || []).find(it => it.id === ri.po_item_id)?.description || `Item #${ri.po_item_id}`}</td>
                  <td className="py-1.5 text-right text-green-600">{ri.received_qty} {ri.uom || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function POReceipts({ po, onChanged }: { po: PurchaseOrder; onChanged?: () => void }) {
  const qc = useQueryClient()
  const { isAdmin } = useAuth()
  const canWrite = isAdmin()
  const [showForm, setShowForm] = useState(false)

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['po-receipts', po.id],
    queryFn: () => purchaseOrdersApi.listReceipts(po.id).then(r => r.data.data as PoReceipt[]),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['po-receipts', po.id] })
    qc.invalidateQueries({ queryKey: ['purchase-orders'] })
    qc.invalidateQueries({ queryKey: ['purchase-order', po.id] })
    onChanged?.()
  }

  const items = po.items || []

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Truck size={16} className="text-gray-500" />
        <h3 className="font-semibold text-gray-900">Goods Receipts (GRN)</h3>
      </div>

      {/* Per-item progress */}
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Receiving progress</div>
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">No line items on this PO.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map(it => <ItemProgress key={it.id} item={it} />)}
          </div>
        )}
      </div>

      {/* Record form */}
      {canWrite && (
        showForm ? (
          <ReceiptForm
            po={po}
            onClose={() => setShowForm(false)}
            onSaved={() => { setShowForm(false); invalidate(); toast.success('Goods receipt recorded') }}
          />
        ) : (
          <button onClick={() => setShowForm(true)} className="btn-secondary text-sm flex items-center gap-1">
            <Plus size={14} /> Record Goods Receipt
          </button>
        )
      )}

      {/* Receipt history */}
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Receipt history</div>
        {isLoading ? (
          <LoadingSpinner />
        ) : receipts.length === 0 ? (
          <p className="text-sm text-gray-400">No goods receipts recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {receipts.map(r => (
              <ReceiptCard key={r.id} po={po} receipt={r} canWrite={canWrite} onChanged={invalidate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
