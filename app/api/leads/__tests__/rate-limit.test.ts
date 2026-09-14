import { describe, it, expect, vi } from 'vitest'
import { HONEYPOT_FIELD } from '@/lib/honeypot'
import { RATE_LIMIT_MAX, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'

// Pure-mock route test: no database, no mail. route.test.ts in this folder
// exercises the real lead insert against a disposable Supabase; this file only
// proves the ORDER of the guards — honeypot first (free), then the per-IP
// limit, then everything that costs a row or an email.
const mockCreateLead = vi.fn(async () => ({ id: 'lead-1' }))
vi.mock('@/lib/leads', () => ({ createLead: () => mockCreateLead() }))
vi.mock('@/lib/order-matching', () => ({
  getCompanyContact: async () => ({ email: 'buyer@example.com', phone: '5185550100' }),
}))
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}))
vi.mock('@/lib/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/email')>()
  return { ...actual, sendEmailOrThrow: async () => undefined }
})

const { POST } = await import('../route')

const validBody = {
  items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
  matchedCompanyId: 'company-1',
  channel: 'sms',
  name: 'Jane Doe',
}

function post(ip: string, body: unknown) {
  return POST(
    new Request('http://localhost/api/leads', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    })
  )
}

describe('POST /api/leads rate limit', () => {
  it('serves 5 submissions from one IP, then 429s the 6th with Retry-After', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect((await post('203.0.113.10', validBody)).status).toBe(200)
    }
    const sixth = await post('203.0.113.10', validBody)
    expect(sixth.status).toBe(429)
    expect(await sixth.json()).toEqual({ error: RATE_LIMIT_MESSAGE })
    expect(Number(sixth.headers.get('Retry-After'))).toBeGreaterThan(0)
    expect(mockCreateLead).toHaveBeenCalledTimes(RATE_LIMIT_MAX)
  })

  it('does not affect a different IP', async () => {
    expect((await post('203.0.113.11', validBody)).status).toBe(200)
  })

  it('honeypot short-circuits to 200 without consuming a slot', async () => {
    mockCreateLead.mockClear()
    const bot = { ...validBody, [HONEYPOT_FIELD]: 'http://spam' }
    for (let i = 0; i < RATE_LIMIT_MAX + 1; i++) {
      const res = await post('203.0.113.12', bot)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ leadId: 'ok' })
    }
    expect(mockCreateLead).not.toHaveBeenCalled()
    // Six bot posts later a real seller on the same IP still has all 5 slots.
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect((await post('203.0.113.12', validBody)).status).toBe(200)
    }
    expect((await post('203.0.113.12', validBody)).status).toBe(429)
  })
})
