import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    host: `email-smtp.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com`,
    port: 587,
    secure: false,
    auth: {
      user: process.env.AWS_ACCESS_KEY_ID || '',
      pass: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })
}

export async function sendPIEmail(pi: any, toEmail: string) {
  const transporter = getTransporter()
  const subject = `Proforma Invoice ${pi.pi_no} from ${pi.brand?.name || 'AMI Enterprises'}`
  const html = `
    <p>Dear ${pi.client_name},</p>
    <p>Please find attached the Proforma Invoice <strong>${pi.pi_no}</strong> dated ${pi.pi_date}.</p>
    <p>Total Amount: <strong>Rs. ${pi.total_amount?.toLocaleString('en-IN')}</strong> (incl. ${pi.gst_percent}% GST)</p>
    <p>Please confirm receipt and arrange payment as per agreed terms.</p>
    <br/><p>Regards,<br/>${pi.brand?.name || 'AMI Enterprises Pvt. Ltd.'}<br/>${pi.brand?.phone || ''}<br/>${pi.brand?.email || ''}</p>
  `
  await transporter.sendMail({ from: process.env.SES_FROM_EMAIL, to: toEmail, subject, html })
}

export async function sendOfferEmail(offer: any, toEmail: string, ccEmail?: string) {
  const transporter = getTransporter()
  const subject = `Quotation ${offer.offer_no} from ${offer.brand?.name || 'AMI Enterprises'}`
  const html = `
    <p>Dear ${offer.contact_person || offer.customer_name},</p>
    <p>Please find our quotation <strong>${offer.offer_no}</strong> dated ${offer.offer_date}.</p>
    <p>This quotation is valid till <strong>${offer.validity_date || 'until stock lasts'}</strong>.</p>
    <p>We look forward to your valued order.</p>
    <br/><p>Regards,<br/>${offer.brand?.name || 'AMI Enterprises Pvt. Ltd.'}<br/>${offer.brand?.phone || ''}<br/>${offer.brand?.email || ''}</p>
  `
  const mailOptions: any = { from: process.env.SES_FROM_EMAIL, to: toEmail, subject, html }
  if (ccEmail) mailOptions.cc = ccEmail
  await transporter.sendMail(mailOptions)
}

export async function sendRequisitionReminderEmail(toEmail: string, requisitions: any[]) {
  const transporter = getTransporter()
  const list = requisitions.map(r => `<li>${r.indent_no} — ${r.machine_area || 'N/A'} [${r.priority}] (Status: ${r.status})</li>`).join('')
  const html = `
    <p>Reminder: The following requisitions require your attention:</p>
    <ul>${list}</ul>
    <p>Please update the status or raise purchase orders as needed.</p>
  `
  await transporter.sendMail({
    from: process.env.SES_FROM_EMAIL,
    to: toEmail,
    subject: `Requisition Reminder — ${requisitions.length} item(s) pending`,
    html,
  })
}
