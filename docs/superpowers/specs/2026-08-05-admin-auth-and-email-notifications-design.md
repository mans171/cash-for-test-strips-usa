# Admin Password Reset & Email Notifications Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-05
**Status:** Approved

---

## Overview

Adds real email capability to the buyer-portal-and-order-flow feature, reusing the Gmail SMTP account already set up for CFTS Albany (`support@nycphonebuyer.com`, new dedicated app password). Three pieces:

1. **Admin password reset** — the admin password moves from an `ADMIN_PASSWORD` env var into the database (hashed) so it can actually be changed at runtime. A "Forgot password?" link on `/admin/login` emails a one-time reset link.
2. **Buyer notification** — when a submission is approved or rejected, the buyer is emailed automatically if their listing has an `email` on file. Silent no-op if not.
3. **Admin notification** — every new submission emails Feldon so `/admin` doesn't need to be checked manually for new pending items.

---

## Data Model Changes (Supabase project `whgwneuarnrsktolmqdj`)

### `admin_credentials` (new table, single row)
| column | type | notes |
|---|---|---|
| `id` | uuid, pk | `gen_random_uuid()` |
| `password_hash` | text not null | Node `crypto.scrypt`-based hash (salt + derived key, no new dependency) |
| `updated_at` | timestamptz, default `now()` | |

Seeded once via migration from the current `ADMIN_PASSWORD` value. No RLS policies — only ever read/written via `supabaseAdmin` (service-role), same pattern as `submissions` after the Task-3 RLS tightening.

### `admin_reset_tokens` (new table)
| column | type | notes |
|---|---|---|
| `id` | uuid, pk | `gen_random_uuid()` |
| `token_hash` | text not null | SHA-256 of the raw token — raw token only ever exists in the emailed URL, never stored |
| `expires_at` | timestamptz not null | `now() + 30 minutes` at creation |
| `used_at` | timestamptz, null | set on successful reset, makes the token single-use |
| `created_at` | timestamptz, default `now()` | |

No RLS policies — `supabaseAdmin` only.

---

## New env vars

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=support@nycphonebuyer.com`
- `SMTP_PASSWORD` — new dedicated Gmail app password (separate from CFTS Albany's own app password; Gmail supports multiple simultaneously)
- `ADMIN_NOTIFY_EMAIL=feldon.richards@gmail.com` — where reset links and new-submission alerts go

`ADMIN_PASSWORD` env var is removed once the migration seeds `admin_credentials` — `lib/admin-auth.ts` no longer reads it.

---

## Components

| File | Type | Purpose |
|---|---|---|
| `lib/email.ts` | Server module | `sendEmail({ to, subject, html }): Promise<void>` — nodemailer transporter built from `SMTP_*` env vars. Wraps send in try/catch, logs failures, never throws (callers must not break on email failure) |
| `lib/admin-auth.ts` (modified) | Server module | `checkPassword` becomes async, reads `admin_credentials` via `supabaseAdmin`, verifies with `crypto.scrypt` + timing-safe comparison. New: `hashPassword`, `createResetToken`, `verifyResetToken`, `consumeResetToken`, `updatePassword` |
| `app/api/admin/forgot-password/route.ts` | API route | `POST`, no body needed — creates a token, emails the reset link to `ADMIN_NOTIFY_EMAIL`. Light in-memory rate limit (same pattern as the existing login rate limiter) |
| `app/api/admin/reset-password/route.ts` | API route | `POST { token, newPassword }` — validates token (exists, unexpired, unused), updates `admin_credentials`, marks token used |
| `app/admin/forgot-password/page.tsx` | Client page | One button: "Send reset link" → success message, no email field (single fixed recipient) |
| `app/admin/reset/page.tsx` | Client page | Reads `?token=` from URL, form for new password + confirm → `POST /api/admin/reset-password` → redirect to `/admin/login` on success |
| `app/admin/login/page.tsx` (modified) | Client page | Add "Forgot password?" link to the new forgot-password page |
| `lib/submissions.ts` (modified) | Server module | `approveSubmission`/`rejectSubmission` call `sendEmail` after the DB write succeeds, if the relevant email exists. `createSubmission` calls `sendEmail` to `ADMIN_NOTIFY_EMAIL` after successful insert |

---

## Flows

**Forgot password:** `/admin/login` → "Forgot password?" → `/admin/forgot-password` → click send → `POST /api/admin/forgot-password` → server generates a random token, stores its SHA-256 hash + 30-min expiry in `admin_reset_tokens`, emails `https://cash4teststripsusa.com/admin/reset?token=<raw>` to `ADMIN_NOTIFY_EMAIL` → user sees "Check your email."

**Reset:** click emailed link → `/admin/reset?token=...` → enter new password (+ confirm, client-side match check) → `POST /api/admin/reset-password` → server hashes the incoming token, looks it up, checks `expires_at > now()` and `used_at is null` → hashes new password with `crypto.scrypt`, updates `admin_credentials`, sets `used_at` → redirect to `/admin/login`.

**Buyer notification:** inside `approveSubmission`, after the `companies` insert/update succeeds — if the resulting company has a non-null `email`, `sendEmail` a "Your listing is live on Cash4TestStripsUSA" message. Inside `rejectSubmission` — if `submission.payload.email` is present, `sendEmail` a brief "not approved" message. Both fire-and-forget: a failed send is logged, never surfaces to the admin as an error, never blocks the approve/reject action itself.

**Admin notification:** inside `createSubmission`, after the `submissions` insert succeeds — always `sendEmail` to `ADMIN_NOTIFY_EMAIL` with the buyer name, phone, and a link to `/admin`. Same fire-and-forget rule — a customer's submission must succeed even if this email fails.

---

## Error Handling

- **Email send never blocks the underlying DB operation** — every `sendEmail` call site wraps it so a submission/approval/rejection still fully succeeds even if SMTP is down; failures are logged server-side only.
- **Reset token replay** — `used_at` check prevents reusing a token twice; expired tokens rejected with a clear "This link has expired, request a new one" message.
- **Forgot-password abuse** — public unauthenticated endpoint, so it gets the same lightweight in-memory rate limit already used on `/api/admin/login` (reused pattern, not a new mechanism).
- **Password hash migration** — the migration seeds `admin_credentials` from the current `ADMIN_PASSWORD` env var value at migration time; if that env var is unset when the migration runs, the migration fails loudly rather than seeding an empty/unusable hash.

---

## Testing

- `lib/email.ts`: unit test that a failed SMTP send is caught and logged, never throws (mock the transporter)
- `lib/admin-auth.ts`: hash/verify round-trip test (scrypt), reset-token create/verify/consume lifecycle (valid, expired, already-used, wrong-token cases) — integration tests against the live `admin_credentials`/`admin_reset_tokens` tables, same pattern as existing `lib/__tests__`
- Manual: full password-reset walkthrough in browser (request → check real inbox → click link → set new password → log in with it); trigger one real submission and confirm the admin-notify email arrives; approve one submission for a company with a real `email` value and confirm the buyer-notify email arrives

---

## Out of Scope

- Customer (not buyer) email capture/notifications — `/sell` still doesn't collect customer email, no change here
- Multi-admin accounts — still a single shared credential, just DB-backed instead of env-var-backed
- Email templates beyond plain, functional HTML — no branded design pass
