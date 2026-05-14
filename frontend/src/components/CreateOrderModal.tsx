import { useState, useEffect } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { ordersApi } from '../services/api'
import { X, Plus, Trash2 } from 'lucide-react'
import type { Client, Product, ProductVariant, Brand } from '../types'
import toast from 'react-hot-toast'

interface Props {
  brands: Brand[]
  clients: Client[]
  products: Product[]
  onClose: () => void
  onSuccess: () => void
}

interface ItemRowProps {
  index: number
  control: any
  register: any
  setValue: any
  remove: () => void
  showRemove: boolean
  brandFilteredProducts: Product[]
}

function OrderItemRow({ index, control, register, setValue, remove, showRemove, brandFilteredProducts }: ItemRowProps) {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string>('')

  const variants: ProductVariant[] = selectedProductId
    ? (brandFilteredProducts.find(p => p.id === selectedProductId)?.variants || [])
    : []

  const watchQtyPcs = useWatch({ control, name: `items.${index}.quantity_pcs` })
  const watchQtyKgs = useWatch({ control, name: `items.${index}.quantity_kgs` })
  const watchRate = useWatch({ control, name: `items.${index}.rate` })
  const watchUom = useWatch({ control, name: `items.${index}.uom` })

  useEffect(() => {
    const uom = (watchUom || '').toLowerCase()
    const qty = uom === 'kgs' || uom === 'mt'
      ? parseFloat(watchQtyKgs) || 0
      : parseInt(watchQtyPcs) || 0
    const rate = parseFloat(watchRate) || 0
    setValue(`items.${index}.total`, parseFloat((qty * rate).toFixed(2)))
  }, [watchQtyPcs, watchQtyKgs, watchRate, watchUom])

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = parseInt(e.target.value) || null
    setSelectedProductId(pid)
    setSelectedVariantId('')
    setValue(`items.${index}.product_variant_id`, '')
    setValue(`items.${index}.description`, '')
    setValue(`items.${index}.rate`, 0)
    setValue(`items.${index}.total`, 0)
  }

  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const variantId = e.target.value
    setSelectedVariantId(variantId)
    setValue(`items.${index}.product_variant_id`, variantId)

    const variant = variants.find(v => v.id === parseInt(variantId))
    if (variant) {
      const product = brandFilteredProducts.find(p => p.id === selectedProductId)
      setValue(`items.${index}.description`, `${product?.item_name} — ${variant.variant_name}`)
      setValue(`items.${index}.uom`, variant.uom || 'mtr')
      setValue(`items.${index}.rate`, variant.client_rate ?? 0)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
          <select
            className="input-field"
            value={selectedProductId ?? ''}
            onChange={handleProductChange}
          >
            <option value="">Select product</option>
            {brandFilteredProducts.map(p => (
              <option key={p.id} value={p.id}>{p.item_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Variant *</label>
          <select
            className="input-field"
            disabled={!selectedProductId}
            value={selectedVariantId}
            onChange={handleVariantChange}
          >
            <option value="">{selectedProductId ? 'Select variant' : '— select product first —'}</option>
            {variants.map(v => (
              <option key={v.id} value={v.id}>{v.variant_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Qty (Pcs)</label>
          <input type="number" min="0" className="input-field" {...register(`items.${index}.quantity_pcs`)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Qty (Kgs)</label>
          <input type="number" min="0" step="0.001" className="input-field" {...register(`items.${index}.quantity_kgs`)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">UOM</label>
          <select className="input-field" {...register(`items.${index}.uom`)}>
            <option value="mtr">Mtr</option>
            <option value="pcs">Pcs</option>
            <option value="kgs">Kgs</option>
            <option value="nos">Nos</option>
            <option value="mt">MT</option>
            <option value="set">Set</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rate</label>
          <input type="number" min="0" step="0.01" className="input-field" {...register(`items.${index}.rate`)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
          <input type="number" readOnly className="input-field bg-gray-50 cursor-default" {...register(`items.${index}.total`)} />
        </div>
      </div>

      {showRemove && (
        <button type="button" onClick={remove} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
          <Trash2 size={12} /> Remove item
        </button>
      )}
    </div>
  )
}

export default function CreateOrderModal({ brands, clients, products, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const defaultBrandId = String(
    (brands.find(b => b.name.toLowerCase().includes('ami enterprise')) || brands[0])?.id || ''
  )

  const { register, control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      brand_id: defaultBrandId,
      client_id: '',
      order_type: 'domestic',
      gst_type: 'cgst_sgst',
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      delivery_mode: '',
      po_no: '',
      po_date: '',
      notes: '',
      items: [{ product_variant_id: '', description: '', quantity_pcs: 0, quantity_kgs: 0, uom: 'mtr', rate: 0, total: 0 }]
    }
  })

  const selectedBrandId = parseInt(watch('brand_id') || '0')
  const filteredClients = selectedBrandId ? clients.filter(c => c.brand_id === selectedBrandId) : clients
  const brandFilteredProducts = products.filter(p => !selectedBrandId || p.brand_id === selectedBrandId)

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const onSubmit = async (values: any) => {
    setLoading(true)
    try {
      const items = values.items.map((item: any) => ({
        ...item,
        product_variant_id: item.product_variant_id ? parseInt(item.product_variant_id) : null,
        quantity_pcs: parseInt(item.quantity_pcs) || 0,
        quantity_kgs: parseFloat(item.quantity_kgs) || 0,
        rate: parseFloat(item.rate) || 0,
        total: parseFloat(item.total) || 0,
      }))
      await ordersApi.create({ ...values, brand_id: parseInt(values.brand_id), client_id: parseInt(values.client_id), items })
      onSuccess()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">New Order</h2>
          <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-gray-700" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <select className="input-field" {...register('brand_id', { required: true })}>
                <option value="">Select company</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select className="input-field" {...register('client_id', { required: true })}>
                <option value="">Select client</option>
                {filteredClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
              <select className="input-field" {...register('order_type')}>
                <option value="domestic">Domestic</option>
                <option value="export">Export</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Type</label>
              <select className="input-field" {...register('gst_type')}>
                <option value="cgst_sgst">CGST 9% + SGST 9% (Intra-state)</option>
                <option value="igst">IGST 18% (Inter-state / Export)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
              <input type="date" className="input-field" {...register('order_date', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
              <input type="date" className="input-field" {...register('delivery_date')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Mode</label>
              <input className="input-field" placeholder="e.g. Road, Rail" {...register('delivery_mode')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client PO No.</label>
              <input className="input-field" placeholder="Client's PO number" {...register('po_no')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client PO Date</label>
              <input type="date" className="input-field" {...register('po_date')} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Order Items</h3>
              <button
                type="button"
                onClick={() => append({ product_variant_id: '', description: '', quantity_pcs: 0, quantity_kgs: 0, uom: 'mtr', rate: 0, total: 0 })}
                className="btn-secondary py-1 flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <OrderItemRow
                  key={field.id}
                  index={idx}
                  control={control}
                  register={register}
                  setValue={setValue}
                  remove={() => remove(idx)}
                  showRemove={fields.length > 1}
                  brandFilteredProducts={brandFilteredProducts}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="input-field" rows={2} {...register('notes')} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Creating...' : 'Create Order'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
