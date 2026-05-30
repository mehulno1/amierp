import { useAuth } from '../hooks/useAuth'
import { LogOut, Menu, Search, Bell } from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header
      className="flex items-center justify-between gap-4 px-6 py-3"
      style={{
        background: '#fff',
        borderBottom: '1px solid var(--rule-lt)',
        minHeight: 56,
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5"
          style={{ color: 'var(--mute-lt)' }}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Command-style search */}
        <div
          className="hidden sm:flex items-center gap-2.5 w-full max-w-sm px-3 py-2"
          style={{
            background: 'var(--color-paper-alt)',
            color: 'var(--mute-lt)',
            fontSize: 13,
          }}
        >
          <Search size={14} />
          <span className="flex-1 truncate" style={{ color: 'var(--mute-lt)' }}>
            Search orders, customers, parts…
          </span>
          <span
            className="px-1.5 py-0.5"
            style={{
              background: '#fff',
              border: '1px solid var(--rule-lt-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--mute-lt)',
            }}
          >
            ⌘ K
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div
          className="hidden md:inline-flex items-center gap-2 uppercase"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '.16em',
            color: 'var(--mute-lt)',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-success)',
            }}
          />
          ERP · Online
        </div>

        <div className="relative" style={{ color: 'var(--color-ink)' }}>
          <Bell size={18} />
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-warm)',
            }}
          />
        </div>

        <div
          className="hidden lg:flex items-center gap-2"
          style={{ fontSize: 12, color: 'var(--mute-lt)' }}
        >
          <span>{user?.name}</span>
          <span style={{ width: 1, height: 14, background: 'var(--rule-lt-md)' }} />
          <span className="uppercase" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.14em' }}>
            {user?.role?.replace(/_/g, ' ')}
          </span>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 transition-colors duration-150"
          style={{
            fontSize: 12,
            color: 'var(--mute-lt)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
          }}
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
