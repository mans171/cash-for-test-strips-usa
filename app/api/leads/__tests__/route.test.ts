import { describe, it, expect, afterEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'

// createServerSupabaseClient calls next/headers `cookies()`, which requires
// a real Next.js request scope that doesn't exist when a route handler is
// invoked directly in a unit test. Mock it so the existing validation-focused
// tests below still exercise the route's body-parsing logic rather than the
// auth gate; getUser defaults to an authenticated session and individual
// tests can override it via mockGetUser.mockResolvedValueOnce(...).
const mockGetUser = vi.fn(async () => ({
  data: { user: { id: 'test-user-id', email: 'jane@example.com' } as { id: string; email: string } | null },
}))
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}))

const { POST } = await import('../route')

const cleanupIds: string[] = []

afterEach(async () => {
  if (cleanupIds.length) {
    await supabaseAdmin.from('leads').delete().in('id', cleanupIds)
    cleanupIds.length = 0
  }
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/leads', () => {
  it('returns 401 when there is no session', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'sms',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(401)
  })

  it('returns 400 when items is empty', async () => {
    const response = await POST(makeRequest({ items: [], matchedCompanyId: null, channel: 'sms', name: 'Jane Doe' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for an invalid channel', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'carrier-pigeon',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when name is missing', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'sms',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when name is blank', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'sms',
        name: '   ',
      })
    )
    expect(response.status).toBe(400)
  })

  it('creates a lead and returns the prefilled message', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'sms',
        sourcePage: '/sell',
        name: 'Jane Doe',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.leadId).toBeDefined()
    expect(body.message).toContain('OneTouch Verio')
    expect(body.message).toContain('Jane Doe')
    cleanupIds.push(body.leadId)
  })
})
