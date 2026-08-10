import nodemailer from 'nodemailer'

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
}

function display(value) { return value || 'Not provided' }

export function buildInquiryMessage(inquiry, { recipient, from }) {
  const subjectName = inquiry.companyName || inquiry.fullName
  const subject = `New DENeon project inquiry — ${subjectName.replace(/[\r\n]/g, ' ')}`
  const rows = [
    ['Inquiry ID', inquiry.inquiryId], ['Submitted', inquiry.submittedAt], ['Full name', inquiry.fullName],
    ['Work email', inquiry.workEmail], ['Company / project', display(inquiry.companyName)],
    ['Company website', display(inquiry.companyWebsite)], ['Project title', inquiry.projectTitle],
    ['Project type', inquiry.projectType], ['Project stage', inquiry.projectStage],
    ['Required expertise', inquiry.expertise.join(', ')], ['Expected start', inquiry.expectedStartDate],
    ['Approximate budget', inquiry.budget], ['Preferred timezone', display(inquiry.timezone)],
    ['Relevant links', inquiry.relevantLinks.length ? inquiry.relevantLinks.join('\n') : 'Not provided'],
    ['Project description', inquiry.description]
  ]
  const text = rows.map(([label, value]) => `${label}:\n${value}`).join('\n\n')
  const htmlRows = rows.map(([label, value]) => `<tr><th style="padding:10px 14px;text-align:left;vertical-align:top;color:#587084;border-bottom:1px solid #dbe6ec">${escapeHtml(label)}</th><td style="padding:10px 14px;color:#102232;border-bottom:1px solid #dbe6ec;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join('')
  return {
    to: recipient, from, replyTo: inquiry.workEmail, subject, text,
    html: `<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#102232"><h1 style="font-size:24px">New DENeon project inquiry</h1><p style="color:#587084">A new inquiry was submitted through team.deneon.net.</p><table style="width:100%;border-collapse:collapse">${htmlRows}</table></div>`
  }
}

export function buildContactMessage(message, { recipient, from }) {
  const subject = `New DENeon contact message — ${message.subject.replace(/[\r\n]/g, ' ')}`
  const rows = [
    ['Message ID', message.messageId],
    ['Submitted', message.submittedAt],
    ['Full name', message.fullName],
    ['Email', message.email],
    ['Company', display(message.company)],
    ['Subject', message.subject],
    ['Message', message.message]
  ]
  const text = rows.map(([label, value]) => `${label}:\n${value}`).join('\n\n')
  const htmlRows = rows.map(([label, value]) => `<tr><th style="padding:10px 14px;text-align:left;vertical-align:top;color:#587084;border-bottom:1px solid #dbe6ec">${escapeHtml(label)}</th><td style="padding:10px 14px;color:#102232;border-bottom:1px solid #dbe6ec;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join('')
  return {
    to: recipient,
    from,
    replyTo: message.email,
    subject,
    text,
    html: `<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#102232"><h1 style="font-size:24px">New DENeon contact message</h1><p style="color:#587084">A new message was submitted through team.deneon.net.</p><table style="width:100%;border-collapse:collapse">${htmlRows}</table></div>`
  }
}

export function createMailTransport(env = process.env) {
  if (env.SMTP_TRANSPORT === 'json') return nodemailer.createTransport({ jsonTransport: true })
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure: String(env.SMTP_SECURE).toLowerCase() === 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    requireTLS: String(env.SMTP_SECURE).toLowerCase() !== 'true'
  })
}

export function mailSettings(env = process.env) {
  return {
    recipient: env.PROJECT_INQUIRY_RECIPIENT || 'deneonofficial@gmail.com',
    from: env.PROJECT_INQUIRY_FROM || 'DENeon Team <deneonofficial@gmail.com>'
  }
}

export function contactMailSettings(env = process.env) {
  return {
    recipient: env.CONTACT_MESSAGE_RECIPIENT || env.PROJECT_INQUIRY_RECIPIENT || 'deneonofficial@gmail.com',
    from: env.PROJECT_INQUIRY_FROM || 'DENeon Team <deneonofficial@gmail.com>'
  }
}
