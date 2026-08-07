# Sell Checkout Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/sell`'s anonymous buyer-list results step with a checkout-style page (Order Summary + Contact Information + buyer cards), and thread the customer's name (required) and optional phone/email through to the stored lead and the composed buyer message.

**Architecture:** No database migration — the `leads` table already has unused `name`/`email`/`phone` columns. `lib/message-template.ts`, `lib/leads.ts`, and `app/api/leads/route.ts` gain the new field; `SellFlowClient.tsx`'s `"results"` stage is restyled with the new Contact Information section; `AdminDashboardClient.tsx`'s leads tab gains a one-line display of the new fields.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest, Supabase. No new dependencies.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-07-sell-checkout-page-design.md`
- No database migration — `name`/`email`/`phone` columns already exist on `leads`
- Only `name` is required; `email`/`phone` stay optional
- No shipping/address/payment-method/bonus-code sections — out of scope
- No change to `/api/sell/match`, the mail-in fallback, or the `"sent"` confirmation stage

---

## Task 1: Thread customerName through message-template, leads, and the API route

**Files:**
- Modify: `lib/message-template.ts`
- Modify: `lib/__tests__/message-template.test.ts`
- Modify: `lib/leads.ts`
- Modify: `lib/__tests__/leads.test.ts`
- Modify: `app/api/leads/route.ts`
- Modify: `app/api/leads/__tests__/route.test.ts`

**Interfaces:**
- Produces: `buildQuoteMessage(items: OrderItem[], customerName: string): string`; `CreateLeadInput` gains `name: string`, `email?: string`, `phone?: string`; `Lead` gains `name: string | null`, `email: string | null`, `phone: string | null`

- [ ] **Step 1: Write the failing message-template test**

Add this test to `lib/__tests__/message-template.test.ts` (keep the existing two tests as-is, add a third):

```typescript
  it('opens with the customer name', () => {
    const message = buildQuoteMessage(
      [{ brand: 'OneTouch Verio', count: 3, expiration: '2027-01', condition: 'sealed' }],
      'Jane Doe'
    )
    expect(message).toContain('Jane Doe')
    expect(message.indexOf('Jane Doe')).toBeLessThan(message.indexOf('OneTouch Verio'))
  })
```

Also update the existing first test's call site to pass a name (its assertion changes too, since the intro line now includes the name):

```typescript
  it('includes the fixed intro line with the customer name', () => {
    const message = buildQuoteMessage(
      [{ brand: 'OneTouch Verio', count: 3, expiration: '2027-01', condition: 'sealed' }],
      'Jane Doe'
    )
    expect(message).toContain(
      'Hi, this is Jane Doe. I got your information from cash4teststripsusa.com. You are my local buyer. Can you give me a quote for the items in my cart?'
    )
  })
```

And update the second existing test's call site to also pass a name (its assertions about item lines are unchanged):

```typescript
  it('lists each item with brand, count, expiration, and condition', () => {
    const message = buildQuoteMessage(
      [
        { brand: 'OneTouch Verio', count: 3, expiration: '2027-01', condition: 'sealed' },
        { brand: 'FreeStyle Lite', count: 1, expiration: '2026-11', condition: 'unsealed' },
      ],
      'Jane Doe'
    )
    expect(message).toContain('- OneTouch Verio × 3 boxes (exp: 2027-01, sealed)')
    expect(message).toContain('- FreeStyle Lite × 1 box (exp: 2026-11, unsealed)')
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- message-template.test.ts`
Expected: FAIL (TypeScript error / wrong intro text — `buildQuoteMessage` doesn't accept a second argument yet)

- [ ] **Step 3: Update lib/message-template.ts**

```typescript
import type { OrderItem } from './types'

export function buildQuoteMessage(items: OrderItem[], customerName: string): string {
  const itemLines = items
    .map(
      (item) =>
        `- ${item.brand} × ${item.count} box${item.count === 1 ? '' : 'es'} (exp: ${item.expiration}, ${item.condition})`
    )
    .join('\n')

  return `Hi, this is ${customerName}. I got your information from cash4teststripsusa.com. You are my local buyer. Can you give me a quote for the items in my cart?\n\n${itemLines}`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- message-template.test.ts`
Expected: all passed

- [ ] **Step 5: Write the failing leads test**

Add this test to `lib/__tests__/leads.test.ts` (keep the existing test, add a second):

```typescript
  it('stores name, email, and phone when provided', async () => {
    const lead = await createLead({
      items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
      matchedCompanyId: null,
      channel: 'email',
      sourcePage: '/sell',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '5551234567',
    })
    cleanupIds.push(lead.id)

    expect(lead.name).toBe('Jane Doe')
    expect(lead.email).toBe('jane@example.com')
    expect(lead.phone).toBe('5551234567')
  })
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test -- leads.test.ts`
Expected: FAIL (TypeScript error — `CreateLeadInput` doesn't have `name`/`email`/`phone` yet)

- [ ] **Step 7: Update lib/leads.ts**

```typescript
import { supabase } from './supabase'
import type { OrderItem } from './types'

export type CreateLeadInput = {
  items: OrderItem[]
  matchedCompanyId: string | null
  channel: 'sms' | 'email'
  sourcePage: string | null
  name: string
  email?: string
  phone?: string
}

export type Lead = {
  id: string
  items: OrderItem[]
  matched_company_id: string | null
  channel: string
  source_page: string | null
  name: string | null
  email: string | null
  phone: string | null
  created_at: string
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  // Generate the id client-side and insert it explicitly rather than relying on
  // `.select()`/RETURNING: anon has no SELECT policy on leads (write-only, by
  // design), so `.insert().select()` fails outright even though the bare insert
  // succeeds — Postgres RLS governs RETURNING through SELECT policies.
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const { error } = await supabase.from('leads').insert({
    id,
    items: input.items,
    matched_company_id: input.matchedCompanyId,
    channel: input.channel,
    source_page: input.sourcePage,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
  })

  if (error) throw new Error(`Failed to create lead: ${error.message}`)

  return {
    id,
    items: input.items,
    matched_company_id: input.matchedCompanyId,
    channel: input.channel,
    source_page: input.sourcePage,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    created_at: createdAt,
  }
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -- leads.test.ts`
Expected: all passed (2 tests)

- [ ] **Step 9: Write the failing route tests**

Add these two tests to `app/api/leads/__tests__/route.test.ts` (keep the existing three tests, add two more, and update the third existing test — "creates a lead and returns the prefilled message" — to pass a `name` in its request body since it's now required):

```typescript
  it('returns 400 when name is missing', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'sms',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when name is blank', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'sms',
        name: '   ',
      })
    )
    expect(response.status).toBe(400)
  })
```

Update the existing "creates a lead and returns the prefilled message" test:

```typescript
  it('creates a lead and returns the prefilled message', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'sms',
        sourcePage: '/sell',
        name: 'Jane Doe',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.leadId).toBeDefined()
    expect(body.message).toContain('OneTouch Verio')
    expect(body.message).toContain('Jane Doe')
    cleanupIds.push(body.leadId)
  })
```

- [ ] **Step 10: Run the tests to verify the new ones fail**

Run: `npm test -- route.test.ts` (from `app/api/leads/__tests__/`)
Expected: the 2 new tests FAIL (no name validation yet); the updated third test FAILs its `Jane Doe` assertion

- [ ] **Step 11: Update app/api/leads/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { createLead } from '@/lib/leads'
import { buildQuoteMessage } from '@/lib/message-template'
import type { OrderItem } from '@/lib/types'

const VALID_CONDITIONS = new Set(['sealed', 'unsealed'])
const MAX_ITEMS = 50

function isValidItem(item: unknown): item is OrderItem {
  if (!item || typeof item !== 'object') return false
  const candidate = item as Record<string, unknown>
  return (
    typeof candidate.brand === 'string' &&
    typeof candidate.count === 'number' &&
    typeof candidate.expiration === 'string' &&
    typeof candidate.condition === 'string' &&
    VALID_CONDITIONS.has(candidate.condition)
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, matchedCompanyId, channel, sourcePage, name, email, phone } = body ?? {}

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }
    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: `No more than ${MAX_ITEMS} items are allowed` }, { status: 400 })
    }
    if (!items.every(isValidItem)) {
      return NextResponse.json({ error: 'Each item must include a valid brand, count, expiration, and condition' }, { status: 400 })
    }
    if (channel !== 'sms' && channel !== 'email') {
      return NextResponse.json({ error: 'channel must be sms or email' }, { status: 400 })
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    }

    const lead = await createLead({
      items: items as OrderItem[],
      matchedCompanyId: matchedCompanyId ?? null,
      channel,
      sourcePage: sourcePage ?? null,
      name: name.trim(),
      email: typeof email === 'string' && email.trim() ? email.trim() : undefined,
      phone: typeof phone === 'string' && phone.trim() ? phone.trim() : undefined,
    })
    const message = buildQuoteMessage(items as OrderItem[], name.trim())

    return NextResponse.json({ leadId: lead.id, message })
  } catch (error) {
    console.error('[POST /api/leads]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 12: Run the tests to verify they pass**

Run: `npm test -- route.test.ts`
Expected: all 5 tests pass

- [ ] **Step 13: Commit**

```bash
git add lib/message-template.ts lib/__tests__/message-template.test.ts lib/leads.ts lib/__tests__/leads.test.ts app/api/leads/route.ts app/api/leads/__tests__/route.test.ts
git commit -m "feat: thread customer name/email/phone through leads and quote message"
```

---

## Task 2: Checkout page UI in SellFlowClient

**Files:**
- Modify: `app/sell/SellFlowClient.tsx`

**Interfaces:**
- Consumes: updated `buildQuoteMessage`/`createLead` contract from Task 1 (via the `/api/leads` route, no direct import change needed here — this task only changes what's sent in the fetch body and what's rendered)

- [ ] **Step 1: Add customer contact state**

Add alongside the other `useState` calls near the top of `SellFlowClient`:

```typescript
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
```

- [ ] **Step 2: Update handleSend to include the contact fields**

Find the existing `handleSend` function's fetch call body:

```typescript
        body: JSON.stringify({ items, matchedCompanyId: buyer.id, channel, sourcePage: "/sell" }),
```

Replace it with:

```typescript
        body: JSON.stringify({
          items,
          matchedCompanyId: buyer.id,
          channel,
          sourcePage: "/sell",
          name: customerName,
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
        }),
```

- [ ] **Step 3: Replace the results-stage JSX with the checkout page**

Find the full `if (stage === "results") { ... }` block:

```typescript
  if (stage === "results") {
    const cards = buyers.length > 0 ? buyers : mailIn ? [mailIn] : [];
    if (cards.length === 0) {
      return (
        <p className="text-sm text-gray-500">
          We couldn&apos;t find a buyer for your area right now. Email{" "}
          <a href="mailto:feldon.richards@gmail.com" className="text-emerald-600 hover:underline">feldon.richards@gmail.com</a>{" "}
          or call <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> directly and we&apos;ll help you sell your strips.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {buyers.length === 0 && mailIn && (
          <p className="text-sm text-gray-500">No local buyer in your state yet — here&apos;s our mail-in option.</p>
        )}
        {cards.map((c) => (
          <div key={c.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{c.name}</p>
              {c.city && <p className="text-xs text-gray-400">{c.city}</p>}
            </div>
            <div className="flex gap-2">
              {c.phone && (
                <button
                  onClick={() => handleSend(c, "sms")}
                  disabled={sending}
                  className="text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  {sending && selectedBuyer?.id === c.id ? "Sending..." : "Text"}
                </button>
              )}
              {c.email && (
                <button
                  onClick={() => handleSend(c, "email")}
                  disabled={sending}
                  className="text-xs font-medium border border-emerald-600 text-emerald-700 px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  {sending && selectedBuyer?.id === c.id ? "Sending..." : "Email"}
                </button>
              )}
            </div>
          </div>
        ))}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    );
  }
```

Replace it with:

```typescript
  if (stage === "results") {
    const cards = buyers.length > 0 ? buyers : mailIn ? [mailIn] : [];
    const nameMissing = customerName.trim().length === 0;
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setStage("build")}
          className="text-xs font-medium text-gray-500 hover:text-emerald-700 self-start"
        >
          ← Back to your order
        </button>

        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Order Summary</h2>
          <div className="flex flex-col gap-1">
            {items.map((item, i) => (
              <p key={i} className="text-sm text-gray-600">
                {item.brand} × {item.count} box{item.count === 1 ? "" : "es"} (exp: {item.expiration}, {item.condition})
              </p>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Contact Information</h2>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Your name *</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Phone (optional)</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email (optional)</label>
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {cards.length === 0 ? (
          <p className="text-sm text-gray-500">
            We couldn&apos;t find a buyer for your area right now. Email{" "}
            <a href="mailto:feldon.richards@gmail.com" className="text-emerald-600 hover:underline">feldon.richards@gmail.com</a>{" "}
            or call <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> directly and we&apos;ll help you sell your strips.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {buyers.length === 0 && mailIn && (
              <p className="text-sm text-gray-500">No local buyer in your state yet — here&apos;s our mail-in option.</p>
            )}
            {cards.map((c) => (
              <div key={c.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.city && <p className="text-xs text-gray-400">{c.city}</p>}
                </div>
                <div className="flex gap-2">
                  {c.phone && (
                    <button
                      onClick={() => handleSend(c, "sms")}
                      disabled={sending || nameMissing}
                      title={nameMissing ? "Enter your name first" : undefined}
                      className="text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                    >
                      {sending && selectedBuyer?.id === c.id ? "Sending..." : "Text"}
                    </button>
                  )}
                  {c.email && (
                    <button
                      onClick={() => handleSend(c, "email")}
                      disabled={sending || nameMissing}
                      title={nameMissing ? "Enter your name first" : undefined}
                      className="text-xs font-medium border border-emerald-600 text-emerald-700 px-3 py-2 rounded-lg disabled:opacity-50"
                    >
                      {sending && selectedBuyer?.id === c.id ? "Sending..." : "Email"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    );
  }
```

- [ ] **Step 4: Run the build to confirm no type errors**

Run: `npm run build`
Expected: builds cleanly, no type errors

- [ ] **Step 5: Manual browser verification**

Run `npm run dev`, go to `/sell`:
1. Build a small cart (1 item), select a state with buyer matches, submit
2. Confirm the new checkout page shows: a "← Back to your order" link, an Order Summary section listing the item, a Contact Information section with Name/Phone/Email fields, then the buyer card(s)
3. Confirm the Text/Email buttons are disabled (grayed, with a tooltip) before typing a name
4. Type a name, confirm the buttons become enabled
5. Click "← Back to your order" and confirm it returns to the build stage with the cart intact (items not lost)
6. Go through checkout again, fill in name only (leave phone/email blank), click Text or Email on a test buyer (e.g. "Admin Review Test Co" from a NY search), confirm it succeeds and the composed message on the "sent" screen includes the name
7. Check via the Supabase MCP tool that the resulting `leads` row has `name` populated correctly and `email`/`phone` are null (since left blank); clean up (delete) the test lead row afterward

- [ ] **Step 6: Commit**

```bash
git add app/sell/SellFlowClient.tsx
git commit -m "feat: replace results step with checkout page (order summary + contact info)"
```

---

## Task 3: Show customer contact info in the admin leads tab

**Files:**
- Modify: `app/admin/AdminDashboardClient.tsx`

- [ ] **Step 1: Update the leads type and row rendering**

Find the leads type declaration:

```typescript
  leads: Array<{ id: string; items: unknown; channel: string; created_at: string }>;
```

Replace it with:

```typescript
  leads: Array<{ id: string; items: unknown; channel: string; created_at: string; name: string | null; email: string | null; phone: string | null }>;
```

Find the leads row rendering:

```typescript
          {data.leads.map((l) => (
            <div key={l.id} className="border border-gray-100 rounded-lg p-3 text-sm">
              <p>{l.channel} · {new Date(l.created_at).toLocaleString()}</p>
              <pre className="text-xs text-gray-500 mt-1">{JSON.stringify(l.items)}</pre>
            </div>
          ))}
```

Replace it with:

```typescript
          {data.leads.map((l) => (
            <div key={l.id} className="border border-gray-100 rounded-lg p-3 text-sm">
              <p>
                {l.name ?? "(no name)"} · {l.channel} · {new Date(l.created_at).toLocaleString()}
                {l.phone && ` · ${l.phone}`}
                {l.email && ` · ${l.email}`}
              </p>
              <pre className="text-xs text-gray-500 mt-1">{JSON.stringify(l.items)}</pre>
            </div>
          ))}
```

- [ ] **Step 2: Run the build to confirm no type errors**

Run: `npm run build`
Expected: builds cleanly, no type errors

- [ ] **Step 3: Manual browser verification**

Log into `/admin`, open the Leads tab, confirm the new lead created during Task 2's manual verification (if not yet cleaned up) shows its name in the row. If it was already cleaned up, this can be verified by re-checking after Task 4's end-to-end walkthrough instead.

- [ ] **Step 4: Commit**

```bash
git add app/admin/AdminDashboardClient.tsx
git commit -m "feat: show customer name/phone/email in admin leads tab"
```

---

## Task 4: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, pristine output

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: builds cleanly, no type errors, `/sell` and `/admin` still prerender/build correctly

- [ ] **Step 3: Full manual walkthrough**

Repeat Task 2 Step 5's walkthrough once more end-to-end, this time also filling in phone and email, and confirm via the Supabase MCP tool that both are stored correctly on the `leads` row (not just name) — clean up the test lead row afterward. Then check the admin leads tab shows the phone/email in the row too (per Task 3).

- [ ] **Step 4: Final commit check**

```bash
git status
```

Confirm nothing from this plan is left uncommitted.
