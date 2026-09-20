import { describe, it, expect, vi, beforeEach } from 'vitest'

// Pure-mock route test, same approach as rate-limit.test.ts in this folder: no
// database, no mail. It proves one thing — a finished request stamps the
// matching sell_starts row, and ONLY the matching one, and never fails a lead.
vi.mock('@/lib/supabase-admin', async () => ({ supabaseAdmin: (await import('@/test/sell-starts-fake-db')).fakeDb.client }))
const mockCreateLead = vi.fn(async () => ({ id: '99999999-9999-4999-8999-999999999999' }))
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

import { fakeDb } from '@/test/sell-starts-fake-db'
import { HONEYPOT_FIELD } from '@/lib/honeypot'
const { POST } = await import('../route')

const LEAD_ID = '99999999-9999-4999-8999-999999999999'

const baseBody = {
  items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
  matchedCompanyId: 'company-1',
  channel: 'sms',
  name: 'Jane Doe',
  phone: '(518) 555-0100',
}

let ipCounter = 0
function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/leads', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.2.0.${++ipCounter}` },
    })
  )
}

beforeEach(() => {
  fakeDb.reset()
  mockCreateLead.mockClear()
})

describe('POST /api/leads marks the sell start completed', () => {
  it('stamps the start whose id AND phone match', async () => {
    const start = fakeDb.seedStart({ phone: '5185550100' })
    const res = await post({ ...baseBody, sellStartId: start.id })
    expect(res.status).toBe(200)
    expect((await res.json()).leadId).toBe(LEAD_ID)
    expect(start.completed_lead_id).toBe(LEAD_ID)
    expect(typeof start.completed_at).toBe('string')
    expect(start.updated_at).toBe(start.completed_at)
  })

  it("does NOT stamp someone else's start: right id, different phone", async () => {
    const start = fakeDb.seedStart({ phone: '5185550199' })
    const res = await post({ ...baseBody, sellStartId: start.id })
    expect(res.status).toBe(200)
    expect(start.completed_at).toBe(null)
    expect(start.completed_lead_id).toBe(null)
  })

  it('does not stamp without a phone on the lead, and leaves other starts alone', async () => {
    const start = fakeDb.seedStart({ phone: '5185550100' })
    const other = fakeDb.seedStart({ phone: '5185550100' })
    const res = await post({ ...baseBody, phone: undefined, sellStartId: start.id })
    expect(res.status).toBe(200)
    expect(start.completed_at).toBe(null)

    await post({ ...baseBody, sellStartId: start.id })
    expect(start.completed_at).not.toBe(null)
    expect(other.completed_at).toBe(null)
  })

  it('never re-stamps a start that is already completed', async () => {
    const start = fakeDb.seedStart({ phone: '5185550100', completed_at: '2026-09-01T00:00:00.000Z', completed_lead_id: 'first-lead' })
    await post({ ...baseBody, sellStartId: start.id })
    expect(start.completed_lead_id).toBe('first-lead')
    expect(start.completed_at).toBe('2026-09-01T00:00:00.000Z')
  })

  it.each([
    ['no start id', undefined],
    ['a junk start id', "x' or 1=1 --"],
    ['a non-string start id', { id: 1 }],
  ])('%s: the lead succeeds and sell_starts is never touched', async (_label, sellStartId) => {
    fakeDb.seedStart()
    const res = await post({ ...baseBody, sellStartId })
    expect(res.status).toBe(200)
    expect(fakeDb.state.touched).toBe(0)
    expect(mockCreateLead).toHaveBeenCalledTimes(1)
  })

  it('the lead still succeeds when the start update FAILS (table missing)', async () => {
    const start = fakeDb.seedStart({ phone: '5185550100' })
    fakeDb.state.failTables.add('sell_starts')
    const res = await post({ ...baseBody, sellStartId: start.id })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.leadId).toBe(LEAD_ID)
    expect(typeof body.message).toBe('string')
    expect(fakeDb.state.ops).toEqual(['update:sell_starts'])
  })

  it('the lead still succeeds when the service-role client THROWS', async () => {
    const start = fakeDb.seedStart({ phone: '5185550100' })
    const original = fakeDb.client.from
    fakeDb.client.from = () => {
      throw new Error('supabaseAdmin is unavailable')
    }
    try {
      const res = await post({ ...baseBody, channel: 'email', email: 'jane@example.com', sellStartId: start.id })
      expect(res.status).toBe(200)
      expect((await res.json()).leadId).toBe(LEAD_ID)
    } finally {
      fakeDb.client.from = original
    }
  })

  it('a tripped honeypot touches nothing', async () => {
    const start = fakeDb.seedStart({ phone: '5185550100' })
    const res = await post({ ...baseBody, sellStartId: start.id, [HONEYPOT_FIELD]: 'spam' })
    expect(await res.json()).toEqual({ leadId: 'ok' })
    expect(fakeDb.state.touched).toBe(0)
    expect(start.completed_at).toBe(null)
  })
})
