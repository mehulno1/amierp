import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersApi, piApi, clientsApi } from '../services/api'
import { ArrowLeft, FileText, Pencil, X, Check, Trash2, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import PIDocument from '../components/PIDocument'

const statusColors: Record<string, string> = {
  new_order: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  ready_for_dispatch: 'bg-orange-100 text-orange-700',
  dispatched: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUSES = ['new_order', 'processing', 'ready_for_dispatch', 'dispatched', 'completed']

function fmt(dateStr?: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const { isAdmin, isSuperAdmin, user } = useAuth()
  const isUser = user?.role === 'user'
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [showPI, setShowPI] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editingOrder, setEditingOrder] = useState(false)
  const [editingDispatch, setEditingDispatch] = useState(false)
  const [editingClient, setEditingClient] = useState(false)
  const [editingItems, setEditingItems] = useState(false)

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(parseInt(id!)).then(r => r.data.data),
  })

  const { data: piData } = useQuery({
    queryKey: ['pi-for-order', id],
    queryFn: () => piApi.list().then(r => (r.data.data as any[]).find((p: any) => p.order_id === parseInt(id!))),
    enabled: !!id,
  })

  const updateStatus = async (newStatus: string) => {
    if (!isAdmin()) return
    setUpdating(true)
    try {
      await ordersApi.update(parseInt(id!), { status: newStatus })
      qc.invalidateQueries({ queryKey: ['order', id] })
      toast.success('Status updated')
    } catch { toast.error('Failed to update status') }
    finally { setUpdating(false) }
  }

  const deleteOrder = async () => {
    if (!window.confirm(`Permanently delete order ${order?.order_id}? This cannot be undone.`)) return
    try {
      await ordersApi.delete(parseInt(id!))
      toast.success('Order deleted')
      navigate('/orders')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const deletePI = async (piId: number) => {
    if (!window.confirm('Delete this PI? It will need to be regenerated.')) return
    try {
      await piApi.delete(piId)
      qc.invalidateQueries({ queryKey: ['order', id] })
      qc.invalidateQueries({ queryKey: ['pi-for-order', id] })
      toast.success('PI deleted')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

  if (isLoading) return <LoadingSpinner />
  if (!order) return <div className="card">Order not found</div>

  const pi = piData || order.pi

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/orders" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">{order.order_id}</h1>
        <span className={`badge-status ${statusColors[order.status]}`}>{order.status.replace(/_/g, ' ')}</span>
        {isSuperAdmin() && (
          <button onClick={deleteOrder} className="ml-auto flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg">
            <Trash2 size={14} /> Delete Order
          </button>
        )}
      </div>

      {isAdmin() && !isUser && order.status !== 'cancelled' && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Update Status</h3>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => updateStatus(s)} disabled={updating || order.status === s}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${order.status === s ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderDetailsCard order={order} id={id!} isAdmin={isAdmin() || isUser} editing={editingOrder} setEditing={setEditingOrder} onSaved={() => qc.invalidateQueries({ queryKey: ['order', id] })} />
        <div className="card">
          <h3 className="font-medium text-gray-900 mb-4">Proforma Invoice</h3>
          {pi ? (
            <div className="space-y-3">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">PI No.</dt><dd className="font-medium">{pi.pi_no}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">PI Date</dt><dd>{fmt(pi.pi_date)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Status</dt><dd className="capitalize">{pi.status}</dd></div>
              </dl>
              <button onClick={() => setShowPI(true)} className="btn-secondary w-full flex items-center justify-center gap-2">
                <FileText size={16} /> View / Download PI
              </button>
              {isSuperAdmin() && (
                <button onClick={() => deletePI(pi.id)} className="w-full flex items-center justify-center gap-1.5 text-red-500 hover:text-red-700 text-sm border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg">
                  <Trash2 size={14} /> Delete PI
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">PI will be generated automatically</p>
          )}
        </div>
      </div>

      <ClientDetailsCard order={order} isAdmin={isAdmin() || isUser} editing={editingClient} setEditing={setEditingClient} onSaved={() => qc.invalidateQueries({ queryKey: ['order', id] })} />

      <OrderItemsCard
        order={order}
        id={id!}
        isSuperAdmin={isSuperAdmin()}
        editing={editingItems}
        setEditing={setEditingItems}
        onSaved={() => qc.invalidateQueries({ queryKey: ['order', id] })}
      />

      <DispatchCard order={order} isAdmin={isAdmin() || isUser} editing={editingDispatch} setEditing={setEditingDispatch} onSaved={() => qc.invalidateQueries({ queryKey: ['order', id] })} />

      {showPI && pi?.id && <PIDocument piId={pi.id} onClose={() => setShowPI(false)} />}
    </div>
  )
}

// ─── Order Details Card ───────────────────────────────────────────────────────

function OrderDetailsCard({ order, id, isAdmin, editing, setEditing, onSaved }: any) {
  const [form, setForm] = useState({
    delivery_date: order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : '',
    delivery_mode: order.delivery_mode || '',
    order_type: order.order_type || 'domestic',
    notes: order.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await ordersApi.update(parseInt(id), form)
      onSaved()
      setEditing(false)
      toast.success('Order details updated')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (editing) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Order Details</h3>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div><label className="block text-gray-500 mb-1">Delivery Date</label>
            <input type="date" className="input-field" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} /></div>
          <div><label className="block text-gray-500 mb-1">Delivery Mode</label>
            <input className="input-field" value={form.delivery_mode} onChange={e => setForm(f => ({ ...f, delivery_mode: e.target.value }))} placeholder="e.g. Road, Rail" /></div>
          <div><label className="block text-gray-500 mb-1">Order Type</label>
            <select className="input-field" value={form.order_type} onChange={e => setForm(f => ({ ...f, order_type: e.target.value }))}>
              <option value="domestic">Domestic</option>
              <option value="export">Export</option>
            </select></div>
          <div><label className="block text-gray-500 mb-1">Notes</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1 py-1.5 text-sm"><Check size={14} />{saving ? 'Saving…' : 'Save'}</button>
            <button onClick={() => setEditing(false)} className="btn-secondary py-1.5 text-sm">Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Order Details</h3>
        {isAdmin && <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><Pencil size={14} /></button>}
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-gray-500">Client</dt><dd className="font-medium">{order.client_name}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">Order Date</dt><dd>{fmt(order.order_date)}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">Delivery Date</dt><dd>{fmt(order.delivery_date)}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">Delivery Mode</dt><dd>{order.delivery_mode || '—'}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">Order Type</dt><dd className="capitalize">{order.order_type}</dd></div>
        {order.notes && <div className="flex justify-between"><dt className="text-gray-500">Notes</dt><dd className="text-right max-w-xs">{order.notes}</dd></div>}
      </dl>
    </div>
  )
}

// ─── Client Details Card ──────────────────────────────────────────────────────

function ClientDetailsCard({ order, isAdmin, editing, setEditing, onSaved }: any) {
  const [form, setForm] = useState({
    name: order.client_name || '',
    contact_person: order.contact_person || '',
    mobile: order.client_mobile || '',
    mobile2: order.client_mobile2 || '',
    email: order.client_email || '',
    gstin: order.client_gstin || '',
    billing_address: order.billing_address || '',
    billing_city: order.billing_city || '',
    billing_state: order.billing_state || '',
    billing_zip: order.billing_zip || '',
    dispatch_instructions: order.dispatch_instructions || '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await clientsApi.update(order.client_id, form)
      onSaved()
      setEditing(false)
      toast.success('Client details updated')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (editing) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Client Details</h3>
          <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Client Name', key: 'name' },
            { label: 'Contact Person', key: 'contact_person' },
            { label: 'Mobile', key: 'mobile' },
            { label: 'Mobile 2', key: 'mobile2' },
            { label: 'Email', key: 'email' },
            { label: 'GSTIN', key: 'gstin' },
            { label: 'Billing Address', key: 'billing_address' },
            { label: 'City', key: 'billing_city' },
            { label: 'State', key: 'billing_state' },
            { label: 'ZIP', key: 'billing_zip' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-gray-500 mb-1">{label}</label>
              <input className="input-field" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-gray-500 mb-1">Dispatch Instructions</label>
            <textarea className="input-field" rows={2} value={form.dispatch_instructions} onChange={e => setForm(f => ({ ...f, dispatch_instructions: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1 py-1.5 text-sm"><Check size={14} />{saving ? 'Saving…' : 'Save'}</button>
          <button onClick={() => setEditing(false)} className="btn-secondary py-1.5 text-sm">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Client Details</h3>
        {isAdmin && <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><Pencil size={14} /></button>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
        {order.contact_person && <Row label="Contact Person" value={order.contact_person} />}
        {order.client_mobile && <Row label="Mobile" value={order.client_mobile} />}
        {order.client_mobile2 && <Row label="Mobile 2" value={order.client_mobile2} />}
        {order.client_email && <Row label="Email" value={order.client_email} />}
        {order.client_gstin && <Row label="GSTIN" value={order.client_gstin} />}
        {order.billing_address && (
          <div className="sm:col-span-2">
            <dt className="text-gray-500 mb-0.5">Billing Address</dt>
            <dd>{[order.billing_address, order.billing_city, order.billing_state, order.billing_zip].filter(Boolean).join(', ')}</dd>
          </div>
        )}
        {order.dispatch_instructions && (
          <div className="sm:col-span-2">
            <dt className="text-gray-500 mb-0.5">Dispatch Instructions</dt>
            <dd className="text-gray-700">{order.dispatch_instructions}</dd>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dispatch Details Card ────────────────────────────────────────────────────

function DispatchCard({ order, isAdmin, editing, setEditing, onSaved }: any) {
  const d = order.dispatch || {}
  const [form, setForm] = useState({
    dispatch_date: d.dispatch_date ? new Date(d.dispatch_date).toISOString().split('T')[0] : '',
    dispatched_by: d.dispatched_by || '',
    courier_name: d.courier_name || '',
    awb_number: d.awb_number || '',
    awb_link: d.awb_link || '',
    lr_link: d.lr_link || '',
    notes: d.notes || '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await ordersApi.updateDispatch(order.id, form)
      onSaved()
      setEditing(false)
      toast.success('Dispatch details updated')
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  if (editing) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Dispatch Details</h3>
          <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><label className="block text-gray-500 mb-1">Dispatch Date</label>
            <input type="date" className="input-field" value={form.dispatch_date} onChange={e => setForm(f => ({ ...f, dispatch_date: e.target.value }))} /></div>
          <div><label className="block text-gray-500 mb-1">Dispatched By</label>
            <input className="input-field" value={form.dispatched_by} onChange={e => setForm(f => ({ ...f, dispatched_by: e.target.value }))} /></div>
          <div><label className="block text-gray-500 mb-1">Courier Name</label>
            <input className="input-field" value={form.courier_name} onChange={e => setForm(f => ({ ...f, courier_name: e.target.value }))} /></div>
          <div><label className="block text-gray-500 mb-1">AWB / Tracking No.</label>
            <input className="input-field" value={form.awb_number} onChange={e => setForm(f => ({ ...f, awb_number: e.target.value }))} /></div>
          <div><label className="block text-gray-500 mb-1">AWB Link</label>
            <input className="input-field" value={form.awb_link} onChange={e => setForm(f => ({ ...f, awb_link: e.target.value }))} placeholder="https://…" /></div>
          <div><label className="block text-gray-500 mb-1">LR Link</label>
            <input className="input-field" value={form.lr_link} onChange={e => setForm(f => ({ ...f, lr_link: e.target.value }))} placeholder="https://…" /></div>
          <div className="col-span-2"><label className="block text-gray-500 mb-1">Notes</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1 py-1.5 text-sm"><Check size={14} />{saving ? 'Saving…' : 'Save'}</button>
          <button onClick={() => setEditing(false)} className="btn-secondary py-1.5 text-sm">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Dispatch Details</h3>
        {isAdmin && <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><Pencil size={14} /></button>}
      </div>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <Row label="Dispatch Date" value={fmt(d.dispatch_date)} />
        <Row label="Dispatched By" value={d.dispatched_by} />
        <Row label="Courier" value={d.courier_name} />
        <Row label="AWB No." value={d.awb_number} />
        {d.awb_link && <div className="col-span-2"><dt className="text-gray-500 mb-0.5">AWB Link</dt><dd><a href={d.awb_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-all">{d.awb_link}</a></dd></div>}
        {d.lr_link && <div className="col-span-2"><dt className="text-gray-500 mb-0.5">LR Link</dt><dd><a href={d.lr_link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs break-all">{d.lr_link}</a></dd></div>}
        {d.notes && <div className="col-span-2"><Row label="Notes" value={d.notes} /></div>}
      </dl>
    </div>
  )
}

// ─── Order Items Card ─────────────────────────────────────────────────────────

function OrderItemsCard({ order, id, isSuperAdmin, editing, setEditing, onSaved }: any) {
  const [rows, setRows] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setRows((order.items || []).map((item: any) => ({
      description: item.description || item.product_name || '',
      quantity_pcs: item.quantity_pcs ?? 0,
      quantity_kgs: item.quantity_kgs ?? 0,
      uom: item.uom || 'mtr',
      rate: item.rate ?? 0,
      total: item.total ?? 0,
    })))
    setEditing(true)
  }

  const updateRow = (idx: number, field: string, value: any) => {
    setRows(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      if (field === 'quantity_pcs' || field === 'quantity_kgs' || field === 'rate' || field === 'uom') {
        const r = next[idx]
        const uom = (r.uom || '').toLowerCase()
        const qty = uom === 'kgs' || uom === 'mt' ? parseFloat(r.quantity_kgs) || 0 : parseInt(r.quantity_pcs) || 0
        next[idx].total = parseFloat((qty * (parseFloat(r.rate) || 0)).toFixed(2))
      }
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      await ordersApi.updateItems(parseInt(id), rows)
      onSaved()
      setEditing(false)
      toast.success('Items updated')
    } catch { toast.error('Failed to save items') }
    finally { setSaving(false) }
  }

  if (editing) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Order Items</h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => setRows(r => [...r, { description: '', quantity_pcs: 0, quantity_kgs: 0, uom: 'mtr', rate: 0, total: 0 }])} className="btn-secondary py-1 text-xs flex items-center gap-1"><Plus size={12} />Add Row</button>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
        </div>
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="border border-gray-100 rounded-lg p-3">
              <div className="grid grid-cols-6 gap-2 text-sm">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Description</label>
                  <input className="input-field text-xs" value={row.description} onChange={e => updateRow(idx, 'description', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Qty (Pcs)</label>
                  <input type="number" min="0" className="input-field text-xs" value={row.quantity_pcs} onChange={e => updateRow(idx, 'quantity_pcs', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Qty (Kgs)</label>
                  <input type="number" min="0" step="0.001" className="input-field text-xs" value={row.quantity_kgs} onChange={e => updateRow(idx, 'quantity_kgs', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">UOM</label>
                  <select className="input-field text-xs" value={row.uom} onChange={e => updateRow(idx, 'uom', e.target.value)}>
                    <option value="mtr">Mtr</option><option value="pcs">Pcs</option><option value="kgs">Kgs</option><option value="nos">Nos</option><option value="mt">MT</option><option value="set">Set</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rate</label>
                  <input type="number" min="0" step="0.01" className="input-field text-xs" value={row.rate} onChange={e => updateRow(idx, 'rate', e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">Total: <span className="font-medium text-gray-900">₹{Number(row.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></span>
                {rows.length > 1 && <button type="button" onClick={() => setRows(r => r.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 text-xs flex items-center gap-1"><Trash2 size={11} />Remove</button>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1 py-1.5 text-sm"><Check size={14} />{saving ? 'Saving…' : 'Save Items'}</button>
          <button onClick={() => setEditing(false)} className="btn-secondary py-1.5 text-sm">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Order Items</h3>
        {isSuperAdmin && <button onClick={startEdit} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"><Pencil size={14} /></button>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-2 text-gray-500 font-medium">Sl.</th>
              <th className="pb-2 text-gray-500 font-medium">Description</th>
              <th className="pb-2 text-gray-500 font-medium">Qty (Pcs)</th>
              <th className="pb-2 text-gray-500 font-medium">Qty (Kgs)</th>
              <th className="pb-2 text-gray-500 font-medium">UOM</th>
              <th className="pb-2 text-gray-500 font-medium">Rate</th>
              <th className="pb-2 text-gray-500 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(order.items || []).map((item: any, idx: number) => (
              <tr key={item.id}>
                <td className="py-2 text-gray-500">{idx + 1}</td>
                <td className="py-2">{item.description || item.product_name}</td>
                <td className="py-2">{item.quantity_pcs || 0}</td>
                <td className="py-2">{item.quantity_kgs ? Number(item.quantity_kgs).toLocaleString('en-IN') : 0}</td>
                <td className="py-2">{item.uom}</td>
                <td className="py-2">₹{Number(item.rate).toLocaleString('en-IN')}</td>
                <td className="py-2 font-medium">₹{Number(item.total).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  )
}
