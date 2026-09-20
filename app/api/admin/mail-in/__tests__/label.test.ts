import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase-admin', async () => ({ supabaseAdmin: (await import('@/test/mail-in-fake-db')).fakeDb.client }))
const sendEmail = vi.fn(async (input: { to: string; subject: string; html: string }) => void input)
vi.mock('@/lib/email', () => ({ sendEmail: (input: { to: string; subject: string; html: string }) => sendEmail(input), escapeHtml: (v: string) => v }))

import { fakeDb } from '@/test/mail-in-fake-db'
// The session's credential version normally comes from admin_credentials.
// Pinned here so a valid session needs no database (lib/admin-credential-version.ts)
// — which also keeps `fakeDb.state.touched === 0` an honest "database untouched".
vi.mock('@/lib/admin-credential-version', () => ({
  getCredentialVersion: async () => 'a'.repeat(32),
  clearCredentialVersionCache: () => {},
}))

import { ADMIN_SESSION_COOKIE_NAME, buildSession } from '@/lib/admin-auth'
import { POST as labelPOST } from '../[id]/label/route'
import { POST as voidPOST } from '../[id]/label/void/route'
import { POST as linkPOST } from '../[id]/link/route'

// EasyPost is never reached: global fetch is replaced and every call recorded.
type Call = { url: string; method: string; auth: string; body: Record<string, unknown> | null }
let calls: Call[] = []
let rates: Array<Record<string, string>> = []
let deliverable = true
let buyFails = false
let buyDelayMs = 0
let buyDrops = false
let shipmentCount = 0

const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input)
  const headers = (init?.headers ?? {}) as Record<string, string>
  calls.push({ url, method: init?.method ?? 'GET', auth: headers.Authorization ?? '', body: init?.body ? JSON.parse(String(init.body)) : null })
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })

  if (url.endsWith('/v2/addresses')) {
    return json({
      id: 'adr_1',
      verifications: { delivery: deliverable ? { success: true, errors: [] } : { success: false, errors: [{ message: 'Address not found' }] } },
    })
  }
  if (url.endsWith('/v2/shipments')) return json({ id: `shp_test${++shipmentCount}`, rates })
  if (url.endsWith('/buy')) {
    if (buyDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, buyDelayMs))
    if (buyDrops) throw new TypeError('socket hang up')
    if (buyFails) return json({ error: { code: 'SHIPMENT.POSTAGE.FAILURE', message: 'Unable to buy postage' } }, 422)
    const picked = rates.find((r) => r.id === (JSON.parse(String(init?.body)) as { rate: { id: string } }).rate.id)
    return json({
      id: url.split('/').at(-2),
      tracking_code: '9400100000000000000001',
      tracker: { id: 'trk_test1' },
      selected_rate: { carrier: picked?.carrier, service: picked?.service },
      postage_label: { label_url: 'https://easypost-files.example/label.pdf', label_pdf_url: null },
    })
  }
  if (url.endsWith('/refund')) return json({ id: 'shp_test1', refund_status: 'submitted' })
  return json({ error: { message: 'unexpected url' } }, 404)
})

const cookie = buildSession('a'.repeat(32))
function request(path: string, body?: unknown, withCookie: string | undefined = cookie) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...(withCookie ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${withCookie}` } : {}) },
  })
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const USPS = { id: 'rate_usps_ga', carrier: 'USPS', service: 'GroundAdvantage', rate: '6.40' }

beforeEach(() => {
  fakeDb.reset()
  sendEmail.mockClear()
  fetchMock.mockClear()
  calls = []
  rates = [{ id: 'rate_ups', carrier: 'UPS', service: 'Ground', rate: '1.00' }, USPS, { id: 'rate_usps_pri', carrier: 'USPS', service: 'Priority', rate: '9.10' }]
  deliverable = true
  buyFails = false
  buyDelayMs = 0
  buyDrops = false
  shipmentCount = 0
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('EASYPOST_MODE', '')
  vi.stubEnv('EASYPOST_TEST_API_KEY', 'EZTK-test-key-sentinel')
  vi.stubEnv('EASYPOST_API_KEY', 'EZAK-live-key-sentinel')
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe.each([
  ['label', labelPOST],
  ['label/void', voidPOST],
  ['link', linkPOST],
] as const)('POST /api/admin/mail-in/[id]/%s without a session', (path, handler) => {
  it.each([
    ['no cookie', undefined],
    ['an unsigned value', 'admin-authenticated'],
    ['a tampered cookie', `${cookie}x`],
  ])('%s -> 401 before the database and before EasyPost', async (_label, bad) => {
    const row = fakeDb.seedOrder()
    const req = new Request(`http://localhost/api/admin/mail-in/${row.id}/${path}`, {
      method: 'POST',
      body: JSON.stringify({ quoted_amount: 90 }),
      headers: bad ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${bad}` } : {},
    })
    const res = await handler(req, ctx(String(row.id)))
    expect(res.status).toBe(401)
    expect(fakeDb.state.touched).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a VALID session posted from another site -> 403 before the database and before EasyPost', async () => {
    const row = fakeDb.seedOrder()
    const req = new Request(`http://localhost/api/admin/mail-in/${row.id}/${path}`, {
      method: 'POST',
      body: JSON.stringify({ quoted_amount: 90 }),
      headers: { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookie}`, origin: 'https://evil.example' },
    })
    const res = await handler(req, ctx(String(row.id)))
    expect(res.status).toBe(403)
    expect(fakeDb.state.touched).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(row.status).toBe('quote_agreed')
  })

  it('a session signed for an OLD credential version -> 401 (the await is really there)', async () => {
    const row = fakeDb.seedOrder()
    const req = new Request(`http://localhost/api/admin/mail-in/${row.id}/${path}`, {
      method: 'POST',
      body: JSON.stringify({ quoted_amount: 90 }),
      headers: { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${buildSession('b'.repeat(32))}` },
    })
    const res = await handler(req, ctx(String(row.id)))
    expect(res.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('POST label — making the label', () => {
  it('verifies, creates a RETURN shipment (to = seller, from = Latham), buys USPS, saves, moves to Label made', async () => {
    const row = fakeDb.seedOrder({ status: 'awaiting_quote', quoted_amount: null, email: 'pat@example.com' })
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, { quoted_amount: '90.50' }), ctx(String(row.id)))
    const body = await res.json()
    expect(res.status).toBe(200)

    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      'POST https://api.easypost.com/v2/addresses',
      'POST https://api.easypost.com/v2/shipments',
      'POST https://api.easypost.com/v2/shipments/shp_test1/buy',
    ])
    // Basic auth with the TEST key as the username and an empty password.
    const expectedAuth = `Basic ${Buffer.from('EZTK-test-key-sentinel:').toString('base64')}`
    for (const call of calls) expect(call.auth).toBe(expectedAuth)

    expect(calls[0].body).toMatchObject({ verify: true, address: { street1: '12 Elm St', zip: '43004', country: 'US' } })
    const shipment = (calls[1].body as { shipment: Record<string, Record<string, unknown>> }).shipment
    expect(shipment.is_return).toBe(true)
    expect(shipment.to_address).toMatchObject({ name: 'Pat Seller', street1: '12 Elm St', city: 'Columbus', state: 'OH' })
    expect(shipment.from_address).toMatchObject({ company: 'Cash For Test Strips USA', street1: '6 Northway Ln', city: 'Latham', state: 'NY', zip: '12110' })
    expect(shipment.parcel).toEqual({ weight: 16, length: 10, width: 8, height: 4 })
    expect(shipment.options).toEqual({ label_format: 'PDF' })
    expect(calls[2].body).toEqual({ rate: { id: 'rate_usps_ga' } })

    expect(row).toMatchObject({
      status: 'label_made', quoted_amount: 90.5, easypost_shipment_id: 'shp_test1', easypost_tracker_id: 'trk_test1',
      easypost_mode: 'test', tracking_code: '9400100000000000000001', carrier: 'USPS', service: 'GroundAdvantage',
      label_url: 'https://easypost-files.example/label.pdf', label_pdf_url: 'https://easypost-files.example/label.pdf', label_refund_status: null,
    })
    expect(row.label_created_at).toBeTruthy()
    expect(row.kit_sent_at).toBeTruthy()
    expect(fakeDb.tables.mail_in_events.map((e) => e.type)).toEqual(['fields_updated', 'label_created', 'status_changed', 'link_sent'])
    expect(fakeDb.tables.mail_in_events[2].detail).toEqual({ from: 'awaiting_quote', to: 'label_made' })
    expect(fakeDb.tables.mail_in_events.slice(0, 3).every((e) => e.actor === 'admin')).toBe(true)

    expect(body.link).toBe(`https://cash4teststripsusa.com/kit/${row.token}`)
    expect(body.text).toBe(`Your prepaid label is ready: ${body.link}`)
    expect(body.emailed).toBe(true)
    expect('token' in body.order).toBe(false)

    // The seller email carries the link and never the amount.
    const mail = sendEmail.mock.calls[0][0]
    expect(mail.to).toBe('pat@example.com')
    expect(mail.html).toContain(body.link)
    expect(mail.html + mail.subject).not.toMatch(/90\.5|\$/)
    // No key in anything we send back.
    expect(JSON.stringify(body)).not.toMatch(/EZTK|EZAK/)
  })

  it('prefers USPSReturns whenever EasyPost offers it', async () => {
    rates = [USPS, { id: 'rate_returns', carrier: 'USPSReturns', service: 'GroundAdvantageReturn', rate: '8.80' }, { id: 'rate_fedex', carrier: 'FedEx', service: 'FEDEX_GROUND', rate: '2.00' }]
    const row = fakeDb.seedOrder()
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(res.status).toBe(200)
    expect(calls[2].body).toEqual({ rate: { id: 'rate_returns' } })
    expect(row).toMatchObject({ carrier: 'USPSReturns', service: 'GroundAdvantageReturn' })
  })

  it('never buys a non-USPS rate: with only UPS/FedEx/DHL on offer it buys nothing', async () => {
    rates = [{ id: 'rate_ups', carrier: 'UPS', service: 'Ground', rate: '1.00' }, { id: 'rate_fedex', carrier: 'FedEx', service: 'FEDEX_GROUND', rate: '2.00' }, { id: 'rate_dhl', carrier: 'DHLExpress', service: 'X', rate: '0.10' }]
    const row = fakeDb.seedOrder()
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(res.status).toBe(502)
    expect(calls.some((c) => c.url.endsWith('/buy'))).toBe(false)
    expect(row.status).toBe('quote_agreed')
    expect(row.easypost_shipment_id).toBeNull()
  })

  it('sizes the parcel from the expected box count', async () => {
    const row = fakeDb.seedOrder({ expected_items: [{ product: 'A', boxes: 15 }, { product: 'B', boxes: 10 }] })
    await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect((calls[1].body as { shipment: { parcel: unknown } }).shipment.parcel).toEqual({ weight: 96, length: 14, width: 12, height: 8 })
  })

  it('uses the LIVE key only when EASYPOST_MODE is live, and records the mode', async () => {
    vi.stubEnv('EASYPOST_MODE', 'live')
    const row = fakeDb.seedOrder()
    await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(calls[0].auth).toBe(`Basic ${Buffer.from('EZAK-live-key-sentinel:').toString('base64')}`)
    expect(row.easypost_mode).toBe('live')
  })

  it('503s with a clear message when the key for the mode is missing — before the database', async () => {
    vi.stubEnv('EASYPOST_TEST_API_KEY', '')
    const row = fakeDb.seedOrder()
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(res.status).toBe(503)
    expect((await res.json()).error).toBe('EasyPost is not configured')
    expect(fakeDb.state.touched).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('422s in plain words on an undeliverable address and buys nothing', async () => {
    deliverable = false
    const row = fakeDb.seedOrder()
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(res.status).toBe(422)
    expect((await res.json()).error).toMatch(/could not confirm this ship-from address \(Address not found\)/)
    expect(calls).toHaveLength(1)
    expect(row.status).toBe('quote_agreed')
  })

  it.each([
    ['no quoted amount anywhere', { quoted_amount: null }, {}, 400, /quoted amount/],
    ['an incomplete address', { street1: null }, {}, 400, /street address/],
    ['a kit already in transit', { status: 'in_transit' }, {}, 409, /only be made while/],
    ['a bad amount in the body', {}, { quoted_amount: 'lots' }, 400, /must be a number/],
  ] as const)('refuses %s without calling EasyPost', async (_label, seed, body, status, message) => {
    const row = fakeDb.seedOrder({ ...seed })
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, body), ctx(String(row.id)))
    expect(res.status).toBe(status)
    expect((await res.json()).error).toMatch(message)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('one label per kit: a second press is a 409 and buys nothing', async () => {
    const row = fakeDb.seedOrder()
    expect((await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))).status).toBe(200)
    fetchMock.mockClear()
    const again = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(again.status).toBe(409)
    expect((await again.json()).error).toMatch(/already has a label/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('404s an unknown kit and 400s a bad id', async () => {
    const id = '99999999-9999-4999-8999-999999999999'
    expect((await labelPOST(request(`/api/admin/mail-in/${id}/label`, {}), ctx(id))).status).toBe(404)
    expect((await labelPOST(request('/api/admin/mail-in/abc/label', {}), ctx('abc'))).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a failed buy is a 502 and leaves the kit alone', async () => {
    buyFails = true
    const row = fakeDb.seedOrder()
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(res.status).toBe(502)
    expect((await res.json()).error).toBe('EasyPost: Unable to buy postage')
    expect(row.status).toBe('quote_agreed')
  })

  it('BUY SUCCEEDED, DATABASE FAILED: logs loudly and hands the shipment id back', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const row = fakeDb.seedOrder()
    fakeDb.state.failOrderUpdateWhen = (payload) => payload.status === 'label_made'
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    const body = await res.json()
    expect(res.status).toBe(500)
    expect(body).toMatchObject({ easypost_shipment_id: 'shp_test1', tracking_code: '9400100000000000000001', label_url: 'https://easypost-files.example/label.pdf' })
    expect(body.error).toMatch(/bought but could not be saved/)
    expect(body.error).toContain('shp_test1')
    expect(logged.mock.calls.flat().join(' ')).toMatch(/LABEL BOUGHT BUT NOT SAVED.*shp_test1/)
    logged.mockRestore()
  })

  it('the same when the kit changed status mid-purchase', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const row = fakeDb.seedOrder()
    fakeDb.state.beforeUpdate = (payload) => { if (payload.status === 'label_made') row.status = 'closed' }
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(res.status).toBe(500)
    expect((await res.json()).easypost_shipment_id).toBe('shp_test1')
    // The purchase is pinned on the kit (status untouched), so it can never
    // expire into a second buy the way a bare claim could.
    expect(row).toMatchObject({ status: 'closed', easypost_shipment_id: 'shp_test1', tracking_code: '9400100000000000000001' })
    logged.mockRestore()
  })
})

describe('POST label — ONE purchase per kit, enforced by the claim', () => {
  const press = (row: { id?: unknown }) => labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
  const buys = () => calls.filter((c) => c.url.endsWith('/buy'))
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

  it('two presses at the same instant: exactly ONE buy, one 200 and one 409', async () => {
    buyDelayMs = 40
    const row = fakeDb.seedOrder()
    const [a, b] = await Promise.all([press(row), press(row)])
    expect([a.status, b.status].sort()).toEqual([200, 409])
    const refused = a.status === 409 ? a : b
    expect((await refused.json()).error).toBe('A label is already being made for this kit')
    expect(buys()).toHaveLength(1)
    // The loser never reached EasyPost at all: one verify, one shipment, one buy.
    expect(calls).toHaveLength(3)
    // And this really was the race: BOTH requests read "no label" before either wrote.
    const orderOps = fakeDb.state.ops.filter((op) => op.endsWith(':mail_in_orders'))
    expect(orderOps.slice(0, 2)).toEqual(['select:mail_in_orders', 'select:mail_in_orders'])
    expect(row).toMatchObject({ status: 'label_made', easypost_shipment_id: 'shp_test1' })
    expect(fakeDb.tables.mail_in_events.filter((e) => e.type === 'label_created')).toHaveLength(1)
  })

  it('five presses at once still buy once', async () => {
    buyDelayMs = 20
    const row = fakeDb.seedOrder()
    const results = await Promise.all([press(row), press(row), press(row), press(row), press(row)])
    expect(results.map((r) => r.status).sort()).toEqual([200, 409, 409, 409, 409])
    expect(buys()).toHaveLength(1)
  })

  it('while the buy is in flight the row holds a claim token, never a shipment', async () => {
    buyDelayMs = 40
    const row = fakeDb.seedOrder()
    const pending = press(row)
    await new Promise((resolve) => setTimeout(resolve, 15))
    expect(String(row.easypost_shipment_id)).toMatch(/^claim:[0-9a-f-]{36}$/)
    expect(row.label_created_at).toBeTruthy()
    expect(row.status).toBe('quote_agreed')
    expect((await pending).status).toBe(200)
    expect(row.easypost_shipment_id).toBe('shp_test1')
  })

  it.each([
    ['an undeliverable address', () => { deliverable = false }, 422],
    ['no USPS rate', () => { rates = [{ id: 'rate_ups', carrier: 'UPS', service: 'Ground', rate: '1.00' }] }, 502],
    ['EasyPost refusing the buy', () => { buyFails = true }, 502],
  ] as const)('a failure before a successful buy (%s) RELEASES the claim, and a retry succeeds', async (_label, breakIt, status) => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const row = fakeDb.seedOrder()
    breakIt()
    expect((await press(row)).status).toBe(status)
    expect(row).toMatchObject({ easypost_shipment_id: null, label_created_at: null, status: 'quote_agreed' })

    deliverable = true
    buyFails = false
    rates = [USPS]
    expect((await press(row)).status).toBe(200)
    // One successful buy; the refused buy in the third case was a call too.
    expect(buys()).toHaveLength(_label.startsWith('EasyPost') ? 2 : 1)
    expect(row.status).toBe('label_made')
    logged.mockRestore()
  })

  it('a THROWN exception releases the claim too, and a retry succeeds', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    // Not an array: totalBoxes throws a TypeError inside the claimed section.
    const row = fakeDb.seedOrder({ expected_items: 5 })
    expect((await press(row)).status).toBe(500)
    expect(buys()).toHaveLength(0)
    expect(row).toMatchObject({ easypost_shipment_id: null, label_created_at: null })

    row.expected_items = [{ product: 'Contour NEXT 100ct', boxes: 4 }]
    expect((await press(row)).status).toBe(200)
    expect(buys()).toHaveLength(1)
    logged.mockRestore()
  })

  it('releasing only ever clears OUR token', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    deliverable = false
    const row = fakeDb.seedOrder()
    // Someone else's token lands on the row before our release runs.
    fakeDb.state.beforeUpdate = (payload) => { if (payload.easypost_shipment_id === null) row.easypost_shipment_id = 'claim:someone-else' }
    expect((await press(row)).status).toBe(422)
    expect(row.easypost_shipment_id).toBe('claim:someone-else')
    logged.mockRestore()
  })

  it('BUY SUCCEEDED, SAVE FAILED (twice): the claim STAYS, a retry is a 409 and buys nothing', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const row = fakeDb.seedOrder()
    let failures = 0
    fakeDb.state.failOrderUpdateWhen = (payload) => payload.status === 'label_made' && ++failures > 0
    const res = await press(row)
    expect(res.status).toBe(500)
    expect((await res.json()).easypost_shipment_id).toBe('shp_test1')
    expect(failures).toBe(2) // the save is retried once, then given up on
    expect(String(row.easypost_shipment_id)).toMatch(/^claim:/)
    expect(buys()).toHaveLength(1)

    fakeDb.state.failOrderUpdateWhen = null
    const again = await press(row)
    expect(again.status).toBe(409)
    expect((await again.json()).error).toBe('A label is already being made for this kit')
    expect(buys()).toHaveLength(1)
    logged.mockRestore()
  })

  it('a save that fails once is retried and the label is saved', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const row = fakeDb.seedOrder()
    let failures = 0
    fakeDb.state.failOrderUpdateWhen = (payload) => payload.status === 'label_made' && ++failures === 1
    expect((await press(row)).status).toBe(200)
    expect(row).toMatchObject({ status: 'label_made', easypost_shipment_id: 'shp_test1' })
    expect(buys()).toHaveLength(1)
    logged.mockRestore()
  })

  it('a buy that never ANSWERS may have been charged: the claim is held and a retry is a 409', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    buyDrops = true
    const row = fakeDb.seedOrder()
    const res = await press(row)
    const body = await res.json()
    expect(res.status).toBe(502)
    expect(body.error).toMatch(/MAY have been bought/)
    expect(body.easypost_shipment_id).toBe('shp_test1')
    expect(String(row.easypost_shipment_id)).toMatch(/^claim:/)
    expect(logged.mock.calls.flat().join(' ')).toMatch(/BUY OUTCOME UNKNOWN.*shp_test1/)

    buyDrops = false
    expect((await press(row)).status).toBe(409)
    expect(buys()).toHaveLength(1)
    logged.mockRestore()
  })

  it('an ABANDONED claim (older than 3 minutes) is taken over', async () => {
    const row = fakeDb.seedOrder({ easypost_shipment_id: 'claim:dead-function', label_created_at: minutesAgo(3.5) })
    expect((await press(row)).status).toBe(200)
    expect(buys()).toHaveLength(1)
    expect(row).toMatchObject({ status: 'label_made', easypost_shipment_id: 'shp_test1' })
  })

  it('a FRESH claim (under 3 minutes) is not: 409 and EasyPost is never called', async () => {
    const row = fakeDb.seedOrder({ easypost_shipment_id: 'claim:still-running', label_created_at: minutesAgo(2.5) })
    const res = await press(row)
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('A label is already being made for this kit')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(row.easypost_shipment_id).toBe('claim:still-running')
  })

  it('two requests racing to take over the same abandoned claim: one buy', async () => {
    buyDelayMs = 20
    const row = fakeDb.seedOrder({ easypost_shipment_id: 'claim:dead-function', label_created_at: minutesAgo(10) })
    const [a, b] = await Promise.all([press(row), press(row)])
    expect([a.status, b.status].sort()).toEqual([200, 409])
    expect(buys()).toHaveLength(1)
  })

  it('an old REAL shipment id is never "taken over", however old', async () => {
    const row = fakeDb.seedOrder({ easypost_shipment_id: 'shp_real', label_created_at: minutesAgo(600) })
    expect((await press(row)).status).toBe(409)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(row.easypost_shipment_id).toBe('shp_real')
  })

  it('a kit voided BEFORE this change (old shipment id still on the row) can be labeled; the old id goes to the timeline first', async () => {
    const row = fakeDb.seedOrder({ easypost_shipment_id: 'shp_legacy', label_refund_status: 'refunded', tracking_code: '9400LEGACY', easypost_mode: 'test' })
    expect((await press(row)).status).toBe(200)
    expect(row).toMatchObject({ status: 'label_made', easypost_shipment_id: 'shp_test1', label_refund_status: null })
    expect(fakeDb.tables.mail_in_events[0]).toMatchObject({ type: 'voided_shipment_archived', detail: { easypost_shipment_id: 'shp_legacy', tracking_code: '9400LEGACY', refund_status: 'refunded' } })
  })

  it('...and if that timeline write fails, the old id is NOT cleared and nothing is bought', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const row = fakeDb.seedOrder({ easypost_shipment_id: 'shp_legacy', label_refund_status: 'refunded' })
    fakeDb.state.failNextEventInsert = true
    expect((await press(row)).status).toBe(500)
    expect(row.easypost_shipment_id).toBe('shp_legacy')
    expect(fetchMock).not.toHaveBeenCalled()
    logged.mockRestore()
  })
})

describe('POST label/void', () => {
  async function labeled() {
    const row = fakeDb.seedOrder()
    await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    calls = []
    return row
  }

  it('refunds at EasyPost, keeps the history, moves back to Quote agreed, writes events', async () => {
    const row = await labeled()
    const res = await voidPOST(request(`/api/admin/mail-in/${row.id}/label/void`), ctx(String(row.id)))
    expect(res.status).toBe(200)
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['POST https://api.easypost.com/v2/shipments/shp_test1/refund'])
    expect(calls[0].body).toBeNull()
    // The shipment id leaves the ROW (so the kit can be claimed again) and lives on in the timeline.
    expect(row).toMatchObject({ status: 'quote_agreed', label_refund_status: 'submitted', easypost_shipment_id: null, tracking_code: '9400100000000000000001' })
    expect(fakeDb.tables.mail_in_events.slice(-2).map((e) => e.type)).toEqual(['label_voided', 'status_changed'])
    expect(fakeDb.tables.mail_in_events.at(-2)?.detail).toEqual({ refund_status: 'submitted', tracking_code: '9400100000000000000001', easypost_shipment_id: 'shp_test1', mode: 'test' })
  })

  it('void, then a NEW label: works, and the voided shipment id survives in the event log', async () => {
    const row = await labeled()
    expect((await voidPOST(request(`/api/admin/mail-in/${row.id}/label/void`), ctx(String(row.id)))).status).toBe(200)
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(res.status).toBe(200)
    expect(row).toMatchObject({ status: 'label_made', easypost_shipment_id: 'shp_test2', label_refund_status: null })
    const voided = fakeDb.tables.mail_in_events.filter((e) => e.type === 'label_voided')
    expect(voided).toHaveLength(1)
    expect(voided[0].detail).toMatchObject({ easypost_shipment_id: 'shp_test1' })
    expect(fakeDb.tables.mail_in_events.filter((e) => e.type === 'label_created').map((e) => (e.detail as { easypost_shipment_id: string }).easypost_shipment_id)).toEqual(['shp_test1', 'shp_test2'])
  })

  it('if the label_voided timeline row cannot be written, the shipment id STAYS on the kit; the next label archives it', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const row = await labeled()
    fakeDb.state.failNextEventInsert = true
    expect((await voidPOST(request(`/api/admin/mail-in/${row.id}/label/void`), ctx(String(row.id)))).status).toBe(200)
    expect(row).toMatchObject({ status: 'quote_agreed', label_refund_status: 'submitted', easypost_shipment_id: 'shp_test1' })

    expect((await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))).status).toBe(200)
    expect(row.easypost_shipment_id).toBe('shp_test2')
    expect(fakeDb.tables.mail_in_events.find((e) => e.type === 'voided_shipment_archived')?.detail).toMatchObject({ easypost_shipment_id: 'shp_test1' })
    logged.mockRestore()
  })

  it.each([
    ['at Quote agreed (a purchase in flight)', 'quote_agreed'],
    ['even on a row that says Label made', 'label_made'],
  ])('a CLAIM token is not a shipment %s: 409 and EasyPost is never called', async (_label, status) => {
    const row = fakeDb.seedOrder({ status, easypost_shipment_id: 'claim:0b9d2c0e-0000-4000-8000-000000000001', label_created_at: new Date().toISOString(), easypost_mode: 'test' })
    const res = await voidPOST(request(`/api/admin/mail-in/${row.id}/label/void`), ctx(String(row.id)))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toBe('A label is already being made for this kit')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(row.easypost_shipment_id).toBe('claim:0b9d2c0e-0000-4000-8000-000000000001')
  })

  it('after a void a fresh label may be made, and the refund flag is cleared', async () => {
    const row = await labeled()
    await voidPOST(request(`/api/admin/mail-in/${row.id}/label/void`), ctx(String(row.id)))
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(res.status).toBe(200)
    expect(row).toMatchObject({ status: 'label_made', label_refund_status: null })
  })

  it('refunds with the key of the mode that BOUGHT the label', async () => {
    const row = await labeled() // bought in test mode
    vi.stubEnv('EASYPOST_MODE', 'live')
    await voidPOST(request(`/api/admin/mail-in/${row.id}/label/void`), ctx(String(row.id)))
    expect(calls[0].auth).toBe(`Basic ${Buffer.from('EZTK-test-key-sentinel:').toString('base64')}`)
  })

  it.each([
    ['a kit with no label', { status: 'label_made' }],
    ['a kit already in transit', { status: 'in_transit', easypost_shipment_id: 'shp_x' }],
    ['a label already voided', { status: 'label_made', easypost_shipment_id: 'shp_x', label_refund_status: 'submitted' }],
  ])('409s on %s without calling EasyPost', async (_label, seed) => {
    const row = fakeDb.seedOrder(seed)
    const res = await voidPOST(request(`/api/admin/mail-in/${row.id}/label/void`), ctx(String(row.id)))
    expect(res.status).toBe(409)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('POST link — resend', () => {
  it('returns the link and text, makes no label, changes nothing', async () => {
    const row = fakeDb.seedOrder({ status: 'awaiting_quote' })
    const res = await linkPOST(request(`/api/admin/mail-in/${row.id}/link`, {}), ctx(String(row.id)))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.link).toBe(`https://cash4teststripsusa.com/kit/${row.token}`)
    expect(body.text).toContain(body.link)
    expect(body.emailed).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(row.status).toBe('awaiting_quote')
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('emails on request, and says so when there is no address', async () => {
    const none = fakeDb.seedOrder()
    expect((await linkPOST(request(`/api/admin/mail-in/${none.id}/link`, { email: true }), ctx(String(none.id)))).status).toBe(400)

    const row = fakeDb.seedOrder({ email: 'pat@example.com', token: 'b'.repeat(64) })
    const res = await linkPOST(request(`/api/admin/mail-in/${row.id}/link`, { email: true }), ctx(String(row.id)))
    expect((await res.json()).emailed).toBe(true)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(fakeDb.tables.mail_in_events.at(-1)).toMatchObject({ type: 'link_sent', detail: { channel: 'email' } })
  })
})
