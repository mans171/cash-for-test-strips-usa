import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'node:crypto'

vi.mock('@/lib/supabase-admin', async () => ({ supabaseAdmin: (await import('@/test/mail-in-fake-db')).fakeDb.client }))

import { fakeDb } from '@/test/mail-in-fake-db'
import { POST } from '../route'

const SECRET = 'whsec-test-Ünïcode'
const TRACKING = '9400100000000000000001'

function sign(raw: string, secret = SECRET) {
  return 'hmac-sha256-hex=' + createHmac('sha256', secret.normalize('NFKD')).update(raw, 'utf8').digest('hex')
}

function event(status: string, overrides: Record<string, unknown> = {}) {
  return {
    object: 'Event',
    description: 'tracker.updated',
    mode: 'test',
    result: { object: 'Tracker', id: 'trk_test1', tracking_code: TRACKING, status },
    ...overrides,
  }
}

function request(payload: unknown, signature?: string | null) {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const header = signature === undefined ? sign(raw) : signature
  if (header) headers['X-Hmac-Signature'] = header
  return new Request('http://localhost/api/webhooks/easypost', { method: 'POST', body: raw, headers })
}

const labeled = (overrides: Record<string, unknown> = {}) =>
  fakeDb.seedOrder({ status: 'label_made', easypost_shipment_id: 'shp_test1', easypost_tracker_id: 'trk_test1', easypost_mode: 'test', tracking_code: TRACKING, ...overrides })

beforeEach(() => {
  fakeDb.reset()
  vi.stubEnv('EASYPOST_WEBHOOK_SECRET', SECRET)
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/webhooks/easypost — the signature comes first', () => {
  it.each([
    ['no signature header', null],
    ['a signature made with another secret', 'OTHER'],
    ['a signature without the prefix', 'NOPREFIX'],
    ['garbage', 'hmac-sha256-hex=zzzz'],
  ])('%s -> 401 and the database is never touched', async (_label, kind) => {
    labeled()
    const payload = event('delivered')
    const raw = JSON.stringify(payload)
    const header = kind === 'OTHER' ? sign(raw, 'someone-else') : kind === 'NOPREFIX' ? sign(raw).replace('hmac-sha256-hex=', '') : kind
    const res = await POST(request(payload, header))
    expect(res.status).toBe(401)
    expect(fakeDb.state.touched).toBe(0)
    expect(fakeDb.tables.mail_in_orders[0].status).toBe('label_made')
  })

  it('a body altered after signing -> 401', async () => {
    labeled()
    const res = await POST(request(JSON.stringify(event('delivered')), sign(JSON.stringify(event('in_transit')))))
    expect(res.status).toBe(401)
    expect(fakeDb.state.touched).toBe(0)
  })

  it('no EASYPOST_WEBHOOK_SECRET configured -> 401 even for a "valid" signature, database untouched', async () => {
    vi.stubEnv('EASYPOST_WEBHOOK_SECRET', '')
    labeled()
    const res = await POST(request(event('delivered')))
    expect(res.status).toBe(401)
    expect(fakeDb.state.touched).toBe(0)
  })
})

describe('POST /api/webhooks/easypost — tracker.updated', () => {
  it('in_transit: Label made -> In transit, first scan stamped, system event', async () => {
    const row = labeled()
    const res = await POST(request(event('in_transit')))
    expect(res.status).toBe(200)
    expect(row.status).toBe('in_transit')
    expect(row.first_scan_at).toBeTruthy()
    expect(fakeDb.tables.mail_in_events).toHaveLength(1)
    expect(fakeDb.tables.mail_in_events[0]).toMatchObject({ type: 'status_changed', actor: 'system', detail: { from: 'label_made', to: 'in_transit', tracker_status: 'in_transit' } })
  })

  it('out_for_delivery counts as in transit; delivered / available_for_pickup as delivered', async () => {
    const row = labeled()
    await POST(request(event('out_for_delivery')))
    expect(row.status).toBe('in_transit')
    const firstScan = row.first_scan_at
    await POST(request(event('available_for_pickup')))
    expect(row.status).toBe('delivered')
    expect(row.delivered_at).toBeTruthy()
    expect(row.first_scan_at).toBe(firstScan)
  })

  it.each(['return_to_sender', 'failure', 'error'])('%s -> Problem with a reason', async (status) => {
    const row = labeled({ status: 'in_transit' })
    await POST(request(event(status)))
    expect(row.status).toBe('problem')
    expect(String(row.problem_reason)).toMatch(/Carrier reports/)
  })

  it('is idempotent: the same event five times writes one move and one timeline row', async () => {
    const row = labeled()
    for (let i = 0; i < 5; i++) expect((await POST(request(event('in_transit')))).status).toBe(200)
    expect(row.status).toBe('in_transit')
    expect(fakeDb.tables.mail_in_events).toHaveLength(1)
  })

  it('never moves a kit backward: a late in_transit after delivered is ignored', async () => {
    const row = labeled({ status: 'delivered', delivered_at: '2026-09-22T00:00:00.000Z' })
    const res = await POST(request(event('in_transit')))
    expect(res.status).toBe(200)
    expect(row.status).toBe('delivered')
    expect(fakeDb.tables.mail_in_events).toHaveLength(0)
  })

  it.each(['checked_in', 'paid', 'closed', 'problem'])('never moves a kit out of %s', async (status) => {
    const row = labeled({ status })
    for (const tracker of ['in_transit', 'delivered', 'return_to_sender']) {
      expect((await POST(request(event(tracker)))).status).toBe(200)
    }
    expect(row.status).toBe(status)
    expect(fakeDb.tables.mail_in_events).toHaveLength(0)
  })

  it('ignores an event whose mode does not match the kit (test event, live kit — and the reverse)', async () => {
    const live = labeled({ easypost_mode: 'live' })
    expect((await POST(request(event('delivered', { mode: 'test' })))).status).toBe(200)
    expect(live.status).toBe('label_made')

    fakeDb.reset()
    const test = labeled({ easypost_mode: 'test' })
    expect((await POST(request(event('delivered', { mode: 'production' })))).status).toBe(200)
    expect(test.status).toBe('label_made')
  })

  it('a production event moves a live kit', async () => {
    const row = labeled({ easypost_mode: 'live' })
    await POST(request(event('delivered', { mode: 'production' })))
    expect(row.status).toBe('delivered')
  })

  it('finds the kit by tracker id when the tracking code does not match', async () => {
    const row = labeled()
    await POST(request(event('in_transit', { result: { id: 'trk_test1', tracking_code: 'SOMETHING-ELSE', status: 'in_transit' } })))
    expect(row.status).toBe('in_transit')
  })

  it('never treats a label CLAIM as a label: a tracker that matches a claimed kit is ignored', async () => {
    // A voided kit being re-labeled right now: the old tracking code is still
    // on the row, the shipment column holds a claim placeholder.
    const row = labeled({ status: 'quote_agreed', easypost_shipment_id: 'claim:0b9d2c0e-0000-4000-8000-000000000001', label_refund_status: null })
    for (const status of ['in_transit', 'delivered']) {
      const res = await POST(request(event(status)))
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ ok: true, ignored: 'label being made' })
    }
    expect(row).toMatchObject({ status: 'quote_agreed', first_scan_at: null, delivered_at: null })
    expect(fakeDb.tables.mail_in_events).toHaveLength(0)
    // Same for a claim sitting on a row that says Label made.
    row.status = 'label_made'
    expect(await (await POST(request(event('in_transit')))).json()).toEqual({ ok: true, ignored: 'label being made' })
    expect(row.status).toBe('label_made')
  })

  it('ignores a voided label\'s tracker', async () => {
    const row = labeled({ status: 'quote_agreed', label_refund_status: 'submitted' })
    await POST(request(event('in_transit')))
    expect(row.status).toBe('quote_agreed')
  })

  it.each([
    ['another event type', event('delivered', { description: 'batch.updated' })],
    ['an unknown tracking code', event('delivered', { result: { id: 'trk_nope', tracking_code: 'NOPE', status: 'delivered' } })],
    ['pre_transit', event('pre_transit')],
    ['a body that is not JSON', 'not json at all'],
  ])('answers 200 to a well-signed %s and changes nothing', async (_label, payload) => {
    const row = labeled()
    const res = await POST(request(payload))
    expect(res.status).toBe(200)
    expect(row.status).toBe('label_made')
    expect(fakeDb.tables.mail_in_events).toHaveLength(0)
  })
})
