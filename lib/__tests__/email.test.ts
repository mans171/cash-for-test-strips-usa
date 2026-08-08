import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMailMock = vi.fn()
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({ sendMail: sendMailMock }),
  },
}))

const { sendEmail, sendEmailOrThrow } = await import('@/lib/email')

describe('sendEmail', () => {
  beforeEach(() => {
    sendMailMock.mockReset()
  })

  it('sends with the expected fields', async () => {
    sendMailMock.mockResolvedValueOnce(undefined)
    await sendEmail({ to: 'test@example.com', subject: 'Hi', html: '<p>hi</p>' })
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'test@example.com', subject: 'Hi', html: '<p>hi</p>' })
    )
  })

  it('catches a failed send and does not throw', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP down'))
    await expect(
      sendEmail({ to: 'test@example.com', subject: 'Hi', html: '<p>hi</p>' })
    ).resolves.toBeUndefined()
  })
})

describe('sendEmailOrThrow', () => {
  it('sends with the expected fields including cc', async () => {
    sendMailMock.mockResolvedValueOnce(undefined)
    await sendEmailOrThrow({ to: 'test@example.com', cc: 'owner@example.com', subject: 'Hi', html: '<p>hi</p>' })
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'test@example.com', cc: 'owner@example.com', subject: 'Hi', html: '<p>hi</p>' })
    )
  })

  it('rethrows when the send fails', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP down'))
    await expect(
      sendEmailOrThrow({ to: 'test@example.com', subject: 'Hi', html: '<p>hi</p>' })
    ).rejects.toThrow('SMTP down')
  })
})
