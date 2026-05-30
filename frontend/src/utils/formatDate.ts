// Single source of truth for date strings rendered to the user.
//
// MySQL DATE columns serialize as `YYYY-MM-DD`, but MySQL DATETIME / TIMESTAMP columns
// come through as full ISO strings (e.g. `2026-05-21T00:00:00.000Z`). Several controllers
// mix the two — order_date is a DATE, but reminder_date or created_at are DATETIMEs that
// previously bled their time portion into PI/Order documents ("dd-mm-yyyyZ00:12...").
//
// `fmtDate(v)` strips anything after the `T` and renders the date portion only.

const placeholder = '—'

function localPartsFromDate(d: Date): [string, string, string] {
  return [
    String(d.getFullYear()),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ]
}

function parseParts(value: unknown): [string, string, string] | null {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return localPartsFromDate(value)
  }
  const str = String(value).trim()
  if (!str) return null

  // Plain MySQL DATE string `YYYY-MM-DD` with no time component — safe to read as literal.
  // (mysql2 only returns this shape when dateStrings is set; we keep the branch for safety.)
  const dateOnly = str.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateOnly) return [dateOnly[1], dateOnly[2], dateOnly[3]]

  // ISO / datetime string. Parse with Date and read local-time parts so a DATE column
  // stored as `2026-05-19` (which mysql2 ships as `2026-05-18T18:30:00.000Z` in IST)
  // renders as `19-05-2026`, not `18-05-2026`.
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return null
  return localPartsFromDate(d)
}

/**
 * dd-mm-yyyy — used in PI/Offer/PO documents and most table cells.
 * Returns the em-dash placeholder for null/empty/unparseable inputs.
 */
export function fmtDate(value: unknown): string {
  const parts = parseParts(value)
  if (!parts) return placeholder
  const [y, m, d] = parts
  return `${d}-${m}-${y}`
}

/**
 * yyyy-mm-dd — used as the value for native `<input type="date">` defaults.
 */
export function toIsoDate(value: unknown): string {
  const parts = parseParts(value)
  if (!parts) return ''
  const [y, m, d] = parts
  return `${y}-${m}-${d}`
}
