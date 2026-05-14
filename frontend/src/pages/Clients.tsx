import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '../services/api'
import { Plus, Search, Edit2, Trash2, MapPin, Mail, Phone } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { useSortable } from '../hooks/useSortable'
import { SortIcon, thSort } from '../components/SortIcon'
import type { Client } from '../types'

function ClientModal({ client, onClose, onSuccess }: { client?: Client; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { brands } = useAuth()
  const defaultBrandId = client?.brand_id ? String(client.brand_id) : (brands.length === 1 ? String(brands[0].id) : '')
  const { register, handleSubmit } = useForm({ defaultValues: { ...client, brand_id: defaultBrandId } })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      if (client) await clientsApi.update(client.id, data)
      else await clientsApi.create({ ...data, brand_id: parseInt(data.brand_id) })
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <h2 className="text-lg font-semibold">{client ? 'Edit Client' : 'New Client'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!client && brands.length > 1 && (
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                <select className="input-field" {...register('brand_id', { required: !client })}>
                  <option value="">Select company</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label><input className="input-field" {...register('name', { required: true })} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label><input className="input-field" {...register('contact_person')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label><input className="input-field" {...register('mobile')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile 2</label><input className="input-field" {...register('mobile2')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input className="input-field" type="email" {...register('email')} /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label><input className="input-field" {...register('gstin')} /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label><textarea className="input-field" rows={2} {...register('billing_address')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Billing City</label><input className="input-field" {...register('billing_city')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Billing State</label><input className="input-field" {...register('billing_state')} /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Dispatch Instructions</label><textarea className="input-field" rows={2} {...register('dispatch_instructions')} /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea className="input-field" rows={2} {...register('notes')} /></div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary order-2 sm:order-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary order-1 sm:order-2">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Clients() {
  const { isAdmin, brands } = useAuth()
  const showCompany = brands.length > 1
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [modal, setModal] = useState<{ open: boolean; client?: Client }>({ open: false })

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list().then(r => r.data.data),
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this client?')) return
    await clientsApi.delete(id)
    qc.invalidateQueries({ queryKey: ['clients'] })
    toast.success('Client deactivated')
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return (clients as Client[]).filter(c => {
      const matchSearch = !s ||
        c.name.toLowerCase().includes(s) ||
        (c.contact_person || '').toLowerCase().includes(s) ||
        ((c as any).brand_name || '').toLowerCase().includes(s) ||
        (c.billing_city || '').toLowerCase().includes(s) ||
        (c.mobile || '').toLowerCase().includes(s) ||
        (c.email || '').toLowerCase().includes(s)
      const matchBrand = !brandFilter || String(c.brand_id) === brandFilter
      return matchSearch && matchBrand
    })
  }, [clients, search, brandFilter])

  const { sorted, sortCol, sortDir, toggle } = useSortable(filtered, 'name')
  const si = (col: string) => <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage client information ({(clients as Client[]).length} total)</p>
        </div>
        {isAdmin() && (
          <button onClick={() => setModal({ open: true })} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus size={16} />Add Client
          </button>
        )}
      </div>

      {/* Search/Filter Card */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Search</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input-field pl-9" placeholder="Client name, contact, city..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          {showCompany && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Company</label>
              <select className="input-field" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
                <option value="">All companies</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div className="lg:self-end">
            <button onClick={() => { setSearch(''); setBrandFilter('') }} className="btn-secondary w-full lg:w-auto h-[42px]">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Clients</h2>
        </div>

        {isLoading ? <LoadingSpinner /> : sorted.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No clients found</p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-50 border-b border-gray-200">
                    <th className={thSort + ' px-4 py-3 text-xs uppercase tracking-wider'} onClick={() => toggle('name')}>Client Name {si('name')}</th>
                    {showCompany && <th className={thSort + ' px-4 py-3 text-xs uppercase tracking-wider'} onClick={() => toggle('brand_name')}>Company {si('brand_name')}</th>}
                    <th className={thSort + ' px-4 py-3 text-xs uppercase tracking-wider'} onClick={() => toggle('billing_city')}>Location {si('billing_city')}</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className={thSort + ' px-4 py-3 text-xs uppercase tracking-wider'} onClick={() => toggle('gstin')}>GST {si('gstin')}</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{c.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">ID: {c.id}{c.contact_person && ` · ${c.contact_person}`}</div>
                      </td>
                      {showCompany && (
                        <td className="px-4 py-3">
                          {c.brand_name && <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{c.brand_name}</span>}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-600">
                        {(c.billing_city || c.billing_state) ? (
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400 shrink-0" />
                            <span className="text-sm">{[c.billing_city, c.billing_state].filter(Boolean).join(', ')}</span>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        <div className="space-y-0.5">
                          {c.email && <div className="flex items-center gap-1"><Mail size={12} className="text-gray-400 shrink-0" />{c.email}</div>}
                          {c.mobile && <div className="flex items-center gap-1"><Phone size={12} className="text-gray-400 shrink-0" />{c.mobile}</div>}
                          {!c.email && !c.mobile && <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono">{c.gstin || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {isAdmin() && (
                            <>
                              <button onClick={() => setModal({ open: true, client: c })} title="Edit" className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700"><Edit2 size={15} /></button>
                              <button onClick={() => handleDelete(c.id)} title="Delete" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700"><Trash2 size={15} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {sorted.map((c: any) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{c.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">ID: {c.id}{c.contact_person && ` · ${c.contact_person}`}</div>
                      {showCompany && c.brand_name && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mt-1.5">{c.brand_name}</span>
                      )}
                    </div>
                    {isAdmin() && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setModal({ open: true, client: c })} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50"><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {(c.billing_city || c.billing_state) && (
                      <div className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400 shrink-0" />{[c.billing_city, c.billing_state].filter(Boolean).join(', ')}</div>
                    )}
                    {c.email && <div className="flex items-center gap-1.5"><Mail size={12} className="text-gray-400 shrink-0" /><span className="truncate">{c.email}</span></div>}
                    {c.mobile && <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400 shrink-0" />{c.mobile}</div>}
                    {c.gstin && <div className="text-xs font-mono text-gray-500 pt-1">GST: {c.gstin}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modal.open && <ClientModal client={modal.client} onClose={() => setModal({ open: false })} onSuccess={() => { setModal({ open: false }); qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Saved') }} />}
    </div>
  )
}
