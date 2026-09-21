import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', async () => ({ supabaseAdmin: (await import('@/test/sell-starts-fake-db')).fakeDb.client }))

// The session's credential version normally comes from admin_credentials.
// Pinned here so a valid session needs no database (lib/admin-credential-version.ts).
vi.mock('@/lib/admin-credential-version', () => ({
  getCredentialVersion: async () => 'a'.repeat(32),
  clearCredentialVersionCache: () => {},
}))

import { fakeDb } from '@/test/sell-starts-fake-db'
import { ADMIN_SESSION_COOKIE_NAME, buildSession } from '@/lib/admin-auth'
import { POST } from '../[id]/route'
import { GET as dataGET } from '../../data/route'

const ID = '11111111-1111-4111-8111-111111111111'
const session = () => buildSession('a'.repeat(32))

function request(method: string, path: string, opts: { cookie?: string; body?: unknown; origin?: string } = {}) {
  return new Request(`http://localhost${path}`, {
    method,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    headers: {
      'Content-Type': 'application/json',
      ...(opts.cookie ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${opts.cookie}` } : {}),
      ...(opts.origin ? { origin: opts.origin } : {}),
    },
  })
}
const context = (id = ID) => ({ params: Promise.resolve({ id }) })

beforeEach(() => fakeDb.reset())

describe('POST /api/admin/sell-starts/[id] — guard runs before the database', () => {
  const forged: Array<[string, string | undefined]> = [
    ['no cookie', undefined],
    ['an unsigned value', 'admin-authenticated'],
    ['a wrong signature', `admin-authenticated.${'0'.repeat(64)}`],
    ['a tampered valid cookie', `${buildSession('a'.repeat(32))}x`],
  ]
  it.each(forged)('%s -> 401, database untouched', async (_label, cookie) => {
    fakeDb.seedStart({ id: ID })
    const res = await POST(request('POST', `/api/admin/sell-starts/${ID}`, { cookie, body: { dismissed: true } }), context())
    expect(res.status).toBe(401)
    expect(fakeDb.state.touched).toBe(0)
    expect(fakeDb.rowsOf('sell_starts')[0].dismissed_at).toBe(null)
  })

  it('a foreign origin -> 403 even WITH a valid session, database untouched', async () => {
    fakeDb.seedStart({ id: ID })
    const res = await POST(
      request('POST', `/api/admin/sell-starts/${ID}`, { cookie: session(), body: { dismissed: true }, origin: 'https://evil.example' }),
      context()
    )
    expect(res.status).toBe(403)
    expect(fakeDb.state.touched).toBe(0)
  })
})

describe('POST /api/admin/sell-starts/[id] — signed in', () => {
  const post = (id: string, body: unknown) =>
    POST(request('POST', `/api/admin/sell-starts/${id}`, { cookie: session(), body, origin: 'http://localhost' }), context(id))

  it('marks contacted, then dismissed, and saves a note', async () => {
    const start = fakeDb.seedStart({ id: ID })
    expect((await post(ID, { contacted: true })).status).toBe(200)
    expect(typeof start.contacted_at).toBe('string')
    expect(start.dismissed_at).toBe(null)

    const res = await post(ID, { dismissed: true, admin_note: ' no answer ' })
    expect(res.status).toBe(200)
    expect(typeof start.dismissed_at).toBe('string')
    expect(start.admin_note).toBe('no answer')
    expect(start.updated_at).toBe(start.dismissed_at)
  })

  it.each([
    ['a phone rewrite', { phone: '5185550199' }],
    ['a completion', { contacted: true, completed_at: '2026-09-20T00:00:00Z' }],
    ['an empty body', {}],
    ['a non-boolean', { contacted: 'yes' }],
  ])('refuses %s with 400, database untouched', async (_label, body) => {
    fakeDb.seedStart({ id: ID })
    const res = await post(ID, body)
    expect(res.status).toBe(400)
    expect(fakeDb.state.touched).toBe(0)
  })

  it('refuses an id that is not a UUID with 400, database untouched', async () => {
    const res = await post('1-or-1=1', { dismissed: true })
    expect(res.status).toBe(400)
    expect(fakeDb.state.touched).toBe(0)
  })

  it('answers 404 for an unknown id', async () => {
    expect((await post(ID, { dismissed: true })).status).toBe(404)
  })
})

describe('GET /api/admin/data — "Started, didn\'t finish"', () => {
  const get = () => dataGET(request('GET', '/api/admin/data', { cookie: session() }))
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()
  const daysAgo = (d: number) => hoursAgo(d * 24)

  it('401 without a session, database untouched', async () => {
    fakeDb.seedStart()
    const res = await dataGET(request('GET', '/api/admin/data'))
    expect(res.status).toBe(401)
    expect(fakeDb.state.touched).toBe(0)
  })

  it('lists open starts newest first; excludes completed, dismissed, recently-converted and week-old contacted', async () => {
    fakeDb.seedStart({ id: 'open-old', phone: '5185550101', created_at: hoursAgo(30) })
    fakeDb.seedStart({ id: 'open-new', phone: '5185550102', created_at: hoursAgo(2) })
    fakeDb.seedStart({ id: 'completed', phone: '5185550103', completed_at: hoursAgo(1), created_at: hoursAgo(1) })
    fakeDb.seedStart({ id: 'dismissed', phone: '5185550104', dismissed_at: hoursAgo(1), created_at: hoursAgo(1) })
    fakeDb.seedStart({ id: 'converted', phone: '5185550105', created_at: hoursAgo(1) })
    fakeDb.seedStart({ id: 'converted-40d-ago', phone: '5185550106', created_at: hoursAgo(3) })
    fakeDb.seedStart({ id: 'contacted-2d', phone: '5185550107', contacted_at: daysAgo(2), created_at: daysAgo(3) })
    fakeDb.seedStart({ id: 'contacted-8d', phone: '5185550108', contacted_at: daysAgo(8), created_at: daysAgo(9) })
    fakeDb.rowsOf('leads').push(
      { id: 'l1', phone: '(518) 555-0105', created_at: daysAgo(5), items: [], channel: 'sms' },
      { id: 'l2', phone: '518-555-0106', created_at: daysAgo(40), items: [], channel: 'sms' }
    )

    const res = await get()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.sellStartsError).toBe(false)
    expect(body.sellStarts.map((s: { id: string }) => s.id)).toEqual(['open-new', 'converted-40d-ago', 'open-old', 'contacted-2d'])
    expect(typeof body.serverNow).toBe('string')
    // The existing tabs are still served.
    expect(body.leads).toHaveLength(2)
    expect(body.submissions).toEqual([])
  })

  it('caps the list at 200', async () => {
    for (let i = 0; i < 230; i++) fakeDb.seedStart({ id: `s${i}`, phone: String(5180000000 + i), created_at: hoursAgo(i + 1) })
    const body = await (await get()).json()
    expect(body.sellStarts).toHaveLength(200)
    expect(body.sellStarts[0].id).toBe('s0')
  })

  it('MIGRATION NOT APPLIED: the dashboard still loads, with the section flagged', async () => {
    fakeDb.state.failTables.add('sell_starts')
    fakeDb.rowsOf('leads').push({ id: 'l1', phone: null, created_at: daysAgo(1), items: [], channel: 'email' })
    const res = await get()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.sellStarts).toEqual([])
    expect(body.sellStartsError).toBe(true)
    expect(body.leads).toHaveLength(1)
  })
})
