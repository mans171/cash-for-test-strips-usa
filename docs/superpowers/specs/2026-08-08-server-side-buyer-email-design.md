# Server-Side Buyer Email Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-08
**Status:** Approved

## Overview

Replaces the current client-side `sms:`/`mailto:` deep-link flow on `/sell` with a real server-side email send. Today, clicking "Text" or "Email" on a buyer card opens the *customer's own* phone/email app pre-filled with a message — the customer has to actually send it themselves, and nothing happens if they close the app without sending. This change makes the app itself deliver the lead: one "Request Quote" button submits the order and sends the matched buyer an email with the customer's contact info and order details, CC'ing the site owner.

## Why

The current flow is unreliable (depends on the customer's device having a working SMS/email app configured, and on them actually hitting send) and gives no confirmation that a buyer was actually notified. A server-side send is deterministic, auditable, and lets the owner monitor every lead via the CC.

## Scope Discovery: Buyer Data Gap

Querying the live `companies` table found 23 of 30 active buyers have a phone number but **no email on file** (0 are email-only, 1 has both, 6 have neither). Since delivery is becoming email-only, those 23 buyers cannot be contacted through this flow until their email is collected — confirmed as an accepted, separate follow-up task, not something this change works around with a phone fallback. Buyer cards for phone-only buyers will not show a working "Request Quote" button.

This only affects `/sell` — grep confirmed the `sms:`/`mailto:` deep-link pattern exists nowhere else in the app (not in `/buyer`, not in `/directory`).

## Architecture

`SellFlowClient`'s two buttons (Text/Email) per buyer card become one "Request Quote" button, shown only when the buyer has an email on file. Clicking it POSTs to `/api/leads` as today; the route creates the lead record, looks up the matched buyer's real email **server-side** via `matchedCompanyId` (never trusting a client-supplied buyer address — consistent with the session-check work already done on this endpoint), and sends the buyer an HTML email with the order details and the customer's contact info, CC'ing `feldon.richards@gmail.com`. The customer sees a plain confirmation instead of today's copy-paste textarea.

## Components

- **`app/sell/SellFlowClient.tsx`**: `handleSend(buyer)` drops the `channel` parameter and the `window.open()` calls entirely. Buyer cards render a single "Request Quote" button, gated on `c.email` (not `c.phone`). The `"sent"` stage renders a simple confirmation message instead of the message textarea.
- **`app/api/leads/route.ts`**: after `createLead()` (unchanged), looks up the buyer's `name`/`email` via a server-side query scoped by `matchedCompanyId`, builds the email via a new `lib/message-template.ts` function, and calls a new error-surfacing email-send path. If the buyer has no email on file (shouldn't happen given the UI gate, but the API must not trust the client) or the send fails, returns an error — the lead row still exists either way, so no customer data is lost even on a failed notification.
- **`lib/email.ts`**: `SendEmailInput` gains an optional `cc?: string`. A new `sendEmailOrThrow()` wraps the same `nodemailer` transport but rethrows on failure instead of logging-and-swallowing, so `/api/leads` can detect and report a failed send. The existing `sendEmail()` (silent-swallow) is unchanged and keeps serving the admin password-reset flow exactly as today — no behavior change to that path.
- **`lib/message-template.ts`**: new `buildBuyerEmail(items, customerName, customerPhone, customerEmail): { subject: string; html: string }` — HTML-formatted version of today's `buildQuoteMessage` content (order items, customer name/contact), using the existing `escapeHtml()` helper from `lib/email.ts` for any interpolated user input. `buildQuoteMessage` itself is left in place (still used nowhere else after this change removes its only caller in `SellFlowClient`, but removing it is out of scope — a dead-code cleanup, not part of this feature).

## Data Flow

1. Customer fills Contact Information, clicks "Request Quote" on a buyer card (button only rendered/enabled when `buyer.email` exists and the customer's name is filled — matching today's `nameMissing` gate).
2. `POST /api/leads` — creates the lead row (unchanged shape/validation), looks up the buyer's email server-side by `matchedCompanyId`, sends them an HTML email (customer name/phone/email, order items) CC'ing `feldon.richards@gmail.com` via `sendEmailOrThrow()`.
3. Success: customer sees "Request sent to {buyer name} — they'll be in touch with you." on the `"sent"` stage.
4. Email-send failure (SMTP error, buyer has no email despite the UI gate, etc.): customer sees a clear error message and stays on the results page so they can retry; the lead record was already created and is not lost.

## Error Handling

- If the buyer lookup finds no email (defensive check even though the UI shouldn't allow this), return a 400 with a clear message — do not silently skip the email or claim success.
- If `sendEmailOrThrow()` throws (SMTP failure), return a 500 with a generic "couldn't send your request, please try again" message — the underlying error is logged server-side (existing `console.error` pattern in the route) but not exposed to the customer.
- The lead row is always created before the email attempt, so a failed send never loses the customer's submitted order/contact info — a retry re-sends the email without needing to re-create the lead (out of scope to dedupe leads on retry; a customer clicking "Request Quote" twice creates two lead rows, matching today's existing behavior with the SMS/email buttons).

## Testing

- Live-DB integration test: create a real lead + verify the server-side buyer-email lookup returns the correct company's `name`/`email` for a given `matchedCompanyId`, matching this repo's no-mocks convention.
- `sendEmailOrThrow()` failure-surfacing behavior is testable directly (mock-free) by pointing at an intentionally invalid SMTP config in a test-only transport, or — if that proves awkward — covered by manual verification only, consistent with how this repo already handles the untested aspects of the existing `sendEmail()`/password-reset flow. Exact approach decided during implementation planning.
- Manual verification: submit a real quote request in the browser against a real buyer with a real email on file, confirm the email arrives with the correct subject/body/CC; confirm a buyer with no email doesn't show a "Request Quote" button at all; confirm the lead row is created even if the email send is forced to fail.

## Out of Scope

- Collecting email addresses for the 23 phone-only buyers (separate follow-up task).
- Any change to `/buyer` or `/directory` — neither uses the `sms:`/`mailto:` pattern being replaced here.
- Deduping repeated "Request Quote" clicks into a single lead.
- Removing the now-possibly-dead `buildQuoteMessage()` function (left in place; not part of this feature).
- Any change to the `leads` table schema — the existing `channel` column is simply always written as `'email'` going forward, no migration needed.
