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
  after: (callback: () => void | Promise<void>) => {
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

afterEach(async () => {
  if (cleanupClaimIds.length) {
    await supabaseAdmin.from('claims').delete().in('id', cleanupClaimIds)
    cleanupClaimIds.length = 0
  }
  if (cleanupCompanySlugs.length) {
    await supabaseAdmin.from('companies').delete().in('slug', cleanupCompanySlugs)
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
