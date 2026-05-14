import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Clients from './pages/Clients'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Vendors from './pages/Vendors'
import Requisitions from './pages/Requisitions'
import PurchaseOrders from './pages/PurchaseOrders'
import Quotations from './pages/Quotations'
import ProformaInvoices from './pages/ProformaInvoices'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } })

function PrivateRoute({ children, roles }: { children: React.ReactElement; roles?: string[] }) {
  const { user, isLoading, brands } = useAuth()
  if (isLoading) return <LoadingSpinner size="lg" />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  if (brands.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-sm w-full text-center">
          <p className="text-gray-600">Please contact your administrator to assign you to a company.</p>
        </div>
      </div>
    )
  }
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
      <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
      <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute roles={['super_admin','admin']}><Products /></PrivateRoute>} />
      <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
      <Route path="/vendors" element={<PrivateRoute roles={['super_admin','admin','requisition_admin']}><Vendors /></PrivateRoute>} />
      <Route path="/requisitions" element={<PrivateRoute><Requisitions /></PrivateRoute>} />
      <Route path="/purchase-orders" element={<PrivateRoute roles={['super_admin','admin','requisition_admin']}><PurchaseOrders /></PrivateRoute>} />
      <Route path="/quotations" element={<PrivateRoute roles={['super_admin','admin','quotation_admin']}><Quotations /></PrivateRoute>} />
      <Route path="/proforma-invoices" element={<PrivateRoute roles={['super_admin','admin','accounts']}><ProformaInvoices /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute roles={['super_admin','admin','accounts']}><Reports /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute roles={['super_admin']}><Admin /></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
