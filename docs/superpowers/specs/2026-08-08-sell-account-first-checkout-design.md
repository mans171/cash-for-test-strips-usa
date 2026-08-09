# Sell Account-First Checkout Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-08
**Status:** Approved

## Overview

Redesigns `/sell` so account creation is a natural, uninterrupted step in the checkout flow instead of a gate the customer hits after already seeing (partially gated) buyer results. Building the order and giving contact info already function as account setup — the last field before seeing buyers is a single "Create your account" submission, not a separate modal or CTA layered on top of results that are already visible.

## Why

The current flow shows buyer cards immediately after "Find My Buyer," then blocks the actual contact buttons behind a `RequiresAccount` gate that opens a modal — two separate moments, with buyer info visibly present before the gate resolves. The owner wants one continuous flow: build order → give your info → the same action creates your account and reveals your matched buyer(s), already unlocked. No buyer information appears before that submission, and no separate "Create an account" prompt appears after it.

## Architecture

`SellFlowClient` gains a new `"account"` stage between `"build"` and `"results"`. Submitting the build stage checks whether the customer already has a session:
- **Already logged in** (returning customer): skip straight to `"results"` — fetch buyers immediately, exactly like today, with contact fields auto-filled from their existing profile.
- **Not logged in**: go to `"account"` stage first — a single form (name, phone, email, password, street, city, state, ZIP) with one **"Create your account"** button. No buyer data has been fetched yet. Submitting creates the Supabase Auth account and `profiles` row (same logic already used by `SignupForm`, inlined here since this stage's layout/fields differ from the standalone signup page), then immediately fetches buyers and moves to `"results"` — already authenticated, so every matched buyer's Text Now/Email button is live with no further gate.

`RequiresAccount` and `AccountModal` are removed from `/sell` entirely (they stay untouched on `/directory` and `/company/[slug]`) — by the time `"results"` renders, the customer is always authenticated, so there's nothing left to gate.

## Components

- **`app/sell/SellFlowClient.tsx`** (the only file this touches):
  - New `"account"` stage, inserted between `"build"` and `"results"` in the `Stage` type.
  - `handleFindBuyers` (the build-stage submit handler) branches on `useUser()`'s `user`: authenticated → call `runMatch` and go to `"results"`; anonymous → go to `"account"` (no match call).
  - New `handleCreateAccount` — reuses the existing `customerName`/`customerPhone`/`customerEmail` state (so values entered here carry straight into `"results"`'s Contact Information section and the eventual lead submission, no re-fetch needed) plus new local state for `password`/`addressStreet`/`addressCity`/`addressState`/`addressZip`. On submit: `supabase.auth.signUp()` → insert `profiles` row (`role: 'customer'`) → `runMatch(state)` → `setStage("results")`. Mirrors `SignupForm`'s existing error handling (signup failure, incomplete response, unconfirmed-email fallback, profile-insert retry) since it's the same underlying operation, just embedded in this page's own layout instead of the standalone `/signup` page.
  - `"results"` stage: unchanged content (Order Summary, Contact Information, buyer cards), except the buyer-card action buttons drop the `RequiresAccount` wrapper — they render directly, since authentication is now guaranteed by the time this stage is reachable.
  - Removed: `AccountModal` import/usage, `accountModalOpen` state, `refillTrigger` state, `refreshMatchAfterAuth` (no longer needed — there's no post-hoc "unlock after login" moment anymore, since the account is created before the first buyer fetch).
  - Kept unchanged: the profile auto-fill effect (`fetchOwnProfileContact`) — still needed for the returning-logged-in-customer path, which skips the `"account"` stage and never fills those fields any other way; `runMatch`, `handleSend`, the `"sent"` stage, and all `"build"` stage item-building logic.

No changes to `/api/sell/match` or `/api/leads` — both already correctly require/check authentication server-side (built in earlier sub-projects), and neither is ever called anonymously in this new flow, but their existing auth checks stay as defense-in-depth for any direct API access.

## Data Flow

1. Customer builds their order (state + items) — unchanged.
2. Submits → already logged in? → fetch buyers → `"results"` (contact fields auto-filled from profile).
   → not logged in? → `"account"` stage: name, phone, email, password, address, one "Create your account" button.
3. Submitting the account form creates the account, then immediately fetches buyers and lands on `"results"` — buyer cards render with live, unlocked Text Now/Email buttons from the first paint of this stage.
4. Clicking Text Now/Email works exactly as it does today (real email to buyer + CC to owner, or SMS deep-link) — unchanged.

## Error Handling

Identical to `SignupForm`'s existing behavior, since this is the same operation: `signUp()` failure shows the Supabase error inline; a profile-insert failure after a successful `signUp()` offers a "Try again" retry (not a full restart, matching the existing fix for this exact failure mode); if Supabase's "Confirm email" setting were ever re-enabled, show "Check your email to confirm your account" instead of proceeding to a doomed profile insert (matching the existing safeguard). None of this is new logic — it's the proven `SignupForm` behavior, embedded in a new location.

## Testing

No automated tests — this repo has no component-test tooling, consistent with every other `/sell`/`/signup` UI change so far. Manual verification: anonymous visitor builds an order, submits, sees the account form (no buyer info visible yet), submits it, lands on results with buyer cards already showing working Text Now/Email buttons (no gate, no modal); a returning logged-in visitor builds an order and goes straight to results with contact fields pre-filled; both paths' buyer contact actions still create leads and send email/SMS exactly as before.

## Out of Scope

- Any change to `/directory`, `/company/[slug]`, or the standalone `/signup`/`/login` pages — all untouched.
- Any change to `/api/sell/match` or `/api/leads` — both already correctly enforce authentication server-side.
- Buyer accounts / the shared-link claim migration (still queued as its own future sub-project).
