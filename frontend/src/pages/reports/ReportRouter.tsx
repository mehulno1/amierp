import { useParams, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { REPORTS, type ReportRole } from './registry'

// Resolves /reports/:slug to its report component, enforcing the report's roles.
export default function ReportRouter() {
  const { slug } = useParams()
  const { user } = useAuth()
  const report = REPORTS.find((r) => r.slug === slug)
  if (!report) return <Navigate to="/reports" replace />
  if (!report.roles.includes((user?.role || 'user') as ReportRole)) return <Navigate to="/reports" replace />
  const Component = report.component
  return <Component />
}
