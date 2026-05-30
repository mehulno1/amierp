import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../services/api'
import { Plus, Edit2, Trash2, Star } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { useSortable } from '../hooks/useSortable'
import { SortIcon, thSort } from '../components/SortIcon'
import { useAuth } from '../hooks/useAuth'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'requisition_admin', label: 'Requisition Admin' },
  { value: 'quotation_admin', label: 'Quotation Admin' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'user', label: 'User' },
]

function UserModal({ user, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm<any>({
    defaultValues: user
      ? { name: user.name, username: user.username, email: user.email, role: user.role, can_approve_requisitions: !!user.can_approve_requisitions, is_active: user.is_active }
      : { role: 'user' }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      if (user) await adminApi.updateUser(user.id, data)
      else await adminApi.createUser(data)
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{user ? 'Edit User' : 'New User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input className="input-field" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input className="input-field" {...register('username', { required: !user })} disabled={!!user} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field" {...register('email')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password {user ? '(leave blank to keep)' : '*'}</label>
            <input type="password" className="input-field" {...register('password', { required: !user })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select className="input-field" {...register('role')}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('can_approve_requisitions')} />
              Can approve requisitions
            </label>
            <p className="text-xs text-gray-400 mt-1">Lets this user approve or reject requisitions raised by others.</p>
          </div>
          {user && (
            <div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...register('is_active')} defaultChecked={user.is_active} />
                Active
              </label>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Company modal — full editor with a banks management section embedded. The bank
// rows in the table sit under the company because every PI/Order picks a bank that
// belongs to one specific brand; managing them in a separate top-level page would
// force users to context-switch when they're already editing the company.
function CompanyModal({ brand, onClose, onSuccess }: any) {
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const isNew = !brand
  const { register, handleSubmit, reset } = useForm<any>({
    defaultValues: brand ?? { is_active: 1 }
  })

  const { data: banks = [], isFetching: loadingBanks, refetch: refetchBanks } = useQuery({
    queryKey: ['admin-brand-banks', brand?.id],
    queryFn: () => adminApi.listBanks(brand.id).then(r => r.data.data),
    enabled: !!brand?.id,
  })

  const [bankModal, setBankModal] = useState<{ open: boolean; bank?: any }>({ open: false })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      if (isNew) await adminApi.createBrand(data)
      else await adminApi.updateBrand(brand.id, data)
      toast.success('Company saved')
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  const handleDeleteBank = async (bank: any) => {
    if (!confirm(`Remove bank "${bank.bank_name}"?`)) return
    await adminApi.deleteBank(brand.id, bank.id)
    refetchBanks()
    qc.invalidateQueries({ queryKey: ['brand-banks'] })
    toast.success('Bank removed')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{isNew ? 'New Company' : 'Edit Company'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 border-b">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input className="input-field" {...register('name', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input className="input-field" {...register('code', { required: true })} disabled={!isNew} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea rows={2} className="input-field" {...register('address')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input className="input-field" {...register('city')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input className="input-field" {...register('state')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input className="input-field" {...register('phone')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input-field" {...register('email')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input className="input-field font-mono" {...register('gstin')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
              <input className="input-field font-mono" {...register('pan')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IEC (Import Export Code)</label>
              <input className="input-field font-mono" {...register('iec')} />
            </div>
            {!isNew && (
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...register('is_active')} defaultChecked={!!brand.is_active} />
                  Active
                </label>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => reset()} className="btn-secondary">Reset</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save Company'}</button>
          </div>
        </form>

        {!isNew && (
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Bank Accounts</h3>
              <button onClick={() => setBankModal({ open: true })} className="btn-secondary text-sm flex items-center gap-1">
                <Plus size={14} /> Add Bank
              </button>
            </div>
            <p className="text-xs text-gray-500">
              These accounts populate the Bank dropdown on new orders and become the bank-details block on the PI.
              The default bank is used when an order is created without an explicit selection.
            </p>
            {loadingBanks ? <LoadingSpinner /> : banks.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center border border-dashed rounded-lg">
                No banks yet. Add one to enable PI generation with auto-populated bank details.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100 text-xs uppercase text-gray-500">
                      <th className="pb-2">Bank</th>
                      <th className="pb-2">Account Name</th>
                      <th className="pb-2">A/C No.</th>
                      <th className="pb-2">IFSC</th>
                      <th className="pb-2 text-center">Default</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {banks.map((b: any) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium">{b.bank_name}{b.branch ? <span className="text-gray-400"> • {b.branch}</span> : null}</td>
                        <td className="py-3 text-gray-600">{b.account_name}</td>
                        <td className="py-3 font-mono text-xs">{b.account_no}</td>
                        <td className="py-3 font-mono text-xs">{b.ifsc_code || '—'}</td>
                        <td className="py-3 text-center">
                          {b.is_default ? <Star size={14} className="text-amber-500 inline" fill="currentColor" /> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 flex gap-2">
                          <button onClick={() => setBankModal({ open: true, bank: b })} className="text-blue-500 hover:text-blue-700"><Edit2 size={14} /></button>
                          <button onClick={() => handleDeleteBank(b)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {bankModal.open && (
          <BankModal
            brandId={brand.id}
            bank={bankModal.bank}
            onClose={() => setBankModal({ open: false })}
            onSuccess={() => {
              setBankModal({ open: false })
              refetchBanks()
              qc.invalidateQueries({ queryKey: ['brand-banks'] })
            }}
          />
        )}
      </div>
    </div>
  )
}

function BankModal({ brandId, bank, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const isNew = !bank
  const { register, handleSubmit } = useForm<any>({
    defaultValues: bank ?? { is_default: false }
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const payload = { ...data, is_default: data.is_default ? 1 : 0 }
      if (isNew) await adminApi.createBank(brandId, payload)
      else await adminApi.updateBank(brandId, bank.id, payload)
      toast.success('Bank saved')
      onSuccess()
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{isNew ? 'Add Bank Account' : 'Edit Bank Account'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
            <input className="input-field" {...register('account_name', { required: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
            <input className="input-field" {...register('bank_name', { required: true })} placeholder="HDFC Bank Ltd. Jamshedpur" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <input className="input-field" {...register('branch')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account No. *</label>
              <input className="input-field font-mono" {...register('account_no', { required: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <input className="input-field font-mono" {...register('ifsc_code')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Swift Code</label>
            <input className="input-field font-mono" {...register('swift_code')} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" {...register('is_default')} defaultChecked={!!bank?.is_default} />
            Set as default bank for this company
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save Bank'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Admin() {
  const qc = useQueryClient()
  const { isSuperAdmin } = useAuth()
  const [tab, setTab] = useState<'users' | 'companies'>(isSuperAdmin() ? 'users' : 'companies')
  const [userModal, setUserModal] = useState<any>({ open: false })
  const [companyModal, setCompanyModal] = useState<any>({ open: false })

  const { data: users = [], isLoading: loadUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.listUsers().then(r => r.data.data),
    enabled: isSuperAdmin(),
  })
  const { data: brands = [], isLoading: loadBrands } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => adminApi.listBrands().then(r => r.data.data),
  })
  const { sorted: sortedUsers, sortCol: uSortCol, sortDir: uSortDir, toggle: uToggle } = useSortable(users, 'name')
  const { sorted: sortedBrands, sortCol: bSortCol, sortDir: bSortDir, toggle: bToggle } = useSortable(brands, 'name')
  const usi = (col: string) => <SortIcon col={col} sortCol={uSortCol} sortDir={uSortDir} />
  const bsi = (col: string) => <SortIcon col={col} sortCol={bSortCol} sortDir={bSortDir} />

  const handleDeleteUser = async (id: number, name: string) => {
    if (!confirm(`Deactivate user "${name}"?`)) return
    await adminApi.deleteUser(id)
    qc.invalidateQueries({ queryKey: ['admin-users'] })
    toast.success('User deactivated')
  }

  const handleDeleteBrand = async (b: any) => {
    if (!confirm(`Deactivate company "${b.name}"? Existing orders/PIs are preserved.`)) return
    await adminApi.deleteBrand(b.id)
    qc.invalidateQueries({ queryKey: ['admin-brands'] })
    qc.invalidateQueries({ queryKey: ['brands'] })
    toast.success('Company deactivated')
  }

  const tabs = isSuperAdmin() ? (['users', 'companies'] as const) : (['companies'] as const)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>

      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors capitalize ${tab === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'users' && isSuperAdmin() && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Users</h2>
            <button onClick={() => setUserModal({ open: true })} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14} />New User</button>
          </div>
          {loadUsers ? <LoadingSpinner /> : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className={thSort} onClick={() => uToggle('name')}>Name {usi('name')}</th>
                  <th className={thSort} onClick={() => uToggle('username')}>Username {usi('username')}</th>
                  <th className={thSort} onClick={() => uToggle('role')}>Role {usi('role')}</th>
                  <th className={thSort} onClick={() => uToggle('is_active')}>Status {usi('is_active')}</th>
                  <th className="pb-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{u.name}</td>
                    <td className="py-3 text-gray-600">{u.username}</td>
                    <td className="py-3 capitalize">
                      <span className="badge-status bg-blue-100 text-blue-700">{u.role.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3">
                      <span className={`badge-status ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 flex gap-2">
                      <button onClick={() => setUserModal({ open: true, user: u })} className="text-blue-500 hover:text-blue-700"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteUser(u.id, u.name)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {tab === 'companies' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Companies</h2>
            {isSuperAdmin() && (
              <button onClick={() => setCompanyModal({ open: true })} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14} />New Company</button>
            )}
          </div>
          {loadBrands ? <LoadingSpinner /> : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className={thSort} onClick={() => bToggle('name')}>Name {bsi('name')}</th>
                  <th className={thSort} onClick={() => bToggle('code')}>Code {bsi('code')}</th>
                  <th className={thSort} onClick={() => bToggle('gstin')}>GSTIN {bsi('gstin')}</th>
                  <th className={thSort} onClick={() => bToggle('is_active')}>Status {bsi('is_active')}</th>
                  <th className="pb-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedBrands.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium">{b.name}</td>
                    <td className="py-3 text-gray-600">{b.code}</td>
                    <td className="py-3 text-gray-500 font-mono text-xs">{b.gstin || '—'}</td>
                    <td className="py-3">
                      <span className={`badge-status ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 flex gap-2">
                      <button onClick={() => setCompanyModal({ open: true, brand: b })} className="text-blue-500 hover:text-blue-700" title="Edit"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteBrand(b)} className="text-red-500 hover:text-red-700" title="Deactivate"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {userModal.open && (
        <UserModal
          user={userModal.user}
          onClose={() => setUserModal({ open: false })}
          onSuccess={() => { setUserModal({ open: false }); qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Saved') }}
        />
      )}

      {companyModal.open && (
        <CompanyModal
          brand={companyModal.brand}
          onClose={() => setCompanyModal({ open: false })}
          onSuccess={() => {
            setCompanyModal({ open: false })
            qc.invalidateQueries({ queryKey: ['admin-brands'] })
            qc.invalidateQueries({ queryKey: ['brands'] })
          }}
        />
      )}
    </div>
  )
}
