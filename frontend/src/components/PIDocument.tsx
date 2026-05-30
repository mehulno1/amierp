import { useQuery } from '@tanstack/react-query'
import { piApi } from '../services/api'
import { X, Download, Send } from 'lucide-react'
import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'
import DocumentHeader from './DocumentHeader'
import { fmtDate } from '../utils/formatDate'
import { downloadDocumentPdf } from '../utils/renderDocumentPdf'

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
      await downloadDocumentPdf(ref.current, `${pi?.pi_no?.replace(/\//g, '-') || 'proforma-invoice'}.pdf`)
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
  // Export orders are billed in USD; everything else in INR.
  const cur = pi.order_type === 'export' ? '$' : '₹'
  // The weight/bulk quantity column header should reflect the line items' actual UOM
  // (e.g. "mt", "kgs") instead of a hardcoded "Kgs". Derive it from the items that
  // carry a kgs-column value; fall back to "Kgs" when absent or mixed.
  const weightUoms = [...new Set(
    items
      .filter((i: any) => i.quantity_kgs && parseFloat(i.quantity_kgs) > 0)
      .map((i: any) => (i.uom || '').toLowerCase())
      .filter(Boolean) as string[]
  )]
  const qtyKgsLabel = weightUoms.length === 1 ? weightUoms[0] : 'Kgs'

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
            <DocumentHeader
              brandName={pi.brand_name}
              brandAddress={pi.brand_address}
              brandPhone={pi.brand_phone}
              brandEmail={pi.brand_email}
              brandGstin={pi.brand_gstin}
            />

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
                <div className="mt-1 font-semibold">Kind Attn: {pi.client_contact || ''}</div>
              </div>
              <div className="border border-gray-300 p-3 space-y-1">
                <div className="flex justify-between"><span className="text-gray-600">PI No.:</span><span className="font-semibold">{pi.pi_no}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">PI Date:</span><span>{fmtDate(pi.pi_date)}</span></div>
                {pi.po_no && <div className="flex justify-between"><span className="text-gray-600">PO No.:</span><span>{pi.po_no}</span></div>}
                {pi.po_date && <div className="flex justify-between"><span className="text-gray-600">PO Date:</span><span>{fmtDate(pi.po_date)}</span></div>}
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
                  <th className="border border-gray-400 p-2 text-center w-16">Qty ({qtyKgsLabel})</th>
                  <th className="border border-gray-400 p-2 text-center w-12">UOM</th>
                  <th className="border border-gray-400 p-2 text-right w-20">Rate ({cur})</th>
                  <th className="border border-gray-400 p-2 text-right w-24">Total ({cur})</th>
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
                    <td className="border border-gray-400 p-2 text-right font-medium w-28">{cur} {basicTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  {pi.gst_type === 'none' ? (
                    <tr>
                      <td className="border border-gray-400 p-2 text-gray-600">GST @ 0%</td>
                      <td className="border border-gray-400 p-2 text-right">{cur} {(0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ) : pi.gst_type === 'cgst_sgst' ? (
                    <>
                      <tr>
                        <td className="border border-gray-400 p-2 text-gray-600">CGST @ {pi.gst_percent / 2}%</td>
                        <td className="border border-gray-400 p-2 text-right">{cur} {(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2 text-gray-600">SGST @ {pi.gst_percent / 2}%</td>
                        <td className="border border-gray-400 p-2 text-right">{cur} {(gstAmount / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td className="border border-gray-400 p-2 text-gray-600">IGST @ {pi.gst_percent}%</td>
                      <td className="border border-gray-400 p-2 text-right">{cur} {gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: '#fef08a' }}>
                    <td className="border border-gray-400 p-2 font-bold">TOTAL</td>
                    <td className="border border-gray-400 p-2 text-right font-bold">{cur} {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
              <div className="font-bold mb-2 text-center" style={{ textDecoration: 'underline' }}>BANK DETAILS</div>
              <table className="w-full text-xs">
                <tbody>
                  {pi.account_name && <tr><td className="font-semibold text-gray-600 py-1 w-32">Account Name</td><td className="py-1">{pi.account_name}</td></tr>}
                  {pi.bank_name && <tr><td className="font-semibold text-gray-600 py-1">Bank Name</td><td className="py-1">{pi.bank_name}</td></tr>}
                  {pi.account_no && <tr><td className="font-semibold text-gray-600 py-1">Account No.</td><td className="py-1 font-mono">{pi.account_no}</td></tr>}
                  {pi.ifsc_code && <tr><td className="font-semibold text-gray-600 py-1">IFSC Code</td><td className="py-1 font-mono">{pi.ifsc_code}</td></tr>}
                  {pi.swift_code && <tr><td className="font-semibold text-gray-600 py-1">Swift Code</td><td className="py-1 font-mono">{pi.swift_code}</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end mt-8 text-xs">
              <div>
                {pi.brand_pan && <div>PAN: {pi.brand_pan}</div>}
                {pi.brand_gstin && <div>GSTIN: {pi.brand_gstin}</div>}
                {pi.order_type === 'export' && pi.brand_iec && <div>IEC: {pi.brand_iec}</div>}
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
