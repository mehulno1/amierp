import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../services/api'
import { Plus, Settings2, Clock, Download, Search, Package, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { InventoryItem, InventoryType } from '../types'
import { useSortable } from '../hooks/useSortable'
import { SortIcon, thSort } from '../components/SortIcon'
import * as XLSX from 'xlsx'

const TYPES: { value: InventoryType; label: string; emoji: string }[] = [
  { value: 'finished_goods', label: 'Finished Goods', emoji: '📦' },
  { value: 'raw_material', label: 'Raw Materials', emoji: '🧱' },
  { value: 'spare_parts', label: 'Spare Parts', emoji: '🔧' },
]

const UOM_OPTIONS = ['pcs', 'kgs', 'gms', 'mtr', 'ltr', 'ml', 'nos', 'set']

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
}

function fmtQty(val: any) {
  const n = parseFloat(String(val || 0))
  return n % 1 === 0 ? String(n) : n.toFixed(3)
}

function getStatus(item: InventoryItem & { reserved_stock: number }) {
  const avail = Number(item.current_stock) - Number(item.reserved_stock)
  if (avail <= 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700 border border-red-200' }
  if (item.minimum_stock && avail < Number(item.minimum_stock)) return { label: 'Low Stock', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200' }
  return { label: 'In Stock', cls: 'bg-green-100 text-green-700 border border-green-200' }
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
  const { register, handleSubmit } = useForm({
    defaultValues: { item_type: activeType, item_name: '', item_code: '', uom: 'pcs', current_stock: 0, minimum_stock: '' }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await inventoryApi.create({ ...data, current_stock: parseFloat(data.current_stock) || 0 })
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage stock levels for all inventory types</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeType !== 'finished_goods' && isAdmin() && (
            <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center justify-center gap-2 text-sm flex-1 sm:flex-initial"><Plus size={14} />Add Item</button>
          )}
          <button onClick={exportExcel} className="btn-secondary flex items-center justify-center gap-2 text-sm flex-1 sm:flex-initial"><Download size={14} />Export CSV</button>
          <button onClick={() => refetch()} disabled={isLoading} className="btn-secondary flex items-center justify-center gap-2 text-sm flex-1 sm:flex-initial">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />Refresh
          </button>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-gray-200">
        {TYPES.map(t => (
          <button key={t.value} onClick={() => { setActiveType(t.value); setSearch(''); setStockFilter('all') }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeType === t.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card p-4 bg-green-50 border border-green-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">Total Items</p>
            <p className="text-3xl font-bold text-green-900">{stats.total}</p>
          </div>
          <Package size={32} className="text-green-500" />
        </div>
        <div className="card p-4 bg-yellow-50 border border-yellow-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">Low Stock Items</p>
            <p className="text-3xl font-bold text-yellow-900">{stats.low}</p>
          </div>
          <AlertTriangle size={32} className="text-yellow-500" />
        </div>
        <div className="card p-4 bg-red-50 border border-red-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800">Out of Stock</p>
            <p className="text-3xl font-bold text-red-900">{stats.out}</p>
          </div>
          <XCircle size={32} className="text-red-500" />
        </div>
      </div>

      {/* Search + Filter */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by item name or code..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['all', 'low', 'out'] as const).map(f => (
            <button key={f} onClick={() => setStockFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                stockFilter === f
                  ? f === 'all' ? 'bg-blue-600 text-white' : f === 'low' ? 'bg-yellow-500 text-white' : 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
              {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-left bg-gray-50 border-b border-gray-200">
                  <th className={thSort + ' px-4 py-3 text-xs uppercase tracking-wider'} onClick={() => toggle('item_name')}>Item Details {si('item_name')}</th>
                  <th className={thSort + ' px-4 py-3 text-xs uppercase tracking-wider'} onClick={() => toggle('current_stock')}>Current Stock {si('current_stock')}</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  <th className={thSort + ' px-4 py-3 text-xs uppercase tracking-wider'} onClick={() => toggle('minimum_stock')}>Min / Max {si('minimum_stock')}</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className={thSort + ' px-4 py-3 text-xs uppercase tracking-wider'} onClick={() => toggle('updated_at')}>Last Updated {si('updated_at')}</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((i: any) => {
                  const reserved = Number(i.reserved_stock)
                  const avail = Number(i.current_stock) - reserved
                  const status = getStatus(i)
                  return (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{i.item_name}</div>
                        {i.item_code && <div className="text-xs text-gray-400 mt-0.5">Code: {i.item_code}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-lg font-semibold text-gray-900">{fmtQty(i.current_stock)}</span>
                        <span className="text-xs text-gray-400 ml-1">{i.uom}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium text-sm ${reserved > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{fmtQty(reserved)}</span>
                        <div className="text-xs text-gray-400">Reserved</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium text-sm ${avail > 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtQty(avail)} {i.uom}</span>
                        <div className="text-xs text-gray-400">Available</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        <div>Min: {i.minimum_stock ? fmtQty(i.minimum_stock) : '—'}</div>
                        <div>Max: {i.maximum_stock ? fmtQty(i.maximum_stock) : 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge-status ${status.cls} inline-flex items-center gap-1`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(i.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setAdjustItem(i)} title="Adjust Stock" className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700"><Plus size={16} /></button>
                          {isAdmin() && <button onClick={() => setLevelsItem(i)} title="Update Min/Max Levels" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"><Settings2 size={16} /></button>}
                          <button onClick={() => setHistoryItem(i)} title="Transaction History" className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 hover:text-green-700"><Clock size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {sorted.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400">
                    {search || stockFilter !== 'all' ? 'No items match your filters' : 'No items in this category'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <AddItemModal activeType={activeType} onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['inventory', activeType] }) }} />}
      {adjustItem && <AdjustModal item={adjustItem} onClose={() => setAdjustItem(null)} onSuccess={onAdjustSuccess} />}
      {levelsItem && <UpdateLevelsModal item={levelsItem} onClose={() => setLevelsItem(null)} onSuccess={onLevelsSuccess} />}
      {historyItem && <TransactionHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />}
    </div>
  )
}
