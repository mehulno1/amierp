import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { vendorsApi } from '../services/api'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Vendor } from '../types'
import { useAuth } from '../hooks/useAuth'
import { useSortable } from '../hooks/useSortable'
import { SortIcon, thSort } from '../components/SortIcon'
import * as XLSX from 'xlsx'

function VendorModal({ vendor, onClose, onSuccess }: { vendor?: Vendor; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { brands } = useAuth()
  const defaultBrandId = vendor?.brand_id ? String(vendor.brand_id) : (brands.length === 1 ? String(brands[0].id) : '')
  const { register, handleSubmit } = useForm({ defaultValues: { ...vendor, brand_id: defaultBrandId } })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      if (vendor) await vendorsApi.update(vendor.id, data)
      else await vendorsApi.create({ ...data, brand_id: parseInt(data.brand_id) })
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{vendor ? 'Edit Vendor' : 'New Vendor'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {!vendor && brands.length > 1 && (
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <select className="input-field" {...register('brand_id', { required: !vendor })}>
                <option value="">Select company</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label><input className="input-field" {...register('name', { required: true })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label><input className="input-field" {...register('contact_person')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label><input className="input-field" {...register('mobile')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input className="input-field" type="email" {...register('email')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input className="input-field" {...register('city')} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><textarea className="input-field" rows={2} {...register('address')} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label><input className="input-field" {...register('gstin')} /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Vendors() {
  const qc = useQueryClient()
  const { brands } = useAuth()
  const showCompany = brands.length > 1
  const [modal, setModal] = useState<{ open: boolean; vendor?: Vendor }>({ open: false })
  const [search, setSearch] = useState('')

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => vendorsApi.list().then(r => r.data.data),
  })

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return (vendors as any[]).filter((v: any) =>
      !s || v.name.toLowerCase().includes(s) || (v.contact_person || '').toLowerCase().includes(s) || (v.city || '').toLowerCase().includes(s)
    )
  }, [vendors, search])

  const { sorted, sortCol, sortDir, toggle } = useSortable(filtered, 'name')
  const si = (col: string) => <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this vendor?')) return
    await vendorsApi.delete(id)
    qc.invalidateQueries({ queryKey: ['vendors'] })
    toast.success('Vendor deactivated')
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(vendors.map((v: Vendor) => ({ Name: v.name, Contact: v.contact_person, Mobile: v.mobile, Email: v.email, City: v.city, GSTIN: v.gstin })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vendors')
    XLSX.writeFile(wb, 'vendors.xlsx')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="btn-secondary text-sm flex-1 sm:flex-initial">Export</button>
          <button onClick={() => setModal({ open: true })} className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"><Plus size={16} />New Vendor</button>
        </div>
      </div>

      <div className="card">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {isLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className={thSort} onClick={() => toggle('name')}>Name {si('name')}</th>
                {showCompany && <th className="pb-3 text-gray-500 font-medium">Company</th>}
                <th className={thSort} onClick={() => toggle('contact_person')}>Contact {si('contact_person')}</th>
                <th className={thSort} onClick={() => toggle('mobile')}>Mobile {si('mobile')}</th>
                <th className={thSort} onClick={() => toggle('city')}>City {si('city')}</th>
                <th className={thSort} onClick={() => toggle('gstin')}>GSTIN {si('gstin')}</th>
                <th className="pb-3 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((v: any) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{v.name}</td>
                  {showCompany && <td className="py-3"><span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{v.brand_name}</span></td>}
                  <td className="py-3 text-gray-600">{v.contact_person || '—'}</td>
                  <td className="py-3 text-gray-600">{v.mobile || '—'}</td>
                  <td className="py-3 text-gray-600">{v.city || '—'}</td>
                  <td className="py-3 text-gray-500 font-mono text-xs">{v.gstin || '—'}</td>
                  <td className="py-3 flex gap-2">
                    <button onClick={() => setModal({ open: true, vendor: v })} className="text-blue-500 hover:text-blue-700"><Edit2 size={15} /></button>
                    <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && <tr><td colSpan={showCompany ? 7 : 6} className="py-8 text-center text-gray-400">{search ? 'No results found' : 'No vendors found'}</td></tr>}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {modal.open && <VendorModal vendor={modal.vendor} onClose={() => setModal({ open: false })} onSuccess={() => { setModal({ open: false }); qc.invalidateQueries({ queryKey: ['vendors'] }); toast.success('Saved') }} />}
    </div>
  )
}
