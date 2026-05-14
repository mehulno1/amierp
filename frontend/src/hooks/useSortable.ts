import { useState, useMemo } from 'react'

export function useSortable<T extends Record<string, any>>(
  data: T[],
  defaultCol = '',
  defaultDir: 'asc' | 'desc' = 'asc'
) {
  const [sortCol, setSortCol] = useState(defaultCol)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultDir)

  const toggle = (col: string) => {
    if (sortCol === col) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    if (!sortCol) return data
    return [...data].sort((a, b) => {
      const va = a[sortCol] ?? ''
      const vb = b[sortCol] ?? ''
      const na = parseFloat(String(va))
      const nb = parseFloat(String(vb))
      if (!isNaN(na) && !isNaN(nb)) return sortDir === 'asc' ? na - nb : nb - na
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
  }, [data, sortCol, sortDir])

  return { sorted, sortCol, sortDir, toggle }
}
