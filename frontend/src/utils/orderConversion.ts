// Order-line conversion between an entered Qty+UOM and the physical pcs/weight,
// plus the billable quantity in the variant's own UOM (the rate basis).
//
// A variant carries per-piece factors: L = length per piece (mtr), W = weight per piece (kg).
// Orders may be entered in Mtr, Kgs or Pcs. We derive whole pieces + weight (physical, for
// inventory) and a billable quantity for Total = Rate x billable.
//
// Billing follows the ENTERED quantity: when the entry unit equals the variant's rate unit
// (e.g. order 10000 Mtr of a per-Mtr pipe) the billable is exactly the entered value — no
// rounding loss. Only when the units differ (order in Kgs, billed per Mtr) is the billable
// derived from the rounded piece count.

const round3 = (n: number) => Math.round((Number(n) || 0) * 1000) / 1000
const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100

// The UOM the variant's single rate is quoted in (drives the billable quantity).
export function billingUomFor(variantUom: string): string {
  const u = (variantUom || '').toLowerCase()
  if (u === 'mtr') return 'mtr'
  if (u === 'kgs' || u === 'mt') return 'kgs'
  return u || 'pcs'
}

// From an entered Qty + order UOM and the variant's per-piece factors + rate basis,
// derive physical pcs/weight and the billable quantity (+ its uom).
export function deriveOrderLine(qty: number, orderUom: string, variantUom: string, L: number, W: number) {
  const q = Number(qty) || 0
  const u = (orderUom || '').toLowerCase()
  const Ln = Number(L) || 0
  const Wn = Number(W) || 0

  let pcsRaw = 0
  if (u === 'mtr') pcsRaw = Ln > 0 ? q / Ln : 0
  else if (u === 'kgs' || u === 'mt') pcsRaw = Wn > 0 ? q / Wn : 0
  else pcsRaw = q
  const pcs = Math.round(pcsRaw)

  // Physical weight: keep the entered value exact when ordered by weight, else from whole pcs.
  const weight = (u === 'kgs' || u === 'mt') ? round3(q) : round3(pcs * Wn)

  const billing_uom = billingUomFor(variantUom)
  let billable: number
  if (billing_uom === 'mtr') billable = (u === 'mtr') ? round3(q) : round3(pcs * Ln)
  else if (billing_uom === 'kgs') billable = (u === 'kgs' || u === 'mt') ? round3(q) : round3(pcs * Wn)
  else billable = (u === 'mtr' || u === 'kgs' || u === 'mt') ? pcs : Math.round(q)

  return { pcs, weight, billable, billing_uom }
}

export function lineTotal(billable: number, rate: number) {
  return round2((Number(billable) || 0) * (Number(rate) || 0))
}

// Default the order-entry UOM dropdown from a variant's UOM.
export function defaultOrderUom(variantUom: string): string {
  const u = (variantUom || '').toLowerCase()
  if (u === 'mtr') return 'mtr'
  if (u === 'kgs' || u === 'mt') return 'kgs'
  return 'pcs'
}
