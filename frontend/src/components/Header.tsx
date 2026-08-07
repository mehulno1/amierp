import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { notificationsApi } from '../services/api'
import { LogOut, Menu, Search, Bell } from 'lucide-react'
import { fmtDate } from '../utils/formatDate'

interface HeaderProps {
  onMenuClick?: () => void
}

// Bell + dropdown. Polls every 60s; clicking a requisition-linked notification
// jumps to the requisitions page and marks it read.
function NotificationBell() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then(r => r.data.data),
    refetchInterval: 60_000,
  })
  const unread = Number(data?.unread) || 0
  const items = data?.notifications || []

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const openItem = async (n: any) => {
    setOpen(false)
    if (!n.is_read) {
      try { await notificationsApi.markRead(n.id) } catch { /* non-fatal */ }
      qc.invalidateQueries({ queryKey: ['notifications'] })
    }
    if (n.reference_type === 'requisition') navigate('/requisitions')
  }

  const markAll = async () => {
    try { await notificationsApi.markAllRead() } catch { /* non-fatal */ }
    qc.invalidateQueries({ queryKey: ['notifications'] })
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} style={{ color: 'var(--color-ink)', position: 'relative', background: 'transparent', cursor: 'pointer' }} aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && (
          <span
            style={{
              position: 'absolute', top: -6, right: -8, minWidth: 15, height: 15,
              borderRadius: 8, background: 'var(--color-warm)', color: '#fff',
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto"
          style={{ background: '#fff', border: '1px solid var(--rule-lt-md)', boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 50 }}
        >
          <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--rule-lt)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--mute-lt)' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} style={{ fontSize: 11, color: 'var(--color-warm-dk)', background: 'transparent', cursor: 'pointer' }}>Mark all read</button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center" style={{ fontSize: 12, color: 'var(--mute-lt)' }}>No notifications yet</p>
          ) : (
            items.map((n: any) => (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className="block w-full text-left px-3 py-2.5"
                style={{
                  background: n.is_read ? '#fff' : 'var(--color-paper-alt)',
                  borderBottom: '1px solid var(--rule-lt)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 600, color: 'var(--color-ink)' }}>{n.title}</div>
                {n.body && <div style={{ fontSize: 11, color: 'var(--mute-lt)', marginTop: 2 }}>{n.body}</div>}
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mute-lt)', marginTop: 3 }}>{fmtDate(n.created_at)}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header
      className="flex items-center justify-between gap-4 px-6 py-3"
      style={{
        background: 'var(--color-paper)',
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
            background: '#fff',
            border: '1px solid var(--rule-lt)',
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
              background: 'var(--color-paper-alt)',
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

        <NotificationBell />

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
