import { useState } from 'react'
import { ordersApi } from '../services/api'
import { X } from 'lucide-react'
import type { Order, OrderDelivery } from '../types'

interface Props {
  order: Order
  delivery?: OrderDelivery   // when present => edit mode
  onClose: () => void
  onSaved: () => void
}

// The driving unit for a line: kgs|mt => kgs, else pcs.
function isKgsDriven(uom?: string) {
  const u = (uom || '').toLowerCase()
  return u === 'kgs' || u === 'mt'
}

function fmtNum(n: number) {
  return Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 3 })
}

export default function RecordDeliveryModal({ order, delivery, onClose, onSaved }: Props) {
  const isEdit = !!delivery
  const items = order.items || []

  // For edit mode, prefill the entered driving-unit quantity from this delivery's lines.
  const prefillQty = (orderItemId: number, kgsDriven: boolean): string => {
    if (!delivery) return ''
    const di = delivery.items.find(d => d.order_item_id === orderItemId)
    if (!di) return ''
    const v = kgsDriven ? di.quantity_kgs : di.quantity_pcs
    return v ? String(v) : ''
  }

  const [header, setHeader] = useState({
    delivery_date: delivery?.delivery_date
      ? new Date(delivery.delivery_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    dispatched_by: delivery?.dispatched_by || '',
    courier_name: delivery?.courier_name || '',
    transporter: delivery?.transporter || '',
    awb_number: delivery?.awb_number || '',
    awb_link: delivery?.awb_link || '',
    lr_link: delivery?.lr_link || '',
    vehicle_no: delivery?.vehicle_no || '',
    notes: delivery?.notes || '',
  })

  // Map of order_item_id -> entered driving-unit quantity (as string).
  const [qty, setQty] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {}
    for (const it of items) init[it.id] = prefillQty(it.id, isKgsDriven(it.uom))
    return init
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // In edit mode the line we are editing should not count its own quantity towards
  // "already delivered" — so balance reflects everything except this installment.
  const alreadyDelivered = (it: typeof items[number], kgsDriven: boolean): number => {
    const total = kgsDriven ? Number(it.delivered_kgs || 0) : Number(it.delivered_pcs || 0)
    if (!delivery) return total
    const di = delivery.items.find(d => d.order_item_id === it.id)
    const own = di ? (kgsDriven ? Number(di.quantity_kgs || 0) : Number(di.quantity_pcs || 0)) : 0
    return Math.max(0, total - own)
  }

  const balanceOf = (it: typeof items[number], kgsDriven: boolean): number => {
    const ordered = kgsDriven ? Number(it.quantity_kgs || 0) : Number(it.quantity_pcs || 0)
    return Math.max(0, ordered - alreadyDelivered(it, kgsDriven))
  }

  const handleQty = (it: typeof items[number], raw: string) => {
    const kgsDriven = isKgsDriven(it.uom)
    const bal = balanceOf(it, kgsDriven)
    let v = raw
    const num = parseFloat(raw)
    if (!isNaN(num) && num > bal) v = String(bal)
    if (!isNaN(num) && num < 0) v = '0'
    setQty(prev => ({ ...prev, [it.id]: v }))
  }

  const submit = async () => {
    setError(null)
    const payloadItems = items
      .map(it => {
        const kgsDriven = isKgsDriven(it.uom)
        const entered = parseFloat(qty[it.id]) || 0
        if (entered <= 0) return null
        return {
          order_item_id: it.id,
          quantity_pcs: kgsDriven ? 0 : entered,
          quantity_kgs: kgsDriven ? entered : 0,
        }
      })
      .filter(Boolean) as { order_item_id: number; quantity_pcs: number; quantity_kgs: number }[]

    if (payloadItems.length === 0) {
      setError('Enter a dispatch quantity for at least one line.')
      return
    }

    const payload = { ...header, items: payloadItems }
    setSaving(true)
    try {
      if (isEdit) {
        await ordersApi.updateDelivery(order.id, delivery!.id, payload)
      } else {
        await ordersApi.createDelivery(order.id, payload)
      }
      onSaved()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save delivery')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? `Edit Delivery #${delivery!.delivery_no}` : 'Record Dispatch / Delivery'}
          </h2>
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-gray-700" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Logistics header */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
              <input type="date" className="input-field" value={header.delivery_date}
                onChange={e => setHeader(h => ({ ...h, delivery_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dispatched By</label>
              <input className="input-field" value={header.dispatched_by}
                onChange={e => setHeader(h => ({ ...h, dispatched_by: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name</label>
              <input className="input-field" value={header.courier_name}
                onChange={e => setHeader(h => ({ ...h, courier_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transporter</label>
              <input className="input-field" value={header.transporter}
                onChange={e => setHeader(h => ({ ...h, transporter: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AWB / Tracking No.</label>
              <input className="input-field" value={header.awb_number}
                onChange={e => setHeader(h => ({ ...h, awb_number: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No.</label>
              <input className="input-field" value={header.vehicle_no}
                onChange={e => setHeader(h => ({ ...h, vehicle_no: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AWB Link</label>
              <input className="input-field" placeholder="https://…" value={header.awb_link}
                onChange={e => setHeader(h => ({ ...h, awb_link: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LR Link</label>
              <input className="input-field" placeholder="https://…" value={header.lr_link}
                onChange={e => setHeader(h => ({ ...h, lr_link: e.target.value }))} />
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="input-field" rows={2} value={header.notes}
                onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Items to Dispatch</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-2 text-gray-500 font-medium">Description</th>
                    <th className="pb-2 text-gray-500 font-medium">UOM</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Ordered</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Delivered</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Balance</th>
                    <th className="pb-2 text-gray-500 font-medium text-right">Dispatch Now</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(it => {
                    const kgsDriven = isKgsDriven(it.uom)
                    const ordered = kgsDriven ? Number(it.quantity_kgs || 0) : Number(it.quantity_pcs || 0)
                    const delivered = alreadyDelivered(it, kgsDriven)
                    const bal = balanceOf(it, kgsDriven)
                    const unit = kgsDriven ? 'kgs' : 'pcs'
                    return (
                      <tr key={it.id}>
                        <td className="py-2">{it.description || it.product_name}</td>
                        <td className="py-2 text-gray-500">{it.uom}</td>
                        <td className="py-2 text-right">{fmtNum(ordered)} {unit}</td>
                        <td className="py-2 text-right text-gray-600">{fmtNum(delivered)} {unit}</td>
                        <td className="py-2 text-right font-medium">{fmtNum(bal)} {unit}</td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max={bal}
                            step={kgsDriven ? '0.001' : '1'}
                            disabled={bal <= 0}
                            className="input-field text-right w-28 inline-block disabled:bg-gray-50"
                            value={qty[it.id] ?? ''}
                            onChange={e => handleQty(it, e.target.value)}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="button" onClick={submit} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : isEdit ? 'Update Delivery' : 'Record Delivery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
