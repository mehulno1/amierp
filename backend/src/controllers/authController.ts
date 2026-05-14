import { Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { executeQuery } from '../config/database'
import { AuthRequest } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'ami_erp_jwt_secret'

export async function login(req: AuthRequest, res: Response) {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password required' })

    const users = await executeQuery<any>('SELECT * FROM new_users WHERE username = ? AND is_active = 1', [username])
    if (!users.length) return res.status(401).json({ success: false, error: 'Invalid credentials' })

    const user = users[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid credentials' })

    const brands = user.role === 'super_admin'
      ? await executeQuery<any>('SELECT * FROM brands WHERE is_active = 1')
      : await executeQuery<any>('SELECT b.* FROM brands b JOIN user_brands ub ON b.id = ub.brand_id WHERE ub.user_id = ? AND b.is_active = 1', [user.id])

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' })
    const { password_hash, ...safeUser } = user
    res.json({ success: true, data: { token, user: safeUser, brands } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const brands = req.user!.role === 'super_admin'
      ? await executeQuery<any>('SELECT * FROM brands WHERE is_active = 1')
      : await executeQuery<any>('SELECT b.* FROM brands b JOIN user_brands ub ON b.id = ub.brand_id WHERE ub.user_id = ? AND b.is_active = 1', [req.user!.id])
    res.json({ success: true, data: { user: req.user, brands } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { current_password, new_password } = req.body
    const users = await executeQuery<any>('SELECT * FROM new_users WHERE id = ?', [req.user!.id])
    const valid = await bcrypt.compare(current_password, users[0].password_hash)
    if (!valid) return res.status(400).json({ success: false, error: 'Current password incorrect' })
    const hash = await bcrypt.hash(new_password, 10)
    await executeQuery('UPDATE new_users SET password_hash = ? WHERE id = ?', [hash, req.user!.id])
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}
