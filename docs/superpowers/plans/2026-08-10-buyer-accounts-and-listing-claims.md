# Buyer Accounts & Listing Claims Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/buyer`'s anonymous phone-lookup flow with an account-based claim system so buyers log in, claim or submit company listings, and admins approve claims through a new dashboard tab — matching the approved spec at `docs/superpowers/specs/2026-08-09-buyer-accounts-and-listing-claims-design.md`.

**Architecture:** A new `claims` table (locked down, service-role-only access like `submissions`) is the single source of truth for listing ownership — no denormalized `companies.claimed_by` column. `lib/claims.ts` mirrors `lib/submissions.ts`'s shape (create/approve/reject). `submissions` gains a nullable `submitted_by_user_id` column so `createSubmission`/`approveSubmission` can relax the phone-match check for verified owners and auto-claim new listings on approval. New API routes gate buyer actions behind `getCurrentUser()` + `profile.role === 'buyer'`; the admin routes reuse the existing admin-session-cookie pattern. `BuyerPortalClient` is rewritten as a login-gated "My Listings" dashboard.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + Auth), Vitest with live-DB integration tests, Tailwind.

## Global Constraints

- Live-DB integration tests are the norm in this repo, not mocks — real Supabase project (`whgwneuarnrsktolmqdj`). Mock only things that can't exist outside a real Next.js request (`next/server`'s `after()`, `next/headers`'s `cookies()` via `getCurrentUser()`) and real SMTP sends (`sendEmail`).
- Any manual verification against the live database must clean up after itself — never leave test data live, never use a real buyer's contact info in a test.
- `companies.claimed_by` must NOT be added — ownership derives entirely from `claims where status = 'approved'`.
- Claim search keeps the phone-match verification; editing an owned listing skips phone-match and trusts the approved claim instead.
- A new-listing's `claims` row is only created at admin-approval time (auto-claim), never at submission time.
- `submitted_by_user_id` is set only server-side from the authenticated session, never trusted from the request body.
- Push immediately after every merge and verify via `vercel list --yes` — this repo has silently run stale code before.

---

## File Structure

- **New: `supabase/migrations/20260810000000_create_claims_and_submissions_owner.sql`** — `claims` table + `submissions.submitted_by_user_id` column.
- **New: `lib/phone.ts`** — `normalizePhone`, shared by `lib/submissions.ts` and `lib/claims.ts` (currently duplicated only in `lib/submissions.ts`).
- **New: `lib/claims.ts`** — `createClaim`, `approveClaim`, `rejectClaim`. Mirrors `lib/submissions.ts`.
- **Modify: `lib/submissions.ts`** — `createSubmission` accepts `submittedByUserId` and relaxes the phone check for verified owners; `approveSubmission` auto-claims new listings.
- **Modify: `lib/buyer-lookup.ts`** — export its field-list constant as `BUYER_COMPANY_FIELDS` so `app/api/buyer/claims/route.ts` can reuse the same shape.
- **New: `app/api/claims/route.ts`** (`POST`) — authenticated buyer creates a claim.
- **New: `app/api/buyer/claims/route.ts`** (`GET`) — authenticated buyer's own claims + company info, for My Listings.
- **New: `app/api/admin/claims/review/route.ts`** (`POST`) — admin approve/reject, mirrors `app/api/admin/review/route.ts`.
- **Modify: `app/api/admin/data/route.ts`** — also returns pending claims with buyer identity + company diff context.
- **Modify: `app/api/submissions/route.ts`** — threads `submitted_by_user_id` from the session when the caller is an authenticated buyer.
- **Modify: `app/api/buyer-lookup/route.ts`** — now requires an authenticated buyer session.
- **Modify: `app/admin/AdminDashboardClient.tsx`** — new "Claims" tab.
- **Modify: `app/buyer/BuyerPortalClient.tsx`** (full rewrite) and **`app/buyer/page.tsx`** (copy update) — login-gated My Listings dashboard, claim flow, add-listing flow, edit-listing flow.

---

### Task 1: Migration — `claims` table + `submissions.submitted_by_user_id`

**Files:**
- Create: `supabase/migrations/20260810000000_create_claims_and_submissions_owner.sql`

**Interfaces:**
- Produces: `public.claims` table (`id, company_id, user_id, submitted_phone, status, created_at, reviewed_at`), `public.submissions.submitted_by_user_id` column. Every later task depends on these existing in the live database.

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260810000000_create_claims_and_submissions_owner.sql

create table public.claims (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id),
  user_id         uuid not null references auth.users(id),
  submitted_phone text not null,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);

alter table public.claims enable row level security;
-- No policies at all: every read/write goes through a server route that
-- authenticates the caller first (getCurrentUser() for buyers, the admin
-- session cookie for admin routes), then uses supabaseAdmin. Matches
-- submissions' locked-down pattern after the anon-insert policy was removed.

alter table public.submissions add column submitted_by_user_id uuid references auth.users(id);
```

- [ ] **Step 2: Apply the migration to the live project**

Apply via the Supabase MCP tool against project `whgwneuarnrsktolmqdj`, name `create_claims_and_submissions_owner`, using the exact SQL from Step 1.

Then verify: `mcp__claude_ai_Supabase__list_migrations` for project `whgwneuarnrsktolmqdj` should now list a migration ending in `create_claims_and_submissions_owner`, and `mcp__claude_ai_Supabase__list_tables` should include `claims`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260810000000_create_claims_and_submissions_owner.sql
git commit -m "feat: add claims table and submissions.submitted_by_user_id column"
```

---

### Task 2: Extract shared `normalizePhone` into `lib/phone.ts`

**Files:**
- Create: `lib/phone.ts`
- Modify: `lib/submissions.ts:37-39` (remove the local `normalizePhone`, import from `./phone`)
- Test: `lib/__tests__/phone.test.ts`

**Interfaces:**
- Produces: `normalizePhone(phone: string): string` — strips all non-digit characters. Used by `lib/claims.ts` (Task 3) and `lib/submissions.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { normalizePhone } from '@/lib/phone'

describe('normalizePhone', () => {
  it('strips formatting characters down to digits only', () => {
    expect(normalizePhone('(555) 999-0301')).toBe('5559990301')
  })

  it('leaves an already-normalized number unchanged', () => {
    expect(normalizePhone('5559990301')).toBe('5559990301')
  })

  it('returns an empty string for an empty input', () => {
    expect(normalizePhone('')).toBe('')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/__tests__/phone.test.ts`
Expected: FAIL — `lib/phone.ts` does not exist yet (module not found).

- [ ] **Step 3: Create `lib/phone.ts` and update `lib/submissions.ts` to use it**

```ts
// lib/phone.ts
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}
```

In `lib/submissions.ts`, delete the local `normalizePhone` function (lines 37-39) and add the import:

```ts
import { normalizePhone } from './phone'
```

(Add it alongside the existing imports at the top of the file.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- lib/__tests__/phone.test.ts lib/__tests__/submissions.test.ts`
Expected: PASS — the new phone tests pass, and the existing submissions tests are unaffected since behavior didn't change.

- [ ] **Step 5: Commit**

```bash
git add lib/phone.ts lib/submissions.ts lib/__tests__/phone.test.ts
git commit -m "refactor: extract normalizePhone into lib/phone.ts"
```

---

### Task 3: `lib/claims.ts` — createClaim, approveClaim, rejectClaim

**Files:**
- Create: `lib/claims.ts`
- Test: `lib/__tests__/claims.test.ts`

**Interfaces:**
- Consumes: `supabaseAdmin` (`lib/supabase-admin.ts`), `normalizePhone` (`lib/phone.ts`, Task 2), `sendEmail`/`escapeHtml` (`lib/email.ts`).
- Produces: `createClaim(input: { companyId: string; userId: string; submittedPhone: string }): Promise<Claim>`, `approveClaim(claimId: string): Promise<void>`, `rejectClaim(claimId: string): Promise<void>`, and the `Claim` type (`{ id, company_id, user_id, submitted_phone, status, created_at, reviewed_at }`). Task 7 (`POST /api/claims`) and Task 9 (`POST /api/admin/claims/review`) call these directly.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/claims.test.ts
import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClaim, approveClaim, rejectClaim } from '@/lib/claims'

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/__tests__/claims.test.ts`
Expected: FAIL — `lib/claims.ts` does not exist yet.

- [ ] **Step 3: Write `lib/claims.ts`**

```ts
import { after } from 'next/server'
import { supabaseAdmin } from './supabase-admin'
import { normalizePhone } from './phone'
import { sendEmail, escapeHtml } from './email'

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
    throw new Error('The listing you are trying to claim could not be found')
  }

  const currentPhone = normalizePhone(company.phone ?? '')
  const submittedPhone = normalizePhone(input.submittedPhone)
  if (!currentPhone || currentPhone !== submittedPhone) {
    throw new Error('Phone number does not match this listing')
  }

  const { data: existingClaim } = await supabaseAdmin
    .from('claims')
    .select('id')
    .eq('company_id', input.companyId)
    .eq('user_id', input.userId)
    .in('status', ['pending', 'approved'])
    .maybeSingle()

  if (existingClaim) {
    throw new Error('You already have a pending or approved claim on this listing')
  }

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const { error } = await supabaseAdmin.from('claims').insert({
    id,
    company_id: input.companyId,
    user_id: input.userId,
    submitted_phone: input.submittedPhone,
  })

  if (error) throw new Error(`Failed to create claim: ${error.message}`)

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
    submitted_phone: input.submittedPhone,
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- lib/__tests__/claims.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/claims.ts lib/__tests__/claims.test.ts
git commit -m "feat: add lib/claims.ts (createClaim, approveClaim, rejectClaim)"
```

---

### Task 4: `lib/submissions.ts` — owner-relaxed phone check + auto-claim on approval

**Files:**
- Modify: `lib/submissions.ts`
- Test: `lib/__tests__/submissions.test.ts` (add new `describe` blocks; existing ones stay green)

**Interfaces:**
- Consumes: `Claim` shape from `lib/claims.ts` (Task 3, read directly via `supabaseAdmin.from('claims')`, no function import needed).
- Produces: `CreateSubmissionInput` gains `submittedByUserId: string | null`; `Submission` type gains `submitted_by_user_id: string | null`. Task 8 (`POST /api/submissions`) passes this field through.

- [ ] **Step 1: Write the failing tests**

Append to `lib/__tests__/submissions.test.ts` (reuse the file's existing `cleanupCompanySlugs`/`cleanupSubmissionIds` arrays and `beforeAll`/`afterAll` env stub already in the file):

```ts
// Add near the top of the file, alongside the other imports:
// import { supabaseAdmin } from '@/lib/supabase-admin' (already imported)

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

  it('still uses the phone-match check when submittedByUserId is absent (unauthenticated caller)', async () => {
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
    ).rejects.toThrow('Phone number does not match the listing you are trying to edit')
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/__tests__/submissions.test.ts`
Expected: FAIL — `submittedByUserId` isn't a recognized field yet, `createSubmission` doesn't check `claims`, `approveSubmission` doesn't insert into `claims`.

- [ ] **Step 3: Update `lib/submissions.ts`**

Change `CreateSubmissionInput` and `Submission`:

```ts
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
```

Replace the existing target-company phone-check block in `createSubmission` with:

```ts
  // Security: when this submission is an edit targeting an existing company,
  // verify the submitter actually owns it. An authenticated buyer (submittedByUserId
  // set) must have an approved claim — phone numbers change, so claim ownership is
  // the real authority once an account exists. An anonymous/unauthenticated caller
  // (submittedByUserId absent — shouldn't happen once /buyer is fully replaced, but
  // this path isn't deleted) falls back to today's phone-match check.
  if (input.targetCompanyId) {
    const { data: targetCompany, error: lookupError } = await supabaseAdmin
      .from('companies')
      .select('phone')
      .eq('id', input.targetCompanyId)
      .single()

    if (lookupError || !targetCompany) {
      throw new Error('The listing you are trying to edit could not be found')
    }

    if (input.submittedByUserId) {
      const { data: approvedClaim } = await supabaseAdmin
        .from('claims')
        .select('id')
        .eq('company_id', input.targetCompanyId)
        .eq('user_id', input.submittedByUserId)
        .eq('status', 'approved')
        .maybeSingle()

      if (!approvedClaim) {
        throw new Error('You do not have an approved claim on this listing')
      }
    } else {
      const currentPhone = normalizePhone(targetCompany.phone ?? '')
      const submittedPhone = normalizePhone(input.submittedPhone)
      if (!currentPhone || currentPhone !== submittedPhone) {
        throw new Error('Phone number does not match the listing you are trying to edit')
      }
    }
  }
```

Add `submitted_by_user_id: input.submittedByUserId` to the `supabaseAdmin.from('submissions').insert({...})` call, and to the returned `Submission` object.

In `approveSubmission`, change the initial select to also fetch the new fields:

```ts
  const { data: submission, error: fetchError } = await supabaseAdmin
    .from('submissions')
    .select('id, target_company_id, payload, status, submitted_phone, submitted_by_user_id')
    .eq('id', submissionId)
    .single()
```

Change both company-insert branches to capture the new company's id (needed for auto-claim):

```ts
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
```

After the submission's status is updated to `approved` (after the existing `statusError` check), add the auto-claim insert:

```ts
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
```

- [ ] **Step 4: Update every existing `createSubmission` call site to pass `submittedByUserId`**

`lib/__tests__/submissions.test.ts`'s pre-existing calls (the ones already in the file before this task) don't pass `submittedByUserId`, which is now a required field. Add `submittedByUserId: null` to each of those existing call sites in the file.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/__tests__/submissions.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/submissions.ts lib/__tests__/submissions.test.ts
git commit -m "feat: owner-relaxed phone check and auto-claim in lib/submissions.ts"
```

---

### Task 5: `lib/buyer-lookup.ts` — export `BUYER_COMPANY_FIELDS`

**Files:**
- Modify: `lib/buyer-lookup.ts`

**Interfaces:**
- Produces: `BUYER_COMPANY_FIELDS: string` (exported constant, same value as today's private `COMPANY_FIELDS`). Task 6 (`GET /api/buyer/claims`) imports this.

- [ ] **Step 1: Rename and export the constant**

```ts
import { supabaseAdmin } from './supabase-admin'
import type { Company } from './types'

export const BUYER_COMPANY_FIELDS =
  'id, name, slug, url, email, city, owner_name, states, payment_methods, accepted_brands, rating, description, featured, phone'

export async function lookupCompaniesByPhone(phone: string): Promise<Company[]> {
  const normalized = phone.replace(/[^0-9]/g, '')
  const { data, error } = await supabaseAdmin.from('companies').select(BUYER_COMPANY_FIELDS)

  if (error) throw new Error(`Lookup failed: ${error.message}`)
  return (data ?? []).filter(
    (c) => c.phone && c.phone.replace(/[^0-9]/g, '') === normalized
  ) as Company[]
}
```

- [ ] **Step 2: Run existing tests to confirm nothing broke**

Run: `npm test -- lib/__tests__/buyer-lookup.test.ts`
Expected: PASS (pure rename, same value)

- [ ] **Step 3: Commit**

```bash
git add lib/buyer-lookup.ts
git commit -m "refactor: export BUYER_COMPANY_FIELDS from lib/buyer-lookup.ts"
```

---

### Task 6: `POST /api/claims` and `GET /api/buyer/claims`

**Files:**
- Create: `app/api/claims/route.ts`
- Create: `app/api/buyer/claims/route.ts`
- Test: `app/api/claims/__tests__/route.test.ts`
- Test: `app/api/buyer/claims/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `getCurrentUser` (`lib/auth.ts`), `createClaim` (`lib/claims.ts`, Task 3), `BUYER_COMPANY_FIELDS` (`lib/buyer-lookup.ts`, Task 5).
- Produces: `POST /api/claims` returns `{ claimId }` (200) or `{ error }` (401/400/500). `GET /api/buyer/claims` returns `{ claims: BuyerClaim[] }` where `BuyerClaim = { id, company_id, status, submitted_phone, created_at, company: Company | null }`. Task 12 (buyer UI) consumes both.

- [ ] **Step 1: Write the failing tests**

```ts
// app/api/claims/__tests__/route.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { POST } from '../route'

const mockGetCurrentUser = vi.fn()
vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

// createClaim defers its admin-notification email with next/server's after(),
// which needs Next's real request-scope machinery — absent when a route
// handler is invoked directly in a test. Stub it to just run the callback.
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (cb: () => unknown) => {
      void cb()
    },
  }
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
  mockGetCurrentUser.mockReset()
})

// claims.user_id has a real FK to auth.users(id) — every test that ends up
// inserting a claims row (directly or via the route) needs a real auth user,
// not an arbitrary string. Tests that only check the 401/400 short-circuit
// (before any insert happens) can use a fake id since it's never persisted.
async function makeBuyer(): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `claims-route-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'test-password-123',
    email_confirm: true,
  })
  expect(error).toBeNull()
  const userId = data!.user!.id
  cleanupUserIds.push(userId)
  return userId
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/claims', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/claims', () => {
  it('returns 401 when there is no session', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const response = await POST(makeRequest({ companyId: 'x', submittedPhone: '5551234567' }))
    expect(response.status).toBe(401)
  })

  it('returns 401 when the session belongs to a customer, not a buyer', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'c@example.com', profile: { role: 'customer' } })
    const response = await POST(makeRequest({ companyId: 'x', submittedPhone: '5551234567' }))
    expect(response.status).toBe(401)
  })

  it('returns 400 when companyId or submittedPhone is missing', async () => {
    const userId = await makeBuyer()
    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'b@example.com', profile: { role: 'buyer' } })
    const response = await POST(makeRequest({ companyId: 'x' }))
    expect(response.status).toBe(400)
  })

  it('creates a pending claim for an authenticated buyer with a matching phone', async () => {
    const userId = await makeBuyer()
    const { data: company } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Route Claim Test Co', slug: 'route-claim-test-co', states: ['NY'], active: true, phone: '5559994001' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(company!.slug)

    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'b@example.com', profile: { role: 'buyer' } })
    const response = await POST(makeRequest({ companyId: company!.id, submittedPhone: '5559994001' }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.claimId).toBeDefined()
    cleanupClaimIds.push(body.claimId)
  })
})
```

```ts
// app/api/buyer/claims/__tests__/route.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { GET } from '../route'

const mockGetCurrentUser = vi.fn()
vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

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
  mockGetCurrentUser.mockReset()
})

describe('GET /api/buyer/claims', () => {
  it('returns 401 when there is no session', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it("returns the caller's own claims joined to company info", async () => {
    // claims.user_id has a real FK to auth.users(id) — needs a real created user,
    // not an arbitrary string.
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `buyer-claims-route-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const { data: company } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'My Listings Test Co', slug: 'my-listings-test-co', states: ['NY'], active: true, phone: '5559994101', city: 'Troy' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(company!.slug)

    const { data: claim } = await supabaseAdmin
      .from('claims')
      .insert({ company_id: company!.id, user_id: userId, submitted_phone: '5559994101', status: 'pending' })
      .select('id')
      .single()
    cleanupClaimIds.push(claim!.id)

    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'b@example.com', profile: { role: 'buyer' } })
    const response = await GET()
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.claims).toHaveLength(1)
    expect(body.claims[0].company.name).toBe('My Listings Test Co')
    expect(body.claims[0].status).toBe('pending')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- app/api/claims app/api/buyer/claims`
Expected: FAIL — routes don't exist yet.

- [ ] **Step 3: Write `app/api/claims/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createClaim } from '@/lib/claims'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'buyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { companyId, submittedPhone } = body ?? {}

    if (!companyId || !submittedPhone) {
      return NextResponse.json({ error: 'companyId and submittedPhone are required' }, { status: 400 })
    }

    const claim = await createClaim({ companyId, userId: user.id, submittedPhone })
    return NextResponse.json({ claimId: claim.id })
  } catch (error) {
    console.error('[POST /api/claims]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Write `app/api/buyer/claims/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { BUYER_COMPANY_FIELDS } from '@/lib/buyer-lookup'
import type { Company } from '@/lib/types'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'buyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: claims, error } = await supabaseAdmin
      .from('claims')
      .select('id, company_id, status, submitted_phone, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/buyer/claims]', error)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    const companyIds = Array.from(new Set((claims ?? []).map((c) => c.company_id)))
    let companiesById = new Map<string, Company>()
    if (companyIds.length > 0) {
      const { data: companies, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select(BUYER_COMPANY_FIELDS)
        .in('id', companyIds)

      if (companiesError) {
        console.error('[GET /api/buyer/claims]', companiesError)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }
      companiesById = new Map((companies ?? []).map((c) => [c.id, c as unknown as Company]))
    }

    const claimsWithCompany = (claims ?? []).map((c) => ({
      ...c,
      company: companiesById.get(c.company_id) ?? null,
    }))

    return NextResponse.json({ claims: claimsWithCompany })
  } catch (error) {
    console.error('[GET /api/buyer/claims]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- app/api/claims app/api/buyer/claims`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/claims app/api/buyer/claims
git commit -m "feat: add POST /api/claims and GET /api/buyer/claims"
```

---

### Task 7: `POST /api/admin/claims/review`

**Files:**
- Create: `app/api/admin/claims/review/route.ts`
- Test: `app/api/admin/claims/review/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `isValidSession`, `ADMIN_SESSION_COOKIE_NAME` (`lib/admin-auth.ts`), `approveClaim`, `rejectClaim` (`lib/claims.ts`, Task 3).
- Produces: `POST /api/admin/claims/review` returns `{ ok: true }` (200) or `{ error }` (401/400/500). Task 11 (admin UI) calls this.

- [ ] **Step 1: Write the failing test**

```ts
// app/api/admin/claims/review/__tests__/route.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { signSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { createClaim } from '@/lib/claims'
import { POST } from '../route'

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (cb: () => unknown) => {
      void cb()
    },
  }
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

function makeRequest(body: unknown, cookie?: string) {
  return new Request('http://localhost/api/admin/claims/review', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookie}` } : {}),
    },
  })
}

describe('POST /api/admin/claims/review', () => {
  it('rejects requests without a valid admin session', async () => {
    const response = await POST(makeRequest({ claimId: 'x', action: 'approve' }))
    expect(response.status).toBe(401)
  })

  it('approves a pending claim when authenticated', async () => {
    const { data: userData } = await supabaseAdmin.auth.admin.createUser({
      email: `claims-review-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const { data: company } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Admin Claim Review Co', slug: 'admin-claim-review-co', states: ['NY'], active: true, phone: '5559994201' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(company!.slug)

    const claim = await createClaim({ companyId: company!.id, userId, submittedPhone: '5559994201' })
    cleanupClaimIds.push(claim.id)

    const response = await POST(makeRequest({ claimId: claim.id, action: 'approve' }, signSession()))
    expect(response.status).toBe(200)

    const { data: updated } = await supabaseAdmin.from('claims').select('status').eq('id', claim.id).single()
    expect(updated?.status).toBe('approved')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/api/admin/claims/review`
Expected: FAIL — route doesn't exist yet.

- [ ] **Step 3: Write `app/api/admin/claims/review/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { approveClaim, rejectClaim } from '@/lib/claims'

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? ''
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))
  return match?.slice(name.length + 1)
}

export async function POST(request: Request) {
  try {
    const session = getCookie(request, ADMIN_SESSION_COOKIE_NAME)
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { claimId, action } = body ?? {}

    if (!claimId || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'claimId and a valid action are required' }, { status: 400 })
    }

    if (action === 'approve') {
      await approveClaim(claimId)
    } else {
      await rejectClaim(claimId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/admin/claims/review]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/api/admin/claims/review`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/claims
git commit -m "feat: add POST /api/admin/claims/review"
```

---

### Task 8: Extend `GET /api/admin/data` with pending claims

**Files:**
- Modify: `app/api/admin/data/route.ts`
- Test: `app/api/admin/data/__tests__/route.test.ts` (new file — no test currently exists for this route)

**Interfaces:**
- Produces: JSON response gains `claims: Array<{ id, company_id, status, submitted_phone, created_at, company: {id,name,phone,email,city,states,owner_name} | null, buyer: {name,email} | null }>`. Task 11 (admin UI) consumes this.

- [ ] **Step 1: Write the failing test**

```ts
// app/api/admin/data/__tests__/route.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { signSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { createClaim } from '@/lib/claims'
import { GET } from '../route'

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

function makeRequest(cookie?: string) {
  return new Request('http://localhost/api/admin/data', {
    headers: cookie ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookie}` } : {},
  })
}

describe('GET /api/admin/data', () => {
  it('rejects requests without a valid admin session', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })

  it('includes pending claims with buyer identity and company info', async () => {
    const { data: userData } = await supabaseAdmin.auth.admin.createUser({
      email: `admin-data-claims-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)
    await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'buyer',
      name: 'Admin Data Test Buyer',
      phone: '5551239999',
      address_street: '1 Test Ave',
      address_city: 'Troy',
      address_state: 'NY',
      address_zip: '12180',
    })

    const { data: company } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Admin Data Claims Co', slug: 'admin-data-claims-co', states: ['NY'], active: true, phone: '5559994301' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(company!.slug)

    const claim = await createClaim({ companyId: company!.id, userId, submittedPhone: '5559994301' })
    cleanupClaimIds.push(claim.id)

    const response = await GET(makeRequest(signSession()))
    const body = await response.json()
    expect(response.status).toBe(200)

    const found = body.claims.find((c: { id: string }) => c.id === claim.id)
    expect(found).toBeDefined()
    expect(found.company.name).toBe('Admin Data Claims Co')
    expect(found.buyer.email).toBe(userData!.user!.email)
  })
})
```

Note: `GET /api/admin/data`'s handler signature must accept a `Request` argument (it currently takes none and reads cookies via `next/headers`'s `cookies()`, which would need mocking in a test). Step 3 changes it to read the cookie header directly from the `Request` object instead — matching the pattern already used in `app/api/admin/review/route.ts`'s `getCookie()` helper, and making this route testable the same way.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- app/api/admin/data`
Expected: FAIL — route doesn't accept a `Request` argument yet, and doesn't return `claims`.

- [ ] **Step 3: Update `app/api/admin/data/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? ''
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))
  return match?.slice(name.length + 1)
}

export async function GET(request: Request) {
  try {
    const session = getCookie(request, ADMIN_SESSION_COOKIE_NAME)
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [submissions, leads, clicks, missingPhones, claims] = await Promise.all([
      supabaseAdmin.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('clicks').select('*').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('companies').select('id, name, city, states').or('phone.is.null,phone.eq.'),
      supabaseAdmin.from('claims').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ])

    const firstError = [submissions, leads, clicks, missingPhones, claims].find((r) => r.error)?.error
    if (firstError) {
      console.error('[GET /api/admin/data]', firstError)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    // For each pending edit submission AND each pending claim, attach the target
    // company's CURRENT values so the reviewer can see a current -> proposed diff.
    const submissionTargetIds = (submissions.data ?? []).map((s) => s.target_company_id).filter((id): id is string => Boolean(id))
    const claimCompanyIds = (claims.data ?? []).map((c) => c.company_id)
    const allCompanyIds = Array.from(new Set([...submissionTargetIds, ...claimCompanyIds]))

    let currentCompaniesById = new Map<string, Record<string, unknown>>()
    if (allCompanyIds.length > 0) {
      const { data: currentCompanies, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select('id, name, phone, email, city, states, owner_name')
        .in('id', allCompanyIds)

      if (companiesError) {
        console.error('[GET /api/admin/data]', companiesError)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }
      currentCompaniesById = new Map((currentCompanies ?? []).map((c) => [c.id, c]))
    }

    // Buyer identity for each pending claim: name from profiles, email from
    // auth.users (profiles doesn't store email). supabaseAdmin bypasses RLS.
    const claimUserIds = Array.from(new Set((claims.data ?? []).map((c) => c.user_id)))
    let buyersById = new Map<string, { name: string | null; email: string | null }>()
    if (claimUserIds.length > 0) {
      const [profilesResult, ...userResults] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, name').in('id', claimUserIds),
        ...claimUserIds.map((id) => supabaseAdmin.auth.admin.getUserById(id)),
      ])
      const namesById = new Map((profilesResult.data ?? []).map((p) => [p.id, p.name]))
      claimUserIds.forEach((id, i) => {
        buyersById.set(id, { name: namesById.get(id) ?? null, email: userResults[i]?.data?.user?.email ?? null })
      })
    }

    const submissionsWithDiff = (submissions.data ?? []).map((s) => ({
      ...s,
      currentCompany: s.target_company_id ? (currentCompaniesById.get(s.target_company_id) ?? null) : null,
    }))

    const claimsWithDetails = (claims.data ?? []).map((c) => ({
      ...c,
      company: currentCompaniesById.get(c.company_id) ?? null,
      buyer: buyersById.get(c.user_id) ?? null,
    }))

    return NextResponse.json({
      submissions: submissionsWithDiff,
      leads: leads.data ?? [],
      clicks: clicks.data ?? [],
      missingPhones: missingPhones.data ?? [],
      claims: claimsWithDetails,
    })
  } catch (error) {
    console.error('[GET /api/admin/data]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- app/api/admin/data`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/data
git commit -m "feat: extend GET /api/admin/data with pending claims"
```

---

### Task 9: `POST /api/submissions` threads the buyer session; `POST /api/buyer-lookup` requires buyer auth

**Files:**
- Modify: `app/api/submissions/route.ts`
- Modify: `app/api/submissions/__tests__/route.test.ts`
- Modify: `app/api/buyer-lookup/route.ts`
- Modify: `app/api/buyer-lookup/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `getCurrentUser` (`lib/auth.ts`).
- Produces: `POST /api/submissions` passes `submittedByUserId` through to `createSubmission` when the caller is an authenticated buyer, `null` otherwise. `POST /api/buyer-lookup` now returns 401 for non-buyer/unauthenticated callers.

- [ ] **Step 1: Write the failing tests**

Add to `app/api/submissions/__tests__/route.test.ts` (reuse the file's existing mocks for `@/lib/email` and `next/server`):

```ts
// Add this mock alongside the existing @/lib/email and next/server mocks:
const mockGetCurrentUser = vi.fn()
vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

// In beforeEach, alongside the existing mockSendEmail.mockReset()/mockResolvedValue:
mockGetCurrentUser.mockReset()
mockGetCurrentUser.mockResolvedValue(null)

// New test case:
it('threads submitted_by_user_id through when the caller is an authenticated buyer', async () => {
  mockGetCurrentUser.mockResolvedValue({ id: 'buyer-route-test-1', email: 'b@example.com', profile: { role: 'buyer' } })

  const response = await POST(
    makeRequest({
      targetCompanyId: null,
      submittedPhone: '5551234569',
      payload: { name: 'Route Buyer Test Co', states: ['NY'], phone: '5551234569' },
    })
  )
  const body = await response.json()
  expect(response.status).toBe(200)
  cleanupIds.push(body.submissionId)

  const { data: submission } = await supabaseAdmin
    .from('submissions')
    .select('submitted_by_user_id')
    .eq('id', body.submissionId)
    .single()
  expect(submission?.submitted_by_user_id).toBe('buyer-route-test-1')
})
```

Replace the entire contents of `app/api/buyer-lookup/__tests__/route.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from '../route'

const mockGetCurrentUser = vi.fn()
vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/buyer-lookup', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/buyer-lookup', () => {
  it('returns 401 when there is no session', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const response = await POST(makeRequest({ phone: '5550000000' }))
    expect(response.status).toBe(401)
  })

  it('returns 401 when the session belongs to a customer, not a buyer', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'c@example.com', profile: { role: 'customer' } })
    const response = await POST(makeRequest({ phone: '5550000000' }))
    expect(response.status).toBe(401)
  })

  it('returns 400 when phone is missing for an authenticated buyer', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'b@example.com', profile: { role: 'buyer' } })
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns an empty companies array for an unknown phone', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'u1', email: 'b@example.com', profile: { role: 'buyer' } })
    const response = await POST(makeRequest({ phone: '0000000000' }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.companies).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- app/api/submissions app/api/buyer-lookup`
Expected: FAIL — routes don't call `getCurrentUser` yet.

- [ ] **Step 3: Update `app/api/submissions/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createSubmission, validateSubmissionPayload } from '@/lib/submissions'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { targetCompanyId, submittedPhone, payload } = body ?? {}

    if (!submittedPhone || !payload) {
      return NextResponse.json({ error: 'submittedPhone and payload are required' }, { status: 400 })
    }

    const validation = validateSubmissionPayload(payload)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const user = await getCurrentUser()
    const submittedByUserId = user?.profile?.role === 'buyer' ? user.id : null

    const submission = await createSubmission({
      targetCompanyId: targetCompanyId ?? null,
      submittedPhone,
      payload,
      submittedByUserId,
    })

    return NextResponse.json({ submissionId: submission.id })
  } catch (error) {
    console.error('[POST /api/submissions]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Update `app/api/buyer-lookup/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { lookupCompaniesByPhone } from '@/lib/buyer-lookup'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'buyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const phone = body?.phone

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 })
    }

    const companies = await lookupCompaniesByPhone(phone)
    return NextResponse.json({ companies })
  } catch (error) {
    console.error('[POST /api/buyer-lookup]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- app/api/submissions app/api/buyer-lookup`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/submissions app/api/buyer-lookup
git commit -m "feat: thread buyer session through /api/submissions and gate /api/buyer-lookup"
```

---

### Task 10: Run the full existing suite for regressions

**Files:** none (verification only)

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: PASS — every file from Tasks 1-9 plus every pre-existing test file (including `lib/__tests__/schema.test.ts`, `lib/__tests__/profiles-rls.test.ts`, etc., which touch the live DB and could be affected by the new `claims` table/column).

- [ ] **Step 2: If anything fails, fix before proceeding**

Do not move on to the UI tasks with a red suite.

---

### Task 11: Admin UI — "Claims" tab in `AdminDashboardClient`

**Files:**
- Modify: `app/admin/AdminDashboardClient.tsx`

**Interfaces:**
- Consumes: `GET /api/admin/data`'s new `claims` field (Task 8), `POST /api/admin/claims/review` (Task 7).

- [ ] **Step 1: Add the `claims` type and extend `DashboardData`**

```ts
type ClaimCompany = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  states: string[];
  owner_name: string | null;
};

type ClaimBuyer = {
  name: string | null;
  email: string | null;
};

type Claim = {
  id: string;
  company_id: string;
  status: "pending" | "approved" | "rejected";
  submitted_phone: string;
  created_at: string;
  company: ClaimCompany | null;
  buyer: ClaimBuyer | null;
};
```

Add `claims: Claim[];` to the `DashboardData` type.

- [ ] **Step 2: Add "claims" to the tab list**

Change:

```ts
  const [tab, setTab] = useState<"submissions" | "leads" | "clicks" | "missingPhones">("submissions");
```

to:

```ts
  const [tab, setTab] = useState<"submissions" | "claims" | "leads" | "clicks" | "missingPhones">("submissions");
```

and change the tab-button loop's array literal from `["submissions", "leads", "clicks", "missingPhones"]` to `["submissions", "claims", "leads", "clicks", "missingPhones"]`.

- [ ] **Step 3: Add a `reviewClaim` function, parallel to `review`**

```ts
  async function reviewClaim(claimId: string, action: "approve" | "reject") {
    try {
      const res = await fetch("/api/admin/claims/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, action }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to review claim");
        return;
      }
      await load();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }
```

- [ ] **Step 4: Add the Claims tab panel**

Insert this block after the closing `)}` of the existing `{tab === "submissions" && (...)}` block:

```tsx
      {tab === "claims" && (
        <div className="flex flex-col gap-3">
          {data.claims.map((c) => (
            <div key={c.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.company?.name ?? "(company not found)"}</p>
                  <p className="text-xs text-gray-400">
                    Claimed by {c.buyer?.name ?? "unknown"} ({c.buyer?.email ?? "no email on file"}) · submitted from {c.submitted_phone}
                  </p>
                  {c.company?.phone && c.company.phone !== c.submitted_phone && (
                    <p className="text-xs text-red-500">Listing's phone on file: {c.company.phone}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => reviewClaim(c.id, "approve")} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg">Approve</button>
                  <button onClick={() => reviewClaim(c.id, "reject")} className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg">Reject</button>
                </div>
              </div>
            </div>
          ))}
          {data.claims.length === 0 && <p className="text-sm text-gray-400">No pending claims.</p>}
        </div>
      )}
```

- [ ] **Step 5: Manually verify in the browser**

Run `npm run dev`, log into `/admin`, confirm the "Claims" tab renders (empty state is fine — no code path was exercised without a manual test claim). This is a UI-only change with no dedicated test file, matching this file's existing untested-component precedent (`AdminDashboardClient.tsx` has no test file today).

- [ ] **Step 6: Commit**

```bash
git add app/admin/AdminDashboardClient.tsx
git commit -m "feat: add Claims tab to admin dashboard"
```

---

### Task 12: Buyer UI — rewrite `BuyerPortalClient` as a login-gated My Listings dashboard

**Files:**
- Modify: `app/buyer/BuyerPortalClient.tsx` (full rewrite)
- Modify: `app/buyer/page.tsx` (copy update)

**Interfaces:**
- Consumes: `useUser`/`signOut` (`lib/auth-client.tsx`), `SignupForm`/`LoginForm` (`app/components/SignupForm.tsx`/`LoginForm.tsx`), `GET /api/buyer/claims` (Task 6), `POST /api/buyer-lookup` (Task 9), `POST /api/claims` (Task 6), `POST /api/submissions` (Task 9), `STATE_LABELS` (`lib/states.ts`), `Company`/`SubmissionPayload` (`lib/types.ts`).

- [ ] **Step 1: Write `app/buyer/BuyerPortalClient.tsx`**

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { STATE_LABELS } from "@/lib/states";
import { useUser, signOut } from "@/lib/auth-client";
import { SignupForm } from "@/app/components/SignupForm";
import { LoginForm } from "@/app/components/LoginForm";
import type { Company, SubmissionPayload } from "@/lib/types";

type BuyerClaim = {
  id: string;
  company_id: string;
  status: "pending" | "approved" | "rejected";
  submitted_phone: string;
  created_at: string;
  company: Company | null;
};

// "checking": initial load / re-check after auth. "wrong-role": a session exists
// but /api/buyer/claims still 401'd (a customer account, not a buyer) — shown
// instead of re-rendering Signup/LoginForm, since those forms treat ANY existing
// session as already-successful and would otherwise call onSuccess in a loop.
// "auth": no session at all — show the signup/login toggle.
type Stage =
  | "checking"
  | "wrong-role"
  | "auth"
  | "dashboard"
  | "claim-phone"
  | "claim-choose"
  | "claim-confirm"
  | "add-form"
  | "edit-form"
  | "submitted";

const emptyPayload: SubmissionPayload = { name: "", states: [] };

export function BuyerPortalClient() {
  const { user, loading: userLoading } = useUser();
  const [stage, setStage] = useState<Stage>("checking");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [claims, setClaims] = useState<BuyerClaim[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Claim flow state
  const [phone, setPhone] = useState("");
  const [matches, setMatches] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Form state, shared by add-form and edit-form
  const [form, setForm] = useState<SubmissionPayload>(emptyPayload);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/buyer/claims");
    if (res.status === 401) {
      setStage(user ? "wrong-role" : "auth");
      return;
    }
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    setClaims(body.claims as BuyerClaim[]);
    setStage("dashboard");
  }, [user]);

  useEffect(() => {
    if (userLoading) return;
    loadDashboard();
    // Only re-run when the session itself changes (userLoading flips, or user
    // identity changes) — loadDashboard is intentionally not a dependency here
    // since it's recreated whenever `user` changes, which would otherwise loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user?.id]);

  function backToDashboard() {
    setError(null);
    setPhone("");
    setMatches([]);
    setSelectedCompany(null);
    setForm(emptyPayload);
    setEditingCompanyId(null);
    loadDashboard();
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/buyer-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    const companies = body.companies as Company[];
    if (companies.length === 0) {
      setForm({ ...emptyPayload, phone });
      setStage("add-form");
    } else if (companies.length === 1) {
      setSelectedCompany(companies[0]);
      setStage("claim-confirm");
    } else {
      setMatches(companies);
      setStage("claim-choose");
    }
  }

  function chooseCompany(company: Company) {
    setSelectedCompany(company);
    setStage("claim-confirm");
  }

  async function handleClaimConfirm() {
    if (!selectedCompany) return;
    setError(null);
    setLoading(true);
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId: selectedCompany.id, submittedPhone: phone }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    setStage("submitted");
  }

  function startAddListing() {
    setError(null);
    setForm(emptyPayload);
    setEditingCompanyId(null);
    setStage("add-form");
  }

  function startEditListing(claim: BuyerClaim) {
    if (!claim.company) return;
    setError(null);
    setEditingCompanyId(claim.company.id);
    setForm({
      name: claim.company.name,
      phone: claim.company.phone,
      email: claim.company.email,
      url: claim.company.url,
      city: claim.company.city,
      owner_name: claim.company.owner_name,
      states: claim.company.states,
      payment_methods: claim.company.payment_methods,
      accepted_brands: claim.company.accepted_brands,
      description: claim.company.description,
    });
    setStage("edit-form");
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.phone) {
      setError("Enter a phone number so customers and admins can reach you.");
      return;
    }
    if (form.states.length === 0) {
      setError("Select at least one state you serve.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetCompanyId: editingCompanyId, submittedPhone: form.phone, payload: form }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    setStage("submitted");
  }

  function toggleState(code: string) {
    setForm((f) => ({
      ...f,
      states: f.states.includes(code) ? f.states.filter((s) => s !== code) : [...f.states, code],
    }));
  }

  if (stage === "checking" || userLoading) {
    return <p className="text-gray-400 text-sm">Loading...</p>;
  }

  if (stage === "wrong-role") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          This account isn&apos;t a buyer account. Log out and sign up with a different email to manage a buyer listing.
        </p>
        <button
          onClick={async () => {
            await signOut();
            setStage("auth");
            setAuthMode("signup");
          }}
          className="self-start text-sm font-medium text-emerald-700 underline"
        >
          Log out
        </button>
      </div>
    );
  }

  if (stage === "auth") {
    return (
      <div className="flex flex-col gap-4">
        {authMode === "signup" ? (
          <>
            <SignupForm role="buyer" onSuccess={loadDashboard} />
            <p className="text-center text-sm text-gray-500">
              Already have a buyer account?{" "}
              <button type="button" onClick={() => setAuthMode("login")} className="text-emerald-700 underline">
                Log in
              </button>
            </p>
          </>
        ) : (
          <>
            <LoginForm onSuccess={loadDashboard} compact />
            <p className="text-center text-sm text-gray-500">
              New buyer?{" "}
              <button type="button" onClick={() => setAuthMode("signup")} className="text-emerald-700 underline">
                Create an account
              </button>
            </p>
          </>
        )}
      </div>
    );
  }

  if (stage === "submitted") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-emerald-700 font-medium">Submitted — pending review. We&apos;ll email you once it&apos;s reviewed.</p>
        <button onClick={backToDashboard} className="self-start text-sm font-medium text-emerald-700 underline">
          Back to My Listings
        </button>
      </div>
    );
  }

  if (stage === "dashboard") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex gap-3">
          <button onClick={() => { setPhone(""); setStage("claim-phone"); }} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
            Claim a listing
          </button>
          <button onClick={startAddListing} className="border border-emerald-600 text-emerald-700 font-semibold px-4 py-2 rounded-lg">
            Add a new listing
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex flex-col gap-3">
          {claims.length === 0 && <p className="text-sm text-gray-400">You don&apos;t have any listings yet.</p>}
          {claims.map((c) => (
            <div key={c.id} className="border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{c.company?.name ?? "(listing not found)"}</p>
                <p className="text-xs text-gray-400">{c.company?.city} · {c.status}</p>
              </div>
              {c.status === "approved" && (
                <button onClick={() => startEditListing(c)} className="text-xs text-emerald-700 underline">
                  Manage
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === "claim-phone") {
    return (
      <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Business phone number</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2"
          placeholder="518-555-0100"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
            {loading ? "Looking up..." : "Continue"}
          </button>
          <button type="button" onClick={backToDashboard} className="text-sm text-gray-500 underline">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (stage === "claim-choose") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">Multiple listings share that phone number — which one is you?</p>
        {matches.map((c) => (
          <button
            key={c.id}
            onClick={() => chooseCompany(c)}
            className="text-left border border-gray-200 rounded-lg px-4 py-3 hover:border-emerald-400"
          >
            <p className="font-medium text-gray-900">{c.name}</p>
            <p className="text-xs text-gray-400">{c.city}</p>
          </button>
        ))}
        <button type="button" onClick={backToDashboard} className="self-start text-sm text-gray-500 underline">
          Cancel
        </button>
      </div>
    );
  }

  if (stage === "claim-confirm" && selectedCompany) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          Claim <span className="font-medium text-gray-900">{selectedCompany.name}</span> ({selectedCompany.city}) using phone{" "}
          <span className="font-medium text-gray-900">{phone}</span>?
        </p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={handleClaimConfirm} disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
            {loading ? "Submitting..." : "Submit claim"}
          </button>
          <button type="button" onClick={backToDashboard} className="text-sm text-gray-500 underline">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // add-form / edit-form
  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      <h2 className="font-semibold text-gray-900">{stage === "edit-form" ? "Edit your listing" : "Add a new listing"}</h2>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Business name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
        <input
          type="tel"
          required
          value={form.phone ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Email (optional)</label>
        <input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">City</label>
        <input
          type="text"
          value={form.city ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">States you serve</label>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-2">
          {Object.entries(STATE_LABELS).map(([code, label]) => (
            <button
              type="button"
              key={code}
              onClick={() => toggleState(code)}
              className={`text-xs px-2 py-1 rounded-full border ${
                form.states.includes(code) ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
          {loading ? "Submitting..." : "Submit for review"}
        </button>
        <button type="button" onClick={backToDashboard} className="text-sm text-gray-500 underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Update `app/buyer/page.tsx` copy**

```tsx
import type { Metadata } from "next";
import { BuyerPortalClient } from "./BuyerPortalClient";

export const metadata: Metadata = {
  title: "Manage Your Buyer Listing — Cash4TestStripsUSA",
  description: "Claim or create your buyer listing on Cash4TestStripsUSA.",
};

export default function BuyerPortalPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Your Listing</h1>
      <p className="text-gray-500 text-sm mb-8">
        Log in or create a buyer account to claim your existing listing or add a new one. Changes are reviewed before going live.
      </p>
      <BuyerPortalClient />
    </div>
  );
}
```

- [ ] **Step 3: Manually verify in the browser (no automated test — this component has no test file today, matching `SellFlowClient.tsx`'s existing untested-component precedent)**

Run `npm run dev`, then walk through, cleaning up any created test data via `supabaseAdmin` afterward (never leave test data live, never use a real buyer's info):
1. Visit `/buyer` logged out → see the signup/login toggle.
2. Sign up a fresh synthetic buyer account (role="buyer") → land on My Listings (empty state).
3. Click "Add a new listing", submit → see the "Submitted" confirmation → back to dashboard shows nothing yet (submission is pending, not a claim).
4. In `/admin`, approve that submission → confirm a `claims` row now exists (approved) for that buyer/company (query via `supabaseAdmin` or the Supabase dashboard).
5. Reload `/buyer` → My Listings now shows that company with a "Manage" button; click it → edit form is prefilled → submit a change → confirm it lands in the admin Submissions tab as a pending edit, and that approving it does NOT insert a second claims row (already-approved claim covers it).
6. Log out, log back in as a customer-role test account, visit `/buyer` → confirm the "wrong-role" message and "Log out" button appear (not an infinite loop, not the signup form).
7. Clean up: delete every synthetic company/claim/submission/user created during this walkthrough via `supabaseAdmin`.

- [ ] **Step 4: Commit**

```bash
git add app/buyer/BuyerPortalClient.tsx app/buyer/page.tsx
git commit -m "feat: rewrite BuyerPortalClient as a login-gated My Listings dashboard"
```

---

### Task 13: Final regression pass, push, verify deploy

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite one more time**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors (existing untracked stray files like `app/blog/`, `lib/blog-posts.ts`, and the two `20260618_*` migrations predate this feature and aren't part of this diff — don't stage or fix them here unless lint fails because of them).

- [ ] **Step 3: Push and verify the live deploy**

```bash
git push
```

Then run `vercel list --yes` (or check the Vercel dashboard) to confirm the new deployment for `cash-for-test-strips-usa` in team `mans171s-projects` built successfully and is promoted to production. This repo has a history of work sitting merged-but-unpushed with the live site silently running stale code — always verify.

---

## Self-Review Notes

**Spec coverage:** Data model (Task 1), ownership/auth model (Tasks 3, 4, 6, 9), claim flow + add-new-listing + edit-owned-listing + auto-claim-on-approval (Tasks 3, 4, 12), all API changes listed in the spec (Tasks 5-9), admin UI (Task 11), testing section (every `lib`/route task has its own test step; Task 10 is a full-suite regression gate before UI work). Out-of-scope items (claim revocation/transfer, `/sell`/`/directory`/`/company/[slug]` changes, rate-limiting) are correctly not touched by any task.

**Type consistency:** `Claim` (Task 3) / `BuyerClaim` (Tasks 6, 12) / the admin dashboard's `Claim` type (Task 11) intentionally have different shapes for different callers (raw DB row vs. joined-with-company vs. joined-with-company-and-buyer) — each is defined where it's used, matching how `Submission` vs. the admin dashboard's own submission shape already coexist in this codebase today. `CreateSubmissionInput.submittedByUserId` (Task 4) is threaded consistently from `app/api/submissions/route.ts` (Task 9) through to `lib/submissions.ts`.
