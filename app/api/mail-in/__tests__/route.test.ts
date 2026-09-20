import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', async () => ({ supabaseAdmin: (await import('@/test/mail-in-fake-db')).fakeDb.client }))
const sendEmail = vi.fn(async (input: { to: string; subject: string; html: string }) => void input)
vi.mock('@/lib/email', () => ({ sendEmail: (input: { to: string; subject: string; html: string }) => sendEmail(input), escapeHtml: (v: string) => v }))

import { fakeDb } from '@/test/mail-in-fake-db'
import { HONEYPOT_FIELD } from '@/lib/honeypot'
import { RATE_LIMIT_MAX } from '@/lib/rate-limit'
import { OWNER_EMAIL } from '@/lib/owner'
import { EXPIRATION_BUCKET_VALUES } from '@/lib/mail-in'
import { POST } from '../route'

let ipCounter = 0
const freshIp = () => `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`

function request(body: unknown, ip = freshIp()) {
  return new Request('http://localhost/api/mail-in', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
  })
}

const valid = {
  name: 'Pat Seller',
  phone: '(518) 555-0100',
  email: 'pat@example.com',
  street1: '12 Elm St',
  street2: '',
  city: 'Columbus',
  state: 'OH',
  zip: '43004',
  expected_items: [{ product: 'Contour NEXT 100ct', boxes: 4 }, { product: 'Dexcom G7', boxes: 2 }],
  payout_method: 'zelle',
  payout_handle: 'ZELLE-HANDLE-SENTINEL',
  note: 'call after 5',
  [HONEYPOT_FIELD]: '',
}

beforeEach(() => {
  fakeDb.reset()
  sendEmail.mockClear()
})

describe('POST /api/mail-in', () => {
  it('saves a kit at awaiting_quote from the site, writes a seller event, alerts the owner', async () => {
    const res = await POST(request(valid))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.order_number).toMatch(/^MK-[0-9A-Z]{6}$/)
    expect(body.status_path).toMatch(/^\/kit\/[0-9a-f]{64}$/)
    expect(Object.keys(body).sort()).toEqual(['ok', 'order_number', 'status_path'])

    expect(fakeDb.tables.mail_in_orders).toHaveLength(1)
    const row = fakeDb.tables.mail_in_orders[0]
    expect(row).toMatchObject({ status: 'awaiting_quote', source: 'site', phone: '5185550100', state: 'OH', seller_note: 'call after 5', payout_method: 'zelle' })
    expect(row.quoted_amount).toBeUndefined()
    expect(body.status_path).toBe(`/kit/${row.token}`)

    expect(fakeDb.tables.mail_in_events).toHaveLength(1)
    expect(fakeDb.tables.mail_in_events[0]).toMatchObject({ order_id: row.id, type: 'created', actor: 'seller', detail: { source: 'site', expected_lines: 2 } })

    expect(sendEmail).toHaveBeenCalledTimes(1)
    const mail = sendEmail.mock.calls[0][0]
    expect(mail.to).toBe(OWNER_EMAIL)
    expect(mail.subject).toContain(body.order_number)
    // The alert never carries the payout handle or the private link.
    expect(mail.html).not.toContain('ZELLE-HANDLE-SENTINEL')
    expect(mail.html).not.toContain(String(row.token))
  })

  it('stores the optional month per item and shows it in the alert, neutrally', async () => {
    const items = [{ product: 'Contour NEXT 100ct', boxes: 4, expiration: EXPIRATION_BUCKET_VALUES[1] }, { product: 'Dexcom G7', boxes: 2 }]
    const res = await POST(request({ ...valid, expected_items: items }))
    expect(res.status).toBe(201)
    expect(fakeDb.tables.mail_in_orders[0].expected_items).toEqual(items)
    const html = sendEmail.mock.calls[0][0].html
    expect(html).toContain('<li>Contour NEXT 100ct x 4 · exp ' + EXPIRATION_BUCKET_VALUES[1] + '</li>')
    expect(html).toContain('<li>Dexcom G7 x 2</li>')
  })

  it('answers 400 to a month the form could never send, nothing saved', async () => {
    const res = await POST(request({ ...valid, expected_items: [{ product: 'Dexcom G7', boxes: 2, expiration: 'whenever' }] }))
    expect(res.status).toBe(400)
    expect(fakeDb.tables.mail_in_orders).toHaveLength(0)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('refuses a browser POST from another site with 403, database untouched', async () => {
    const req = new Request('http://localhost/api/mail-in', {
      method: 'POST',
      body: JSON.stringify(valid),
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': freshIp(), origin: 'https://evil.example' },
    })
    expect((await POST(req)).status).toBe(403)
    expect(fakeDb.state.touched).toBe(0)
    expect(sendEmail).not.toHaveBeenCalled()

    const same = new Request('http://localhost/api/mail-in', {
      method: 'POST',
      body: JSON.stringify(valid),
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': freshIp(), origin: 'http://localhost' },
    })
    expect((await POST(same)).status).toBe(201)
  })

  it('ignores any status, amount or source the client tries to set', async () => {
    await POST(request({ ...valid, status: 'paid', quoted_amount: 999, paid_amount: 999, source: 'admin', internal_notes: 'x', easypost_mode: 'live' }))
    const row = fakeDb.tables.mail_in_orders[0]
    expect(row).toMatchObject({ status: 'awaiting_quote', source: 'site' })
    for (const key of ['quoted_amount', 'paid_amount', 'internal_notes', 'easypost_mode']) expect(key in row, key).toBe(false)
  })

  it('a tripped honeypot gets a plain ok: nothing saved, nothing mailed, no rate-limit slot used', async () => {
    const ip = freshIp()
    for (let i = 0; i < RATE_LIMIT_MAX + 3; i++) {
      const res = await POST(request({ ...valid, [HONEYPOT_FIELD]: 'http://spam.example' }, ip))
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ ok: true })
    }
    expect(fakeDb.state.touched).toBe(0)
    expect(sendEmail).not.toHaveBeenCalled()
    // The same IP can still submit for real: the honeypot hits cost it nothing.
    expect((await POST(request(valid, ip))).status).toBe(201)
  })

  it('rate-limits per IP BEFORE validation and before any insert', async () => {
    const ip = freshIp()
    // Invalid bodies still consume slots — the limiter runs before validation.
    for (let i = 0; i < RATE_LIMIT_MAX; i++) expect((await POST(request({ ...valid, phone: '' }, ip))).status).toBe(400)
    const limited = await POST(request(valid, ip))
    expect(limited.status).toBe(429)
    expect(limited.headers.get('Retry-After')).toBeTruthy()
    expect(fakeDb.state.touched).toBe(0)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it.each([
    ['a body that is not JSON', '{nope'],
    ['no phone', { ...valid, phone: '' }],
    ['no items', { ...valid, expected_items: [] }],
    ['no address', { ...valid, street1: '' }],
    ['a non-US state', { ...valid, state: 'CANADA' }],
    ['no payout method', { ...valid, payout_method: '' }],
  ])('400s on %s without touching the database', async (_label, body) => {
    const res = await POST(request(body))
    expect(res.status).toBe(400)
    expect(fakeDb.state.touched).toBe(0)
  })

  it('accepts a seller in Washington DC', async () => {
    const res = await POST(request({ ...valid, city: 'Washington', state: 'DC', zip: '20001' }))
    expect(res.status).toBe(201)
  })

  it.each(['account_number', 'routing_number', 'bank_account'])('refuses a %s field outright', async (key) => {
    const res = await POST(request({ ...valid, payout_method: 'ach', [key]: '021000021' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/do not send bank details/i)
    expect(fakeDb.state.touched).toBe(0)
  })

  it('for ACH, stores no handle even when one is posted', async () => {
    await POST(request({ ...valid, payout_method: 'ach', payout_handle: '021000021 1234567890' }))
    expect(fakeDb.tables.mail_in_orders[0].payout_handle).toBeNull()
    expect(JSON.stringify(fakeDb.tables)).not.toContain('021000021')
  })

  it('still succeeds when the alert email throws', async () => {
    sendEmail.mockRejectedValueOnce(new Error('smtp down'))
    const res = await POST(request(valid))
    expect(fakeDb.tables.mail_in_orders).toHaveLength(1)
    expect(res.status).toBe(201)
  })
})
