import { describe, it, expect, vi, beforeEach } from 'vitest'

// No database needed, and none allowed: the service-role client is replaced
// with one that records any touch. Each test then proves two things at once —
// the route answers 401, and it did so BEFORE reaching for the database.
const touched = vi.fn()

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: new Proxy(
    {},
    {
      get(_target, prop) {
        touched(String(prop))
        throw new Error(`database touched (${String(prop)}) before the admin session was checked`)
      },
    }
  ),
}))

import { ADMIN_SESSION_COOKIE_NAME, signSession } from '@/lib/admin-auth'
import { GET as listGET, POST as listPOST } from '../route'
import { GET as detailGET, PATCH as detailPATCH } from '../[id]/route'

const ID = '11111111-1111-4111-8111-111111111111'
const context = { params: Promise.resolve({ id: ID }) }

function request(method: string, path: string, cookie?: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookie}` } : {}),
    },
  })
}

const validBody = { name: 'Pat', phone: '5185550100' }

const forgedCookies: Array<[string, string | undefined]> = [
  ['no cookie', undefined],
  ['an unsigned value', 'admin-authenticated'],
  ['a wrong signature', `admin-authenticated.${'0'.repeat(64)}`],
  ['a tampered valid cookie', `${signSession()}x`],
]

beforeEach(() => touched.mockClear())

describe.each(forgedCookies)('mail-in admin routes with %s', (_label, cookie) => {
  it('GET /api/admin/mail-in -> 401, database untouched', async () => {
    const res = await listGET(request('GET', '/api/admin/mail-in', cookie))
    expect(res.status).toBe(401)
    expect(touched).not.toHaveBeenCalled()
  })

  it('POST /api/admin/mail-in -> 401, database untouched', async () => {
    const res = await listPOST(request('POST', '/api/admin/mail-in', cookie, validBody))
    expect(res.status).toBe(401)
    expect(touched).not.toHaveBeenCalled()
  })

  it('GET /api/admin/mail-in/[id] -> 401, database untouched', async () => {
    const res = await detailGET(request('GET', `/api/admin/mail-in/${ID}`, cookie), context)
    expect(res.status).toBe(401)
    expect(touched).not.toHaveBeenCalled()
  })

  it('PATCH /api/admin/mail-in/[id] -> 401, database untouched', async () => {
    const res = await detailPATCH(request('PATCH', `/api/admin/mail-in/${ID}`, cookie, { status: 'kit_sent' }), context)
    expect(res.status).toBe(401)
    expect(touched).not.toHaveBeenCalled()
  })
})

describe('mail-in admin routes with a valid session reject bad input before the database', () => {
  const cookie = signSession()

  it('GET list: unknown status -> 400', async () => {
    const res = await listGET(request('GET', '/api/admin/mail-in?status=shipped', cookie))
    expect(res.status).toBe(400)
    expect(touched).not.toHaveBeenCalled()
  })

  it('POST: no phone or email -> 400 with a clear message', async () => {
    const res = await listPOST(request('POST', '/api/admin/mail-in', cookie, { name: 'Pat' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('A phone number or an email is required')
    expect(touched).not.toHaveBeenCalled()
  })

  it('POST: body that is not JSON -> 400', async () => {
    const bad = new Request('http://localhost/api/admin/mail-in', {
      method: 'POST',
      body: '{not json',
      headers: { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookie}` },
    })
    expect((await listPOST(bad)).status).toBe(400)
    expect(touched).not.toHaveBeenCalled()
  })

  it('GET/PATCH detail: id that is not a UUID -> 400', async () => {
    const badContext = { params: Promise.resolve({ id: 'abc' }) }
    expect((await detailGET(request('GET', '/api/admin/mail-in/abc', cookie), badContext)).status).toBe(400)
    expect((await detailPATCH(request('PATCH', '/api/admin/mail-in/abc', cookie, { status: 'kit_sent' }), badContext)).status).toBe(400)
    expect(touched).not.toHaveBeenCalled()
  })

  it('PATCH: unknown status -> 400', async () => {
    const res = await detailPATCH(request('PATCH', `/api/admin/mail-in/${ID}`, cookie, { status: 'shipped' }), context)
    expect(res.status).toBe(400)
    expect(touched).not.toHaveBeenCalled()
  })
})
