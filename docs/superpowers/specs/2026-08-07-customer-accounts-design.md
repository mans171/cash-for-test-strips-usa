# Customer Accounts Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-07
**Status:** Approved

## Overview

Second of three sub-projects building toward required accounts on this app:
1. **Auth foundation** (done, merged) — Supabase Auth wiring, `profiles` table, shared signup/login/logout UI, session handling, `<RequiresAccount>` gating component (built but unused).
2. **Customer accounts** (this spec) — gate buyer contact info on `/sell` behind login, without losing the customer's in-progress order; update homepage messaging.
3. **Buyer accounts** — migrate `/buyer`'s shared-link claim flow to real accounts.

This spec covers only sub-project 2.

## Why

The auth foundation's motivation was hiding buyer contact info (phone/email, and the ability to message a buyer) from anonymous visitors — a real anti-scraping/lead-capture mechanism. That gate isn't wired into the actual checkout flow yet. This sub-project wires it in, and solves the one problem that wiring naively would create: `/sell`'s order-building flow is entirely client-side React state (items, matched buyers, selected state) with no persistence — a hard navigation to `/signup` and back would lose it.

## Architecture

Extract the existing signup form logic out of `app/(auth)/signup/page.tsx` into a shared, reusable `SignupForm` component that takes an `onSuccess` callback instead of a hardcoded redirect. The standalone `/signup` page becomes a thin wrapper rendering it with `onSuccess={() => router.push("/")}`. A new `AccountModal` component wraps that same form in an overlay, used from `/sell` with `onSuccess={() => setModalOpen(false)}` — since the modal lives inside `SellFlowClient`, closing it reveals the now-unlocked buttons underneath. No navigation ever happens on `/sell`, so order state is never at risk.

## Components

- **`app/components/SignupForm.tsx`** (new, extracted from the existing page) — all 8 fields (email, password, name, phone, address street/city/state/zip), the existing `signUp()` → `profiles` insert → retry-on-failure logic, unchanged behavior, parameterized by `onSuccess: () => void` and an optional `role?: 'customer' | 'buyer'` prop (defaults to `'customer'`, so `/sell` never needs the `?role=buyer` query trick sub-project C will use elsewhere).
- **`app/components/AccountModal.tsx`** (new) — a simple overlay (backdrop + centered panel, closable via an X button or backdrop click) rendering `<SignupForm onSuccess={...} />`. No new auth logic — pure presentation, takes `onClose` and `onSuccess` props.
- **`app/(auth)/signup/page.tsx`** (modified) — shrinks to the existing `Suspense` wrapper plus `<SignupForm onSuccess={() => router.push("/")} />`. Behavior for direct `/signup` visitors is unchanged.
- **`app/sell/SellFlowClient.tsx`** (modified) — each buyer card's Text/Email button pair is wrapped in `<RequiresAccount>` (built in the auth foundation, unused until now). `<RequiresAccount>`'s "Create an account" link becomes a button that opens `AccountModal` instead of navigating. On modal success, `useUser()` re-fires (a session now exists), `<RequiresAccount>` re-renders its children unlocked automatically — no manual state wiring needed beyond closing the modal.
- **Contact Information auto-fill**: `SellFlowClient` uses `useUser()` (already returns `{id, email}` when logged in) plus a client-side `profiles` fetch scoped to the logged-in user (RLS-protected: `auth.uid() = id`) to pre-fill `customerName`/`customerPhone`/`customerEmail` state once, the first time a session is detected. Fields remain editable afterward — this is a convenience default, not a lock.

## Data Flow

1. Guest fills out an order, hits "Find My Buyer" — unauthenticated, ungated (matches buyers, shows results). Only contact actions are gated, not search or buyer name/city visibility.
2. Results page renders buyer cards; Text/Email buttons are visible-but-disabled via `<RequiresAccount>`, with "Create an account to view this information."
3. Click → `AccountModal` opens over the current page; order state untouched underneath.
4. Signup succeeds inline → modal closes → buttons unlock → profile fetched → Contact Information fields auto-filled (still editable) → customer proceeds exactly as today (Text/Email send flow unchanged).
5. An already-logged-in customer sees buttons unlocked immediately and fields pre-filled on page load — no modal ever appears for them.

## Error Handling

- `AccountModal`'s `SignupForm` reuses all existing error handling (signUp failure, incomplete signup response, unconfirmed-email fallback message, profile-insert retry) unchanged — none of that logic changes, only where it's rendered and what happens on success.
- If the profile auto-fill fetch fails (network error, RLS denies for any reason), fail silently and leave the Contact Information fields blank/manually-entered as they are today — this is a convenience enhancement, not a required step, and must never block the checkout flow.
- Closing the modal without completing signup leaves the buttons gated and the order state exactly as it was.

## Homepage

`app/page.tsx`: both occurrences of `"Free to use · No account needed"` (line 8, the meta description, and line 56, visible page copy) change to `"Free to use · Free account required"`.

## Testing

- Live-DB integration test for the profile auto-fill fetch: create a real test user + profile via `supabaseAdmin`, sign in as that user with a real client, assert the fetched shape (name/phone/email) matches what a `SellFlowClient`-style query would retrieve — bounded cleanup via `afterEach`, matching this repo's established no-mocks convention.
- No automated test for the modal UI itself — this repo has no component/UI test tooling, consistent with how `/signup`/`/login` were verified in the auth foundation.
- Manual browser verification: gated buttons render disabled when logged out with the correct message; the modal opens, completes signup, and closes without losing any part of the in-progress order (items, matched state, buyer list); buttons unlock immediately after signup; Contact Information fields auto-fill from the new profile; a separately-tested already-logged-in visitor sees unlocked buttons and prefilled fields on initial page load with no modal ever appearing; closing the modal without signing up leaves everything gated and the order intact.

## Out of Scope (this spec only)

- Buyer accounts / migrating `/buyer`'s shared-link claim flow (sub-project C).
- Whether `role` needs server-side authorization at signup beyond the client-side default (flagged as a deferred spec question in the auth foundation's final review; applies more to sub-project C's buyer-role flow than this one, since this sub-project never sets `role: 'buyer'`).
- Any change to `/admin`'s separate auth system.
- Persisting order state across a real page reload/tab close (out of scope entirely — today's `/sell` flow has never supported this, and this sub-project doesn't change that; the fix here is specifically to avoid losing state on a *navigation the account gate itself would otherwise cause*, not to add general durability).
