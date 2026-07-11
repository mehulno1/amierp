import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, ShoppingCart, Users, Package, Warehouse,
  ClipboardList, FileText, Truck, BarChart3, Settings, MessageSquare, FileOutput, X,
  ChevronDown,
} from 'lucide-react'
import Wordmark from './ui/Wordmark'
import { reportsForRole } from '../pages/reports/registry'

type NavRole = 'super_admin' | 'admin' | 'requisition_admin' | 'quotation_admin' | 'user' | 'accounts'

type NavEntry =
  | { type: 'link'; label: string; icon: typeof LayoutDashboard; path: string; roles: NavRole[] }
  | { type: 'group'; label: string; roles: NavRole[] }
  | { type: 'reports'; label: string; roles: NavRole[] }

const NAV: NavEntry[] = [
  { type: 'link', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['super_admin','admin','requisition_admin','quotation_admin','user','accounts'] },
  { type: 'group', label: 'Sales', roles: ['super_admin','admin','accounts','quotation_admin','user'] },
  { type: 'link', label: 'Orders', icon: ShoppingCart, path: '/orders', roles: ['super_admin','admin','user','accounts'] },
  { type: 'link', label: 'Proforma Invoices', icon: FileOutput, path: '/proforma-invoices', roles: ['super_admin','admin','accounts'] },
  { type: 'link', label: 'Clients', icon: Users, path: '/clients', roles: ['super_admin','admin','accounts','quotation_admin'] },
  { type: 'group', label: 'Quotations', roles: ['super_admin','admin','quotation_admin'] },
  { type: 'link', label: 'Enquiries', icon: MessageSquare, path: '/quotations', roles: ['super_admin','admin','quotation_admin'] },
  { type: 'group', label: 'Procurement', roles: ['super_admin','admin','requisition_admin','user'] },
  { type: 'link', label: 'Requisitions', icon: ClipboardList, path: '/requisitions', roles: ['super_admin','admin','requisition_admin','user'] },
  { type: 'link', label: 'Purchase Orders', icon: FileText, path: '/purchase-orders', roles: ['super_admin','admin','requisition_admin'] },
  { type: 'link', label: 'Vendors', icon: Truck, path: '/vendors', roles: ['super_admin','admin','requisition_admin'] },
  { type: 'group', label: 'Inventory', roles: ['super_admin','admin','requisition_admin'] },
  { type: 'link', label: 'Inventory', icon: Warehouse, path: '/inventory', roles: ['super_admin','admin','requisition_admin'] },
  { type: 'link', label: 'Products', icon: Package, path: '/products', roles: ['super_admin','admin'] },
  { type: 'reports', label: 'Reports', roles: ['super_admin','admin','accounts','requisition_admin'] },
  { type: 'group', label: 'Admin', roles: ['super_admin', 'admin'] },
  { type: 'link', label: 'System Admin', icon: Settings, path: '/admin', roles: ['super_admin', 'admin'] },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { pathname } = useLocation()
  const { user, brands } = useAuth()
  const role = (user?.role ?? 'user') as NavRole
  const [reportsOpen, setReportsOpen] = useState(pathname.startsWith('/reports'))
  const reportLinks = reportsForRole(role)
  const activeBrand = brands[0]
  const initials = user?.name
    ? user.name.split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase()
    : 'U'

  const content = (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
    >
      {/* Wordmark */}
      <div
        className="flex items-center justify-between px-5 pt-5 pb-5"
        style={{ borderBottom: '1px solid var(--rule)' }}
      >
        <Wordmark variant="dark" sub="ERP" size={22} />
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1"
            style={{ color: 'var(--mute)' }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Company switcher */}
      <div className="px-3 pt-4">
        <button
          className="w-full flex items-center justify-between px-3.5 py-2.5 transition-colors duration-150"
          style={{
            background: 'rgba(245,241,234,0.06)',
            border: '1px solid var(--rule)',
            color: 'var(--color-paper)',
            fontSize: 12,
            fontFamily: 'var(--font-sans)',
          }}
          type="button"
        >
          <span className="flex items-center gap-2.5">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--color-warm)',
                display: 'inline-block',
              }}
            />
            {activeBrand?.name ?? 'No company'}
          </span>
          <ChevronDown size={14} style={{ color: 'var(--mute)' }} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5">
        {NAV.map((item, idx) => {
          if (!item.roles.includes(role)) return null

          if (item.type === 'group') {
            return (
              <div key={`g-${idx}`} className="px-3.5 pt-4 pb-1">
                <span
                  className="uppercase"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    letterSpacing: '.18em',
                    color: 'var(--mute)',
                  }}
                >
                  {item.label}
                </span>
              </div>
            )
          }

          if (item.type === 'reports') {
            if (reportLinks.length === 0) return null
            const sectionActive = pathname === '/reports'
            return (
              <div key={`reports-${idx}`} className="pt-4">
                {/* Group header — toggles the report list, with a shortcut to the hub */}
                <div className="flex items-center justify-between px-3.5 pb-1">
                  <NavLink
                    to="/reports"
                    onClick={onClose}
                    className="flex items-center gap-2 uppercase"
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.18em',
                      color: sectionActive ? 'var(--color-warm)' : 'var(--mute)', textDecoration: 'none',
                    }}
                  >
                    <BarChart3 size={12} /> {item.label}
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => setReportsOpen(o => !o)}
                    aria-label={reportsOpen ? 'Collapse reports' : 'Expand reports'}
                    style={{ color: 'var(--mute)' }}
                  >
                    <ChevronDown
                      size={13}
                      style={{ transform: reportsOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .15s' }}
                    />
                  </button>
                </div>
                {reportsOpen && (
                  <div className="flex flex-col">
                    {reportLinks.map((r) => {
                      const to = `/reports/${r.slug}`
                      const active = pathname === to
                      const Icon = r.icon
                      return (
                        <NavLink
                          key={r.slug}
                          to={to}
                          onClick={onClose}
                          className="flex items-center gap-2.5 py-1.5 transition-colors duration-150"
                          style={{
                            fontFamily: 'var(--font-sans)', fontSize: 12.5,
                            paddingLeft: 18, paddingRight: 14, textDecoration: 'none',
                            background: active ? 'var(--color-warm)' : 'transparent',
                            color: active ? 'var(--color-ink)' : 'var(--mute)',
                            borderLeft: `3px solid ${active ? 'var(--color-warm-dk)' : 'transparent'}`,
                            marginLeft: active ? -3 : 0,
                          }}
                        >
                          <Icon size={13} style={{ opacity: active ? 1 : 0.7 }} />
                          {r.title}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const Icon = item.icon
          const active = pathname === item.path || pathname.startsWith(item.path + '/')

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2 transition-colors duration-150"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: '.01em',
                textDecoration: 'none',
                background: active ? 'var(--color-warm)' : 'transparent',
                color: active ? 'var(--color-ink)' : 'var(--mute)',
                borderLeft: `3px solid ${active ? 'var(--color-warm-dk)' : 'transparent'}`,
                marginLeft: active ? -3 : 0,
              }}
            >
              <Icon size={15} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User pill */}
      <NavLink
        to="/profile"
        onClick={onClose}
        className="flex items-center gap-3 px-5 py-4 transition-colors duration-150"
        style={{
          borderTop: '1px solid var(--rule)',
          textDecoration: 'none',
        }}
      >
        <div
          className="inline-flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--color-warm)',
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {initials}
        </div>
        <div className="min-w-0 leading-tight">
          <div
            className="truncate"
            style={{ fontSize: 13, color: 'var(--color-paper)', fontWeight: 500 }}
          >
            {user?.name ?? '—'}
          </div>
          <div
            className="uppercase truncate"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '.1em',
              color: 'var(--mute)',
            }}
          >
            {user?.role?.replace(/_/g, ' ') ?? ''}
          </div>
        </div>
      </NavLink>
    </div>
  )

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}

      {/* Desktop */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col">{content}</aside>

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  )
}
