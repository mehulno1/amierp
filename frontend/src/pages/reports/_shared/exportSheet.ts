import * as XLSX from 'xlsx'

// Thin wrappers over the XLSX pattern already used across the app
// (XLSX.utils.json_to_sheet → book_append_sheet → writeFile).

export function exportSheet(filename: string, sheetName: string, rows: Record<string, any>[]) {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  XLSX.writeFile(wb, filename)
}

export function exportSheets(filename: string, sheets: { name: string; rows: Record<string, any>[] }[]) {
  const wb = XLSX.utils.book_new()
  for (const s of sheets) {
    const ws = XLSX.utils.json_to_sheet(s.rows)
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31))
  }
  XLSX.writeFile(wb, filename)
}
