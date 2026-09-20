import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase-admin', async () => ({ supabaseAdmin: (await import('@/test/mail-in-fake-db')).fakeDb.client }))
const sendEmail = vi.fn(async (input: { to: string; subject: string; html: string }) => void input)
vi.mock('@/lib/email', () => ({ sendEmail: (input: { to: string; subject: string; html: string }) => sendEmail(input), escapeHtml: (v: string) => v }))

import { fakeDb } from '@/test/mail-in-fake-db'
import { ADMIN_SESSION_COOKIE_NAME, signSession } from '@/lib/admin-auth'
import { POST as labelPOST } from '../[id]/label/route'
import { POST as voidPOST } from '../[id]/label/void/route'
import { POST as linkPOST } from '../[id]/link/route'

// EasyPost is never reached: global fetch is replaced and every call recorded.
type Call = { url: string; method: string; auth: string; body: Record<string, unknown> | null }
let calls: Call[] = []
let rates: Array<Record<string, string>> = []
let deliverable = true
let buyFails = false

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
  if (url.endsWith('/v2/shipments')) return json({ id: 'shp_test1', rates })
  if (url.endsWith('/buy')) {
    if (buyFails) return json({ error: { code: 'SHIPMENT.POSTAGE.FAILURE', message: 'Unable to buy postage' } }, 422)
    const picked = rates.find((r) => r.id === (JSON.parse(String(init?.body)) as { rate: { id: string } }).rate.id)
    return json({
      id: 'shp_test1',
      tracking_code: '9400100000000000000001',
      tracker: { id: 'trk_test1' },
      selected_rate: { carrier: picked?.carrier, service: picked?.service },
      postage_label: { label_url: 'https://easypost-files.example/label.pdf', label_pdf_url: null },
    })
  }
  if (url.endsWith('/refund')) return json({ id: 'shp_test1', refund_status: 'submitted' })
  return json({ error: { message: 'unexpected url' } }, 404)
})

const cookie = signSession()
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
    fakeDb.state.failNextOrderUpdate = true
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
    fakeDb.state.beforeUpdate = () => { row.status = 'closed' }
    const res = await labelPOST(request(`/api/admin/mail-in/${row.id}/label`, {}), ctx(String(row.id)))
    expect(res.status).toBe(500)
    expect((await res.json()).easypost_shipment_id).toBe('shp_test1')
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
    expect(row).toMatchObject({ status: 'quote_agreed', label_refund_status: 'submitted', easypost_shipment_id: 'shp_test1', tracking_code: '9400100000000000000001' })
    expect(fakeDb.tables.mail_in_events.slice(-2).map((e) => e.type)).toEqual(['label_voided', 'status_changed'])
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
