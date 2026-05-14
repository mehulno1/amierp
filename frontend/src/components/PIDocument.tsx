import { useQuery } from '@tanstack/react-query'
import { piApi } from '../services/api'
import { X, Download, Send } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'

export default function PIDocument({ piId, onClose }: { piId: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [sending, setSending] = useState(false)

  const { data: pi, isLoading } = useQuery({
    queryKey: ['pi', piId],
    queryFn: () => piApi.get(piId).then(r => r.data.data),
  })

  const downloadPDF = async () => {
    if (!ref.current) return
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (cloneDoc) => {
          // Remove all stylesheets (Tailwind uses oklch which html2canvas can't parse)
          cloneDoc.querySelectorAll('link[rel="stylesheet"], style').forEach(el => el.remove())
          // Inject minimal hex-based CSS for the PI document
          const style = cloneDoc.createElement('style')
          style.textContent = `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; font-size: 11px; background: #fff; }
            table { border-collapse: collapse; width: 100%; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-2xl { font-size: 1.5rem; }
            .text-base { font-size: 1rem; }
            .text-sm { font-size: 0.875rem; }
            .text-xs { font-size: 0.75rem; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .font-mono { font-family: monospace; }
            .tracking-wide { letter-spacing: 0.025em; }
            .text-blue-800 { color: #1e40af; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-400 { color: #9ca3af; }
            .bg-white { background-color: #ffffff; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .border { border: 1px solid #9ca3af; }
            .border-b-2 { border-bottom: 2px solid; }
            .border-t { border-top: 1px solid; }
            .border-gray-800 { border-color: #1f2937; }
            .border-gray-400 { border-color: #9ca3af; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-collapse { border-collapse: collapse; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr; }
            .gap-4 { gap: 1rem; }
            .gap-2 { gap: 0.5rem; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }
            .items-end { align-items: flex-end; }
            .w-full { width: 100%; }
            .w-8 { width: 2rem; } .w-12 { width: 3rem; } .w-16 { width: 4rem; }
            .w-20 { width: 5rem; } .w-24 { width: 6rem; } .w-28 { width: 7rem; } .w-40 { width: 10rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .p-8 { padding: 2rem; }
            .p-3 { padding: 0.75rem; }
            .p-2 { padding: 0.5rem; }
            .pr-8 { padding-right: 2rem; }
            .pb-4 { padding-bottom: 1rem; }
            .pt-2 { padding-top: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-8 { margin-top: 2rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .whitespace-pre-line { white-space: pre-line; }
            .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,.05); }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .min-w-\\[260px\\] { min-width: 260px; }
          `
          cloneDoc.head.appendChild(style)
        },
      })
      const img = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgH = (canvas.height * pageW) / canvas.width
      let y = 0
      let remaining = imgH
      while (remaining > 0) {
        pdf.addImage(img, 'PNG', 0, y, pageW, imgH)
        remaining -= pageH
        if (remaining > 0) { pdf.addPage(); y -= pageH }
      }
      pdf.save(`${pi?.pi_no?.replace(/\//g, '-')}.pdf`)
    } catch (err) {
      toast.error('PDF download failed')
      console.error(err)
    }
  }

  const sendEmail = async () => {
    setSending(true)
    try {
      await piApi.send(piId)
      toast.success('PI emailed to client')
    } catch { toast.error('Failed to send') }
    finally { setSending(false) }
  }

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8"><LoadingSpinner /></div>
    </div>
  )

  if (!pi) return null

  const items = pi.items || []
  const basicTotal = parseFloat(pi.basic_total || 0)
  const gstAmount = parseFloat(pi.gst_amount || 0)
  const totalAmount = parseFloat(pi.total_amount || 0)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Proforma Invoice — {pi.pi_no}</h2>
          <div className="flex gap-2">
            <button onClick={sendEmail} disabled={sending} className="btn-secondary text-sm flex items-center gap-1">
              <Send size={14} />{sending ? 'Sending…' : 'Email to Client'}
            </button>
            <button onClick={downloadPDF} className="btn-primary text-sm flex items-center gap-1"><Download size={14} />Download PDF</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4 bg-gray-100">
          <div ref={ref} className="bg-white mx-auto p-8 shadow-sm" style={{ width: '794px', minHeight: '1123px', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
              <div className="text-2xl font-bold text-blue-800 tracking-wide">{pi.brand_name || 'AMI ENTERPRISES PVT. LTD.'}</div>
              <div className="text-xs text-gray-600 mt-1">{pi.brand_address || 'Manufacturer of Lancing Pipes & Allied Products'}</div>
              {pi.brand_gstin && <div className="text-xs text-gray-600">GSTIN: {pi.brand_gstin}</div>}
            </div>

            <div className="text-center text-base font-bold mb-4 border border-gray-400 py-1">PROFORMA INVOICE</div>

            {/* PI Details + Client Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
              <div className="border border-gray-300 p-3">
                <div className="font-bold text-sm mb-2">To,</div>
                <div className="font-semibold">{pi.client_name}</div>
                {pi.billing_address && <div className="text-gray-600">{pi.billing_address}</div>}
                {(pi.billing_city || pi.billing_state) && (
                  <div className="text-gray-600">{[pi.billing_city, pi.billing_state, pi.billing_zip].filter(Boolean).join(', ')}</div>
                )}
                {pi.client_gstin && <div className="mt-1">GSTIN: <span className="font-mono">{pi.client_gstin}</span></div>}
              </div>
              <div className="border border-gray-300 p-3 space-y-1">
                <div className="flex justify-between"><span className="text-gray-600">PI No.:</span><span className="font-semibold">{pi.pi_no}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">PI Date:</span><span>{pi.pi_date}</span></div>
                {pi.po_no && <div className="flex justify-between"><span className="text-gray-600">PO No.:</span><span>{pi.po_no}</span></div>}
                {pi.po_date && <div className="flex justify-between"><span className="text-gray-600">PO Date:</span><span>{pi.po_date}</span></div>}
                {pi.order_id && <div className="flex justify-between"><span className="text-gray-600">Order Ref.:</span><span>{pi.order_id}</span></div>}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-gray-400 text-xs mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-center w-8">Sr.</th>
                  <th className="border border-gray-400 p-2 text-center w-20">Mat. No.</th>
                  <th className="border border-gray-400 p-2 text-left">Description</th>
                  <th className="border border-gray-400 p-2 text-center w-16">Qty (Pcs)</th>
                  <th className="border border-gray-400 p-2 text-center w-16">Qty (Kgs)</th>
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
                    <td className="border border-gray-400 p-2 text-center">{item.quantity_pcs || '—'}</td>
                    <td className="border border-gray-400 p-2 text-center">{item.quantity_kgs ? parseFloat(item.quantity_kgs).toFixed(3) : '—'}</td>
                    <td className="border border-gray-400 p-2 text-center">{item.uom}</td>
                    <td className="border border-gray-400 p-2 text-right">{parseFloat(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="border border-gray-400 p-2 text-right">{parseFloat(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {/* Empty rows to fill space */}
                {items.length < 6 && Array.from({ length: 6 - items.length }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-gray-400 p-2">&nbsp;</td>
                    <td className="border border-gray-400 p-2"></td>
                    <td className="border border-gray-400 p-2"></td>
                    <td className="border border-gray-400 p-2"></td>
                    <td className="border border-gray-400 p-2"></td>
                    <td className="border border-gray-400 p-2"></td>
                    <td className="border border-gray-400 p-2"></td>
                    <td className="border border-gray-400 p-2"></td>
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
                    <td className="border border-gray-400 p-2 text-right font-medium w-28">₹ {basicTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  {pi.gst_type === 'cgst_sgst' ? (
                    <>
                      <tr>
                        <td className="border border-gray-400 p-2 text-gray-600">CGST @ {pi.gst_percent / 2}%</td>
                        <td className="border border-gray-400 p-2 text-right">₹ {(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 text-gray-600">SGST @ {pi.gst_percent / 2}%</td>
                        <td className="border border-gray-400 p-2 text-right">₹ {(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td className="border border-gray-400 p-2 text-gray-600">IGST @ {pi.gst_percent}%</td>
                      <td className="border border-gray-400 p-2 text-right">₹ {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: '#fef08a' }}>
                    <td className="border border-gray-400 p-2 font-bold">TOTAL</td>
                    <td className="border border-gray-400 p-2 text-right font-bold">₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount in words */}
            {pi.amount_in_words && (
              <div className="border border-gray-300 p-2 mb-4 text-xs">
                <span className="font-semibold">Amount in Words: </span>{pi.amount_in_words}
              </div>
            )}

            {/* Bank Details */}
            <div className="border border-gray-300 p-3 mb-4 text-xs">
              <div className="font-bold mb-2">Bank Details:</div>
              <div className="grid grid-cols-2 gap-2">
                {pi.bank_name && <div><span className="text-gray-600">Bank: </span>{pi.bank_name}</div>}
                {pi.account_name && <div><span className="text-gray-600">Account Name: </span>{pi.account_name}</div>}
                {pi.account_no && <div><span className="text-gray-600">Account No.: </span><span className="font-mono">{pi.account_no}</span></div>}
                {pi.ifsc_code && <div><span className="text-gray-600">IFSC: </span><span className="font-mono">{pi.ifsc_code}</span></div>}
                {pi.swift_code && <div><span className="text-gray-600">SWIFT: </span><span className="font-mono">{pi.swift_code}</span></div>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-8 text-xs">
              <div>
                {pi.brand_pan && <div>PAN: {pi.brand_pan}</div>}
                {pi.brand_gstin && <div>GSTIN: {pi.brand_gstin}</div>}
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2 mt-8 w-40">Authorised Signatory</div>
                <div className="text-gray-600 mt-1">{pi.brand_name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
