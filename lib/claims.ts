import { after } from 'next/server'
import { supabaseAdmin } from './supabase-admin'
import { normalizePhone } from './phone'
import { sendEmail, escapeHtml } from './email'

// Thrown for expected, user-facing business-logic failures (phone mismatch,
// duplicate claim, listing not found) — as opposed to unexpected errors
// (DB failures, etc). Route handlers catch this specifically to surface
// error.message to the caller instead of a generic 500.
export class ClaimValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ClaimValidationError'
  }
}

export type Claim = {
  id: string
  company_id: string
  user_id: string
  submitted_phone: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
}

export type CreateClaimInput = {
  companyId: string
  userId: string
  submittedPhone: string
}

export async function createClaim(input: CreateClaimInput): Promise<Claim> {
  const { data: company, error: lookupError } = await supabaseAdmin
    .from('companies')
    .select('name, phone')
    .eq('id', input.companyId)
    .single()

  if (lookupError || !company) {
    throw new ClaimValidationError('The listing you are trying to claim could not be found')
  }

  const currentPhone = normalizePhone(company.phone ?? '')
  const submittedPhone = normalizePhone(input.submittedPhone)
  if (!currentPhone || currentPhone !== submittedPhone) {
    throw new ClaimValidationError('Phone number does not match this listing')
  }

  const { data: existingClaim } = await supabaseAdmin
    .from('claims')
    .select('id')
    .eq('company_id', input.companyId)
    .eq('user_id', input.userId)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (existingClaim) {
    throw new ClaimValidationError('You already have a pending or approved claim on this listing')
  }

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  // Store the normalized phone (not the raw input) — it's already been verified
  // to match the company's normalized phone above, and normalizing it here means
  // the stored value on the claims row is directly comparable to other normalized
  // phones without a caller having to re-normalize it (e.g. admin UI display).
  const { error } = await supabaseAdmin.from('claims').insert({
    id,
    company_id: input.companyId,
    user_id: input.userId,
    submitted_phone: submittedPhone,
  })

  // Handle unique constraint violation (TOCTOU race on duplicate pending/approved claims)
  // Postgres error code 23505 = unique_violation
  if (error) {
    if (error.code === '23505') {
      throw new ClaimValidationError('You already have a pending or approved claim on this listing')
    }
    throw new Error(`Failed to create claim: ${error.message}`)
  }

  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL
  if (notifyEmail) {
    after(() =>
      sendEmail({
        to: notifyEmail,
        subject: `New listing claim: ${escapeHtml(company.name)}`,
        html: `<p>A buyer submitted a claim on "${escapeHtml(company.name)}" (${escapeHtml(input.submittedPhone)}).</p><p><a href="https://cash4teststripsusa.com/admin">Review it in the admin dashboard</a>.</p>`,
      })
    )
  }

  return {
    id,
    company_id: input.companyId,
    user_id: input.userId,
    submitted_phone: submittedPhone,
    status: 'pending',
    created_at: createdAt,
    reviewed_at: null,
  }
}

async function getPendingClaimWithCompanyName(claimId: string): Promise<{ claim: { id: string; company_id: string; user_id: string }; companyName: string }> {
  const { data: claim, error } = await supabaseAdmin
    .from('claims')
    .select('id, company_id, user_id, status')
    .eq('id', claimId)
    .single()

  if (error || !claim) throw new Error('Claim not found')
  if (claim.status !== 'pending') throw new Error('Claim already reviewed')

  const { data: company } = await supabaseAdmin.from('companies').select('name').eq('id', claim.company_id).single()

  return { claim, companyName: company?.name ?? 'your listing' }
}

// Buyer email isn't stored on profiles — look it up from auth.users. Best-effort:
// if the lookup fails we skip the notification rather than failing the review.
async function notifyBuyer(userId: string, subject: string, html: string): Promise<void> {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
  const email = !error ? data?.user?.email : undefined
  if (!email) return

  after(() => sendEmail({ to: email, subject, html }))
}

export async function approveClaim(claimId: string): Promise<void> {
  const { claim, companyName } = await getPendingClaimWithCompanyName(claimId)

  const { error } = await supabaseAdmin
    .from('claims')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', claimId)
  if (error) throw new Error(`Failed to approve claim: ${error.message}`)

  await notifyBuyer(
    claim.user_id,
    'Your listing claim was approved',
    `<p>Your claim on "${escapeHtml(companyName)}" has been approved. You can now manage this listing from your My Listings dashboard.</p>`
  )
}

export async function rejectClaim(claimId: string): Promise<void> {
  const { claim, companyName } = await getPendingClaimWithCompanyName(claimId)

  const { error } = await supabaseAdmin
    .from('claims')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', claimId)
  if (error) throw new Error(`Failed to reject claim: ${error.message}`)

  await notifyBuyer(
    claim.user_id,
    'Update on your listing claim',
    `<p>Your claim on "${escapeHtml(companyName)}" was not approved. If you think this is a mistake, reply to this email or contact us directly.</p>`
  )
}
