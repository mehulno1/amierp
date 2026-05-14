import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ami_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('ami_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data: { current_password: string; new_password: string }) => api.post('/auth/change-password', data),
}

// Brands
export const brandsApi = {
  list: () => api.get('/brands'),
}

// Clients
export const clientsApi = {
  list: (search?: string, brand_id?: number) => api.get('/clients', { params: { search, brand_id } }),
  create: (data: any) => api.post('/clients', data),
  update: (id: number, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: number) => api.delete(`/clients/${id}`),
}

// Products
export const productsApi = {
  list: () => api.get('/products'),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  createVariant: (productId: number, data: any) => api.post(`/products/${productId}/variants`, data),
  updateVariant: (productId: number, variantId: number, data: any) => api.put(`/products/${productId}/variants/${variantId}`, data),
  deleteVariant: (productId: number, variantId: number) => api.delete(`/products/${productId}/variants/${variantId}`),
}

// Orders
export const ordersApi = {
  list: (params?: any) => api.get('/orders', { params }),
  get: (id: number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  update: (id: number, data: any) => api.put(`/orders/${id}`, data),
  cancel: (id: number) => api.patch(`/orders/${id}/cancel`),
  delete: (id: number) => api.delete(`/orders/${id}`),
  updateItems: (id: number, items: any[]) => api.put(`/orders/${id}/items`, { items }),
  updateBilling: (id: number, data: any) => api.put(`/orders/${id}/billing`, data),
  updatePayment: (id: number, data: any) => api.put(`/orders/${id}/payment`, data),
  updateDispatch: (id: number, data: any) => api.put(`/dispatch/${id}`, data),
}

// Inventory
export const inventoryApi = {
  getByType: (type: string) => api.get(`/inventory-items/type/${type}`),
  create: (data: any) => api.post('/inventory-items', data),
  adjust: (id: number, data: any) => api.post(`/inventory-items/${id}/adjust`, data),
  updateLevels: (id: number, data: any) => api.patch(`/inventory-items/${id}/levels`, data),
  getTransactions: (id: number) => api.get(`/inventory-items/${id}/transactions`),
  delete: (id: number) => api.delete(`/inventory-items/${id}`),
}

// Vendors
export const vendorsApi = {
  list: () => api.get('/vendors'),
  create: (data: any) => api.post('/vendors', data),
  update: (id: number, data: any) => api.put(`/vendors/${id}`, data),
  delete: (id: number) => api.delete(`/vendors/${id}`),
}

// Requisitions
export const requisitionsApi = {
  list: (params?: any) => api.get('/requisitions', { params }),
  get: (id: number) => api.get(`/requisitions/${id}`),
  create: (data: any) => api.post('/requisitions', data),
  delete: (id: number) => api.delete(`/requisitions/${id}`),
  updateStatus: (id: number, data: any) => api.patch(`/requisitions/${id}/status`, data),
  updateItems: (id: number, items: any[]) => api.put(`/requisitions/${id}/items`, { items }),
  addQuotation: (id: number, data: any) => api.post(`/requisitions/${id}/quotations`, data),
  selectQuotation: (id: number, quotationId: number) => api.post(`/requisitions/${id}/quotations/${quotationId}/select`),
  deleteQuotation: (reqId: number, quotationId: number) => api.delete(`/requisitions/${reqId}/quotations/${quotationId}`),
}

// Purchase Orders
export const purchaseOrdersApi = {
  list: (params?: any) => api.get('/purchase-orders', { params }),
  get: (id: number) => api.get(`/purchase-orders/${id}`),
  create: (data: any) => api.post('/purchase-orders', data),
  updateStatus: (id: number, data: any) => api.patch(`/purchase-orders/${id}/status`, data),
  updateReceivedQty: (id: number, itemId: number, data: any) => api.patch(`/purchase-orders/${id}/items/${itemId}/received`, data),
}

// Enquiries
export const enquiriesApi = {
  list: (params?: any) => api.get('/enquiries', { params }),
  get: (id: number) => api.get(`/enquiries/${id}`),
  create: (data: any) => api.post('/enquiries', data),
  updateStatus: (id: number, data: any) => api.patch(`/enquiries/${id}/status`, data),
  delete: (id: number) => api.delete(`/enquiries/${id}`),
}

// Offers
export const offersApi = {
  list: (params?: any) => api.get('/offers', { params }),
  get: (id: number) => api.get(`/offers/${id}`),
  create: (data: any) => api.post('/offers', data),
  send: (id: number, data?: any) => api.post(`/offers/${id}/send`, data),
}

// Proforma Invoices
export const piApi = {
  list: () => api.get('/proforma-invoices'),
  get: (id: number) => api.get(`/proforma-invoices/${id}`),
  send: (id: number, data?: any) => api.post(`/proforma-invoices/${id}/send`, data),
  regenerate: (orderId: number) => api.post(`/proforma-invoices/order/${orderId}/regenerate`),
  delete: (id: number) => api.delete(`/proforma-invoices/${id}`),
}

// Dashboard
export const dashboardApi = {
  getMasterStats: () => api.get('/dashboard/stats'),
  getRequisitionStats: () => api.get('/dashboard/requisition-stats'),
  getQuotationStats: () => api.get('/dashboard/quotation-stats'),
}

// Admin
export const adminApi = {
  listBrands: () => api.get('/admin/brands'),
  createBrand: (data: any) => api.post('/admin/brands', data),
  updateBrand: (id: number, data: any) => api.put(`/admin/brands/${id}`, data),
  listUsers: () => api.get('/admin/users'),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
}

export default api
