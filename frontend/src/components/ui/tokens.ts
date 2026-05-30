export const tokens = {
  color: {
    ink: '#0d1117',
    inkSoft: '#1a1410',
    paper: '#f5f1ea',
    paperAlt: '#ece6d8',
    warm: '#d97247',
    warmDk: '#c25a30',
    rule: 'rgba(245,241,234,0.12)',
    ruleLt: 'rgba(20,15,10,0.10)',
    ruleLtMd: 'rgba(20,15,10,0.25)',
    ruleLtStrong: 'rgba(20,15,10,0.30)',
    mute: 'rgba(245,241,234,0.65)',
    muteLt: 'rgba(20,15,10,0.55)',
    success: '#3f8d54',
    successSoft: '#5fb56f',
    danger: '#b6432f',
    info: '#2563a8',
  },
  font: {
    serif: '"IBM Plex Serif", Georgia, serif',
    sans: '"IBM Plex Sans", -apple-system, system-ui, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", monospace',
  },
} as const

export type StatusKind =
  | 'open'
  | 'confirmed'
  | 'delivered'
  | 'draft'
  | 'review'
  | 'overdue'
  | 'low'
  | 'healthy'
  | 'hot'
  | 'warm'
  | 'cold'
