import { tokens } from '../../../components/ui/tokens'

// Recharts palette derived from the app design tokens so charts match the UI.
export const CHART_COLORS = [
  tokens.color.warm,     // #d97247
  tokens.color.info,     // #2563a8
  tokens.color.success,  // #3f8d54
  tokens.color.warmDk,   // #c25a30
  '#8a6d3b',
  tokens.color.danger,   // #b6432f
  '#5fb56f',
  '#7a8aa0',
]

export const AGE_COLORS: Record<string, string> = {
  '0-30': tokens.color.success,
  '31-60': tokens.color.info,
  '31-90': tokens.color.info,
  '61-90': tokens.color.warm,
  '91-180': tokens.color.warm,
  '90+': tokens.color.danger,
  '180+': tokens.color.danger,
}

export const axisStyle = {
  fontFamily: tokens.font.mono,
  fontSize: 10,
  fill: 'rgba(20,15,10,0.55)',
}

export const tooltipStyle = {
  contentStyle: {
    fontFamily: tokens.font.sans,
    fontSize: 12,
    border: '1px solid rgba(20,15,10,0.15)',
    borderRadius: 2,
  },
  labelStyle: { fontFamily: tokens.font.mono, fontSize: 10, letterSpacing: '0.1em' },
}

const inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

// Full rupee value, e.g. ₹12,34,567
export const inr = (n: number | null | undefined) =>
  n == null ? '—' : `₹${inrFmt.format(Math.round(Number(n)))}`

// Compact rupee value for axis labels: ₹1.2L / ₹3.4Cr
export const inrShort = (n: number | null | undefined) => {
  if (n == null) return '—'
  const v = Number(n)
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`
  if (Math.abs(v) >= 1e3) return `₹${(v / 1e3).toFixed(0)}k`
  return `₹${Math.round(v)}`
}

export const num = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en-IN').format(Number(n))

export const pct = (n: number | null | undefined) => (n == null ? '—' : `${n}%`)

// Default reporting window: first of the month 11 months ago → today.
export function last12Months(): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 11, 1)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

// Turn a YYYY-MM key into a short "Mon 'YY" label.
export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[Number(m) - 1] || m} '${y.slice(2)}`
}
