import { after } from 'next/server'
import { supabaseAdmin } from './supabase-admin'
import { VALID_STATE_CODES } from './states'
import type { SubmissionPayload } from './types'
import { sendEmail, escapeHtml } from './email'

// Thrown for expected, user-facing business-logic failures (no approved
// claim, listing not found, must be logged in) — as opposed to unexpected
// errors (DB failures, etc). Route handlers catch this specifically to
// surface error.message to the caller instead of a generic 500.
export class SubmissionValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SubmissionValidationError'
  }
}

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
    if (payload.states.length > 50) {
      errors.push('Too many states submitted')
    }
    for (const state of payload.states) {
      if (!VALID_STATE_CODES.has(state)) {
        errors.push(`Invalid state code: ${state}`)
      }
    }
  }

  if (payload.payment_methods && payload.payment_methods.length > 50) {
    errors.push('Too many payment methods submitted')
  }
  if (payload.accepted_brands && payload.accepted_brands.length > 50) {
    errors.push('Too many accepted brands submitted')
  }

  return { valid: errors.length === 0, errors }
}

export type CreateSubmissionInput = {
  targetCompanyId: string | null
  payload: SubmissionPayload
  submittedPhone: string
  submittedByUserId: string | null
}

export type Submission = {
  id: string
  target_company_id: string | null
  payload: SubmissionPayload
  submitted_phone: string
  submitted_by_user_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
}

export async function createSubmission(input: CreateSubmissionInput): Promise<Submission> {
  const validation = validateSubmissionPayload(input.payload)
  if (!validation.valid) {
    throw new SubmissionValidationError(`Invalid submission: ${validation.errors.join(', ')}`)
  }

  // Security: when this submission is an edit targeting an existing company,
  // verify the submitter actually owns it. This requires an authenticated
  // buyer (submittedByUserId set) with an approved claim on that company —
  // /buyer is now fully login-gated, so there is no legitimate anonymous edit
  // path anymore. Anonymous phone-match "verification" used to be accepted as
  // a fallback, but company phone numbers are visible to any logged-in
  // customer account, so it wasn't much of a barrier — closed entirely.
  if (input.targetCompanyId) {
    const { data: targetCompany, error: lookupError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('id', input.targetCompanyId)
      .single()

    if (lookupError || !targetCompany) {
      throw new SubmissionValidationError('The listing you are trying to edit could not be found')
    }

    if (!input.submittedByUserId) {
      throw new SubmissionValidationError('You must be logged in with an approved claim to edit this listing')
    }

    const { data: approvedClaim } = await supabaseAdmin
      .from('claims')
      .select('id')
      .eq('company_id', input.targetCompanyId)
      .eq('user_id', input.submittedByUserId)
      .eq('status', 'approved')
      .maybeSingle()

    if (!approvedClaim) {
      throw new SubmissionValidationError('You do not have an approved claim on this listing')
    }
  }

  // Generate the id client-side and insert it explicitly rather than relying on
  // `.select()`/RETURNING: Postgres RLS governs RETURNING through SELECT policies,
  // and anon intentionally has no SELECT policy on submissions (write-only, by design).
  // `.insert().select()` would fail outright even though the bare insert succeeds.
  //
  // Uses supabaseAdmin (service role) rather than the anon client: anon has no
  // INSERT policy on submissions at all now (see the migration dropping
  // submissions_insert_anon), since the anon key is public and an anon
  // insert-only policy let anyone bypass the phone-ownership check above by
  // POSTing directly to Supabase's REST API. createSubmission is only ever
  // called from the server-only /api/submissions route handler, so writing
  // through the service-role client here is safe.
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const { error } = await supabaseAdmin.from('submissions').insert({
    id,
    target_company_id: input.targetCompanyId,
    payload: input.payload,
    submitted_phone: input.submittedPhone,
    submitted_by_user_id: input.submittedByUserId,
  })

  if (error) throw new Error(`Failed to create submission: ${error.message}`)

  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL
  if (notifyEmail) {
    // sendEmail() already swallows its own errors — awaiting it here only
    // makes the caller (a customer or admin) wait on Gmail's SMTP round
    // trip for a notification email that's best-effort by design. Defer it
    // with after() so the response returns immediately; Vercel keeps the
    // function alive until the send finishes instead of risking it getting
    // cut off mid-send the way a bare fire-and-forget would.
    after(() =>
      sendEmail({
        to: notifyEmail,
        subject: `New ${input.targetCompanyId ? 'edit' : 'buyer'} submission: ${escapeHtml(input.payload.name)}`,
        html: `<p>${escapeHtml(input.payload.name)} (${escapeHtml(input.submittedPhone)}) submitted ${input.targetCompanyId ? 'an edit to their listing' : 'a new buyer profile'}.</p><p><a href="https://cash4teststripsusa.com/admin">Review it in the admin dashboard</a>.</p>`,
      })
    )
  }

  return {
    id,
    target_company_id: input.targetCompanyId,
    payload: input.payload,
    submitted_phone: input.submittedPhone,
    submitted_by_user_id: input.submittedByUserId,
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

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6)
}

function baseSlugFor(name: string): string {
  const slug = slugify(name)
  return slug.length > 0 ? slug : `buyer-${randomSuffix()}`
}

export async function approveSubmission(submissionId: string): Promise<void> {
  const { data: submission, error: fetchError } = await supabaseAdmin
    .from('submissions')
    .select('id, target_company_id, payload, status, submitted_phone, submitted_by_user_id')
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

  let newCompanyId: string | null = null

  if (submission.target_company_id) {
    const { error } = await supabaseAdmin
      .from('companies')
      .update(companyData)
      .eq('id', submission.target_company_id)
      .select('id')
      .single()
    if (error) throw new Error(`Failed to update company: ${error.message}`)
  } else {
    const slug = baseSlugFor(payload.name)
    const { data: inserted, error } = await supabaseAdmin
      .from('companies')
      .insert({ ...companyData, slug })
      .select('id')
      .single()

    if (error) {
      // Postgres unique_violation on companies.slug: retry once with a random
      // suffix appended rather than failing the whole approval (two buyers with
      // the same/similar name, or a name that slugifies to an empty string,
      // would otherwise leave the submission stuck in `pending` forever).
      if (error.code === '23505') {
        const retrySlug = `${slug}-${randomSuffix()}`
        const { data: retryInserted, error: retryError } = await supabaseAdmin
          .from('companies')
          .insert({ ...companyData, slug: retrySlug })
          .select('id')
          .single()
        if (retryError) throw new Error(`Failed to create company: ${retryError.message}`)
        newCompanyId = retryInserted!.id
      } else {
        throw new Error(`Failed to create company: ${error.message}`)
      }
    } else {
      newCompanyId = inserted!.id
    }
  }

  const { error: statusError } = await supabaseAdmin
    .from('submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
  if (statusError) throw new Error(`Failed to update submission status: ${statusError.message}`)

  // Auto-claim: a brand-new listing submitted by an authenticated buyer becomes
  // that buyer's approved claim the moment it goes live — no separate claim step.
  // Edits to an existing company never reach here with a fresh company id, so this
  // only fires for genuinely new listings.
  if (newCompanyId && submission.submitted_by_user_id) {
    const { error: claimError } = await supabaseAdmin.from('claims').insert({
      company_id: newCompanyId,
      user_id: submission.submitted_by_user_id,
      submitted_phone: submission.submitted_phone,
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    })
    if (claimError) throw new Error(`Failed to auto-claim new listing: ${claimError.message}`)
  }

  if (payload.email) {
    after(() =>
      sendEmail({
        to: payload.email!,
        subject: 'Your listing is live on Cash4TestStripsUSA',
        html: `<p>Hi ${escapeHtml(payload.owner_name ?? payload.name)},</p><p>Your listing "${escapeHtml(payload.name)}" is now live on Cash4TestStripsUSA. Customers in your area can find and contact you.</p>`,
      })
    )
  }
}

export async function rejectSubmission(submissionId: string): Promise<void> {
  const { data: submission } = await supabaseAdmin
    .from('submissions')
    .select('payload')
    .eq('id', submissionId)
    .single()

  const { error } = await supabaseAdmin
    .from('submissions')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
  if (error) throw new Error(`Failed to reject submission: ${error.message}`)

  const payload = submission?.payload as SubmissionPayload | undefined
  if (payload?.email) {
    after(() =>
      sendEmail({
        to: payload.email!,
        subject: 'Update on your Cash4TestStripsUSA submission',
        html: `<p>Hi ${escapeHtml(payload.owner_name ?? payload.name)},</p><p>Your recent submission to Cash4TestStripsUSA was not approved. If you think this is a mistake, reply to this email or contact us directly.</p>`,
      })
    )
  }
}
