import { describe, it, expect, vi, afterEach } from 'vitest'
import { createHash } from 'crypto'
import {
  buildLeadEvent,
  capiContextFromRequest,
  hashEmail,
  hashPhone,
  normalizePhone,
  reportLead,
  sendLeadEvent,
  SEND_TIMEOUT_MS,
} from '@/lib/meta-capi'

const sha = (v: string) => createHash('sha256').update(v).digest('hex')
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

// A made-up id: tests must not carry a real dataset id (see tracking-isolation).
const TEST_PIXEL = '9000000000000001'

function request(headers: Record<string, string> = {}) {
  return new Request('https://cash4teststripsusa.com/api/leads', { method: 'POST', headers })
}

function configure() {
  vi.stubEnv('META_PIXEL_ID', TEST_PIXEL)
  vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'test-token')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('hashing', () => {
  it('normalizes a US phone to 11 digits with the country code before hashing', () => {
    expect(normalizePhone('(518) 555-0100')).toBe('15185550100')
    expect(normalizePhone('+1 518.555.0100')).toBe('15185550100')
    expect(normalizePhone('011 1 518 555 0100')).toBe('15185550100')
    expect(hashPhone('518-555-0100')).toBe(sha('15185550100'))
  })

  it('drops phones it cannot trust instead of hashing them wrong', () => {
    expect(hashPhone('555-0100')).toBeNull()
    expect(hashPhone('+44 20 7946 0958')).toBeNull()
    expect(hashPhone('')).toBeNull()
    expect(hashPhone(undefined)).toBeNull()
  })

  it('trims and lowercases an email before hashing, and never hashes an empty one', () => {
    expect(hashEmail('  Pat@Example.COM ')).toBe(sha('pat@example.com'))
    expect(hashEmail('')).toBeNull()
    expect(hashEmail('not-an-email')).toBeNull()
    expect(hashEmail(null)).toBeNull()
  })
})

describe('capiContextFromRequest', () => {
  it('reads IP, user agent, Meta cookies and the page from the request', () => {
    const ctx = capiContextFromRequest(
      request({
        'x-forwarded-for': '203.0.113.9, 10.0.0.1',
        'user-agent': 'UA/1.0',
        cookie: 'c4ts_zip=12203; _fbp=fb.1.111.222; _fbc=fb.1.333.abc',
        referer: 'https://cash4teststripsusa.com/sell?utm_source=fb&fbclid=zzz#top',
      }),
      '/sell'
    )
    expect(ctx).toEqual({
      ip: '203.0.113.9',
      userAgent: 'UA/1.0',
      fbp: 'fb.1.111.222',
      fbc: 'fb.1.333.abc',
      // Query string and fragment never go to Meta.
      sourceUrl: 'https://cash4teststripsusa.com/sell',
      allowed: true,
    })
  })

  it('derives fbc from an fbclid on the page when the cookie is not there yet', () => {
    const ctx = capiContextFromRequest(
      request({ referer: 'https://cash4teststripsusa.com/sell-test-strips-in-bulk?fbclid=AbC123' }),
      '/sell-test-strips-in-bulk',
      1_700_000_000_000
    )
    expect(ctx.fbc).toBe('fb.1.1700000000000.AbC123')
  })

  it('falls back to the known page when there is no usable referer', () => {
    expect(capiContextFromRequest(request(), '/mail-in-kit').sourceUrl).toBe('https://cash4teststripsusa.com/mail-in-kit')
    expect(capiContextFromRequest(request({ referer: 'https://evil.example/x' }), '/sell').sourceUrl).toBe(
      'https://cash4teststripsusa.com/sell'
    )
  })

  it('honors Global Privacy Control and the opt-out cookie', () => {
    expect(capiContextFromRequest(request({ 'sec-gpc': '1' }), '/sell').allowed).toBe(false)
    expect(capiContextFromRequest(request({ cookie: 'c4ts_ad_optout=1' }), '/sell').allowed).toBe(false)
  })
})

describe('buildLeadEvent', () => {
  const context = {
    ip: '203.0.113.9',
    userAgent: 'UA/1.0',
    fbp: 'fb.1.111.222',
    fbc: null,
    sourceUrl: 'https://cash4teststripsusa.com/sell',
    allowed: true,
  }

  it('builds a website Lead with hashed identifiers and the shared event id', () => {
    const event = buildLeadEvent({
      eventId: 'evt-1',
      leadType: 'sell',
      email: 'Pat@Example.com',
      phone: '(518) 555-0100',
      context,
      eventTime: 1_700_000_000,
    })
    expect(event).toEqual({
      event_name: 'Lead',
      event_time: 1_700_000_000,
      event_id: 'evt-1',
      action_source: 'website',
      event_source_url: 'https://cash4teststripsusa.com/sell',
      user_data: {
        em: [sha('pat@example.com')],
        ph: [sha('15185550100')],
        country: [sha('us')],
        client_ip_address: '203.0.113.9',
        client_user_agent: 'UA/1.0',
        fbp: 'fb.1.111.222',
      },
      custom_data: { lead_type: 'sell' },
    })
  })

  it('never puts a raw phone, email, product or value in the payload', () => {
    // The page URL is left out of the word check: the domain itself is
    // cash4teststripsusa.com, which Meta sees on every pixel hit regardless.
    const { event_source_url, ...rest } = buildLeadEvent({
      eventId: 'e',
      leadType: 'mail_kit',
      email: 'pat@example.com',
      phone: '5185550100',
      context,
    })
    expect(event_source_url).toBe('https://cash4teststripsusa.com/sell')
    const json = JSON.stringify(rest)
    expect(json).not.toContain('pat@example.com')
    expect(json).not.toContain('5185550100')
    expect(json).not.toMatch(/value|currency|content_|strip|dexcom|diabet/i)
  })

  it('omits country when there is no real identifier to go with it', () => {
    const event = buildLeadEvent({ eventId: 'e', leadType: 'bulk', context }) as { user_data: Record<string, unknown> }
    expect(event.user_data.country).toBeUndefined()
    expect(event.user_data.em).toBeUndefined()
  })
})

describe('sendLeadEvent', () => {
  const event = { event_name: 'Lead', event_id: 'evt-9' }

  it('does nothing when the pixel id or token is not configured', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('META_PIXEL_ID', '')
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'test-token')
    expect(await sendLeadEvent(event, true)).toBe('not_configured')
    vi.stubEnv('META_PIXEL_ID', TEST_PIXEL)
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', '')
    expect(await sendLeadEvent(event, true)).toBe('not_configured')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does nothing for a visitor who opted out', async () => {
    configure()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await sendLeadEvent(event, false)).toBe('opted_out')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts to the configured dataset with a timeout, and adds the test code only when set', async () => {
    configure()
    vi.stubEnv('META_CAPI_TEST_EVENT_CODE', 'TEST123')
    const fetchMock = vi.fn(async () => new Response('{"events_received":1}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await sendLeadEvent(event, true)).toBe('sent')

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`https://graph.facebook.com/v22.0/${TEST_PIXEL}/events?access_token=test-token`)
    expect(JSON.parse(String(init.body))).toEqual({ data: [event], test_event_code: 'TEST123' })
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(SEND_TIMEOUT_MS).toBe(3000)

    vi.stubEnv('META_CAPI_TEST_EVENT_CODE', '')
    await sendLeadEvent(event, true)
    expect(JSON.parse(String((fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1].body))).toEqual({ data: [event] })
  })

  it('never throws on a network failure or an error response, and logs no token or body', async () => {
    configure()
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async () => { throw Object.assign(new Error('boom'), { name: 'TimeoutError' }) }))
    expect(await sendLeadEvent(event, true)).toBe('failed')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":{"message":"bad ph 15185550100"}}', { status: 400 })))
    expect(await sendLeadEvent(event, true)).toBe('failed')

    const logged = log.mock.calls.flat().map(String).join('\n')
    expect(logged).toContain('TimeoutError')
    expect(logged).toContain('HTTP 400')
    expect(logged).not.toContain('test-token')
    expect(logged).not.toContain('15185550100')
  })
})

describe('reportLead', () => {
  it('returns a fresh UUID event id even when tracking is not configured', async () => {
    vi.stubEnv('META_PIXEL_ID', '')
    const a = await reportLead(request(), { leadType: 'sell', fallbackPath: '/sell' })
    const b = await reportLead(request(), { leadType: 'sell', fallbackPath: '/sell' })
    expect(a).toMatch(UUID)
    expect(b).toMatch(UUID)
    expect(a).not.toBe(b)
  })

  it('sends the SAME id it returns, so the browser pixel can dedupe against it', async () => {
    configure()
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const eventId = await reportLead(request({ 'user-agent': 'UA' }), {
      leadType: 'bulk',
      email: 'pat@example.com',
      phone: '5185550100',
      fallbackPath: '/sell-test-strips-in-bulk',
    })
    const sent = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body))
    expect(sent.data[0].event_id).toBe(eventId)
    expect(sent.data[0].custom_data).toEqual({ lead_type: 'bulk' })
  })

  it('still returns an id when Meta is down', async () => {
    configure()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down') }))
    expect(await reportLead(request(), { leadType: 'mail_kit', fallbackPath: '/mail-in-kit' })).toMatch(UUID)
  })
})
