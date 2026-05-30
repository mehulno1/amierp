import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi } from '../services/api'
import type { User, Brand } from '../types'

interface AuthContextType {
  user: User | null
  brands: Brand[]
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  isRequisitionAdmin: () => boolean
  isQuotationAdmin: () => boolean
  canApproveRequisitions: () => boolean
  hasRole: (roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [token, setToken] = useState<string | null>(localStorage.getItem('ami_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authApi.getProfile()
        .then((res) => {
          setUser(res.data.data.user)
          setBrands(res.data.data.brands)
        })
        .catch(() => {
          localStorage.removeItem('ami_token')
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [token])

  const login = async (username: string, password: string) => {
    const res = await authApi.login({ username, password })
    const { token: newToken, user: newUser, brands: newBrands } = res.data.data
    localStorage.setItem('ami_token', newToken)
    setToken(newToken)
    setUser(newUser)
    setBrands(newBrands)
  }

  const logout = () => {
    localStorage.removeItem('ami_token')
    setToken(null)
    setUser(null)
    setBrands([])
  }

  const isAdmin = () => ['super_admin', 'admin'].includes(user?.role || '')
  const isSuperAdmin = () => user?.role === 'super_admin'
  const isRequisitionAdmin = () => ['super_admin', 'admin', 'requisition_admin'].includes(user?.role || '')
  const isQuotationAdmin = () => ['super_admin', 'admin', 'quotation_admin'].includes(user?.role || '')
  const canApproveRequisitions = () => isAdmin() || !!user?.can_approve_requisitions
  const hasRole = (roles: string[]) => roles.includes(user?.role || '')

  return (
    <AuthContext.Provider value={{ user, brands, token, isLoading, login, logout, isAdmin, isSuperAdmin, isRequisitionAdmin, isQuotationAdmin, canApproveRequisitions, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
