import { useQuery } from '@tanstack/react-query'
import { purchaseOrdersApi } from '../services/api'
import { X, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useRef } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function PODocument({ poId, onClose }: { poId: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', poId],
    queryFn: () => purchaseOrdersApi.get(poId).then(r => r.data.data),
  })

  const downloadPDF = async () => {
    if (!ref.current) return
    const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, allowTaint: true, logging: false })
    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgW = pageW
    const imgH = (canvas.height * imgW) / canvas.width
    let remaining = imgH
    let offset = 0
    while (remaining > 0) {
      pdf.addImage(imgData, 'JPEG', 0, -offset, imgW, imgH)
      remaining -= pageH
      offset += pageH
      if (remaining > 0) pdf.addPage()
    }
    pdf.save(`${po?.po_no?.replace(/\//g, '-')}.pdf`)
  }

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8"><LoadingSpinner /></div>
    </div>
  )
  if (!po) return null

  const items = po.items || []
  const basicTotal = items.reduce((s: number, i: any) => s + parseFloat(i.total || 0), 0)
  const gstAmount = basicTotal * (parseFloat(po.gst_percent || 18) / 100)
  const totalAmount = basicTotal + gstAmount

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 })

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Purchase Order — {po.po_no}</h2>
          <div className="flex gap-2">
            <button onClick={downloadPDF} className="btn-primary text-sm flex items-center gap-1"><Download size={14} />Download PDF</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 bg-gray-100">
          <div ref={ref} className="bg-white mx-auto p-8 shadow-sm" style={{ width: '794px', minHeight: '1123px', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
              <div className="text-2xl font-bold text-blue-800 tracking-wide">{po.brand_name || 'AMI ENTERPRISES PVT. LTD.'}</div>
              <div className="text-xs text-gray-600 mt-1">{po.brand_address || 'Manufacturer of Lancing Pipes & Allied Products'}</div>
              {po.brand_gstin && <div className="text-xs text-gray-600">GSTIN: {po.brand_gstin}</div>}
            </div>

            <div className="text-center text-base font-bold mb-4 border border-gray-400 py-1">PURCHASE ORDER</div>

            {/* PO details + Vendor */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div className="border border-gray-300 p-3">
                <div className="font-bold text-sm mb-2">To,</div>
                <div className="font-semibold">{po.vendor_name}</div>
                {po.vendor_address && <div className="text-gray-600 whitespace-pre-line">{po.vendor_address}</div>}
                {po.vendor_gstin && <div className="mt-1">GSTIN: <span className="font-mono">{po.vendor_gstin}</span></div>}
                {po.vendor_mobile && <div>Mobile: {po.vendor_mobile}</div>}
              </div>
              <div className="border border-gray-300 p-3 space-y-1">
                <div className="flex justify-between"><span className="text-gray-600">PO No.:</span><span className="font-semibold">{po.po_no}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">PO Date:</span><span>{po.po_date}</span></div>
                {po.quotation_no && <div className="flex justify-between"><span className="text-gray-600">Quotation No.:</span><span>{po.quotation_no}</span></div>}
                {po.quotation_date && <div className="flex justify-between"><span className="text-gray-600">Quotation Date:</span><span>{po.quotation_date}</span></div>}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-center w-8">Sr.</th>
                  <th className="border border-gray-400 p-2 text-center w-20">Mat. No.</th>
                  <th className="border border-gray-400 p-2 text-left">Description</th>
                  <th className="border border-gray-400 p-2 text-center w-16">Qty</th>
                  <th className="border border-gray-400 p-2 text-center w-12">UOM</th>
                  <th className="border border-gray-400 p-2 text-right w-20">Rate (₹)</th>
                  <th className="border border-gray-400 p-2 text-right w-24">Total (₹)</th>
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
                    <td className="border border-gray-400 p-2 text-right">{fmt(parseFloat(item.rate))}</td>
                    <td className="border border-gray-400 p-2 text-right">{fmt(parseFloat(item.total))}</td>
                  </tr>
                ))}
                {items.length < 6 && Array.from({ length: 6 - items.length }).map((_, i) => (
                  <tr key={`e-${i}`}>
                    {Array.from({ length: 7 }).map((__, j) => <td key={j} className="border border-gray-400 p-2">&nbsp;</td>)}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-4">
              <table className="text-xs border-collapse" style={{ minWidth: '260px' }}>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 pr-8 text-gray-600">Basic Total</td>
                    <td className="border border-gray-400 p-2 text-right font-medium w-28">₹ {fmt(basicTotal)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 text-gray-600">IGST @ {po.gst_percent}%</td>
                    <td className="border border-gray-400 p-2 text-right">₹ {fmt(gstAmount)}</td>
                  </tr>
                  <tr style={{ backgroundColor: '#fef08a' }}>
                    <td className="border border-gray-400 p-2 font-bold">TOTAL</td>
                    <td className="border border-gray-400 p-2 text-right font-bold">₹ {fmt(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Terms & Conditions */}
            <div className="border border-gray-300 p-3 mb-4 text-xs">
              <div className="font-bold mb-2">TERMS & CONDITIONS:</div>
              <div className="space-y-1">
                {po.terms_gst && <div><span className="font-semibold">GST: </span>{po.terms_gst}</div>}
                {po.terms_delivery && <div><span className="font-semibold">Delivery: </span>{po.terms_delivery}</div>}
                {po.terms_delivery_instructions && <div><span className="font-semibold">Delivery Instructions: </span>{po.terms_delivery_instructions}</div>}
                {po.terms_supply_basis && <div><span className="font-semibold">Supply Basis: </span>{po.terms_supply_basis}</div>}
                {po.terms_payment && <div><span className="font-semibold">Payment: </span>{po.terms_payment}</div>}
                {po.notes && <div><span className="font-semibold">Notes: </span>{po.notes}</div>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-8 text-xs">
              <div>
                {po.brand_pan && <div>PAN: {po.brand_pan}</div>}
                {po.brand_gstin && <div>GSTIN: {po.brand_gstin}</div>}
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2 mt-8 w-40">Authorised Signatory</div>
                <div className="text-gray-600 mt-1">{po.brand_name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
