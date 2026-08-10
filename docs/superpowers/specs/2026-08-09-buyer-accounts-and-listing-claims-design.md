# Buyer Accounts & Listing Claims Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-09
**Status:** Approved

## Overview

Replaces `/buyer`'s anonymous phone-lookup flow (`BuyerPortalClient`) with an account-based claim system. A buyer signs up or logs in (reusing the existing `profiles.role = 'buyer'` support), then claims one or more existing company listings and/or submits brand-new ones, all subject to admin approval through the existing `submissions` review machinery. A buyer account can own multiple companies (e.g. a franchise with several locations).

## Why

The current `/buyer` flow has no account, no session, and no real ownership record — the only check is that a submitted edit's phone number matches the target company's phone on file. That's brittle (phone numbers change, and there's no way to tell who actually owns a listing after the fact) and doesn't support one buyer managing several locations. This was already decided in a prior session (see `docs/handoff-2026-08-09.md`) to move to an admin-approved claim model that fully replaces the old flow — no anonymous fallback.

## Data Model

New `claims` table:

```sql
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
```

`submissions` gains one column:

```sql
alter table public.submissions add column submitted_by_user_id uuid references auth.users(id);
```

Set only server-side in the `/api/submissions` route handler, from the authenticated session — never trusted from the request body.

**`companies.claimed_by` is explicitly NOT added.** Ownership is always derived from `claims where status = 'approved'`. A denormalized column would need dual-write discipline (set on approve, and eventually cleared on any future revoke/dispute flow) for a query that's already cheap as a join — `claims` is the single source of truth, with claim history (rejected/superseded claims) coming for free.

## Ownership & Auth Model

- Buyers are `profiles.role = 'buyer'` accounts, created via the existing `SignupForm role="buyer"` / `LoginForm` components — no new signup mechanism.
- Every buyer-facing page/route requires both an authenticated session (`getCurrentUser()`) and `profile.role === 'buyer'`. A customer-role account hitting these routes is treated as unauthenticated for this feature (buyer and customer accounts are separate; no cross-role actions).
- "Owning" a company means an approved `claims` row exists for that `(company_id, user_id)` pair.

## Flow

**Entry (`/buyer`, replaces `BuyerPortalClient` in place):**
1. Not logged in → auth gate: `SignupForm role="buyer"` / `LoginForm` toggle, same "Log in instead" pattern used on `/sell`.
2. Logged in as a buyer → **My Listings** dashboard: every claim the user has (pending and approved), each showing the company name/city and claim status. Two actions: "Claim a listing" and "Add a new listing."

**Claim a listing:**
1. Phone search — same 0/1/2+ match UX as the current flow, backed by `/api/buyer-lookup` (see API changes below).
2. 0 matches → redirected into "Add a new listing" instead (no separate claim to submit).
3. 1 or 2+ matches → buyer picks a company, confirms the phone number is what they searched (already have it from step 1) → `POST /api/claims`.
4. Claim is validated (see below) and inserted as `status = 'pending'`, shown in My Listings.

**Add a new listing:**
- Same business-info form the current flow already has (name, phone/email, city, states, etc.) → `POST /api/submissions` with `targetCompanyId: null`. The route sets `submitted_by_user_id` from the session. No claim exists yet — see "Auto-claim on approval" below.

**Editing an owned listing:**
- From My Listings, an approved claim's company opens a prefilled edit form → `POST /api/submissions` with `targetCompanyId` set and `submitted_by_user_id` set from the session.
- `createSubmission()` changes: when `submitted_by_user_id` is present, skip the phone-match check and instead verify an approved claim exists for that `(target_company_id, submitted_by_user_id)` pair — phone numbers change, claim ownership is now the real authority. When `submitted_by_user_id` is absent (shouldn't happen once `/buyer` is fully replaced, but the code path isn't deleted), today's phone-match check still applies as-is.

**Auto-claim on approval:**
- `approveSubmission()` changes: when a submission both has no `target_company_id` (new listing) and has `submitted_by_user_id` set, after creating the company, insert an approved `claims` row (`company_id` = the new company's id, `user_id` = `submitted_by_user_id`, `submitted_phone` = the submission's `submitted_phone`, `status = 'approved'`, `reviewed_at = now()`). No `claims` row exists before approval — new-listing submissions stay entirely in the existing Submissions tab/flow until then, avoiding a "claim for a company that doesn't exist yet" edge case.

## API Changes

**New: `lib/claims.ts`** — mirrors `lib/submissions.ts`'s shape:
- `createClaim({ companyId, userId, submittedPhone })`: verifies `normalizePhone(submittedPhone)` matches the target company's current phone (same check `createSubmission` does today for edits); rejects if the user already has a pending or approved claim on that company; inserts via `supabaseAdmin`; notifies admin by email (same `after()` + `sendEmail()` pattern as `createSubmission`).
- `approveClaim(claimId)` / `rejectClaim(claimId)`: mirror `approveSubmission`/`rejectSubmission` — status + `reviewed_at` update via `supabaseAdmin`, best-effort notification email to the buyer on approve/reject (buyer email comes from `supabaseAdmin.auth.admin.getUserById(user_id)`, since `profiles` doesn't store email).

**Shared:** `normalizePhone` moves out of `lib/submissions.ts` into `lib/phone.ts` so both `lib/submissions.ts` and `lib/claims.ts` import the same implementation instead of duplicating it.

**New: `POST /api/claims`** — requires an authenticated buyer session (`getCurrentUser()`, `profile.role === 'buyer'`); body `{ companyId, submittedPhone }`; calls `createClaim` with `userId` from the session, never from the body.

**New: `GET /api/buyer/claims`** — requires an authenticated buyer session; returns the caller's own claims joined to basic company info (`id, name, city`), for the My Listings dashboard.

**New: `POST /api/admin/claims/review`** — mirrors `POST /api/admin/review`'s shape exactly (admin-session-cookie-gated, `{ claimId, action: 'approve' | 'reject' }`), calling `approveClaim`/`rejectClaim`.

**Changed: `GET /api/admin/data`** — extended to also return pending claims (id, company name/city, buyer identity, submitted phone vs. the company's current phone) alongside the existing `submissions`/`leads`/`clicks`/`missingPhones`.

**Changed: `POST /api/submissions`** — reads the caller's session via `getCurrentUser()`; if present and `profile.role === 'buyer'`, passes `submitted_by_user_id` through to `createSubmission`. Anonymous/customer callers behave exactly as today.

**Changed: `POST /api/buyer-lookup`** — currently has no auth check at all and returns full, unstripped company contact info by phone. That was acceptable only because it existed solely to serve the anonymous `/buyer` flow's own lookup step. With that flow replaced, an open anonymous endpoint returning any company's phone/email/URL by guessing phone numbers is the same class of bug already fixed elsewhere in this codebase (buyer contact info must always be gated). This route now requires an authenticated buyer session (`getCurrentUser()`, `profile.role === 'buyer'`) before returning results; unauthenticated requests get `401`.

## Admin UI

New **"Claims"** tab in `AdminDashboardClient`, parallel to the existing Submissions tab, same diff-style review card layout: company name, buyer's name/email (from `profiles`/`auth.users`), submitted phone shown next to the company's current phone for the reviewer to eyeball, Approve/Reject buttons hitting `/api/admin/claims/review`.

## Testing

Same live-DB integration pattern as the rest of the repo — real Supabase project, synthetic data created and cleaned up per test, mocks only where existing precedent already mocks (SMTP sends via `sendEmail`, request-scoped Next.js APIs). New coverage:
- `lib/claims.ts`: phone-match validation, duplicate-claim rejection (pending and approved), approve/reject status transitions.
- `POST /api/claims`: auth required, buyer-role required, happy path, phone mismatch, duplicate claim.
- `POST /api/admin/claims/review`: admin-session required, approve/reject transitions.
- `lib/submissions.ts`: the new owner-relaxation branch in `createSubmission` (approved claim present → phone check skipped; absent → today's behavior unchanged), and `approveSubmission`'s auto-claim insert for new-listing submissions with `submitted_by_user_id` set.
- `POST /api/buyer-lookup`: now requires buyer auth; add a 401 case for unauthenticated/customer-role requests alongside the existing happy-path coverage.

## Out of Scope

- Claim revocation or transferring an approved claim to a different user (no UI, no API) — `claims.status` only ever moves `pending → approved` or `pending → rejected` in this design.
- Any change to `/sell`, `/directory`, `/company/[slug]`, or customer (`role = 'customer'`) accounts.
- Rate-limiting or throttling on `/api/claims` / `/api/buyer-lookup` beyond the auth gate added here.
