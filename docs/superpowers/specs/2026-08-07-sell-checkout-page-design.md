# Sell Checkout Page Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-07
**Status:** Approved

## Overview

Replace `/sell`'s current "results" step (a plain list of matched buyer cards, each with anonymous Text/Email buttons) with a checkout-style page, informed by reviewing twomomsbuyteststrips.com's `/checkout` page. Scoped down from that reference per Feldon's explicit direction: no shipping/mail-in/payment-method/bonus-code sections — those don't apply to our model (we connect customers to independent local buyers who negotiate directly; we don't buy or ship anything ourselves).

## Why

Today the quote message sent to a buyer is anonymous — it opens the customer's own SMS/email app with no name attached, so the buyer has no idea who they're talking to until the customer introduces themselves. Add a Contact Information section so the buyer gets a proper "Hi, this is Jane Doe..." message.

## Data Model

**No migration needed** — the `leads` table already has unused `name`, `email`, `phone` text columns (nullable). This feature just starts populating them.

## Changes

### `lib/message-template.ts`

`buildQuoteMessage` gains a `customerName` parameter, interpolated into the opening line:

```typescript
export function buildQuoteMessage(items: OrderItem[], customerName: string): string {
  // "Hi, this is {customerName}. I got your information from cash4teststripsusa.com...`
}
```

### `lib/leads.ts`

`CreateLeadInput` gains `name: string` (required), `email?: string`, `phone?: string`. `createLead` inserts them into the existing columns. `Lead` type includes them.

### `app/api/leads/route.ts`

Validates `name` is a non-empty string (400 if missing/blank). `email`/`phone` are optional strings, passed through as-is if present. Passes `customerName` into `buildQuoteMessage`.

### `app/sell/SellFlowClient.tsx`

The `"results"` stage is restyled into a checkout page, keeping the same underlying buyer-matching call (`/api/sell/match`) and the same Text/Email send mechanism (`/api/leads` → device-native `sms:`/`mailto:` compose) — only the presentation and the new contact fields change:

1. **Order Summary** — compact recap of the built cart (reuse the same row style as the active-item-focus cart rows: `{brand} × {count} box(es) (exp: {expiration})`), read-only at this stage (no edit/remove — go back via the browser or a simple "← Back to your order" link that returns to the `"build"` stage without losing cart state).
2. **Contact Information** — Name (required text input), Phone (optional), Email (optional). Matches the twomoms section header/style but only these 3 fields — no address, since we have no shipping.
3. **Buyer card(s)** — same as today (name, city, Text/Email buttons per buyer with a phone/email on file) but the Text/Email buttons are disabled until Name is filled in, since the API now requires it.

No changes to `/api/sell/match`, the mail-in fallback logic, or the `"sent"` confirmation stage (still shows the composed message for copy/paste fallback).

### Admin dashboard

`app/admin/AdminDashboardClient.tsx`'s leads tab currently shows only `channel · timestamp` + raw items JSON. Add the customer name (and phone/email if present) to that row so Feldon can see who a lead came from at a glance — a 2-line addition to an existing render, not a new feature.

## Testing

- Unit test for `buildQuoteMessage`: confirms the customer name appears in the output.
- Unit test for `createLead`: confirms `name`/`email`/`phone` are passed through to the insert.
- Unit test for the `/api/leads` route: 400 when `name` is missing/blank; 200 with valid name and optional email/phone.
- Manual browser verification: build a cart, reach the checkout page, confirm Order Summary shows the right items, confirm Text/Email buttons are disabled until Name is filled, fill in Name only (no phone/email) and confirm a send still succeeds, confirm the composed message includes the name; check the resulting `leads` row has `name` populated; check the admin leads tab shows the name.

## Out of Scope

- Address collection, shipping options, EasyPost, mail-in labels (explicitly parked by Feldon — "we don't need mail ins just yet")
- Payment method / bonus code sections (don't apply to our model)
- Requiring phone or email (both stay optional; only name is required)
- Any change to `/buyer` or the buyer-matching algorithm itself
