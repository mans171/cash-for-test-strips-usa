# Text Now + Order Summary Confirmation Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-08
**Status:** Approved

## Overview

Two additions to the `/sell` buyer-contact flow shipped in the prior server-side-buyer-email sub-project:

1. **Text Now** — a customer-initiated SMS option (opens the customer's own phone, pre-filled) for buyers who have a phone on file but no email. Right now 29 of 30 active buyers are phone-only, so the email-only "Request Quote" button leaves nearly every buyer card with no contact option at all. Text Now restores contactability immediately, without waiting on buyer email collection.
2. **Order summary on the confirmation screen** — the `"sent"` stage currently only says "Request sent to {buyer}." It should also show what was actually ordered, like a receipt.

## Why

Both are gaps in the just-shipped flow, not new features: the email-only design didn't account for how few buyers currently have an email on file, and the confirmation screen was left minimal when the message-preview textarea was removed.

## Architecture

Each buyer card shows up to two buttons — "Request Quote" (`c.email` set) and "Text Now" (`c.phone` set) — both inside the same `RequiresAccount` gate, so a logged-out visitor sees one "Create an account" prompt covering whichever button(s) would otherwise appear. `/api/leads` regains a `channel: 'sms' | 'email'` field: `'email'` keeps today's exact behavior (server-side send, buyer email required); `'sms'` requires the buyer to have a phone on file instead, skips the email step entirely, and returns the pre-built message text so the client can open `sms:{buyer.phone}?body=...}` — the customer sends the actual text themselves from their own phone, but the lead is still recorded server-side either way, so every contact attempt lands in the `leads` table regardless of channel.

## Components

- **`lib/order-matching.ts`**: `getCompanyContact` adds `phone` to its selected columns and return type (`{ name, email: string | null, phone: string | null } | null`) — needed so the `'sms'` channel can verify server-side that the buyer actually has a phone on file, the same "never trust the client, resolve server-side" pattern already used for email.
- **`app/api/leads/route.ts`**: accepts `channel` again (`'sms' | 'email'`, 400 if neither). Branches after the existing `matchedCompanyId`/name validation:
  - `'email'`: unchanged — requires `buyer.email`, sends via `sendEmailOrThrow`, returns `{ leadId }`.
  - `'sms'`: requires `buyer.phone` (400 "This buyer cannot be reached right now" if absent, same message as today's email-missing case), creates the lead with `channel: 'sms'`, builds the message via the existing (currently unused) `buildQuoteMessage(items, name)` from `lib/message-template.ts`, and returns `{ leadId, message }`.
- **`app/sell/SellFlowClient.tsx`**: `handleSend(buyer, channel)` takes the channel again, passes it to `/api/leads`. On a `'sms'` response, opens `window.open(\`sms:${buyer.phone}?body=${encodeURIComponent(body.message)}\`, "_blank")` before moving to the `"sent"` stage (matching the pre-server-side-email behavior for the deep-link mechanics, but now with a real lead already recorded server-side first, and with the buyer contact info the customer already legitimately has as an authenticated user). The buyer-card button block becomes `{(c.email || c.phone) && <RequiresAccount>...</RequiresAccount>}` wrapping both buttons.
- **Confirmation (`"sent"` stage)**: renders the same item-summary block already used in the "Order Summary" card on the results stage (brand, count, expiration, condition), reusing the `items` state already in memory — no new data fetching.

## Data Flow

1. Buyer card shows "Request Quote" and/or "Text Now" per the buyer's `email`/`phone`, both gated behind login.
2. **Request Quote**: `POST /api/leads` (`channel: 'email'`) → lead created → buyer emailed, owner CC'd → `"sent"` stage with order summary.
3. **Text Now**: `POST /api/leads` (`channel: 'sms'`) → lead created (no email attempted) → client opens the customer's SMS app pre-filled to the buyer's number → `"sent"` stage with order summary, regardless of whether the customer actually completes sending the text from their phone.

## Error Handling

- `'sms'` with no `buyer.phone` on file: 400, same messaging pattern as the existing "buyer cannot be reached" case for missing email.
- All other validation (items, `matchedCompanyId`, name, session) is unchanged from the current route.
- If the lead is created successfully but the client-side `window.open("sms:...")` is blocked by the browser (e.g. popup blocker) or the customer closes the SMS app without sending, the confirmation screen still shows — matching the pre-server-side-email behavior, where the lead/message existed regardless of what the customer's phone app did afterward.

## Testing

- `lib/__tests__/order-matching.test.ts`: extend the existing `getCompanyContact` tests to also assert the returned `phone` field.
- `app/api/leads/__tests__/route.test.ts`: add cases for `channel: 'sms'` — creates a lead without attempting an email send (assert the mocked `sendEmailOrThrow` is NOT called), returns `{ leadId, message }` with the message containing order items; a buyer with no phone on file returns 400 for `channel: 'sms'` even if they have an email; a buyer with no email returns 400 for `channel: 'email'` even if they have a phone (existing behavior, now specifically re-asserted per-channel).
- Manual browser verification: a buyer with only a phone shows just "Text Now"; a buyer with only email shows just "Request Quote"; a buyer with both shows both; clicking either while logged out shows the account gate; clicking either while logged in creates a lead (visible in admin dashboard) and shows the order summary on the confirmation screen; Text Now opens the phone's SMS app pre-filled with the same message format used before this session's changes.

## Out of Scope

- Gating `/directory` or `/company/[slug]` behind an account — raised by the user as a separate, larger reconsideration; will be brainstormed as its own spec immediately after this one ships.
- Any change to the buyer-facing email content or the `sendEmailOrThrow`/`buildBuyerEmail` path — unchanged.
- Deduplicating a customer who clicks both "Request Quote" and "Text Now" for the same buyer — two separate lead rows is accepted, matching the plan's earlier accepted "retry creates a duplicate lead" behavior.
