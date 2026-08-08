import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'

// createServerSupabaseClient calls next/headers `cookies()`, which requires
// a real Next.js request scope that doesn't exist when a route handler is
// invoked directly in a unit test. Mock it so these tests exercise the
// route's own logic; getUser defaults to an authenticated session (reset
// every test in beforeEach, so test order never matters).
const mockGetUser = vi.fn<
  () => Promise<{ data: { user: { id: string; email: string } | null } }>
>()

// Real SMTP sends must never happen from a test run — mock the one function
// that actually talks to the mail server, same precedent as
// lib/__tests__/email.test.ts mocking nodemailer directly. Everything else
// in this route (session check, lead creation, company lookup) stays real.
const mockSendEmailOrThrow = vi.fn()

beforeEach(() => {
  mockGetUser.mockReset()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id', email: 'jane@example.com' } } })
  mockSendEmailOrThrow.mockReset()
  mockSendEmailOrThrow.mockResolvedValue(undefined)
})

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}))

// message-template.ts imports escapeHtml from this same module, so the mock
// must preserve the real implementation via importOriginal rather than
// replacing the whole module — only sendEmailOrThrow needs to be faked out.
vi.mock('@/lib/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/email')>()
  return {
    ...actual,
    sendEmailOrThrow: (...args: unknown[]) => mockSendEmailOrThrow(...args),
  }
})

const { POST } = await import('../route')

const cleanupLeadIds: string[] = []
const cleanupCompanyIds: string[] = []

// Naming pattern shared with createTestCompany below — used both to build
// each row's slug and as the LIKE prefix for the safety-net cleanup.
const TEST_COMPANY_SLUG_PREFIX = 'leads-route-test-co-'

afterEach(async () => {
  if (cleanupLeadIds.length) {
    await supabaseAdmin.from('leads').delete().in('id', cleanupLeadIds)
    cleanupLeadIds.length = 0
  }
  if (cleanupCompanyIds.length) {
    await supabaseAdmin.from('companies').delete().in('id', cleanupCompanyIds)
    cleanupCompanyIds.length = 0
  }
  // Safety net: an interrupted prior run may have left a stray row behind
  // (created but never reaching the cleanup above, e.g. process killed
  // mid-test). Sweep anything matching this test file's naming pattern so
  // it never sits around live — createTestCompany defaults new rows to
  // active: false unless a test opts in, but this catches any leftover.
  //
  // leads.matched_company_id -> companies(id) has no ON DELETE clause
  // (defaults to NO ACTION), so a company with a dependent lead can't be
  // deleted until that lead is deleted first. Look up the matching company
  // ids, delete any leads pointing at them, then delete the companies.
  const { data: staleCompanies, error: staleLookupError } = await supabaseAdmin
    .from('companies')
    .select('id')
    .like('slug', `${TEST_COMPANY_SLUG_PREFIX}%`)
  expect(staleLookupError).toBeNull()
  const staleCompanyIds = (staleCompanies ?? []).map((c) => c.id)
  if (staleCompanyIds.length) {
    const { error: staleLeadsError } = await supabaseAdmin
      .from('leads')
      .delete()
      .in('matched_company_id', staleCompanyIds)
    expect(staleLeadsError).toBeNull()
  }
  const { error: staleCompaniesError } = await supabaseAdmin
    .from('companies')
    .delete()
    .like('slug', `${TEST_COMPANY_SLUG_PREFIX}%`)
  expect(staleCompaniesError).toBeNull()
})

async function createTestCompany(overrides: { email?: string | null; phone?: string | null; active?: boolean } = {}) {
  const suffix = Date.now()
  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert({
      name: `Leads Route Test Co ${suffix}`,
      slug: `${TEST_COMPANY_SLUG_PREFIX}${suffix}`,
      email: overrides.email === undefined ? `buyer-test-${suffix}@example.com` : overrides.email,
      phone: overrides.phone === undefined ? '5185550100' : overrides.phone,
      // Default to inactive so a test buyer is never live/discoverable even
      // if cleanup is skipped (interrupted run) — it must not appear on
      // /directory or in real /api/sell/match results, both of which filter
      // active=true. Tests that need the route to find the buyer (i.e. that
      // exercise the "buyer found" path) must explicitly pass active: true.
      active: overrides.active ?? false,
    })
    .select('id')
    .single()
  expect(error).toBeNull()
  const companyId = data!.id
  cleanupCompanyIds.push(companyId)
  return companyId
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/leads', () => {
  it('returns 401 when there is no session', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        channel: 'email',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(401)
  })

  it('returns 400 when items is empty', async () => {
    const response = await POST(
      makeRequest({ items: [], matchedCompanyId: 'irrelevant', channel: 'email', name: 'Jane Doe' })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when matchedCompanyId is missing', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        channel: 'email',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when channel is missing', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 for an invalid channel', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        channel: 'carrier-pigeon',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when name is missing', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        channel: 'email',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when name is blank', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        channel: 'email',
        name: '   ',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when channel is email and the matched buyer has no email on file', async () => {
    const companyId = await createTestCompany({ email: null, active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'email',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
    expect(mockSendEmailOrThrow).not.toHaveBeenCalled()
  })

  it('returns 400 when channel is sms and the matched buyer has no phone on file', async () => {
    const companyId = await createTestCompany({ phone: null, active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'sms',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when the matched buyer does not exist', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: '00000000-0000-0000-0000-000000000000',
        channel: 'email',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('creates a lead and emails the buyer, CC-ing the owner, for channel email', async () => {
    const companyId = await createTestCompany({ email: 'buyer-real@example.com', active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'email',
        sourcePage: '/sell',
        name: 'Jane Doe',
        phone: '5551234567',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.leadId).toBeDefined()
    expect(body.message).toBeUndefined()
    cleanupLeadIds.push(body.leadId)

    expect(mockSendEmailOrThrow).toHaveBeenCalledTimes(1)
    const callArgs = mockSendEmailOrThrow.mock.calls[0][0]
    expect(callArgs.to).toBe('buyer-real@example.com')
    expect(callArgs.cc).toBe('feldon.richards@gmail.com')
    expect(callArgs.subject).toContain('Jane Doe')
    expect(callArgs.html).toContain('OneTouch Verio')
  })

  it('creates a lead and returns a message for channel sms without sending an email', async () => {
    const companyId = await createTestCompany({ phone: '5185550199', active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'sms',
        sourcePage: '/sell',
        name: 'Jane Doe',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.leadId).toBeDefined()
    cleanupLeadIds.push(body.leadId)

    expect(body.message).toContain('Jane Doe')
    expect(body.message).toContain('OneTouch Verio')
    expect(mockSendEmailOrThrow).not.toHaveBeenCalled()
  })

  it('returns 500 and does not lose the lead when the email send fails', async () => {
    mockSendEmailOrThrow.mockRejectedValueOnce(new Error('SMTP down'))
    const companyId = await createTestCompany({ email: 'buyer-real@example.com', active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'email',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(500)

    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('matched_company_id', companyId)
    for (const lead of leads ?? []) cleanupLeadIds.push(lead.id)
    expect(leads?.length).toBe(1)
  })
})
