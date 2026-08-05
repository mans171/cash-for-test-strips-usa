import { describe, it, expect } from 'vitest'
import { POST } from '../route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/buyer-lookup', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/buyer-lookup', () => {
  it('returns 400 when phone is missing', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns an empty companies array for an unknown phone', async () => {
    const response = await POST(makeRequest({ phone: '0000000000' }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.companies).toEqual([])
  })
})
