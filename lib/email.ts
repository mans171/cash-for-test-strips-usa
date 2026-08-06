import nodemailer from 'nodemailer'

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
  subject: string
  html: string
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: input.to,
      subject: input.subject,
      html: input.html,
    })
  } catch (error) {
    console.error('[sendEmail] failed to send', { to: input.to, subject: input.subject }, error)
  }
}
