import { describe, it, expect } from 'vitest'
import { createResetToken } from '@/lib/admin-auth'
import { POST } from '../route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/reset-password', () => {
  it('returns 400 for a missing token or password', async () => {
    const response = await POST(makeRequest({ token: 'x' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for an invalid token', async () => {
    const response = await POST(makeRequest({ token: 'not-a-real-token', newPassword: 'whatever-Task5' }))
    expect(response.status).toBe(400)
  })

  it('resets the password for a valid token', async () => {
    const token = await createResetToken()
    const response = await POST(makeRequest({ token, newPassword: 'reset-via-route-Task5' }))
    expect(response.status).toBe(200)
  })
})
