# Text Now + Order Summary Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a customer-initiated "Text Now" contact option (for buyers with a phone but no email) alongside the existing server-sent "Request Quote", and show the order summary on the post-submit confirmation screen.

**Architecture:** `/api/leads` regains a required `channel: 'sms' | 'email'` field. `'email'` keeps today's exact server-side-send behavior. `'sms'` requires the buyer to have a phone on file instead of email, skips the send, and returns a pre-built message the client uses to open the customer's own SMS app — the lead is recorded server-side either way. `SellFlowClient` renders both buttons per buyer card (whichever the buyer supports), both behind the existing account gate, and the confirmation screen now repeats the order items.

**Tech Stack:** Next.js 16.2.9 App Router, Supabase Postgres, Vitest.

## Global Constraints

- `channel` is required on `POST /api/leads` — 400 if it's neither `'sms'` nor `'email'`.
- `'sms'` requires the buyer to have a `phone` on file (not `email`) — 400 "This buyer cannot be reached right now. Please try another buyer." (same message text as today's email-missing case) if absent.
- The buyer's phone/email must be resolved server-side via `getCompanyContact(matchedCompanyId)` for both channels — never trust a client-supplied buyer contact value, consistent with the existing `'email'` path.
- Both "Request Quote" and "Text Now" stay behind the existing `RequiresAccount` gate — no change to the account-gating behavior itself.
- Every test file hits the real Supabase project directly via `supabaseAdmin` (`lib/supabase-admin.ts`) with bounded cleanup; the one deliberate exception is mocking `sendEmailOrThrow` (never let a test trigger a real SMTP send) — same convention as the existing test files this plan modifies.
- Never use `.single()` in a query that could match 0 or 2+ rows — use `.maybeSingle()`.

---

### Task 1: `getCompanyContact` returns `phone`

**Files:**
- Modify: `lib/order-matching.ts`
- Modify: `lib/__tests__/order-matching.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `getCompanyContact(companyId: string): Promise<{ name: string; email: string | null; phone: string | null } | null>` — return type gains `phone`. Task 2 (`/api/leads`) uses this to resolve the buyer's phone for the `'sms'` channel.

- [ ] **Step 1: Read the current files first**

Read `lib/order-matching.ts` and the `getCompanyContact` `describe` block in `lib/__tests__/order-matching.test.ts` in full before editing.

- [ ] **Step 2: Update the existing test assertions to include `phone`**

Find:

```typescript
  it('returns the name and email for an existing company', async () => {
    const result = await getCompanyContact(testCompanyId)
    expect(result).toEqual({ name: 'Test Contact Lookup Co', email: 'contact-lookup-test@example.com' })
  })
```

Replace with:

```typescript
  it('returns the name, email, and phone for an existing company', async () => {
    const result = await getCompanyContact(testCompanyId)
    expect(result).toEqual({
      name: 'Test Contact Lookup Co',
      email: 'contact-lookup-test@example.com',
      phone: '5185550100',
    })
  })
```

And find the `beforeAll` insert for `TEST_SLUG_CONTACT`:

```typescript
  beforeAll(async () => {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert({
        name: 'Test Contact Lookup Co',
        slug: TEST_SLUG_CONTACT,
        email: 'contact-lookup-test@example.com',
        states: ['VT'],
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    testCompanyId = data!.id
  })
```

Replace with (adds `phone`):

```typescript
  beforeAll(async () => {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert({
        name: 'Test Contact Lookup Co',
        slug: TEST_SLUG_CONTACT,
        email: 'contact-lookup-test@example.com',
        phone: '5185550100',
        states: ['VT'],
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    testCompanyId = data!.id
  })
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- order-matching.test`
Expected: FAIL — `getCompanyContact` doesn't return `phone` yet, so the new assertion's `toEqual` doesn't match (the actual result is missing the `phone` key).

- [ ] **Step 4: Update `getCompanyContact` in `lib/order-matching.ts`**

Find:

```typescript
export async function getCompanyContact(companyId: string): Promise<{ name: string; email: string | null } | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('name, email')
    .eq('id', companyId)
    .eq('active', true)
    .maybeSingle()

  if (error) throw new Error(`Company lookup failed: ${error.message}`)
  return data
}
```

Replace with:

```typescript
export async function getCompanyContact(
  companyId: string
): Promise<{ name: string; email: string | null; phone: string | null } | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('name, email, phone')
    .eq('id', companyId)
    .eq('active', true)
    .maybeSingle()

  if (error) throw new Error(`Company lookup failed: ${error.message}`)
  return data
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- order-matching.test`
Expected: PASS (6/6 — 2 `matchBuyersForState`, 1 `getMailInFallback`, 3 `getCompanyContact`)

- [ ] **Step 6: Commit**

```bash
git add lib/order-matching.ts lib/__tests__/order-matching.test.ts
git commit -m "feat: getCompanyContact returns buyer phone alongside email"
```

---

### Task 2: `/api/leads` supports `channel: 'sms' | 'email'`

**Files:**
- Modify: `app/api/leads/route.ts` (full replacement)
- Modify: `app/api/leads/__tests__/route.test.ts` (full replacement)

**Interfaces:**
- Consumes: `getCompanyContact` (Task 1, now returns `phone`), `buildQuoteMessage` from `lib/message-template.ts` (already exists, currently unused — signature `buildQuoteMessage(items: OrderItem[], customerName: string): string`), `buildBuyerEmail`/`sendEmailOrThrow`/`createLead` (all existing, unchanged).
- Produces: `POST /api/leads` request body gains a required `channel: 'sms' | 'email'` field (400 if neither). Response on success is `{ leadId: string }` for `'email'` (unchanged) or `{ leadId: string, message: string }` for `'sms'` (new). Task 3 (`SellFlowClient`) is the only consumer.

Read the current `app/api/leads/route.ts` and `app/api/leads/__tests__/route.test.ts` in full before editing — both already exist with the current email-only behavior; this task adds the `'sms'` branch alongside it.

- [ ] **Step 1: Write the failing tests (full replacement of the test file)**

```typescript
// app/api/leads/__tests__/route.test.ts
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'

// createServerSupabaseClient calls next/headers `cookies()`, which requires
// a real Next.js request scope that doesn't exist when a route handler is
// invoked directly in a unit test. Mock it so these tests exercise the
// route's own logic; getUser defaults to an authenticated session (reset
// every test in beforeEach, so test order never matters).
const mockGetUser = vi.fn<
  () => Promise<{ data: { user: { id: string; email: string } | null } }>
>()

// Real SMTP sends must never happen from a test run — mock the one function
// that actually talks to the mail server, same precedent as
// lib/__tests__/email.test.ts mocking nodemailer directly. Everything else
// in this route (session check, lead creation, company lookup) stays real.
const mockSendEmailOrThrow = vi.fn()

beforeEach(() => {
  mockGetUser.mockReset()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-id', email: 'jane@example.com' } } })
  mockSendEmailOrThrow.mockReset()
  mockSendEmailOrThrow.mockResolvedValue(undefined)
})

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}))

// message-template.ts imports escapeHtml from this same module, so the mock
// must preserve the real implementation via importOriginal rather than
// replacing the whole module — only sendEmailOrThrow needs to be faked out.
vi.mock('@/lib/email', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/email')>()
  return {
    ...actual,
    sendEmailOrThrow: (...args: unknown[]) => mockSendEmailOrThrow(...args),
  }
})

const { POST } = await import('../route')

const cleanupLeadIds: string[] = []
const cleanupCompanyIds: string[] = []

// Naming pattern shared with createTestCompany below — used both to build
// each row's slug and as the LIKE prefix for the safety-net cleanup.
const TEST_COMPANY_SLUG_PREFIX = 'leads-route-test-co-'

afterEach(async () => {
  if (cleanupLeadIds.length) {
    await supabaseAdmin.from('leads').delete().in('id', cleanupLeadIds)
    cleanupLeadIds.length = 0
  }
  if (cleanupCompanyIds.length) {
    await supabaseAdmin.from('companies').delete().in('id', cleanupCompanyIds)
    cleanupCompanyIds.length = 0
  }
  // Safety net: an interrupted prior run may have left a stray row behind
  // (created but never reaching the cleanup above, e.g. process killed
  // mid-test). Sweep anything matching this test file's naming pattern so
  // it never sits around live — createTestCompany defaults new rows to
  // active: false unless a test opts in, but this catches any leftover.
  //
  // leads.matched_company_id -> companies(id) has no ON DELETE clause
  // (defaults to NO ACTION), so a company with a dependent lead can't be
  // deleted until that lead is deleted first. Look up the matching company
  // ids, delete any leads pointing at them, then delete the companies.
  const { data: staleCompanies, error: staleLookupError } = await supabaseAdmin
    .from('companies')
    .select('id')
    .like('slug', `${TEST_COMPANY_SLUG_PREFIX}%`)
  expect(staleLookupError).toBeNull()
  const staleCompanyIds = (staleCompanies ?? []).map((c) => c.id)
  if (staleCompanyIds.length) {
    const { error: staleLeadsError } = await supabaseAdmin
      .from('leads')
      .delete()
      .in('matched_company_id', staleCompanyIds)
    expect(staleLeadsError).toBeNull()
  }
  const { error: staleCompaniesError } = await supabaseAdmin
    .from('companies')
    .delete()
    .like('slug', `${TEST_COMPANY_SLUG_PREFIX}%`)
  expect(staleCompaniesError).toBeNull()
})

async function createTestCompany(overrides: { email?: string | null; phone?: string | null; active?: boolean } = {}) {
  const suffix = Date.now()
  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert({
      name: `Leads Route Test Co ${suffix}`,
      slug: `${TEST_COMPANY_SLUG_PREFIX}${suffix}`,
      email: overrides.email === undefined ? `buyer-test-${suffix}@example.com` : overrides.email,
      phone: overrides.phone === undefined ? '5185550100' : overrides.phone,
      // Default to inactive so a test buyer is never live/discoverable even
      // if cleanup is skipped (interrupted run) — it must not appear on
      // /directory or in real /api/sell/match results, both of which filter
      // active=true. Tests that need the route to find the buyer (i.e. that
      // exercise the "buyer found" path) must explicitly pass active: true.
      active: overrides.active ?? false,
    })
    .select('id')
    .single()
  expect(error).toBeNull()
  const companyId = data!.id
  cleanupCompanyIds.push(companyId)
  return companyId
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/leads', () => {
  it('returns 401 when there is no session', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        channel: 'email',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(401)
  })

  it('returns 400 when items is empty', async () => {
    const response = await POST(
      makeRequest({ items: [], matchedCompanyId: 'irrelevant', channel: 'email', name: 'Jane Doe' })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when matchedCompanyId is missing', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        channel: 'email',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when channel is missing', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 for an invalid channel', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        channel: 'carrier-pigeon',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when name is missing', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        channel: 'email',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when name is blank', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        channel: 'email',
        name: '   ',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when channel is email and the matched buyer has no email on file', async () => {
    const companyId = await createTestCompany({ email: null, active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'email',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
    expect(mockSendEmailOrThrow).not.toHaveBeenCalled()
  })

  it('returns 400 when channel is sms and the matched buyer has no phone on file', async () => {
    const companyId = await createTestCompany({ phone: null, active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'sms',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when the matched buyer does not exist', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: '00000000-0000-0000-0000-000000000000',
        channel: 'email',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('creates a lead and emails the buyer, CC-ing the owner, for channel email', async () => {
    const companyId = await createTestCompany({ email: 'buyer-real@example.com', active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'email',
        sourcePage: '/sell',
        name: 'Jane Doe',
        phone: '5551234567',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.leadId).toBeDefined()
    expect(body.message).toBeUndefined()
    cleanupLeadIds.push(body.leadId)

    expect(mockSendEmailOrThrow).toHaveBeenCalledTimes(1)
    const callArgs = mockSendEmailOrThrow.mock.calls[0][0]
    expect(callArgs.to).toBe('buyer-real@example.com')
    expect(callArgs.cc).toBe('feldon.richards@gmail.com')
    expect(callArgs.subject).toContain('Jane Doe')
    expect(callArgs.html).toContain('OneTouch Verio')
  })

  it('creates a lead and returns a message for channel sms without sending an email', async () => {
    const companyId = await createTestCompany({ phone: '5185550199', active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'sms',
        sourcePage: '/sell',
        name: 'Jane Doe',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.leadId).toBeDefined()
    cleanupLeadIds.push(body.leadId)

    expect(body.message).toContain('Jane Doe')
    expect(body.message).toContain('OneTouch Verio')
    expect(mockSendEmailOrThrow).not.toHaveBeenCalled()
  })

  it('returns 500 and does not lose the lead when the email send fails', async () => {
    mockSendEmailOrThrow.mockRejectedValueOnce(new Error('SMTP down'))
    const companyId = await createTestCompany({ email: 'buyer-real@example.com', active: true })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        channel: 'email',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(500)

    const { data: leads } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('matched_company_id', companyId)
    for (const lead of leads ?? []) cleanupLeadIds.push(lead.id)
    expect(leads?.length).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- app/api/leads`
Expected: FAIL — the route doesn't accept/validate `channel` yet, doesn't branch on `'sms'`.

- [ ] **Step 3: Replace `app/api/leads/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createLead } from '@/lib/leads'
import { buildBuyerEmail, buildQuoteMessage } from '@/lib/message-template'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendEmailOrThrow } from '@/lib/email'
import { getCompanyContact } from '@/lib/order-matching'
import type { OrderItem } from '@/lib/types'

const VALID_CONDITIONS = new Set(['sealed', 'unsealed'])
const MAX_ITEMS = 50
const OWNER_EMAIL = 'feldon.richards@gmail.com'

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
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to contact a buyer' }, { status: 401 })
    }

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
    if (typeof matchedCompanyId !== 'string' || matchedCompanyId.trim().length === 0) {
      return NextResponse.json({ error: 'A matched buyer is required' }, { status: 400 })
    }
    if (channel !== 'sms' && channel !== 'email') {
      return NextResponse.json({ error: 'channel must be sms or email' }, { status: 400 })
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    }

    const buyer = await getCompanyContact(matchedCompanyId)
    const buyerContactValue = channel === 'sms' ? buyer?.phone : buyer?.email
    if (!buyer || !buyerContactValue) {
      return NextResponse.json({ error: 'This buyer cannot be reached right now. Please try another buyer.' }, { status: 400 })
    }

    const trimmedPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : undefined
    const trimmedEmail = typeof email === 'string' && email.trim() ? email.trim() : undefined

    const lead = await createLead({
      items: items as OrderItem[],
      matchedCompanyId,
      channel,
      sourcePage: sourcePage ?? null,
      name: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
    })

    if (channel === 'sms') {
      const message = buildQuoteMessage(items as OrderItem[], name.trim())
      return NextResponse.json({ leadId: lead.id, message })
    }

    const { subject, html } = buildBuyerEmail(items as OrderItem[], name.trim(), trimmedPhone, trimmedEmail)

    try {
      await sendEmailOrThrow({ to: buyer.email!, cc: OWNER_EMAIL, subject, html })
    } catch (emailError) {
      console.error('[POST /api/leads] failed to email buyer', { leadId: lead.id, buyerId: matchedCompanyId }, emailError)
      return NextResponse.json({ error: "Couldn't send your request. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ leadId: lead.id })
  } catch (error) {
    console.error('[POST /api/leads]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
```

Note: `buyer.email!` in the `sendEmailOrThrow` call is safe — by the time that line runs, `channel === 'email'` (the `if (channel === 'sms')` branch above already returned), and the earlier `!buyer || !buyerContactValue` check already confirmed `buyer.email` is truthy for the email channel (since `buyerContactValue` is `buyer?.email` when `channel !== 'sms'`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- app/api/leads`
Expected: PASS (13/13)

- [ ] **Step 5: Commit**

```bash
git add app/api/leads/route.ts app/api/leads/__tests__/route.test.ts
git commit -m "feat: support channel sms on /api/leads for buyers without email"
```

---

### Task 3: `SellFlowClient` — Text Now button and order summary confirmation

**Files:**
- Modify: `app/sell/SellFlowClient.tsx`

**Interfaces:**
- Consumes: `POST /api/leads` (Task 2) — now requires `channel: 'sms' | 'email'` in the request body; response is `{ leadId }` for `'email'` or `{ leadId, message }` for `'sms'`.
- Produces: no new exports — final integration point.

Read the current `app/sell/SellFlowClient.tsx` in full before editing. This task only touches `handleSend`, the `"sent"` stage render, and the buyer-card button block inside the `"results"` stage. Do not touch the `"build"` stage, item-building logic, the auto-fill effect, `RequiresAccount`/`AccountModal` wiring, or `runMatch`/`refreshMatchAfterAuth`.

- [ ] **Step 1: Replace `handleSend`**

Find:

```tsx
  async function handleSend(buyer: Company) {
    setSelectedBuyer(buyer);
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          matchedCompanyId: buyer.id,
          sourcePage: "/sell",
          name: customerName,
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setStage("sent");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }
```

Replace with:

```tsx
  async function handleSend(buyer: Company, channel: "sms" | "email") {
    setSelectedBuyer(buyer);
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          matchedCompanyId: buyer.id,
          channel,
          sourcePage: "/sell",
          name: customerName,
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setStage("sent");
      if (channel === "sms" && buyer.phone) {
        window.open(`sms:${buyer.phone}?body=${encodeURIComponent(body.message)}`, "_blank");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }
```

- [ ] **Step 2: Replace the `"sent"` stage to include the order summary**

Find:

```tsx
  if (stage === "sent" && selectedBuyer) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-emerald-700 font-medium">Request sent to {selectedBuyer.name}.</p>
        <p className="text-sm text-gray-500">They&apos;ll reach out to you directly to arrange your sale.</p>
      </div>
    );
  }
```

Replace with:

```tsx
  if (stage === "sent" && selectedBuyer) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-emerald-700 font-medium">Request sent to {selectedBuyer.name}.</p>
        <p className="text-sm text-gray-500">They&apos;ll reach out to you directly to arrange your sale.</p>
        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Your Order</h2>
          <div className="flex flex-col gap-1">
            {items.map((item, i) => (
              <p key={i} className="text-sm text-gray-600">
                {item.brand} × {item.count} box{item.count === 1 ? "" : "es"} (exp: {item.expiration}, {item.condition})
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }
```

- [ ] **Step 3: Replace the buyer-card button block**

Find:

```tsx
                {c.email && (
                  <RequiresAccount onRequestAccount={() => setAccountModalOpen(true)}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSend(c)}
                        disabled={sending || nameMissing}
                        title={nameMissing ? "Enter your name first" : undefined}
                        className="text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                      >
                        {sending && selectedBuyer?.id === c.id ? "Sending..." : "Request Quote"}
                      </button>
                    </div>
                  </RequiresAccount>
                )}
```

Replace with:

```tsx
                {(c.email || c.phone) && (
                  <RequiresAccount onRequestAccount={() => setAccountModalOpen(true)}>
                    <div className="flex gap-2">
                      {c.email && (
                        <button
                          onClick={() => handleSend(c, "email")}
                          disabled={sending || nameMissing}
                          title={nameMissing ? "Enter your name first" : undefined}
                          className="text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                        >
                          {sending && selectedBuyer?.id === c.id ? "Sending..." : "Request Quote"}
                        </button>
                      )}
                      {c.phone && (
                        <button
                          onClick={() => handleSend(c, "sms")}
                          disabled={sending || nameMissing}
                          title={nameMissing ? "Enter your name first" : undefined}
                          className="text-xs font-medium border border-emerald-600 text-emerald-700 px-3 py-2 rounded-lg disabled:opacity-50"
                        >
                          {sending && selectedBuyer?.id === c.id ? "Sending..." : "Text Now"}
                        </button>
                      )}
                    </div>
                  </RequiresAccount>
                )}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Build check**

Run: `npm run build`
Expected: succeeds

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including Task 1 and Task 2's updated tests.

- [ ] **Step 7: Manual browser verification**

Start `npm run dev`, then in a browser, logged in as a real (or test) account:

1. Search a state matched to a buyer with a phone but no email (currently 29 of 30 real buyers — pick any, or create a test buyer for this). Confirm the card shows only "Text Now" (no "Request Quote").
2. Click "Text Now". Confirm: the customer's own SMS app opens pre-filled to the buyer's number with a message containing the order items; the page moves to the confirmation screen showing "Request sent to {buyer}" AND the order summary (items list); the lead appears in the admin dashboard's Leads tab with `channel: sms`.
3. Search a state matched to a buyer with both phone and email (e.g. a test buyer you create for this, since only Albany currently has both). Confirm the card shows BOTH "Request Quote" and "Text Now".
4. Click "Request Quote" on that buyer. Confirm: no SMS app opens; the confirmation screen shows the order summary; the buyer receives the email as before (Task 2's behavior, unchanged); the lead shows `channel: email` in the admin dashboard.
5. While logged out, confirm both buttons (whichever apply to a given buyer) are gated behind the same "Create an account" prompt as before.
6. Clean up any test buyer/lead data created for this verification, the same way prior tasks in this project have, and confirm via SQL against the live Supabase project (`whgwneuarnrsktolmqdj`) that nothing stray remains.

Stop the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add app/sell/SellFlowClient.tsx
git commit -m "feat: add Text Now button and order summary on confirmation screen"
```

---

## Self-Review Notes

- **Spec coverage:** Architecture (`getCompanyContact` phone — Task 1; `/api/leads` channel branching — Task 2; button/confirmation UI — Task 3), Data Flow (Task 3's manual checklist walks all 3 steps from the spec), Error Handling (missing-phone-for-sms 400 covered in Task 2's tests; existing validation unchanged), Testing (each section of the spec's Testing list maps to a task: `getCompanyContact` phone assertion → Task 1; `/api/leads` sms cases → Task 2; manual verification → Task 3).
- **Placeholder scan:** none found — every step has complete, runnable code.
- **Type consistency:** `getCompanyContact`'s return type (Task 1, adds `phone: string | null`) matches exactly how Task 2's route destructures `buyer.phone`/`buyer.email`. `handleSend(buyer, channel)`'s signature (Task 3) matches exactly how the two buttons call it (`handleSend(c, "email")` / `handleSend(c, "sms")`). The `/api/leads` response shape (`{leadId}` vs `{leadId, message}`, Task 2) matches how Task 3's `handleSend` reads `body.message` only inside the `channel === "sms"` branch.
