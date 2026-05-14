import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { piApi } from '../services/api'
import { FileText, Download, Trash2, Search } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSortable } from '../hooks/useSortable'
import { SortIcon, thSort } from '../components/SortIcon'
import LoadingSpinner from '../components/LoadingSpinner'
import PIDocument from '../components/PIDocument'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import type { ProformaInvoice } from '../types'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const part = d.split('T')[0]
  const [y, m, day] = part.split('-')
  return `${day}/${m}/${y}`
}

const statusColors: Record<string, string> = {
  generated: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-700',
  revised: 'bg-orange-100 text-orange-700',
}

export default function ProformaInvoices() {
  const [viewPI, setViewPI] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const { isSuperAdmin } = useAuth()
  const qc = useQueryClient()

  const { data: pis = [], isLoading } = useQuery({
    queryKey: ['proforma-invoices'],
    queryFn: () => piApi.list().then(r => r.data.data),
  })

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return (pis as ProformaInvoice[]).filter(p =>
      !s ||
      p.pi_no.toLowerCase().includes(s) ||
      (p.client_name || '').toLowerCase().includes(s) ||
      (p.po_no || '').toLowerCase().includes(s)
    )
  }, [pis, search])

  const { sorted, sortCol, sortDir, toggle } = useSortable(filtered, 'pi_date', 'desc')

  const deletePI = async (id: number, piNo: string) => {
    if (!window.confirm(`Delete PI ${piNo}? This cannot be undone.`)) return
    try {
      await piApi.delete(id)
      qc.invalidateQueries({ queryKey: ['proforma-invoices'] })
      toast.success('PI deleted')
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
  }

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sorted.map(p => ({
      'PI No': p.pi_no,
      'Date': fmtDate(p.pi_date),
      'Client': p.client_name,
      'Order Ref': p.order_id,
      'PO No': p.po_no || '',
      'Basic Total': p.basic_total,
      'GST Amount': p.gst_amount,
      'Total Amount': p.total_amount,
      'Status': p.status,
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ProformaInvoices')
    XLSX.writeFile(wb, 'proforma_invoices.xlsx')
  }

  const si = (col: string) => <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Proforma Invoices</h1>
        <button onClick={exportExcel} className="btn-secondary text-sm flex items-center justify-center gap-1 w-full sm:w-auto"><Download size={14} />Export</button>
      </div>

      <div className="card">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search PI no, client, PO no..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className={thSort} onClick={() => toggle('pi_no')}>PI No. {si('pi_no')}</th>
                  <th className={thSort} onClick={() => toggle('pi_date')}>Date {si('pi_date')}</th>
                  <th className={thSort} onClick={() => toggle('client_name')}>Client {si('client_name')}</th>
                  <th className={thSort} onClick={() => toggle('order_id')}>Order Ref {si('order_id')}</th>
                  <th className={thSort} onClick={() => toggle('po_no')}>PO No. {si('po_no')}</th>
                  <th className={thSort} onClick={() => toggle('basic_total')}>Basic Total {si('basic_total')}</th>
                  <th className={thSort} onClick={() => toggle('total_amount')}>Total Amount {si('total_amount')}</th>
                  <th className={thSort} onClick={() => toggle('status')}>Status {si('status')}</th>
                  <th className="pb-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-blue-600 cursor-pointer" onClick={() => setViewPI(p.id)}>{p.pi_no}</td>
                    <td className="py-3 text-gray-500">{fmtDate(p.pi_date)}</td>
                    <td className="py-3 text-gray-900">{p.client_name}</td>
                    <td className="py-3 text-gray-500 text-xs font-mono">{p.order_id}</td>
                    <td className="py-3 text-gray-500">{p.po_no || '—'}</td>
                    <td className="py-3 text-gray-700">₹ {parseFloat(String(p.basic_total || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 font-medium text-gray-900">₹ {parseFloat(String(p.total_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3"><span className={`badge-status ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>{p.status}</span></td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewPI(p.id)} className="text-blue-500 hover:text-blue-700"><FileText size={15} /></button>
                        {isSuperAdmin() && <button onClick={() => deletePI(p.id, p.pi_no)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-gray-400">{search ? 'No results found' : 'No proforma invoices'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewPI && <PIDocument piId={viewPI} onClose={() => setViewPI(null)} />}
    </div>
  )
}
