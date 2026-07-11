import type { ReactNode } from 'react'
import { useSortable } from '../../../hooks/useSortable'
import { SortIcon, thSort } from '../../../components/SortIcon'
import MonoEyebrow from '../../../components/ui/MonoEyebrow'

export interface Column<T> {
  key: string
  label: string
  align?: 'left' | 'right'
  sortable?: boolean
  sortKey?: string
  render?: (row: T) => ReactNode
}

interface SortableTableProps<T> {
  title?: string
  rows: T[]
  columns: Column<T>[]
  defaultSort?: string
  defaultDir?: 'asc' | 'desc'
  empty?: string
  minWidth?: number
  maxHeight?: number
}

export default function SortableTable<T extends Record<string, any>>({
  title, rows, columns, defaultSort = '', defaultDir = 'asc', empty = 'No data', minWidth = 640, maxHeight,
}: SortableTableProps<T>) {
  const { sorted, sortCol, sortDir, toggle } = useSortable(rows, defaultSort, defaultDir)

  return (
    <div className="card">
      {title && <div className="mb-4"><MonoEyebrow>{title}</MonoEyebrow></div>}
      <div className="overflow-x-auto" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead>
            <tr className="text-left border-b border-gray-100">
              {columns.map((c) => {
                const sk = c.sortKey || c.key
                const sortable = c.sortable !== false
                return (
                  <th
                    key={c.key}
                    className={sortable ? thSort : 'pb-3 text-gray-500 font-medium whitespace-nowrap'}
                    style={c.align === 'right' ? { textAlign: 'right' } : undefined}
                    onClick={sortable ? () => toggle(sk) : undefined}
                  >
                    {c.label}
                    {sortable && <SortIcon col={sk} sortCol={sortCol} sortDir={sortDir} />}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((row, ri) => (
              <tr key={ri}>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="py-3 text-gray-700"
                    style={c.align === 'right' ? { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } : undefined}
                  >
                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={columns.length} className="py-8 text-center text-gray-400">{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
