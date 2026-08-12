import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClaim, approveClaim, rejectClaim } from '@/lib/claims'

// Mock email module to prevent actual sends and after() errors in tests
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  escapeHtml: (text: string) => text,
}))

// Mock next/server's after() to handle being called outside request scope in tests
vi.mock('next/server', () => ({
  after: () => {
    // no-op in tests; after() doesn't work outside request scope
  },
}))

// createClaim/approveClaim/rejectClaim send fire-and-forget notification
// emails via after() + sendEmail — same precedent as lib/__tests__/submissions.test.ts.
beforeAll(() => {
  vi.stubEnv('ADMIN_NOTIFY_EMAIL', '')
})
afterAll(() => {
  vi.unstubAllEnvs()
})

const cleanupCompanySlugs: string[] = []
const cleanupClaimIds: string[] = []
const cleanupUserIds: string[] = []

// Every fixed slug this file passes to makeCompany() below. A run that
// crashes before afterEach can run leaves these rows behind; the next run's
// insert then collides with the fixed slug. beforeAll self-heals that debris.
const FIXTURE_SLUGS = [
  'claim-phone-guard-co',
  'claim-phone-match-co',
  'claim-dup-pending-co',
  'claim-dup-approved-co',
  'claim-approve-co',
  'claim-reject-co',
  'claim-already-reviewed-co',
]

beforeAll(async () => {
  const { data: debris, error: selectError } = await supabaseAdmin
    .from('companies')
    .select('id, slug')
    .in('slug', FIXTURE_SLUGS)
  if (selectError) {
    throw new Error(`beforeAll debris lookup failed: ${selectError.message}`)
  }
  if (debris && debris.length) {
    const ids = debris.map((row) => row.id)
    console.log(
      `[claims.test] beforeAll: self-healing ${ids.length} leftover fixture compan${ids.length === 1 ? 'y' : 'ies'} from a prior run: ${debris.map((row) => row.slug).join(', ')}`
    )
    // Claims first — they FK-reference companies, and a blocked company
    // delete's error was previously discarded (supabase-js never throws).
    const { error: claimsError } = await supabaseAdmin.from('claims').delete().in('company_id', ids)
    if (claimsError) {
      throw new Error(`beforeAll debris cleanup failed deleting claims: ${claimsError.message}`)
    }
    const { error: companiesError } = await supabaseAdmin.from('companies').delete().in('id', ids)
    if (companiesError) {
      throw new Error(`beforeAll debris cleanup failed deleting companies: ${companiesError.message}`)
    }
  }
})

afterEach(async () => {
  if (cleanupClaimIds.length) {
    await supabaseAdmin.from('claims').delete().in('id', cleanupClaimIds)
    cleanupClaimIds.length = 0
  }
  if (cleanupCompanySlugs.length) {
    // Look up ids first so any claims still referencing these companies
    // (e.g. left behind by a crash) can be cleared before the FK delete,
    // instead of silently blocking it — read every error, never discard it.
    const { data: companies, error: lookupError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .in('slug', cleanupCompanySlugs)
    if (lookupError) {
      console.error('afterEach: failed to look up companies for cleanup:', lookupError.message)
    } else if (companies && companies.length) {
      const ids = companies.map((c) => c.id)
      const { error: claimsError } = await supabaseAdmin.from('claims').delete().in('company_id', ids)
      if (claimsError) {
        console.error('afterEach: failed to delete claims before company cleanup:', claimsError.message)
      }
      const { error: companiesError } = await supabaseAdmin.from('companies').delete().in('id', ids)
      if (companiesError) {
        console.error('afterEach: failed to delete companies:', companiesError.message)
      }
    }
    cleanupCompanySlugs.length = 0
  }
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
})

async function makeBuyer(): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `claims-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'test-password-123',
    email_confirm: true,
  })
  expect(error).toBeNull()
  const userId = data!.user!.id
  cleanupUserIds.push(userId)
  await supabaseAdmin.from('profiles').insert({
    id: userId,
    role: 'buyer',
    name: 'Test Buyer',
    phone: '5551230000',
    address_street: '1 Test Ave',
    address_city: 'Troy',
    address_state: 'NY',
    address_zip: '12180',
  })
  return userId
}

async function makeCompany(slug: string, phone: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('companies')
    .insert({ name: `Test ${slug}`, slug, states: ['NY'], active: true, phone })
    .select('id')
    .single()
  cleanupCompanySlugs.push(slug)
  return data!.id
}

describe('createClaim', () => {
  it('rejects a claim whose submittedPhone does not match the company phone', async () => {
    const userId = await makeBuyer()
    const companyId = await makeCompany('claim-phone-guard-co', '5559990501')

    await expect(
      createClaim({ companyId, userId, submittedPhone: '5559990502' })
    ).rejects.toThrow('Phone number does not match this listing')
  })

  it('creates a pending claim when the submittedPhone matches (ignoring formatting)', async () => {
    const userId = await makeBuyer()
    const companyId = await makeCompany('claim-phone-match-co', '5559990601')

    const claim = await createClaim({ companyId, userId, submittedPhone: '(555) 999-0601' })
    cleanupClaimIds.push(claim.id)

    expect(claim.status).toBe('pending')
    expect(claim.company_id).toBe(companyId)
    expect(claim.user_id).toBe(userId)
    // submitted_phone is stored normalized (digits only), not the raw formatted input.
    expect(claim.submitted_phone).toBe('5559990601')
  })

  it('rejects a duplicate pending claim from the same user on the same company', async () => {
    const userId = await makeBuyer()
    const companyId = await makeCompany('claim-dup-pending-co', '5559990701')

    const first = await createClaim({ companyId, userId, submittedPhone: '5559990701' })
    cleanupClaimIds.push(first.id)

    await expect(
      createClaim({ companyId, userId, submittedPhone: '5559990701' })
    ).rejects.toThrow('You already have a pending or approved claim on this listing')
  })

  it('rejects a duplicate claim when the prior one is already approved', async () => {
    const userId = await makeBuyer()
    const companyId = await makeCompany('claim-dup-approved-co', '5559990801')

    const first = await createClaim({ companyId, userId, submittedPhone: '5559990801' })
    cleanupClaimIds.push(first.id)
    await approveClaim(first.id)

    await expect(
      createClaim({ companyId, userId, submittedPhone: '5559990801' })
    ).rejects.toThrow('You already have a pending or approved claim on this listing')
  })
})

describe('approveClaim / rejectClaim', () => {
  it('approveClaim sets status to approved with a reviewed_at timestamp', async () => {
    const userId = await makeBuyer()
    const companyId = await makeCompany('claim-approve-co', '5559990901')
    const claim = await createClaim({ companyId, userId, submittedPhone: '5559990901' })
    cleanupClaimIds.push(claim.id)

    await approveClaim(claim.id)

    const { data: updated } = await supabaseAdmin
      .from('claims')
      .select('status, reviewed_at')
      .eq('id', claim.id)
      .single()
    expect(updated?.status).toBe('approved')
    expect(updated?.reviewed_at).not.toBeNull()
  })

  it('rejectClaim sets status to rejected with a reviewed_at timestamp', async () => {
    const userId = await makeBuyer()
    const companyId = await makeCompany('claim-reject-co', '5559991001')
    const claim = await createClaim({ companyId, userId, submittedPhone: '5559991001' })
    cleanupClaimIds.push(claim.id)

    await rejectClaim(claim.id)

    const { data: updated } = await supabaseAdmin
      .from('claims')
      .select('status, reviewed_at')
      .eq('id', claim.id)
      .single()
    expect(updated?.status).toBe('rejected')
    expect(updated?.reviewed_at).not.toBeNull()
  })

  it('approveClaim throws when the claim is already reviewed', async () => {
    const userId = await makeBuyer()
    const companyId = await makeCompany('claim-already-reviewed-co', '5559991101')
    const claim = await createClaim({ companyId, userId, submittedPhone: '5559991101' })
    cleanupClaimIds.push(claim.id)
    await approveClaim(claim.id)

    await expect(approveClaim(claim.id)).rejects.toThrow('Claim already reviewed')
  })
})
