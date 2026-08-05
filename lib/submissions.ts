import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import { VALID_STATE_CODES } from './states'
import type { SubmissionPayload } from './types'

export function validateSubmissionPayload(payload: SubmissionPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!payload.name || payload.name.trim().length === 0) {
    errors.push('Business name is required')
  }
  if (!payload.phone && !payload.email) {
    errors.push('At least one contact method (phone or email) is required')
  }
  if (!payload.states || payload.states.length === 0) {
    errors.push('At least one state is required')
  } else {
    for (const state of payload.states) {
      if (!VALID_STATE_CODES.has(state)) {
        errors.push(`Invalid state code: ${state}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export type CreateSubmissionInput = {
  targetCompanyId: string | null
  payload: SubmissionPayload
  submittedPhone: string
}

export type Submission = {
  id: string
  target_company_id: string | null
  payload: SubmissionPayload
  submitted_phone: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
}

export async function createSubmission(input: CreateSubmissionInput): Promise<Submission> {
  const validation = validateSubmissionPayload(input.payload)
  if (!validation.valid) {
    throw new Error(`Invalid submission: ${validation.errors.join(', ')}`)
  }

  // Generate the id client-side and insert it explicitly rather than relying on
  // `.select()`/RETURNING: Postgres RLS governs RETURNING through SELECT policies,
  // and anon intentionally has no SELECT policy on submissions (write-only, by design).
  // `.insert().select()` would fail outright even though the bare insert succeeds.
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const { error } = await supabase.from('submissions').insert({
    id,
    target_company_id: input.targetCompanyId,
    payload: input.payload,
    submitted_phone: input.submittedPhone,
  })

  if (error) throw new Error(`Failed to create submission: ${error.message}`)

  return {
    id,
    target_company_id: input.targetCompanyId,
    payload: input.payload,
    submitted_phone: input.submittedPhone,
    status: 'pending',
    created_at: createdAt,
    reviewed_at: null,
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function approveSubmission(submissionId: string): Promise<void> {
  const { data: submission, error: fetchError } = await supabaseAdmin
    .from('submissions')
    .select('id, target_company_id, payload, status')
    .eq('id', submissionId)
    .single()

  if (fetchError || !submission) throw new Error('Submission not found')
  if (submission.status !== 'pending') throw new Error('Submission already reviewed')

  const payload = submission.payload as SubmissionPayload
  const companyData = {
    name: payload.name,
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    url: payload.url ?? null,
    city: payload.city ?? null,
    owner_name: payload.owner_name ?? null,
    states: payload.states,
    payment_methods: payload.payment_methods ?? [],
    accepted_brands: payload.accepted_brands ?? [],
    description: payload.description ?? null,
    active: true,
  }

  if (submission.target_company_id) {
    const { error } = await supabaseAdmin
      .from('companies')
      .update(companyData)
      .eq('id', submission.target_company_id)
    if (error) throw new Error(`Failed to update company: ${error.message}`)
  } else {
    const { error } = await supabaseAdmin
      .from('companies')
      .insert({ ...companyData, slug: slugify(payload.name) })
    if (error) throw new Error(`Failed to create company: ${error.message}`)
  }

  const { error: statusError } = await supabaseAdmin
    .from('submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
  if (statusError) throw new Error(`Failed to update submission status: ${statusError.message}`)
}

export async function rejectSubmission(submissionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('submissions')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
  if (error) throw new Error(`Failed to reject submission: ${error.message}`)
}
