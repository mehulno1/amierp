import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: ReactNode
  delta?: string
  deltaPositive?: boolean
  sub?: ReactNode
  to?: string
  onClick?: () => void
}

export default function MetricCard({
  label,
  value,
  delta,
  deltaPositive = true,
  sub,
  onClick,
}: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-5 ${onClick ? 'cursor-pointer' : ''} transition-colors duration-150`}
      style={{
        background: '#fff',
        border: '1px solid var(--rule-lt)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        className="uppercase mb-3.5"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '.18em',
          color: 'var(--mute-lt)',
        }}
      >
        {label}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 300,
            fontSize: 38,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: 'var(--color-ink)',
          }}
        >
          {value}
        </div>
        {delta && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: deltaPositive ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {deltaPositive ? '↑' : '↓'} {delta}
          </div>
        )}
      </div>
      {sub && (
        <div
          className="mt-2"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--mute-lt)',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
