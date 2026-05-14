import { useQuery } from '@tanstack/react-query'
import { offersApi } from '../services/api'
import { X, Download, Send } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'

export default function OfferDocument({ offerId, onClose }: { offerId: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [sending, setSending] = useState(false)

  const { data: offer, isLoading } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => offersApi.get(offerId).then(r => r.data.data),
  })

  const downloadPDF = async () => {
    if (!ref.current) return
    const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const w = pdf.internal.pageSize.getWidth()
    const h = (canvas.height * w) / canvas.width
    pdf.addImage(img, 'PNG', 0, 0, w, h)
    pdf.save(`${offer?.offer_no?.replace(/\//g, '-')}.pdf`)
  }

  const sendEmail = async () => {
    setSending(true)
    try {
      await offersApi.send(offerId)
      toast.success('Offer emailed to customer')
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8"><LoadingSpinner /></div>
    </div>
  )
  if (!offer) return null

  const items = offer.items || []

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Offer / Quotation — {offer.offer_no}</h2>
          <div className="flex gap-2">
            <button onClick={sendEmail} disabled={sending} className="btn-secondary text-sm flex items-center gap-1">
              <Send size={14} />{sending ? 'Sending…' : 'Email to Customer'}
            </button>
            <button onClick={downloadPDF} className="btn-primary text-sm flex items-center gap-1"><Download size={14} />Download PDF</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 bg-gray-100">
          <div ref={ref} className="bg-white mx-auto p-8 shadow-sm" style={{ width: '794px', minHeight: '1123px', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
              <div className="text-2xl font-bold text-blue-800 tracking-wide">{offer.brand_name || 'AMI ENTERPRISES PVT. LTD.'}</div>
              <div className="text-xs text-gray-600 mt-1">{offer.brand_address || 'Manufacturer of Lancing Pipes & Allied Products'}</div>
              {offer.brand_gstin && <div className="text-xs text-gray-600">GSTIN: {offer.brand_gstin}</div>}
            </div>

            <div className="text-center text-base font-bold mb-4 border border-gray-400 py-1">QUOTATION / OFFER</div>

            {/* Customer + Offer details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div className="border border-gray-300 p-3">
                <div className="font-bold text-sm mb-2">To,</div>
                <div className="font-semibold">{offer.customer_name}</div>
                {offer.contact_person && <div className="text-gray-600">Attn: {offer.contact_person}</div>}
                {offer.customer_city && <div className="text-gray-600">{offer.customer_city}</div>}
                {offer.customer_email && <div className="text-gray-600">{offer.customer_email}</div>}
                {offer.customer_mobile && <div className="text-gray-600">{offer.customer_mobile}</div>}
              </div>
              <div className="border border-gray-300 p-3 space-y-1">
                <div className="flex justify-between"><span className="text-gray-600">Offer No.:</span><span className="font-semibold">{offer.offer_no}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Offer Date:</span><span>{offer.offer_date}</span></div>
                {offer.validity_date && <div className="flex justify-between"><span className="text-gray-600">Valid Until:</span><span>{offer.validity_date}</span></div>}
                {offer.enquiry_no && <div className="flex justify-between"><span className="text-gray-600">Enquiry No.:</span><span>{offer.enquiry_no}</span></div>}
                {offer.enquiry_date && <div className="flex justify-between"><span className="text-gray-600">Enquiry Date:</span><span>{offer.enquiry_date}</span></div>}
                {offer.due_date && <div className="flex justify-between"><span className="text-gray-600">Due Date:</span><span>{offer.due_date}</span></div>}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-center w-8">Sr.</th>
                  <th className="border border-gray-400 p-2 text-center w-20">Mat. No.</th>
                  <th className="border border-gray-400 p-2 text-left">Description</th>
                  <th className="border border-gray-400 p-2 text-center w-14">Qty</th>
                  <th className="border border-gray-400 p-2 text-center w-12">UOM</th>
                  <th className="border border-gray-400 p-2 text-right w-20">Rate (₹)</th>
                  <th className="border border-gray-400 p-2 text-left w-32">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, idx: number) => (
                  <tr key={item.id}>
                    <td className="border border-gray-400 p-2 text-center">{idx + 1}</td>
                    <td className="border border-gray-400 p-2 text-center">{item.material_no || '—'}</td>
                    <td className="border border-gray-400 p-2">{item.description}</td>
                    <td className="border border-gray-400 p-2 text-center">{parseFloat(item.qty)}</td>
                    <td className="border border-gray-400 p-2 text-center">{item.uom}</td>
                    <td className="border border-gray-400 p-2 text-right">{parseFloat(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="border border-gray-400 p-2">{item.remarks || ''}</td>
                  </tr>
                ))}
                {items.length < 6 && Array.from({ length: 6 - items.length }).map((_, i) => (
                  <tr key={`e-${i}`}>
                    {Array.from({ length: 7 }).map((__, j) => <td key={j} className="border border-gray-400 p-2">&nbsp;</td>)}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Terms & Conditions */}
            <div className="border border-gray-300 p-3 mb-4 text-xs">
              <div className="font-bold mb-2">TERMS & CONDITIONS:</div>
              <div className="space-y-1">
                {offer.terms_gst && <div><span className="font-semibold">GST: </span>{offer.terms_gst}</div>}
                {offer.terms_price_validity && <div><span className="font-semibold">Price Validity: </span>{offer.terms_price_validity}</div>}
                {offer.terms_delivery && <div><span className="font-semibold">Delivery: </span>{offer.terms_delivery}</div>}
                {offer.terms_supply_basis && <div><span className="font-semibold">Supply Basis: </span>{offer.terms_supply_basis}</div>}
                {offer.terms_weight_tolerance && <div><span className="font-semibold">Weight Tolerance: </span>{offer.terms_weight_tolerance}</div>}
                {offer.terms_force_majure && <div><span className="font-semibold">Force Majeure: </span>{offer.terms_force_majure}</div>}
                {offer.terms_payment && <div><span className="font-semibold">Payment: </span>{offer.terms_payment}</div>}
                {offer.notes && <div><span className="font-semibold">Notes: </span>{offer.notes}</div>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-8 text-xs">
              <div>
                {offer.brand_pan && <div>PAN: {offer.brand_pan}</div>}
                {offer.brand_gstin && <div>GSTIN: {offer.brand_gstin}</div>}
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2 mt-8 w-40">Authorised Signatory</div>
                <div className="text-gray-600 mt-1">{offer.brand_name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
