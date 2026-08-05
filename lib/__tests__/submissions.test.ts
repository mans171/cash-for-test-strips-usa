import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  validateSubmissionPayload,
  createSubmission,
  approveSubmission,
  rejectSubmission,
} from '@/lib/submissions'

const cleanupCompanySlugs: string[] = []
const cleanupSubmissionIds: string[] = []

afterEach(async () => {
  // Submissions must be deleted before companies: submissions.target_company_id
  // has a foreign key to companies.id, and a pending/approved submission created
  // in a test may still reference the company row being cleaned up here.
  if (cleanupSubmissionIds.length) {
    await supabaseAdmin.from('submissions').delete().in('id', cleanupSubmissionIds)
    cleanupSubmissionIds.length = 0
  }
  if (cleanupCompanySlugs.length) {
    await supabaseAdmin.from('companies').delete().in('slug', cleanupCompanySlugs)
    cleanupCompanySlugs.length = 0
  }
})

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

    const submission = await createSubmission({
      targetCompanyId: existing!.id,
      submittedPhone: '5559990002',
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

  // Note: an integration test that physically deletes the target company while a
  // pending submission still references it is not constructible against this schema.
  // `submissions.target_company_id references companies(id)` has default NO ACTION
  // (no cascade), so Postgres refuses the delete outright (23503 foreign key
  // violation) as long as any submission row points at that company — confirmed
  // empirically. See task-9-report.md for the reproduction and the direct
  // (non-integration) verification that `.select('id').single()` does correctly
  // throw on a zero-row update.
})

describe('rejectSubmission', () => {
  it('marks the submission rejected without touching companies', async () => {
    const submission = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5559990003',
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
