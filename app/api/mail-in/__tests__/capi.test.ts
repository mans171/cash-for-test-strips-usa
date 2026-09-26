import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/supabase-admin', async () => ({ supabaseAdmin: (await import('@/test/mail-in-fake-db')).fakeDb.client }))
vi.mock('@/lib/email', () => ({ sendEmail: async () => undefined, escapeHtml: (v: string) => v }))

import { fakeDb } from '@/test/mail-in-fake-db'
import { POST } from '../route'

const valid = {
  name: 'Pat Seller',
  phone: '(518) 555-0100',
  email: 'pat@example.com',
  street1: '12 Elm St',
  street2: '',
  city: 'Columbus',
  state: 'OH',
  zip: '43004',
  expected_items: [{ product: 'Contour NEXT 100ct', boxes: 4 }],
  payout_method: 'zelle',
  payout_handle: 'ZELLE-HANDLE-SENTINEL',
  note: 'call after 5',
}

let ip = 0
const request = () =>
  new Request('http://localhost/api/mail-in', {
    method: 'POST',
    body: JSON.stringify(valid),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.8.0.${++ip}` },
  })

const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))

beforeEach(() => {
  fakeDb.reset()
  vi.stubEnv('META_PIXEL_ID', '9000000000000001')
  vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'test-token')
  fetchMock.mockClear()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('POST /api/mail-in → Meta Conversions API', () => {
  it('sends one Lead after the kit is saved, with the event id it returns', async () => {
    const res = await POST(request())
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(fakeDb.tables.mail_in_orders).toHaveLength(1)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const event = JSON.parse(String(init.body)).data[0]
    expect(event.event_id).toBe(json.event_id)
    expect(event.custom_data).toEqual({ lead_type: 'mail_kit' })
    expect(event.event_source_url).toBe('https://cash4teststripsusa.com/mail-in-kit')
    // The address, items and payout never go to Meta.
    const sent = JSON.stringify(event)
    for (const secret of ['Elm', 'Columbus', '43004', 'Contour', 'ZELLE-HANDLE-SENTINEL', 'call after 5', 'Pat']) {
      expect(sent).not.toContain(secret)
    }
  })

  it('still saves the kit when Meta is down', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValueOnce(new Error('network'))
    const res = await POST(request())
    expect(res.status).toBe(201)
    expect(fakeDb.tables.mail_in_orders).toHaveLength(1)
  })
})
