import { useAuth } from '../hooks/useAuth'
import { LogOut, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm text-gray-500 hidden sm:block">
          Welcome back, <span className="font-medium text-gray-800">{user?.name}</span>!
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          Role: <span className="font-medium text-gray-700 capitalize">{user?.role?.replace(/_/g, ' ')}</span>
        </span>
        <div className="h-4 w-px bg-gray-200" />
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}
