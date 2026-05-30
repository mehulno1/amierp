import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../services/api'
import { Plus, Settings2, Clock, Download, Search, RefreshCw, Edit2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { InventoryItem, InventoryType } from '../types'
import { useSortable } from '../hooks/useSortable'
import { SortIcon, thSort } from '../components/SortIcon'
import * as XLSX from 'xlsx'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import MetricCard from '../components/ui/MetricCard'
import StatusPill from '../components/ui/StatusPill'
import { fmtDate } from '../utils/formatDate'

const TYPES: { value: InventoryType; label: string }[] = [
  { value: 'finished_goods', label: 'Finished goods' },
  { value: 'raw_material', label: 'Raw materials' },
  { value: 'spare_parts', label: 'Spare parts' },
]

const UOM_OPTIONS = ['pcs', 'kgs', 'gms', 'mtr', 'ltr', 'ml', 'nos', 'set']

function fmtQty(val: any) {
  const n = parseFloat(String(val || 0))
  return n % 1 === 0 ? String(n) : n.toFixed(3)
}

type StockState = 'low' | 'out' | 'ok'

function getStockState(item: InventoryItem & { reserved_stock: number }): StockState {
  const avail = Number(item.current_stock) - Number(item.reserved_stock)
  if (avail <= 0) return 'out'
  if (item.minimum_stock && avail < Number(item.minimum_stock)) return 'low'
  return 'ok'
}

const TX_TYPES: Record<string, { label: string; cls: string }> = {
  opening_stock: { label: 'Opening Stock', cls: 'bg-blue-100 text-blue-700' },
  manual_add: { label: 'Manual Add', cls: 'bg-green-100 text-green-700' },
  manual_deduct: { label: 'Manual Deduct', cls: 'bg-orange-100 text-orange-700' },
  adjustment: { label: 'Adjustment', cls: 'bg-purple-100 text-purple-700' },
  purchase: { label: 'Purchase', cls: 'bg-teal-100 text-teal-700' },
  dispatch: { label: 'Dispatch', cls: 'bg-red-100 text-red-700' },
  reserved: { label: 'Reserved', cls: 'bg-gray-100 text-gray-700' },
  release: { label: 'Released', cls: 'bg-indigo-100 text-indigo-700' },
}

function AddItemModal({ activeType, onClose, onSuccess }: { activeType: InventoryType; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { brands } = useAuth()
  // Backend requires either header x-brand-id or body.brand_id to pass requireBrandContext;
  // include it in the form payload so the request works regardless of header state.
  const defaultBrandId = brands.length === 1 ? String(brands[0].id) : ''
  const { register, handleSubmit } = useForm({
    defaultValues: {
      brand_id: defaultBrandId,
      item_type: activeType,
      item_name: '', item_code: '', uom: 'pcs', current_stock: 0, minimum_stock: '',
    }
  })

  const onSubmit = async (data: any) => {
    if (!data.brand_id) { toast.error('Select a company'); return }
    setLoading(true)
    try {
      await inventoryApi.create({
        ...data,
        brand_id: parseInt(data.brand_id),
        current_stock: parseFloat(data.current_stock) || 0,
      })
      toast.success('Item added')
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  const typeLabel = TYPES.find(t => t.value === activeType)?.label || activeType

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-base font-semibold text-gray-900">Add {typeLabel} Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {brands.length > 1 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <select className="input-field" {...register('brand_id', { required: true })}>
                <option value="">Select company</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          ) : (
            <input type="hidden" {...register('brand_id', { required: true })} />
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input className="input-field" placeholder="e.g. Steel Rod 12mm" {...register('item_name', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
              <input className="input-field" placeholder="e.g. STL-12" {...register('item_code')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UOM *</label>
              <select className="input-field" {...register('uom')}>
                {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock</label>
              <input type="number" step="0.001" min="0" className="input-field" {...register('current_stock')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Alert</label>
              <input type="number" step="0.001" min="0" className="input-field" placeholder="Optional" {...register('minimum_stock')} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Adding...' : 'Add Item'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditItemModal({ item, onClose, onSuccess }: { item: InventoryItem; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm({
    defaultValues: { item_name: item.item_name, item_code: item.item_code || '', uom: item.uom }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await inventoryApi.update(item.id, data)
      toast.success('Item updated')
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-base font-semibold text-gray-900">Edit Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input className="input-field" {...register('item_name', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label>
              <input className="input-field" {...register('item_code')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UOM *</label>
              <select className="input-field" {...register('uom')}>
                {UOM_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdjustModal({ item, onClose, onSuccess }: { item: InventoryItem; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm({ defaultValues: { adjustment_type: 'add', quantity: '', notes: '' } })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await inventoryApi.adjust(item.id, { ...data, quantity: parseFloat(data.quantity) })
      toast.success('Stock updated')
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Adjust Stock</h2>
            <p className="text-xs text-gray-500 mt-0.5">{item.item_name} · Current: <strong>{fmtQty(item.current_stock)} {item.uom}</strong></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
            <select className="input-field" {...register('adjustment_type')}>
              <option value="add">Add Stock</option>
              <option value="subtract">Subtract Stock</option>
              <option value="set">Set to Value</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity ({item.uom}) *</label>
            <input type="number" step="0.001" min="0" className="input-field" {...register('quantity', { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input className="input-field" placeholder="Reason for adjustment..." {...register('notes')} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Update Stock'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function UpdateLevelsModal({ item, onClose, onSuccess }: { item: InventoryItem; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm({
    defaultValues: { minimum_stock: item.minimum_stock || '', maximum_stock: item.maximum_stock || '' }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await inventoryApi.updateLevels(item.id, data)
      toast.success('Stock levels updated')
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-base font-semibold text-gray-900">Update Stock Levels</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="bg-gray-50 mx-5 mt-5 rounded-lg p-3">
          <p className="font-medium text-gray-900 text-sm">{item.item_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">Current Stock: <strong>{fmtQty(item.current_stock)} {item.uom}</strong></p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock ({item.uom})</label>
            <input type="number" step="0.001" min="0" className="input-field" placeholder="0" {...register('minimum_stock')} />
            <p className="text-xs text-gray-400 mt-1">Alert when stock falls below this level</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Stock ({item.uom}) <span className="text-gray-400">(Optional)</span></label>
            <input type="number" step="0.001" min="0" className="input-field" placeholder="Leave empty for no limit" {...register('maximum_stock')} />
            <p className="text-xs text-gray-400 mt-1">Alert when stock exceeds this level (leave empty for no limit)</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Update Levels'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TransactionHistoryModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const { data: txns = [], isLoading } = useQuery({
    queryKey: ['inventory-txns', item.id],
    queryFn: () => inventoryApi.getTransactions(item.id).then(r => r.data.data),
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Transaction History</h2>
            <p className="text-xs text-gray-500 mt-0.5">{item.item_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? <LoadingSpinner /> : txns.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No transactions yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Qty Change</th>
                  <th className="pb-3">Stock Before</th>
                  <th className="pb-3">Stock After</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(txns as any[]).map((t: any) => {
                  const txInfo = TX_TYPES[t.transaction_type] || { label: t.transaction_type, cls: 'bg-gray-100 text-gray-700' }
                  const isNeg = ['manual_deduct', 'dispatch', 'reserved'].includes(t.transaction_type)
                  const qty = parseFloat(t.quantity)
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="py-3 text-gray-600 whitespace-nowrap">{new Date(t.created_at).toLocaleString('en-IN')}</td>
                      <td className="py-3">
                        <span className={`badge-status ${txInfo.cls}`}>{txInfo.label}</span>
                      </td>
                      <td className={`py-3 font-medium ${isNeg ? 'text-red-600' : 'text-green-600'}`}>
                        {isNeg ? '-' : '+'}{fmtQty(qty)}
                      </td>
                      <td className="py-3 text-gray-600">{t.stock_before != null ? fmtQty(t.stock_before) : '—'}</td>
                      <td className="py-3 text-gray-600">{t.stock_after != null ? fmtQty(t.stock_after) : '—'}</td>
                      <td className="py-3 text-gray-500 max-w-[200px] truncate">{t.notes || '—'}</td>
                      <td className="py-3 text-gray-500">{t.created_by_name || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t p-4 flex justify-end shrink-0">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  )
}

export default function Inventory() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [activeType, setActiveType] = useState<InventoryType>('finished_goods')
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null)
  const [levelsItem, setLevelsItem] = useState<InventoryItem | null>(null)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['inventory', activeType],
    queryFn: () => inventoryApi.getByType(activeType).then(r => r.data.data),
  })

  const allItems = items as (InventoryItem & { reserved_stock: number })[]

  const stats = useMemo(() => {
    const low = allItems.filter(i => {
      const avail = Number(i.current_stock) - Number(i.reserved_stock)
      return avail > 0 && i.minimum_stock && avail < Number(i.minimum_stock)
    }).length
    const out = allItems.filter(i => Number(i.current_stock) - Number(i.reserved_stock) <= 0).length
    return { total: allItems.length, low, out }
  }, [allItems])

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return allItems.filter(i => {
      const matchSearch = !s || i.item_name.toLowerCase().includes(s) || (i.item_code || '').toLowerCase().includes(s)
      const avail = Number(i.current_stock) - Number(i.reserved_stock)
      const matchFilter =
        stockFilter === 'all' ||
        (stockFilter === 'low' && avail > 0 && i.minimum_stock && avail < Number(i.minimum_stock)) ||
        (stockFilter === 'out' && avail <= 0)
      return matchSearch && matchFilter
    })
  }, [allItems, search, stockFilter])

  const { sorted, sortCol, sortDir, toggle } = useSortable(filtered, 'item_name')
  const si = (col: string) => <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sorted.map(i => ({
      Code: i.item_code, Name: i.item_name, UOM: i.uom,
      'Current Stock': i.current_stock, 'Reserved': i.reserved_stock,
      'Available': Number(i.current_stock) - Number(i.reserved_stock),
      'Min Stock': i.minimum_stock, 'Max Stock': i.maximum_stock,
      'Last Updated': fmtDate((i as any).updated_at),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, activeType)
    XLSX.writeFile(wb, `inventory_${activeType}.xlsx`)
  }

  const onAdjustSuccess = () => {
    setAdjustItem(null)
    qc.invalidateQueries({ queryKey: ['inventory', activeType] })
    qc.invalidateQueries({ queryKey: ['inventory-txns'] })
  }
  const onLevelsSuccess = () => {
    setLevelsItem(null)
    qc.invalidateQueries({ queryKey: ['inventory', activeType] })
  }

  const stockLevel = (i: InventoryItem & { reserved_stock: number }) => {
    const min = Number(i.minimum_stock || 0)
    const max = Number(i.maximum_stock || 0)
    const cur = Number(i.current_stock)
    const ref = max > 0 ? max : Math.max(min * 2, 1)
    return Math.max(0, Math.min(100, (cur / ref) * 100))
  }

  return (
    <div>
      <PageHeader
        breadcrumb={['Ami Enterprises', 'Inventory', TYPES.find(t => t.value === activeType)?.label ?? '']}
        title="Inventory"
        subtitle="Track and manage stock levels across all categories."
        actions={
          <>
            {activeType !== 'finished_goods' && isAdmin() && (
              <Button variant="primary" leadingIcon={<Plus size={14} />} onClick={() => setShowAdd(true)}>
                Add item
              </Button>
            )}
            <Button variant="secondary" leadingIcon={<Download size={14} />} onClick={exportExcel}>
              Export CSV
            </Button>
            <Button
              variant="secondary"
              leadingIcon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </>
        }
      />

      {/* Type Tabs */}
      <div
        className="flex gap-0 mb-5 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--rule-lt)' }}
      >
        {TYPES.map((t) => {
          const active = activeType === t.value
          return (
            <button
              key={t.value}
              onClick={() => {
                setActiveType(t.value)
                setSearch('')
                setStockFilter('all')
              }}
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
            </button>
          )
        })}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <MetricCard label="Total items" value={stats.total} sub={TYPES.find((t) => t.value === activeType)?.label} />
        <MetricCard
          label="Low stock items"
          value={stats.low}
          deltaPositive={false}
          sub={stats.low > 0 ? 'Restock needed' : 'All within limits'}
        />
        <MetricCard
          label="Out of stock"
          value={stats.out}
          deltaPositive={false}
          sub={stats.out > 0 ? 'Stockout warning' : 'All available'}
        />
      </div>

      {/* Search + stock filter */}
      <div
        className="flex flex-wrap gap-3 items-center mb-4 p-3"
        style={{ background: '#fff', border: '1px solid var(--rule-lt)' }}
      >
        <div className="relative flex-1 min-w-52">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--mute-lt)' }}
          />
          <input
            placeholder="Search by item name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            style={{
              padding: '10px 12px 10px 34px',
              background: 'var(--color-paper)',
              border: '1px solid var(--rule-lt-md)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'low', 'out'] as const).map((f) => {
            const active = stockFilter === f
            return (
              <button
                key={f}
                onClick={() => setStockFilter(f)}
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
                {f === 'all' ? 'All' : f === 'low' ? 'Low stock' : 'Out of stock'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--rule-lt)' }} className="overflow-hidden">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full"
              style={{ minWidth: 980, fontFamily: 'var(--font-sans)', fontSize: 13 }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--color-paper-alt)',
                    borderBottom: '1px solid var(--rule-lt)',
                  }}
                >
                  {[
                    { col: 'item_name', label: 'Item', sortable: true },
                    { col: 'current_stock', label: 'On hand', sortable: true },
                    { col: '', label: 'Reserved', sortable: false },
                    { col: '', label: 'Available', sortable: false },
                    { col: 'minimum_stock', label: 'Min / Max', sortable: true },
                    { col: '', label: 'Stock level', sortable: false },
                    { col: '', label: 'Status', sortable: false },
                    { col: 'updated_at', label: 'Last updated', sortable: true },
                    { col: '', label: 'Actions', sortable: false, align: 'right' as const },
                  ].map((h) => (
                    <th
                      key={h.label}
                      onClick={h.sortable ? () => toggle(h.col) : undefined}
                      className={h.sortable ? thSort : ''}
                      style={{
                        padding: '12px 16px',
                        textAlign: h.align ?? 'left',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        letterSpacing: '.18em',
                        textTransform: 'uppercase',
                        color: 'var(--mute-lt)',
                        cursor: h.sortable ? 'pointer' : 'default',
                      }}
                    >
                      {h.label} {h.sortable && si(h.col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((i: any) => {
                  const reserved = Number(i.reserved_stock)
                  const avail = Number(i.current_stock) - reserved
                  const state = getStockState(i)
                  const pct = stockLevel(i)
                  const barColor =
                    state === 'out'
                      ? 'var(--color-danger)'
                      : state === 'low'
                      ? 'var(--color-warm)'
                      : 'var(--color-success)'
                  const pillKind = state === 'out' ? 'overdue' : state === 'low' ? 'low' : 'healthy'
                  const pillLabel = state === 'out' ? 'Out' : state === 'low' ? 'Reorder' : 'In stock'

                  return (
                    <tr key={i.id} style={{ borderTop: '1px solid var(--rule-lt)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{i.item_name}</div>
                        {i.item_code && (
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color: 'var(--color-warm-dk)',
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            {i.item_code}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-serif)',
                            fontSize: 16,
                            fontWeight: 400,
                          }}
                        >
                          {fmtQty(i.current_stock)}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--mute-lt)', marginLeft: 4 }}>
                          {i.uom}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: reserved > 0 ? 'var(--color-warm-dk)' : 'var(--mute-lt)',
                        }}
                      >
                        {fmtQty(reserved)}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          fontWeight: 600,
                          color: avail > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                        }}
                      >
                        {fmtQty(avail)} {i.uom}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--mute-lt)',
                        }}
                      >
                        <div>Min: {i.minimum_stock ? fmtQty(i.minimum_stock) : '—'}</div>
                        <div>Max: {i.maximum_stock ? fmtQty(i.maximum_stock) : 'N/A'}</div>
                      </td>
                      <td style={{ padding: '14px 16px', minWidth: 120 }}>
                        <div style={{ height: 6, background: 'var(--color-paper-alt)', position: 'relative' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: barColor }} />
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--mute-lt)',
                            marginTop: 4,
                          }}
                        >
                          {Math.round(pct)}%
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusPill kind={pillKind} label={pillLabel} />
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--mute-lt)',
                        }}
                      >
                        {fmtDate(i.updated_at)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div className="flex items-center gap-2 justify-end">
                          {isAdmin() && (
                            <button
                              onClick={() => setEditItem(i)}
                              title="Edit Item"
                              style={{ color: 'var(--color-warm-dk)', padding: 4 }}
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => setAdjustItem(i)}
                            title="Adjust Stock"
                            style={{ color: 'var(--color-warm-dk)', padding: 4 }}
                          >
                            <Plus size={16} />
                          </button>
                          {isAdmin() && (
                            <button
                              onClick={() => setLevelsItem(i)}
                              title="Update Min/Max Levels"
                              style={{ color: 'var(--mute-lt)', padding: 4 }}
                            >
                              <Settings2 size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => setHistoryItem(i)}
                            title="Transaction History"
                            style={{ color: 'var(--mute-lt)', padding: 4 }}
                          >
                            <Clock size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        padding: '48px 0',
                        textAlign: 'center',
                        color: 'var(--mute-lt)',
                        fontSize: 13,
                      }}
                    >
                      {search || stockFilter !== 'all'
                        ? 'No items match your filters'
                        : 'No items in this category'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddItemModal
          activeType={activeType}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false)
            qc.invalidateQueries({ queryKey: ['inventory', activeType] })
          }}
        />
      )}
      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => {
            setEditItem(null)
            qc.invalidateQueries({ queryKey: ['inventory', activeType] })
          }}
        />
      )}
      {adjustItem && (
        <AdjustModal item={adjustItem} onClose={() => setAdjustItem(null)} onSuccess={onAdjustSuccess} />
      )}
      {levelsItem && (
        <UpdateLevelsModal item={levelsItem} onClose={() => setLevelsItem(null)} onSuccess={onLevelsSuccess} />
      )}
      {historyItem && (
        <TransactionHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />
      )}
    </div>
  )
}
