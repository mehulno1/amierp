interface WordmarkProps {
  variant?: 'dark' | 'light'
  sub?: string
  size?: number
  className?: string
}

export default function Wordmark({
  variant = 'dark',
  sub = 'GROUP',
  size = 28,
  className = '',
}: WordmarkProps) {
  const fg = variant === 'dark' ? 'var(--color-paper)' : 'var(--color-ink)'
  const accent = variant === 'dark' ? 'var(--color-warm)' : 'var(--color-warm-dk)'

  return (
    <div className={`inline-flex items-center gap-2.5 leading-none ${className}`}>
      <div className="flex items-baseline gap-1.5">
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 700,
            fontSize: size,
            letterSpacing: '-0.02em',
            color: fg,
          }}
        >
          AMI
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            fontSize: size * 0.42,
            letterSpacing: '.18em',
            color: accent,
            textTransform: 'uppercase',
          }}
        >
          {sub}
        </span>
      </div>
    </div>
  )
}
