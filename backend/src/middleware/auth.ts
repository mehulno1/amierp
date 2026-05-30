import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { executeQuery } from '../config/database'
import { AuthRequest, User } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'ami_erp_jwt_secret'

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' })

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
    const users = await executeQuery<User>('SELECT * FROM new_users WHERE id = ? AND is_active = 1', [decoded.userId])
    if (!users.length) return res.status(401).json({ success: false, error: 'User not found' })
    req.user = users[0]
    next()
  } catch {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' })
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })
    if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, error: 'Forbidden' })
    next()
  }
}

export const requireAdmin = requireRole(['super_admin', 'admin'])
export const requireSuperAdmin = requireRole(['super_admin'])
export const requireRequisitionAdmin = requireRole(['super_admin', 'admin', 'requisition_admin'])
export const requireQuotationAdmin = requireRole(['super_admin', 'admin', 'quotation_admin'])

// Approving a requisition is a per-user right (can_approve_requisitions) layered on top
// of the role — super_admin/admin always qualify, any other role only with the flag set.
export function requireRequisitionApprover(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })
  const isAdmin = ['super_admin', 'admin'].includes(req.user.role)
  if (!isAdmin && !(req.user as any).can_approve_requisitions) {
    return res.status(403).json({ success: false, error: 'Not allowed to approve requisitions' })
  }
  next()
}

export async function requireBrandContext(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' })

  // Collect all brands accessible to this user
  let allBrands: any[]
  if (req.user.role === 'super_admin') {
    allBrands = await executeQuery('SELECT id, id as brand_id FROM brands WHERE is_active = 1')
  } else {
    allBrands = await executeQuery(
      'SELECT ub.brand_id, b.* FROM user_brands ub JOIN brands b ON ub.brand_id = b.id WHERE ub.user_id = ? AND b.is_active = 1',
      [req.user.id]
    )
  }

  if (!allBrands.length) return res.status(403).json({ success: false, error: 'No brand assigned' })
  req.userBrandIds = allBrands.map(b => b.brand_id)

  // Optional specific brand from header — used for filtering in list views
  const brandIdHeader = req.headers['x-brand-id']
  const brandId = brandIdHeader ? parseInt(brandIdHeader as string) : null

  if (brandId) {
    if (!req.userBrandIds.includes(brandId)) {
      return res.status(403).json({ success: false, error: 'No access to this brand' })
    }
    req.brandId = brandId
    req.brand = allBrands.find(b => b.brand_id === brandId)
  }
  // No header → brandId stays undefined; controllers use userBrandIds for cross-company queries

  next()
}
