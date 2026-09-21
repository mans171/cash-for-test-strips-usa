import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', async () => ({ supabaseAdmin: (await import('@/test/sell-starts-fake-db')).fakeDb.client }))

import { fakeDb } from '@/test/sell-starts-fake-db'
import { HONEYPOT_FIELD } from '@/lib/honeypot'
import { checkRateLimit, RATE_LIMIT_MAX, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'
import { POST } from '../route'

let ipCounter = 0
const freshIp = () => `10.1.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`

function request(body: unknown, ip = freshIp(), headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/sell-starts', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, ...headers },
  })
}

const item = { brand: 'Accu-Chek — Guide 100ct', count: 3, expiration: '2027-06', condition: 'sealed' }
const valid = { phone: '(518) 555-0100', name: 'Pat', state: 'NY', items: [item], [HONEYPOT_FIELD]: '' }

beforeEach(() => fakeDb.reset())

describe('POST /api/sell-starts', () => {
  it('saves a start and answers { ok, id } — nothing else', async () => {
    const res = await POST(request(valid))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(Object.keys(body).sort()).toEqual(['id', 'ok'])
    expect(body.ok).toBe(true)

    const rows = fakeDb.rowsOf('sell_starts')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ id: body.id, phone: '5185550100', name: 'Pat', state: 'NY', items: [item], source_page: '/sell' })
    // Only ever an insert into this one table: no lookup, no email, no text.
    expect(fakeDb.state.ops).toEqual(['insert:sell_starts'])
  })

  it('cannot set anything outside the whitelist', async () => {
    const res = await POST(
      request({ ...valid, completed_at: '2026-01-01T00:00:00Z', completed_lead_id: 'x', contacted_at: 'x', dismissed_at: 'x', admin_note: 'x', source_page: '/evil', id: 'mine' })
    )
    expect(res.status).toBe(201)
    const row = fakeDb.rowsOf('sell_starts')[0]
    expect(Object.keys(row).sort()).toEqual(['created_at', 'id', 'items', 'name', 'phone', 'source_page', 'state'])
    expect(row.source_page).toBe('/sell')
    expect(row.id).not.toBe('mine')
  })

  it('refuses a foreign origin with 403, database untouched', async () => {
    const res = await POST(request(valid, freshIp(), { origin: 'https://evil.example' }))
    expect(res.status).toBe(403)
    expect(fakeDb.state.touched).toBe(0)
  })

  it('allows this site as the origin', async () => {
    const res = await POST(request(valid, freshIp(), { origin: 'http://localhost' }))
    expect(res.status).toBe(201)
  })

  it('drops a tripped honeypot silently: success shape, no id, database untouched, no rate-limit slot', async () => {
    const ip = freshIp()
    for (let i = 0; i < RATE_LIMIT_MAX + 3; i++) {
      const res = await POST(request({ ...valid, [HONEYPOT_FIELD]: 'http://spam.example' }, ip))
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ ok: true })
    }
    expect(fakeDb.state.touched).toBe(0)
    expect((await POST(request(valid, ip))).status).toBe(201)
  })

  it('rate-limits per IP BEFORE validating or inserting', async () => {
    const ip = freshIp()
    for (let i = 0; i < RATE_LIMIT_MAX; i++) expect((await POST(request(valid, ip))).status).toBe(201)
    const touchedBefore = fakeDb.state.touched

    // Even a junk body gets the 429, not a 400: the limit runs first.
    for (const body of [valid, { nonsense: true }]) {
      const res = await POST(request(body, ip))
      expect(res.status).toBe(429)
      expect(await res.json()).toEqual({ error: RATE_LIMIT_MESSAGE })
      expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0)
    }
    expect(fakeDb.state.touched).toBe(touchedBefore)
    expect(fakeDb.rowsOf('sell_starts')).toHaveLength(RATE_LIMIT_MAX)
  })

  it('uses its own bucket, so saving starts never eats the /api/leads allowance', async () => {
    const ip = freshIp()
    for (let i = 0; i < RATE_LIMIT_MAX; i++) await POST(request(valid, ip))
    expect((await POST(request(valid, ip))).status).toBe(429)
    // /api/leads counts against the bare IP, which is still untouched.
    expect(checkRateLimit(ip).allowed).toBe(true)
  })

  it.each([
    ['a junk state', { ...valid, state: 'ZZ' }],
    ['more than 20 items', { ...valid, items: Array.from({ length: 21 }, () => item) }],
    ['an oversized brand', { ...valid, items: [{ ...item, brand: 'x'.repeat(5000) }] }],
    ['a short phone', { ...valid, phone: '555-0100' }],
    ['a phone with no digits', { ...valid, phone: 'call me' }],
    ['a 16-digit phone', { ...valid, phone: '1234567890123456' }],
    ['no items', { ...valid, items: [] }],
    ['a non-JSON body', 'not json'],
    ['an array body', [valid]],
  ])('answers 400 to %s, database untouched', async (_label, body) => {
    const res = await POST(request(body))
    expect(res.status).toBe(400)
    expect(fakeDb.state.touched).toBe(0)
  })

  it('answers 500 (which the form ignores) when the table is missing', async () => {
    fakeDb.state.failTables.add('sell_starts')
    const res = await POST(request(valid))
    expect(res.status).toBe(500)
    expect((await res.json()).id).toBeUndefined()
  })
})
