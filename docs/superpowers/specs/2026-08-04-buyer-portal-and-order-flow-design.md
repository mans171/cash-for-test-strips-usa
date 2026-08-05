# Buyer Self-Service Portal & Order Flow Design — Cash4TestStripsUSA

**Date:** 2026-08-04
**Status:** Approved

---

## Overview

Two connected features:

1. **Buyer self-service portal** — a single shared link (`/buyer`) buyers use to claim/edit their own listing or create a new one, without needing a login. Nothing they submit touches the live directory until Feldon approves it.
2. **Order flow** — a "sell your test strips" builder (`/sell`) with no prices shown. Customer picks their state, adds items, the site matches them to a buyer in their state (or a mail-in fallback if none), they pick one, and a prefilled quote-request message opens in their own SMS/email app. The order is logged first so it always shows up in the admin dashboard, regardless of whether the message actually sends.

Both features share the same review model: nothing new or edited ever goes live on the public site without Feldon approving it in `/admin`.

**Forward-looking note:** long-term vision is same-day cash pickup at the customer's door (ECOATM-level convenience, Two-Moms-level professionalism, DoorDash-level logistics) — similar in shape to the driver/dispatch system already proven on CFTS Albany. This spec does not build that. It only avoids locking the data model into "redirect to buyer's external site" as the sole outcome, so a future "request pickup" path could be added to the same `leads` record shape without a rework. Full dispatch (drivers, GPS, routing) is a separate future project, out of scope here.

---

## Data Model Changes (Supabase project `whgwneuarnrsktolmqdj`)

### `companies` (existing table)
- Add `email text null` — optional secondary contact, shown on-site only for buyers who have one
- Add `mail_in boolean not null default false` — flags the fallback row used when no buyer covers the customer's state
- One new row inserted: **"CFTS Mail-In"**, `mail_in = true`, `active = true`, phone = Feldon's number. This is the row `/sell` shows when no state match is found.

### `submissions` (new table)
Holds every buyer-portal claim/edit/create request, pending review. Nothing here ever auto-applies to `companies`.

| column | type | notes |
|---|---|---|
| `id` | uuid, pk | `gen_random_uuid()` |
| `target_company_id` | uuid, null | null = new buyer; set = editing an existing row |
| `payload` | jsonb | full proposed state: name, phone, email, url, city, states, owner_name, payment_methods, accepted_brands, description |
| `submitted_phone` | text | the phone number the buyer typed in to identify themselves on `/buyer` |
| `status` | text, default `'pending'` | `pending` \| `approved` \| `rejected` |
| `created_at` | timestamptz, default `now()` | |
| `reviewed_at` | timestamptz, null | set when Feldon approves/rejects |

RLS: anon `INSERT` only (same pattern as existing `clicks`/`leads` policies). No anon `SELECT`. Reads happen only via `/admin`, server-side, using the service-role key.

### `leads` (existing table)
- Add `items jsonb` — array of `{ brand, count, expiration, condition }` per order
- Add `channel text` — `'sms'` or `'email'`, whichever the customer used to contact the buyer
- Add `matched_company_id uuid null` — which buyer (or the mail-in row) was shown/selected

RLS unchanged — already anon `INSERT`-only, no anon `SELECT`, matching the `submissions` pattern above.

---

## Components

| Route/File | Type | Purpose |
|---|---|---|
| `app/buyer/page.tsx` | Client + server actions | Phone lookup → pre-filled edit form (match) or blank create form (no match) → submits to `submissions` |
| `app/sell/page.tsx` | Client + server | State picker + item rows (brand, count, expiration, condition — no prices) |
| `app/sell/results/...` (or inline state) | Server | Queries `companies` by state (`states @> [state]`, `active = true`, `featured` first); falls back to the `mail_in = true` row if zero matches |
| Checkout/send step (within `/sell` flow) | Client | Inserts `leads` row first, then opens `sms:`/`mailto:` prefilled link; always renders the full message as copyable plain text as a fallback |
| `app/admin/page.tsx` | Server, password-gated | Session cookie set via a simple password check against an env var; reads `submissions`, `leads`, `clicks`, and a "missing phone number" report using the service-role key |
| `app/api/buyer-lookup/route.ts` | Server API route | Looks up `companies` by phone using the service-role key (bypasses the `active = true` anon restriction so buyers pending review can still find themselves) |
| `app/api/admin/review/route.ts` | Server API route | Approve: applies `submissions.payload` onto `companies` (update if `target_company_id` set, insert if null, forces `active = true`). Reject: sets `status = 'rejected'`, `companies` untouched |

---

## Data Flow

### Buyer claim/edit flow
1. Buyer opens `/buyer`, enters phone number
2. `POST /api/buyer-lookup` (service-role key) — 0 matches → blank "create new profile" form; 1 match → form pre-filled with current values; >1 match → "which of these is you?" chooser first
3. Buyer edits/fills fields, submits
4. Row inserted into `submissions` (`target_company_id` set or null, `payload` = full proposed state, `status = 'pending'`)
5. Buyer sees "Submitted — pending review"
6. Feldon sees it in `/admin`, approves or rejects
7. Approve → `/api/admin/review` applies `payload` to `companies` (update or insert, `active` forced true)
8. Reject → `submissions.status = 'rejected'`, `companies` untouched

### Customer order flow
1. Customer picks state on `/sell`
2. Adds item rows client-side: brand, box count, expiration, condition — no prices anywhere
3. Submit → server queries `companies` for that state, `active = true`, `featured` first
4. Matches found → customer picks a buyer card. Zero matches → mail-in row (`mail_in = true`) shown automatically
5. Customer taps "Send Quote Request" → server inserts `leads` row (items, matched_company_id, channel, source_page) — logged regardless of what happens next
6. Client opens `sms:<phone>?body=...` (or `mailto:` if the buyer has no phone but has email) prefilled with: *"I got your information from cash4teststripsusa.com. You are my local buyer. Can you give me a quote for the items in my cart?"* followed by the itemized list
7. Full message text is also rendered on-screen with a copy button, in case the `sms:`/`mailto:` link doesn't auto-launch (common on desktop browsers)

---

## Error Handling

- **Phone lookup is server-side only** (via `/api/buyer-lookup` using the service-role key) — the public anon key can only read `active = true` companies, so a listing that's mid-review couldn't otherwise find itself.
- **Duplicate/shared phone numbers** — no unique constraint on `phone`. If lookup returns more than one match, show a chooser instead of guessing.
- **Missing mail-in fallback** — if the `mail_in = true` row is ever deleted/deactivated, `/sell` falls back to a hardcoded "email or call us directly" message rather than a blank screen.
- **`sms:`/`mailto:` links not auto-launching** — the full message is always also shown as copyable plain text on the page.
- **Submission validation** — client-side (and re-checked server-side before insert): requires at least one contact method (phone or email) and a valid state code; blocks submit with an inline error otherwise.
- **RLS enforcement** — `submissions` and `leads` are anon `INSERT`-only, no anon `SELECT`; `companies` has no anon `UPDATE` at all. All reads of pending data and all writes to live data go through server routes using the service-role key.

---

## Testing

- Integration: phone lookup (no match / single match / multi-match chooser), submission insert + admin approve (update path and insert path) + reject (companies untouched), buyer-matching-by-state query, mail-in fallback trigger on zero matches
- RLS: confirm the anon key cannot `SELECT` `leads`/`submissions` or `UPDATE` `companies` directly
- Manual: walk both flows (buyer claim/edit, customer order → message) live in the browser before calling this done

---

## Out of Scope (this spec)

- Real authentication/login for buyers (shared link + phone lookup + Feldon's manual approval is the whole security model for v1)
- Paid SMS/email sending service (Twilio, Postmark, etc.) — messages are sent from the customer's own device via `sms:`/`mailto:` links
- Same-day cash pickup / dispatch / driver logistics (the long-term vision) — noted above as a future, separate project
- Ratings/reviews system beyond the existing `rating` column
- Editing `payment_methods`/`accepted_brands` taxonomy (reuse existing free-text array fields as-is)
