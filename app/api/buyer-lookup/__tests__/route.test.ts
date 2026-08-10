import { describe, it, expect, vi } from 'vitest'
import { POST } from '../route'

const mockGetCurrentUser = vi.fn()
vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/buyer-lookup', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/buyer-lookup', () => {
  it('returns 401 when there is no session', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const response = await POST(makeRequest({ phone: '5550000000' }))
    expect(response.status).toBe(401)
  })

  it('returns 401 when the session belongs to a customer, not a buyer', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'c@example.com', profile: { role: 'customer' } })
    const response = await POST(makeRequest({ phone: '5550000000' }))
    expect(response.status).toBe(401)
  })

  it('returns 400 when phone is missing for an authenticated buyer', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'b@example.com', profile: { role: 'buyer' } })
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns an empty companies array for an unknown phone', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'b@example.com', profile: { role: 'buyer' } })
    const response = await POST(makeRequest({ phone: '0000000000' }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.companies).toEqual([])
  })
})
