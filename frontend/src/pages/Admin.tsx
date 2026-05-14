import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../services/api'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { useSortable } from '../hooks/useSortable'
import { SortIcon, thSort } from '../components/SortIcon'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'requisition_admin', label: 'Requisition Admin' },
  { value: 'quotation_admin', label: 'Quotation Admin' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'user', label: 'User (Floor Manager)' },
]

function UserModal({ user, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit } = useForm<any>({
    defaultValues: user
      ? { name: user.name, username: user.username, email: user.email, role: user.role, is_active: user.is_active }
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

export default function Admin() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'users' | 'companies'>('users')
  const [modal, setModal] = useState<any>({ open: false })

  const { data: users = [], isLoading: loadUsers } = useQuery({ queryKey: ['admin-users'], queryFn: () => adminApi.listUsers().then(r => r.data.data) })
  const { data: brands = [], isLoading: loadBrands } = useQuery({ queryKey: ['admin-brands'], queryFn: () => adminApi.listBrands().then(r => r.data.data) })
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Administration</h1>

      <div className="flex gap-2">
        {(['users', 'companies'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm border transition-colors capitalize ${tab === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Users</h2>
            <button onClick={() => setModal({ open: true })} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14} />New User</button>
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
                      <button onClick={() => setModal({ open: true, user: u })} className="text-blue-500 hover:text-blue-700"><Edit2 size={14} /></button>
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
          <h2 className="font-semibold text-gray-900 mb-4">Companies</h2>
          {loadBrands ? <LoadingSpinner /> : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className={thSort} onClick={() => bToggle('name')}>Name {bsi('name')}</th>
                  <th className={thSort} onClick={() => bToggle('code')}>Code {bsi('code')}</th>
                  <th className={thSort} onClick={() => bToggle('gstin')}>GSTIN {bsi('gstin')}</th>
                  <th className={thSort} onClick={() => bToggle('is_active')}>Status {bsi('is_active')}</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {modal.open && (
        <UserModal
          user={modal.user}
          onClose={() => setModal({ open: false })}
          onSuccess={() => { setModal({ open: false }); qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Saved') }}
        />
      )}
    </div>
  )
}
