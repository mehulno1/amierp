import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logoami from '../assets/logoami.png'
import {
  LayoutDashboard, ShoppingCart, Users, Package, Warehouse,
  ClipboardList, FileText, Truck, BarChart3, Settings, MessageSquare, FileOutput, X
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['super_admin','admin','requisition_admin','quotation_admin','user','accounts'] },
  { type: 'divider', label: 'SALES', roles: ['super_admin','admin','accounts','quotation_admin','user'] },
  { label: 'Orders', icon: ShoppingCart, path: '/orders', roles: ['super_admin','admin','user','accounts'] },
  { label: 'Proforma Invoices', icon: FileOutput, path: '/proforma-invoices', roles: ['super_admin','admin','accounts'] },
  { label: 'Clients', icon: Users, path: '/clients', roles: ['super_admin','admin','accounts','quotation_admin'] },
  { type: 'divider', label: 'QUOTATIONS', roles: ['super_admin','admin','quotation_admin'] },
  { label: 'Enquiries', icon: MessageSquare, path: '/quotations', roles: ['super_admin','admin','quotation_admin'] },
  { type: 'divider', label: 'PROCUREMENT', roles: ['super_admin','admin','requisition_admin','user'] },
  { label: 'Requisitions', icon: ClipboardList, path: '/requisitions', roles: ['super_admin','admin','requisition_admin','user'] },
  { label: 'Purchase Orders', icon: FileText, path: '/purchase-orders', roles: ['super_admin','admin','requisition_admin'] },
  { label: 'Vendors', icon: Truck, path: '/vendors', roles: ['super_admin','admin','requisition_admin'] },
  { type: 'divider', label: 'INVENTORY', roles: ['super_admin','admin','requisition_admin'] },
  { label: 'Inventory', icon: Warehouse, path: '/inventory', roles: ['super_admin','admin','requisition_admin'] },
  { label: 'Products', icon: Package, path: '/products', roles: ['super_admin','admin'] },
  { type: 'divider', label: 'REPORTS', roles: ['super_admin','admin','accounts'] },
  { label: 'Reports', icon: BarChart3, path: '/reports', roles: ['super_admin','admin','accounts'] },
  { type: 'divider', label: 'ADMIN', roles: ['super_admin'] },
  { label: 'System Admin', icon: Settings, path: '/admin', roles: ['super_admin'] },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const role = user?.role || ''

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <img src={logoami} alt="Ami Enterprises" className="w-8 h-8 object-contain" />
          <div>
            <div className="font-bold text-sm text-gray-900">AMI ERP</div>
            <div className="text-xs text-gray-400">Management System</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item, idx) => {
          if (item.type === 'divider') {
            if (!(item as any).roles?.includes(role)) return null
            return (
              <div key={idx} className="px-2 pt-4 pb-1">
                <span className="text-xs font-semibold text-gray-400 tracking-wider">{item.label}</span>
              </div>
            )
          }
          if (!(item as any).roles?.includes(role)) return null
          const Icon = (item as any).icon
          const active = pathname === item.path || pathname.startsWith(item.path + '/')
          return (
            <NavLink
              key={item.path}
              to={item.path!}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={16} className={active ? 'text-blue-600' : 'text-gray-400'} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-gray-100 p-3">
        <NavLink to="/profile" onClick={onClose} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 group">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400 capitalize">{user?.role?.replace(/_/g, ' ')}</div>
          </div>
        </NavLink>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}

      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 shrink-0 flex-col">
        {content}
      </aside>

      {/* Mobile sidebar — slide in */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {content}
      </aside>
    </>
  )
}
