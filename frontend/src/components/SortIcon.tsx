import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'

export const thSort = 'pb-3 text-gray-500 font-medium cursor-pointer select-none hover:text-gray-700 whitespace-nowrap'

export function SortIcon({ col, sortCol, sortDir }: { col: string; sortCol: string; sortDir: 'asc' | 'desc' }) {
  if (col !== sortCol) return <ArrowUpDown size={12} className="text-gray-300 ml-1 inline" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-blue-500 ml-1 inline" />
    : <ChevronDown size={12} className="text-blue-500 ml-1 inline" />
}
