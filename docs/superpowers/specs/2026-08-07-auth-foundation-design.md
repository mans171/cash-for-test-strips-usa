# Auth Foundation Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-07
**Status:** Approved

## Overview

First of three sub-projects building toward required accounts on this app:
1. **Auth foundation** (this spec) — Supabase Auth wiring, `profiles` table, shared signup/login/logout UI, session handling.
2. **Customer accounts** — required signup/login at the `/sell` checkout step, specifically to gate buyer contact info; homepage messaging update.
3. **Buyer accounts** — migrate `/buyer`'s shared-link claim flow to real accounts.

This spec covers only the shared foundation both later sub-projects depend on.

## Why

Confirmed motivation: buyer contact info (phone/email, and the ability to actually message a buyer) should be hidden from anonymous visitors. On the `/sell` checkout page, buyer name/city stay visible, but the Text/Email buttons render disabled/greyed with "Create an account to view this information" until the visitor is logged in. This is a real anti-scraping/lead-capture mechanism, not just data collection — it directly shapes where and how auth integrates into the existing flow.

## Auth Provider

**Supabase Auth** (email + password), using the `@supabase/ssr` package for cookie-based session handling in the Next.js App Router — approved as a new dependency. No email verification required; accounts work immediately after signup (confirmed).

## Data Model

New `public.profiles` table, one row per `auth.users` row:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'buyer')),
  name text not null,
  phone text not null,
  address_street text not null,
  address_city text not null,
  address_state text not null,
  address_zip text not null,
  created_at timestamptz not null default now()
)
```

- `role` distinguishes customer accounts (sub-project B) from buyer accounts (sub-project C) — both share this same table and auth system, since both are "an account with contact info," but buyers additionally link to a `companies` row (that link is added in sub-project C, not here).
- Email lives on `auth.users` natively (Supabase Auth), not duplicated onto `profiles`.
- RLS: a user can `select`/`update` only their own profile row (`auth.uid() = id`); no public read access — profile data is never exposed to anonymous requests.
- A Postgres trigger on `auth.users` insert could auto-create a blank `profiles` row, but since `name`/`phone`/`address_*` are all `not null`, the simpler approach is: the signup form collects all fields upfront and the client inserts the `profiles` row itself, in the same request flow as `auth.signUp()` — no trigger needed, avoids a partially-filled row ever existing.

## Shared UI Components

- `app/(auth)/signup/page.tsx` — full signup form: email, password, name, phone, address (street/city/state/zip), role hidden/pre-set based on entry point (query param or context, wired up by sub-projects B/C).
- `app/(auth)/login/page.tsx` — email + password login.
- `lib/auth.ts` — thin wrapper around `@supabase/ssr` for: `getCurrentUser()` (server-side, reads the session from cookies), a `useUser()` client hook (for components like the checkout page that need to know login state to grey out buttons), and `signOut()`.
- A reusable `<RequiresAccount>` gating pattern: takes children (e.g. the Text/Email buttons) and renders them disabled with a "Create an account to view this information" message when logged out, active when logged in. Sub-project B applies this to the `/sell` checkout buyer cards; sub-project C may reuse it elsewhere.

## Password Reset

Supabase Auth's native password-reset flow (magic-link email), configured to send via the existing Gmail SMTP credentials already in `.env.local` (`SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`) rather than Supabase's default mailer — set via the Supabase dashboard's Auth → SMTP Settings, so reset emails come from `support@nycphonebuyer.com` consistently with this app's other transactional email (the admin password-reset flow built earlier). No new email-sending code needed; this is a one-time dashboard configuration step done by the controller session, not application code.

## Migration Path for Existing Buyers (context for sub-project C)

Not built in this spec, but the foundation must support it: an existing buyer's shared claim link should, when visited, offer "create an account to claim this listing" — a one-time path that creates their `profiles` row (role: buyer) and links it to their existing `companies` row, rather than the old no-login claim/edit flow. After that one-time claim, they log in normally like any other account.

## Testing

- Live-DB integration tests for `lib/auth.ts`, matching this project's established convention (every other test file in this repo hits the real Supabase project directly, not mocks) — create a real test user via `supabaseAdmin.auth.admin.createUser()`, exercise the helper, clean up via `supabaseAdmin.auth.admin.deleteUser()` in `afterEach`, the same bounded-cleanup discipline already used for `admin_credentials`/`leads`/`companies` test rows elsewhere in this codebase.
- Manual browser verification: sign up with all required fields, confirm immediate login (no email confirmation blocking access); log out and log back in; attempt signup with a duplicate email and confirm a clear error; verify the `profiles` row is created correctly with the right `role`.

## Out of Scope (this spec only)

- Applying the `<RequiresAccount>` gate to actual `/sell` checkout buyer cards (sub-project B)
- The buyer shared-link → account claim migration itself (sub-project C)
- Homepage "no account needed" messaging update (sub-project B)
- Linking buyer profiles to `companies` rows (sub-project C)
- Any change to `/admin` (unrelated, separate auth system already in place)
