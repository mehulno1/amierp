import type { ReactNode } from 'react'

interface PageHeaderProps {
  breadcrumb?: ReactNode[]
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}

export default function PageHeader({ breadcrumb, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div
      className="pb-5 mb-5"
      style={{ borderBottom: '1px solid var(--rule-lt)' }}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <div
          className="uppercase mb-2.5"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '.18em',
            color: 'var(--mute-lt)',
          }}
        >
          {breadcrumb.map((node, i) => (
            <span key={i}>
              {i > 0 && <span style={{ margin: '0 8px' }}>›</span>}
              {node}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1
            className="m-0"
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 400,
              fontSize: 32,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'var(--color-ink)',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-2 mb-0"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--mute-lt)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap">{actions}</div>
        )}
      </div>
    </div>
  )
}
