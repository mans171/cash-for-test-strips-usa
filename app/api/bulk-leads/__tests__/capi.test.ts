import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Pure-mock route test: no database, no mail.
const inserted: Record<string, unknown>[] = []
vi.mock('@/lib/supabase', () => {
  const companies = { select: () => companies, eq: () => companies, contains: async () => ({ data: [], error: null }) }
  return {
    supabase: {
      from: (table: string) =>
        table === 'leads'
          ? { insert: async (row: Record<string, unknown>) => (inserted.push(row), { error: null }) }
          : companies,
    },
  }
})
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}))
vi.mock('@/lib/email', () => ({ sendEmail: async () => undefined, escapeHtml: (v: string) => v }))

const { POST } = await import('../route')

const valid = { name: 'Reseller Ray', phone: '518-555-0100', email: 'ray@example.com', state: 'OH', quantity: '400' }
let ip = 0
const request = () =>
  new Request('http://localhost/api/bulk-leads', {
    method: 'POST',
    body: JSON.stringify(valid),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.7.0.${++ip}` },
  })

const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))

beforeEach(() => {
  inserted.length = 0
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

describe('POST /api/bulk-leads → Meta Conversions API', () => {
  it('sends one Lead after the row is saved, with the event id it returns', async () => {
    const res = await POST(request())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(inserted).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const event = JSON.parse(String(init.body)).data[0]
    expect(event.event_id).toBe(json.eventId)
    expect(event.custom_data).toEqual({ lead_type: 'bulk' })
    expect(event.event_source_url).toBe('https://cash4teststripsusa.com/sell-test-strips-in-bulk')
    expect(event.user_data.em).toHaveLength(1)
    expect(event.user_data.ph).toHaveLength(1)
    expect(JSON.stringify(event)).not.toContain('ray@example.com')
  })

  it('still answers ok when Meta is down', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    fetchMock.mockRejectedValueOnce(new Error('network'))
    const res = await POST(request())
    expect(res.status).toBe(200)
    expect(inserted).toHaveLength(1)
  })
})
