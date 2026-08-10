import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  validateSubmissionPayload,
  createSubmission,
  approveSubmission,
  rejectSubmission,
} from '@/lib/submissions'

// createSubmission/approveSubmission/rejectSubmission now send fire-and-forget
// notification emails (Task 7). ADMIN_NOTIFY_EMAIL is set to a real inbox in
// .env.local (which vitest.config.mts loads into process.env), so without this
// stub every createSubmission call in this suite would attempt to send a real
// admin-notification email. Test fixtures never set payload.email, so the
// buyer-facing sends in approveSubmission/rejectSubmission are already inert.
beforeAll(() => {
  vi.stubEnv('ADMIN_NOTIFY_EMAIL', '')
})
afterAll(() => {
  vi.unstubAllEnvs()
})

const cleanupCompanySlugs: string[] = []
const cleanupSubmissionIds: string[] = []
const cleanupClaimIds: string[] = []
const cleanupUserIds: string[] = []

afterEach(async () => {
  // Submissions and claims must be deleted before companies: both have FKs to
  // companies.id, and a pending/approved submission or claim created in a test
  // may still reference the company row being cleaned up here.
  if (cleanupSubmissionIds.length) {
    await supabaseAdmin.from('submissions').delete().in('id', cleanupSubmissionIds)
    cleanupSubmissionIds.length = 0
  }
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

// Edits now require an authenticated buyer with an approved claim on the
// target company (Finding 5 — the anonymous phone-match fallback was removed).
async function makeApprovedBuyerForCompany(companyId: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `submissions-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'test-password-123',
    email_confirm: true,
  })
  expect(error).toBeNull()
  const userId = data!.user!.id
  cleanupUserIds.push(userId)

  const { data: claim } = await supabaseAdmin
    .from('claims')
    .insert({ company_id: companyId, user_id: userId, submitted_phone: '0000000000', status: 'approved', reviewed_at: new Date().toISOString() })
    .select('id')
    .single()
  cleanupClaimIds.push(claim!.id)

  return userId
}

describe('validateSubmissionPayload', () => {
  it('requires a name', () => {
    const result = validateSubmissionPayload({ name: '', states: ['NY'], phone: '5551234567' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Business name is required')
  })

  it('requires at least one contact method', () => {
    const result = validateSubmissionPayload({ name: 'Test Co', states: ['NY'] })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one contact method (phone or email) is required')
  })

  it('requires at least one valid state', () => {
    const result = validateSubmissionPayload({ name: 'Test Co', states: [], phone: '5551234567' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one state is required')
  })

  it('rejects invalid state codes', () => {
    const result = validateSubmissionPayload({ name: 'Test Co', states: ['ZZ'], phone: '5551234567' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid state code: ZZ')
  })

  it('accepts a valid payload', () => {
    const result = validateSubmissionPayload({ name: 'Test Co', states: ['NY'], phone: '5551234567' })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
})

describe('createSubmission + approveSubmission (new buyer)', () => {
  it('creates a pending submission, then approving it inserts a new active company', async () => {
    const submission = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5559990001',
      submittedByUserId: null,
      payload: { name: 'Test New Buyer Co', states: ['NY'], phone: '5559990001' },
    })
    cleanupSubmissionIds.push(submission.id)
    expect(submission.status).toBe('pending')

    await approveSubmission(submission.id)

    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name, active, slug')
      .eq('phone', '5559990001')
      .single()
    expect(company?.name).toBe('Test New Buyer Co')
    expect(company?.active).toBe(true)
    if (company) cleanupCompanySlugs.push(company.slug)

    const { data: updatedSubmission } = await supabaseAdmin
      .from('submissions')
      .select('status, reviewed_at')
      .eq('id', submission.id)
      .single()
    expect(updatedSubmission?.status).toBe('approved')
    expect(updatedSubmission?.reviewed_at).not.toBeNull()
  })
})

describe('createSubmission + approveSubmission (edit existing buyer)', () => {
  it('applies the payload onto the target company', async () => {
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test Edit Target Co', slug: 'test-edit-target-co', states: ['NY'], active: true, phone: '5559990002' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(existing!.slug)
    const userId = await makeApprovedBuyerForCompany(existing!.id)

    const submission = await createSubmission({
      targetCompanyId: existing!.id,
      submittedPhone: '5559990002',
      submittedByUserId: userId,
      payload: { name: 'Test Edit Target Co', states: ['NY', 'NJ'], phone: '5559990099' },
    })
    cleanupSubmissionIds.push(submission.id)

    await approveSubmission(submission.id)

    const { data: updated } = await supabaseAdmin
      .from('companies')
      .select('states, phone')
      .eq('id', existing!.id)
      .single()
    expect(updated?.phone).toBe('5559990099')
    expect(updated?.states).toEqual(['NY', 'NJ'])
  })

  it('the FK constraint prevents deleting a company a pending submission still targets', async () => {
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test FK Target Co', slug: 'test-fk-target-co', states: ['NY'], active: true, phone: '5559990098' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(existing!.slug)
    const userId = await makeApprovedBuyerForCompany(existing!.id)

    const submission = await createSubmission({
      targetCompanyId: existing!.id,
      submittedPhone: '5559990098',
      submittedByUserId: userId,
      payload: { name: 'Test FK Target Co', states: ['NY'], phone: '5559990098' },
    })
    cleanupSubmissionIds.push(submission.id)

    const { error } = await supabaseAdmin.from('companies').delete().eq('id', existing!.id)
    expect(error).not.toBeNull()
    expect(error?.code).toBe('23503')
  })
})

describe('createSubmission requires an approved claim for edits', () => {
  it('rejects an edit submission with no submittedByUserId, even when the phone matches', async () => {
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test Phone Guard Co', slug: 'test-phone-guard-co', states: ['NY'], active: true, phone: '5559990201' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(existing!.slug)

    // The anonymous phone-match fallback was removed: /buyer is fully login-gated
    // now, so an edit with no authenticated submitter must always be rejected,
    // regardless of whether submittedPhone happens to match the listing.
    await expect(
      createSubmission({
        targetCompanyId: existing!.id,
        submittedPhone: '5559990201', // matches the company's real phone
        submittedByUserId: null,
        payload: { name: 'Test Phone Guard Co', states: ['NY'], phone: '5559990201' },
      })
    ).rejects.toThrow('You must be logged in with an approved claim to edit this listing')
  })
})

describe('approveSubmission slug collision handling', () => {
  it('creates both companies with different slugs when their names slugify identically', async () => {
    // Multiple live DB round trips (2 creates + 2 approves) — needs more than the default 5s.
    const submissionA = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5559990401',
      submittedByUserId: null,
      payload: { name: 'Slug Collision Co', states: ['NY'], phone: '5559990401' },
    })
    cleanupSubmissionIds.push(submissionA.id)

    const submissionB = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5559990402',
      submittedByUserId: null,
      payload: { name: 'Slug Collision Co', states: ['NY'], phone: '5559990402' },
    })
    cleanupSubmissionIds.push(submissionB.id)

    await approveSubmission(submissionA.id)
    await approveSubmission(submissionB.id)

    const { data: companyA } = await supabaseAdmin
      .from('companies')
      .select('id, slug')
      .eq('phone', '5559990401')
      .single()
    const { data: companyB } = await supabaseAdmin
      .from('companies')
      .select('id, slug')
      .eq('phone', '5559990402')
      .single()

    expect(companyA?.slug).toBeTruthy()
    expect(companyB?.slug).toBeTruthy()
    expect(companyA?.slug).not.toBe(companyB?.slug)

    if (companyA) cleanupCompanySlugs.push(companyA.slug)
    if (companyB) cleanupCompanySlugs.push(companyB.slug)
  }, 15000)
})

describe('rejectSubmission', () => {
  it('marks the submission rejected without touching companies', async () => {
    const submission = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5559990003',
      submittedByUserId: null,
      payload: { name: 'Test Rejected Co', states: ['NY'], phone: '5559990003' },
    })
    cleanupSubmissionIds.push(submission.id)

    await rejectSubmission(submission.id)

    const { data: updatedSubmission } = await supabaseAdmin
      .from('submissions')
      .select('status')
      .eq('id', submission.id)
      .single()
    expect(updatedSubmission?.status).toBe('rejected')

    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('phone', '5559990003')
    expect(company).toEqual([])
  })
})

describe('createSubmission owner-relaxed phone check', () => {
  const cleanupUserIds: string[] = []
  const cleanupClaimIds: string[] = []

  afterEach(async () => {
    if (cleanupClaimIds.length) {
      await supabaseAdmin.from('claims').delete().in('id', cleanupClaimIds)
      cleanupClaimIds.length = 0
    }
    for (const id of cleanupUserIds) {
      await supabaseAdmin.auth.admin.deleteUser(id)
    }
    cleanupUserIds.length = 0
  })

  async function makeBuyer(): Promise<string> {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: `submissions-owner-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    expect(error).toBeNull()
    const userId = data!.user!.id
    cleanupUserIds.push(userId)
    return userId
  }

  it('skips the phone-match check when the submitter has an approved claim, even if the phone is wrong', async () => {
    const userId = await makeBuyer()
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test Owner Edit Co', slug: 'test-owner-edit-co', states: ['NY'], active: true, phone: '5559992001' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(existing!.slug)

    const { data: claim } = await supabaseAdmin
      .from('claims')
      .insert({ company_id: existing!.id, user_id: userId, submitted_phone: '5559992001', status: 'approved', reviewed_at: new Date().toISOString() })
      .select('id')
      .single()
    cleanupClaimIds.push(claim!.id)

    const submission = await createSubmission({
      targetCompanyId: existing!.id,
      submittedPhone: 'this-does-not-match-anything',
      submittedByUserId: userId,
      payload: { name: 'Test Owner Edit Co', states: ['NY', 'NJ'], phone: '5559992001' },
    })
    cleanupSubmissionIds.push(submission.id)
    expect(submission.status).toBe('pending')
  })

  it('rejects an edit from an authenticated buyer with no approved claim on that company', async () => {
    const userId = await makeBuyer()
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test No Claim Co', slug: 'test-no-claim-co', states: ['NY'], active: true, phone: '5559992101' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(existing!.slug)

    await expect(
      createSubmission({
        targetCompanyId: existing!.id,
        submittedPhone: '5559992101',
        submittedByUserId: userId,
        payload: { name: 'Test No Claim Co', states: ['NY'], phone: '5559992101' },
      })
    ).rejects.toThrow('You do not have an approved claim on this listing')
  })

  it('rejects an edit when submittedByUserId is absent (unauthenticated caller) regardless of phone', async () => {
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test Anon Edit Co', slug: 'test-anon-edit-co', states: ['NY'], active: true, phone: '5559992201' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(existing!.slug)

    await expect(
      createSubmission({
        targetCompanyId: existing!.id,
        submittedPhone: 'wrong-phone',
        submittedByUserId: null,
        payload: { name: 'Test Anon Edit Co', states: ['NY'], phone: '5559992201' },
      })
    ).rejects.toThrow('You must be logged in with an approved claim to edit this listing')
  })
})

describe('approveSubmission auto-claim', () => {
  const cleanupUserIds: string[] = []
  const cleanupClaimIds: string[] = []

  afterEach(async () => {
    if (cleanupClaimIds.length) {
      await supabaseAdmin.from('claims').delete().in('id', cleanupClaimIds)
      cleanupClaimIds.length = 0
    }
    for (const id of cleanupUserIds) {
      await supabaseAdmin.auth.admin.deleteUser(id)
    }
    cleanupUserIds.length = 0
  })

  async function makeBuyer(): Promise<string> {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: `submissions-autoclaim-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    expect(error).toBeNull()
    const userId = data!.user!.id
    cleanupUserIds.push(userId)
    return userId
  }

  it('inserts an approved claim for a new-listing submission with submittedByUserId set', async () => {
    const userId = await makeBuyer()
    const submission = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5559993001',
      submittedByUserId: userId,
      payload: { name: 'Test Autoclaim Co', states: ['NY'], phone: '5559993001' },
    })
    cleanupSubmissionIds.push(submission.id)

    await approveSubmission(submission.id)

    const { data: company } = await supabaseAdmin.from('companies').select('id, slug').eq('phone', '5559993001').single()
    if (company) cleanupCompanySlugs.push(company.slug)

    const { data: claim } = await supabaseAdmin
      .from('claims')
      .select('id, status, company_id, user_id')
      .eq('company_id', company!.id)
      .eq('user_id', userId)
      .single()
    expect(claim?.status).toBe('approved')

    await supabaseAdmin.from('claims').delete().eq('id', claim!.id)
  })

  it('does not insert a claim for a new-listing submission with no submittedByUserId', async () => {
    const submission = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5559993101',
      submittedByUserId: null,
      payload: { name: 'Test No Autoclaim Co', states: ['NY'], phone: '5559993101' },
    })
    cleanupSubmissionIds.push(submission.id)

    await approveSubmission(submission.id)

    const { data: company } = await supabaseAdmin.from('companies').select('id, slug').eq('phone', '5559993101').single()
    if (company) cleanupCompanySlugs.push(company.slug)

    const { data: claims } = await supabaseAdmin.from('claims').select('id').eq('company_id', company!.id)
    expect(claims).toEqual([])
  })
})
