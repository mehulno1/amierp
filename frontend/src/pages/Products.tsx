import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../services/api'
import { Plus, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import type { Product, ProductVariant } from '../types'
import { useAuth } from '../hooks/useAuth'

function ProductModal({ product, onClose, onSuccess }: { product?: Product; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { brands } = useAuth()
  const defaultBrandId = product?.brand_id ? String(product.brand_id) : (brands.length === 1 ? String(brands[0].id) : '')
  const { register, handleSubmit } = useForm({ defaultValues: { ...product, brand_id: defaultBrandId } })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      if (product) await productsApi.update(product.id, data)
      else await productsApi.create({ ...data, brand_id: parseInt(data.brand_id) })
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {!product && brands.length > 1 && (
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <select className="input-field" {...register('brand_id', { required: !product })}>
                <option value="">Select company</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label><input className="input-field" {...register('item_name', { required: true })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Item Code</label><input className="input-field" {...register('item_code')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><input className="input-field" {...register('category')} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea className="input-field" rows={2} {...register('description')} /></div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function VariantModal({ productId, variant, onClose, onSuccess }: { productId: number; variant?: ProductVariant; onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm({ defaultValues: variant || { uom: 'mtr' } })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      if (variant) await productsApi.updateVariant(productId, variant.id, data)
      else await productsApi.createVariant(productId, data)
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{variant ? 'Edit Variant' : 'Add Variant'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Variant Name *</label><input className="input-field" placeholder="e.g. 8mm NB, 4x6mm" {...register('variant_name', { required: true })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">UOM</label>
              <select className="input-field" {...register('uom')}>
                <option value="mtr">Mtr</option><option value="pcs">Pcs</option><option value="kgs">Kgs</option>
                <option value="nos">Nos</option><option value="mt">MT</option><option value="set">Set</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Rate</label><input type="number" step="0.01" className="input-field" {...register('client_rate')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Length / piece (Mtr)</label><input type="number" step="0.001" className="input-field" {...register('length_per_piece_mtr')} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Weight / piece (Kg)</label><input type="number" step="0.001" className="input-field" {...register('weight_kg')} /></div>
          </div>
          <p className="text-xs text-gray-400">Rate is per the selected UOM. Per-piece length &amp; weight drive the pcs/kgs conversion on orders.</p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<any>({ open: false })
  const [variantModal, setVariantModal] = useState<any>({ open: false })
  const [expanded, setExpanded] = useState<number | null>(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then(r => r.data.data),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button onClick={() => setModal({ open: true })} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"><Plus size={16} />New Product</button>
      </div>

      <div className="card">
        {isLoading ? <LoadingSpinner /> : (
          <div className="space-y-2">
            {products.map((p: Product) => (
              <div key={p.id} className="border border-gray-100 rounded-lg">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                  <div>
                    <div className="font-medium text-gray-900">{p.item_name}</div>
                    <div className="text-xs text-gray-500">{p.item_code && `Code: ${p.item_code} · `}{p.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{(p.variants || []).length} variants</span>
                    <button onClick={e => { e.stopPropagation(); setModal({ open: true, product: p }) }} className="text-blue-500 hover:text-blue-700"><Edit2 size={14} /></button>
                    {expanded === p.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>
                {expanded === p.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Variants</span>
                      <button onClick={() => setVariantModal({ open: true, productId: p.id })} className="btn-secondary py-1 text-xs flex items-center gap-1"><Plus size={12} />Add Variant</button>
                    </div>
                    {(p.variants || []).length === 0 ? (
                      <p className="text-gray-400 text-sm">No variants yet</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead><tr className="text-left text-gray-500 text-xs">
                          <th className="pb-1">Variant</th><th className="pb-1">UOM</th><th className="pb-1">Rate</th><th className="pb-1">Length/pc (mtr)</th><th className="pb-1">Weight/pc (kg)</th><th className="pb-1">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {(p.variants || []).map(v => (
                            <tr key={v.id}>
                              <td className="py-1.5">{v.variant_name}</td>
                              <td className="py-1.5 text-gray-500">{v.uom}</td>
                              <td className="py-1.5">{v.client_rate ? `₹${v.client_rate}` : '—'}</td>
                              <td className="py-1.5">{(v as any).length_per_piece_mtr || '—'}</td>
                              <td className="py-1.5">{v.weight_kg || '—'}</td>
                              <td className="py-1.5">
                                <button onClick={() => setVariantModal({ open: true, productId: p.id, variant: v })} className="text-blue-500 hover:text-blue-700 mr-2"><Edit2 size={13} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
            {products.length === 0 && <p className="text-center text-gray-400 py-8">No products yet</p>}
          </div>
        )}
      </div>

      {modal.open && <ProductModal product={modal.product} onClose={() => setModal({ open: false })} onSuccess={() => { setModal({ open: false }); qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Saved') }} />}
      {variantModal.open && <VariantModal productId={variantModal.productId} variant={variantModal.variant} onClose={() => setVariantModal({ open: false })} onSuccess={() => { setVariantModal({ open: false }); qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Saved') }} />}
    </div>
  )
}
