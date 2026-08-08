import nodemailer from 'nodemailer'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export type SendEmailInput = {
  to: string
  cc?: string
  subject: string
  html: string
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      html: input.html,
    })
  } catch (error) {
    console.error('[sendEmail] failed to send', { to: input.to, subject: input.subject }, error)
  }
}

export async function sendEmailOrThrow(input: SendEmailInput): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    html: input.html,
  })
}
