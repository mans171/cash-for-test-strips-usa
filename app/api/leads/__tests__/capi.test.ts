import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Pure-mock route test, same approach as sell-start-completion.test.ts: no
// database, no mail. It proves the Conversions API wiring: the Lead goes to
// Meta only after the request has really gone through, it carries the same
// event id the browser gets back, and a Meta outage never costs a lead.
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
const sendEmailOrThrow = vi.fn(async () => undefined)
vi.mock('@/lib/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/email')>()
  return { ...actual, sendEmailOrThrow: () => sendEmailOrThrow() }
})

const { POST } = await import('../route')

const body = {
  items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
  matchedCompanyId: 'company-1',
  channel: 'sms',
  name: 'Jane Doe',
  phone: '(518) 555-0100',
  email: 'jane@example.com',
}

let ip = 0
function post(payload: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request('http://localhost/api/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': `10.9.0.${++ip}`,
        'user-agent': 'UA/1.0',
        referer: 'https://cash4teststripsusa.com/sell?fbclid=abc',
        cookie: '_fbp=fb.1.1.2',
        ...headers,
      },
    })
  )
}

const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))

beforeEach(() => {
  vi.stubEnv('META_PIXEL_ID', '9000000000000001')
  vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'test-token')
  fetchMock.mockClear()
  sendEmailOrThrow.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function sentEvent() {
  const call = fetchMock.mock.calls.find((c) => String((c as unknown[])[0]).includes('graph.facebook.com')) as unknown as
    | [string, RequestInit]
    | undefined
  return call ? JSON.parse(String(call[1].body)).data[0] : null
}

describe('POST /api/leads → Meta Conversions API', () => {
  it('sends one Lead with the same event id it returns to the browser (text channel)', async () => {
    const res = await post(body)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.eventId).toMatch(/^[0-9a-f-]{36}$/)
    const event = sentEvent()
    expect(event.event_name).toBe('Lead')
    expect(event.event_id).toBe(json.eventId)
    expect(event.action_source).toBe('website')
    expect(event.event_source_url).toBe('https://cash4teststripsusa.com/sell')
    expect(event.user_data.fbp).toBe('fb.1.1.2')
    expect(event.user_data.fbc).toMatch(/^fb\.1\.\d+\.abc$/)
    expect(event.user_data.client_ip_address).toMatch(/^10\.9\.0\./)
    expect(event.custom_data).toEqual({ lead_type: 'sell' })
    expect(JSON.stringify(event)).not.toContain('Jane')
    expect(JSON.stringify(event)).not.toContain('OneTouch')
  })

  it('sends it after the buyer email on the email channel, and returns the id', async () => {
    const res = await post({ ...body, channel: 'email' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(sentEvent().event_id).toBe(json.eventId)
  })

  it('sends nothing when the buyer email fails, so a retry is not counted twice', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    sendEmailOrThrow.mockRejectedValue(new Error('smtp down'))
    const res = await post({ ...body, channel: 'email' })
    expect(res.status).toBe(500)
    expect(sentEvent()).toBeNull()
  })

  it('still saves and answers 200 when Meta is down', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValueOnce(new Error('network'))
    const res = await post(body)
    expect(res.status).toBe(200)
    expect(mockCreateLead).toHaveBeenCalled()
    expect((await res.json()).eventId).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('does not send for a visitor with Global Privacy Control, but still returns an id', async () => {
    const res = await post(body, { 'sec-gpc': '1' })
    expect(res.status).toBe(200)
    expect(sentEvent()).toBeNull()
    expect(typeof (await res.json()).eventId).toBe('string')
  })
})
