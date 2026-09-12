import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Real SMTP sends must never happen from a test run — mock the one function
// that actually talks to the mail server, same precedent as
// lib/__tests__/email.test.ts mocking nodemailer directly. Everything else
// in this route (honeypot handling, lead creation, company lookup) stays real.
const mockSendEmailOrThrow = vi.fn()

beforeEach(() => {
  mockSendEmailOrThrow.mockReset()
  mockSendEmailOrThrow.mockResolvedValue(undefined)
})

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

// The route reads the session so a signed-in seller's lead can be stamped with
// their id. There is no cookie store in a vitest run, so stub the server client
// module: the default is a signed-out visitor, which is exactly how every other
// case in this file behaves today.
const mockGetUser = vi.fn()

// Every insert this stub client is asked to perform, in order. The route hands
// it to createLead ONLY when a session exists, so this array is also the proof
// of which client did the writing.
const serverClientInserts: Array<{ table: string; payload: Record<string, unknown> }> = []

beforeEach(() => {
  mockGetUser.mockReset()
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
  serverClientInserts.length = 0
})

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: () => mockGetUser() },
    // A signed-in lead MUST be inserted through the session-bound client:
    // leads_insert_public checks `user_id = auth.uid()`, and the anon client
    // has no session. There is no real session to bind here, so record the
    // payload and delegate the write to the service-role client — the row
    // still lands, so the read-back and the cleanup below work unchanged,
    // and the recorded payload proves the route routed the insert here.
    from: (table: string) => ({
      insert: (payload: Record<string, unknown>) => {
        serverClientInserts.push({ table, payload })
        return supabaseAdmin.from(table).insert(payload)
      },
    }),
  }),
}))

const { POST } = await import('../route')

const cleanupLeadIds: string[] = []
const cleanupCompanyIds: string[] = []
const cleanupUserIds: string[] = []

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
  // leads.user_id -> auth.users(id) is ON DELETE SET NULL, so the order here
  // does not matter, but the leads above are already gone by this point.
  if (cleanupUserIds.length) {
    for (const userId of cleanupUserIds) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
    }
    cleanupUserIds.length = 0
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

  it('stamps the lead with the signed-in seller\'s id', async () => {
    // A real auth user is required: leads.user_id is a foreign key onto
    // auth.users(id), so a made-up uuid would be rejected by the insert.
    const suffix = Date.now()
    const { data: created, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `leads-route-test-seller-${suffix}@example.com`,
      password: `test-${suffix}-Aa1!`,
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = created!.user!.id
    cleanupUserIds.push(userId)
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null })

    const companyId = await createTestCompany({ phone: '5185550199', active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'sms',
        name: 'Jane Doe',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    cleanupLeadIds.push(body.leadId)

    // The insert went through the session-bound client, not the anon one, and
    // carried the id. Both halves matter: with the anon client auth.uid() is
    // null and leads_insert_public would refuse the row outright.
    expect(serverClientInserts).toHaveLength(1)
    expect(serverClientInserts[0].table).toBe('leads')
    expect(serverClientInserts[0].payload.user_id).toBe(userId)

    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .select('user_id')
      .eq('id', body.leadId)
      .single()
    expect(error).toBeNull()
    expect(lead!.user_id).toBe(userId)
  })

  it('still creates the lead when the session cannot be read', async () => {
    // A broken cookie must never cost us a submission.
    mockGetUser.mockRejectedValue(new Error('cookie jar on fire'))

    const companyId = await createTestCompany({ phone: '5185550199', active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'sms',
        name: 'Jane Doe',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.leadId).toBeDefined()
    cleanupLeadIds.push(body.leadId)

    // No session, so the anon client did the writing — exactly as before this
    // feature existed.
    expect(serverClientInserts).toHaveLength(0)

    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('user_id')
      .eq('id', body.leadId)
      .single()
    expect(lead!.user_id).toBeNull()
  })
})
