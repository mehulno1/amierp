import type { StatusKind } from './tokens'

const ORDER: Record<string, StatusKind> = {
  new_order: 'open',
  processing: 'review',
  ready_for_dispatch: 'hot',
  partially_dispatched: 'review',
  dispatched: 'review',
  completed: 'confirmed',
  cancelled: 'overdue',
}

const REQUISITION: Record<string, StatusKind> = {
  pending_approval: 'open',
  rejected: 'overdue',
  pending: 'draft',
  quotation_pending: 'open',
  quotation_received: 'review',
  po_raised: 'hot',
  partially_delivered: 'review',
  delivered: 'confirmed',
  cancelled: 'overdue',
}

const ENQUIRY: Record<string, StatusKind> = {
  new: 'hot',
  offer_sent: 'review',
  negotiation: 'open',
  order_received: 'confirmed',
  lost: 'overdue',
  expired: 'draft',
}

const OFFER: Record<string, StatusKind> = {
  draft: 'draft',
  sent: 'review',
  accepted: 'confirmed',
  rejected: 'overdue',
  revised: 'open',
}

const PRIORITY: Record<string, StatusKind> = {
  critical: 'overdue',
  urgent: 'hot',
  normal: 'cold',
}

const QUOTATION: Record<string, StatusKind> = {
  pending: 'draft',
  selected: 'confirmed',
  rejected: 'overdue',
}

export const statusMap = {
  order: (s: string): StatusKind => ORDER[s] ?? 'draft',
  requisition: (s: string): StatusKind => REQUISITION[s] ?? 'draft',
  enquiry: (s: string): StatusKind => ENQUIRY[s] ?? 'draft',
  offer: (s: string): StatusKind => OFFER[s] ?? 'draft',
  priority: (s: string): StatusKind => PRIORITY[s] ?? 'cold',
  quotation: (s: string): StatusKind => QUOTATION[s] ?? 'draft',
}

export function humanize(s?: string | null) {
  if (!s) return '—'
  return s.replace(/_/g, ' ')
}
