import type { ReactNode } from 'react'

interface MonoEyebrowProps {
  children: ReactNode
  tone?: 'mute' | 'warm' | 'paper'
  className?: string
  size?: 10 | 11
}

const TONE = {
  mute: 'var(--mute-lt)',
  warm: 'var(--color-warm-dk)',
  paper: 'var(--color-paper)',
} as const

export default function MonoEyebrow({
  children,
  tone = 'mute',
  size = 10,
  className = '',
}: MonoEyebrowProps) {
  return (
    <span
      className={`uppercase ${className}`}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: size,
        letterSpacing: '.18em',
        color: TONE[tone],
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  )
}
