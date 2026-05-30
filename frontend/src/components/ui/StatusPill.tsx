import type { StatusKind } from './tokens'

interface StatusPillProps {
  kind: StatusKind
  label: string
}

const MAP: Record<StatusKind, { bg: string; fg: string }> = {
  open:      { bg: 'rgba(217,114,71,.12)', fg: 'var(--color-warm-dk)' },
  confirmed: { bg: 'rgba(63,141,84,.12)',  fg: 'var(--color-success)' },
  delivered: { bg: 'rgba(63,141,84,.12)',  fg: 'var(--color-success)' },
  draft:     { bg: 'rgba(20,15,11,.06)',   fg: 'var(--mute-lt)' },
  review:    { bg: 'rgba(74,144,217,.12)', fg: 'var(--color-info)' },
  overdue:   { bg: 'rgba(182,67,47,.14)',  fg: 'var(--color-danger)' },
  low:       { bg: 'rgba(182,67,47,.14)',  fg: 'var(--color-danger)' },
  healthy:   { bg: 'rgba(63,141,84,.12)',  fg: 'var(--color-success)' },
  hot:       { bg: 'rgba(217,114,71,.18)', fg: 'var(--color-warm-dk)' },
  warm:      { bg: 'rgba(74,144,217,.12)', fg: 'var(--color-info)' },
  cold:      { bg: 'rgba(20,15,11,.06)',   fg: 'var(--mute-lt)' },
}

export default function StatusPill({ kind, label }: StatusPillProps) {
  const s = MAP[kind] ?? MAP.draft
  return (
    <span
      className="inline-flex items-center gap-1.5 uppercase"
      style={{
        background: s.bg,
        color: s.fg,
        padding: '4px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '.14em',
        fontWeight: 600,
        borderRadius: 2,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: s.fg,
        }}
      />
      {label}
    </span>
  )
}
