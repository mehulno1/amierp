import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../services/api'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const onSubmit = async (data: any) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authApi.changePassword({ current_password: data.current_password, new_password: data.new_password })
      toast.success('Password changed successfully')
      reset()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Account Info</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="font-medium">{user?.name}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Username</dt><dd>{user?.username}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{user?.email || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Role</dt><dd className="capitalize">{user?.role?.replace('_', ' ')}</dd></div>
        </dl>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label><input type="password" className="input-field" {...register('current_password', { required: true })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label><input type="password" className="input-field" {...register('new_password', { required: true, minLength: 6 })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><input type="password" className="input-field" {...register('confirm_password', { required: true })} /></div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Changing...' : 'Change Password'}</button>
        </form>
      </div>
    </div>
  )
}
