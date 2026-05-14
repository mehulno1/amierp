import { executeQuery } from '../config/database'
import { sendRequisitionReminderEmail } from './emailService'

export async function sendRequisitionReminders() {
  try {
    // Requisitions with reminder_date = today
    const dueTodayRows = await executeQuery<any>(
      `SELECT r.*, u.email as admin_email, u.name as admin_name
       FROM requisitions r
       JOIN new_users u ON u.role IN ('requisition_admin','admin','super_admin')
       WHERE r.reminder_date = CURDATE() AND r.status NOT IN ('delivered','cancelled')
       GROUP BY r.id`
    )

    // Group by brand to find relevant admins
    const byBrand: Record<number, { email: string; reqs: any[] }> = {}
    for (const row of dueTodayRows) {
      if (!byBrand[row.brand_id]) byBrand[row.brand_id] = { email: row.admin_email, reqs: [] }
      byBrand[row.brand_id].reqs.push(row)
    }

    for (const { email, reqs } of Object.values(byBrand)) {
      if (email && reqs.length) {
        await sendRequisitionReminderEmail(email, reqs)
      }
    }

    // Overdue (past no_of_days)
    const overdueRows = await executeQuery<any>(
      `SELECT r.*, u.email as admin_email FROM requisitions r
       JOIN new_users u ON u.role IN ('requisition_admin','admin')
       WHERE r.status NOT IN ('delivered','cancelled')
         AND DATE_ADD(r.created_at, INTERVAL COALESCE((SELECT MAX(ri.no_of_days) FROM requisition_items ri WHERE ri.requisition_id = r.id),7) DAY) = CURDATE()
       GROUP BY r.id`
    )
    const overdueByBrand: Record<number, { email: string; reqs: any[] }> = {}
    for (const row of overdueRows) {
      if (!overdueByBrand[row.brand_id]) overdueByBrand[row.brand_id] = { email: row.admin_email, reqs: [] }
      overdueByBrand[row.brand_id].reqs.push(row)
    }
    for (const { email, reqs } of Object.values(overdueByBrand)) {
      if (email && reqs.length) await sendRequisitionReminderEmail(email, reqs)
    }

    console.log(`Reminder cron: processed ${dueTodayRows.length} reminder + ${overdueRows.length} overdue requisitions`)
  } catch (err) {
    console.error('Reminder cron error:', err)
  }
}
