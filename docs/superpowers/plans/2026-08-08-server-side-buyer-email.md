# Server-Side Buyer Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the client-side `sms:`/`mailto:` deep-link flow on `/sell` with a real server-side email to the matched buyer, CC'ing the site owner, and remove the now-redundant Text/Email button split in favor of one "Request Quote" action.

**Architecture:** `/api/leads` gains buyer-email lookup (server-side, by `matchedCompanyId` — never trusting a client-supplied address) and a real send via a new error-surfacing email function. `SellFlowClient` drops its `channel` concept and `window.open()` calls; a single button per buyer card (shown only when the buyer has an email on file) triggers the same POST as before.

**Tech Stack:** Next.js 16.2.9 App Router, Supabase Postgres, `nodemailer` (existing Gmail SMTP setup in `lib/email.ts`), Vitest.

## Global Constraints

- CC address on every buyer notification email: `feldon.richards@gmail.com` (exact address, hardcoded — not an env var, not configurable in this plan).
- A buyer only gets a working "Request Quote" button when `email` is present on their `companies` row — phone-only buyers (23 of 30 active buyers today) show no button and no misleading "create an account" gate message, since there's nothing behind the gate for them.
- The `leads.channel` column is always written as `'email'` now — no DB migration, just a different value from the API.
- `/directory` and `/company/[slug]` are untouched — the `sms:`/`mailto:` pattern being replaced exists only in `app/sell/SellFlowClient.tsx`.
- Every test file hits the real Supabase project directly via `supabaseAdmin` (`lib/supabase-admin.ts`) with bounded `afterEach` cleanup — this repo's established no-mocked-DB convention. The ONE existing exception is `lib/__tests__/email.test.ts`, which mocks `nodemailer` itself (not Supabase) so tests never send real email over the wire — this plan follows that same precedent for anything that would otherwise send a real email during a test run (mock the email-sending call, keep everything else — DB writes, company lookups — real).
- Never use `.single()` in a query that could match 0 or 2+ rows — use `.maybeSingle()`.
- The lead record is always created before the email send is attempted — a failed send never loses the customer's submitted order/contact info (the lead row already exists by that point).

---

### Task 1: `lib/email.ts` — CC support and an error-surfacing send

**Files:**
- Modify: `lib/email.ts`
- Test: `lib/__tests__/email.test.ts` (extend the existing file)

**Interfaces:**
- Consumes: nothing new.
- Produces: `SendEmailInput` gains `cc?: string`. New `sendEmailOrThrow(input: SendEmailInput): Promise<void>` — same transport as `sendEmail`, but rejects instead of logging-and-swallowing on failure. Task 4 (`/api/leads`) uses `sendEmailOrThrow` so it can detect and report a failed buyer notification; the existing `sendEmail` (used by admin password reset) keeps its current silent-swallow behavior unchanged.

- [ ] **Step 1: Read the current file first**

Read `lib/email.ts` in full before editing — confirm it matches what's described below (it should, this is the file as of the last commit on `main`).

- [ ] **Step 2: Write the failing tests**

Add these two `it` blocks inside the existing `describe('sendEmail', ...)` — no, actually add a new `describe('sendEmailOrThrow', ...)` block, appended after the existing `describe('sendEmail', ...)` block in `lib/__tests__/email.test.ts`:

```typescript
describe('sendEmailOrThrow', () => {
  it('sends with the expected fields including cc', async () => {
    sendMailMock.mockResolvedValueOnce(undefined)
    await sendEmailOrThrow({ to: 'test@example.com', cc: 'owner@example.com', subject: 'Hi', html: '<p>hi</p>' })
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'test@example.com', cc: 'owner@example.com', subject: 'Hi', html: '<p>hi</p>' })
    )
  })

  it('rethrows when the send fails', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP down'))
    await expect(
      sendEmailOrThrow({ to: 'test@example.com', subject: 'Hi', html: '<p>hi</p>' })
    ).rejects.toThrow('SMTP down')
  })
})
```

Also update the import line at the top of the test file from:

```typescript
const { sendEmail } = await import('@/lib/email')
```

to:

```typescript
const { sendEmail, sendEmailOrThrow } = await import('@/lib/email')
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- email.test`
Expected: FAIL — `sendEmailOrThrow` is not exported from `@/lib/email` yet.

- [ ] **Step 3: Update `lib/email.ts`**

Add `cc` to the type and add the new function. The full file should read:

```typescript
import nodemailer from 'nodemailer'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export type SendEmailInput = {
  to: string
  cc?: string
  subject: string
  html: string
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      html: input.html,
    })
  } catch (error) {
    console.error('[sendEmail] failed to send', { to: input.to, subject: input.subject }, error)
  }
}

export async function sendEmailOrThrow(input: SendEmailInput): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    html: input.html,
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- email.test`
Expected: PASS (4/4 — the 2 existing `sendEmail` tests plus the 2 new `sendEmailOrThrow` tests)

- [ ] **Step 5: Commit**

```bash
git add lib/email.ts lib/__tests__/email.test.ts
git commit -m "feat: add cc support and sendEmailOrThrow to lib/email"
```

---

### Task 2: `lib/order-matching.ts` — `getCompanyContact`

**Files:**
- Modify: `lib/order-matching.ts`
- Test: `lib/__tests__/order-matching.test.ts` (extend the existing file)

**Interfaces:**
- Consumes: the existing `supabase` anon client already imported in `lib/order-matching.ts`.
- Produces: `getCompanyContact(companyId: string): Promise<{ name: string; email: string | null } | null>` — `null` when no company matches the id. Task 4 (`/api/leads`) uses this to look up the matched buyer's real email server-side.

- [ ] **Step 1: Read the current files first**

Read `lib/order-matching.ts` and `lib/__tests__/order-matching.test.ts` in full before editing.

- [ ] **Step 2: Write the failing test**

Add this `describe` block at the end of `lib/__tests__/order-matching.test.ts`:

```typescript
describe('getCompanyContact', () => {
  const TEST_SLUG_CONTACT = 'test-order-matching-contact-lookup'
  let testCompanyId: string

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

  afterAll(async () => {
    await supabaseAdmin.from('companies').delete().eq('slug', TEST_SLUG_CONTACT)
  })

  it('returns the name and email for an existing company', async () => {
    const result = await getCompanyContact(testCompanyId)
    expect(result).toEqual({ name: 'Test Contact Lookup Co', email: 'contact-lookup-test@example.com' })
  })

  it('returns null for a company id that does not exist', async () => {
    const result = await getCompanyContact('00000000-0000-0000-0000-000000000000')
    expect(result).toBeNull()
  })
})
```

Update the import line at the top of the test file from:

```typescript
import { matchBuyersForState, getMailInFallback } from '@/lib/order-matching'
```

to:

```typescript
import { matchBuyersForState, getMailInFallback, getCompanyContact } from '@/lib/order-matching'
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- order-matching.test`
Expected: FAIL — `getCompanyContact` is not exported yet.

- [ ] **Step 4: Add `getCompanyContact` to `lib/order-matching.ts`**

Append this function at the end of the file (after `getMailInFallback`):

```typescript
export async function getCompanyContact(companyId: string): Promise<{ name: string; email: string | null } | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('name, email')
    .eq('id', companyId)
    .maybeSingle()

  if (error) throw new Error(`Company lookup failed: ${error.message}`)
  return data
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- order-matching.test`
Expected: PASS (5/5 — 2 existing `matchBuyersForState` tests, 1 existing `getMailInFallback` test, 2 new `getCompanyContact` tests)

- [ ] **Step 6: Commit**

```bash
git add lib/order-matching.ts lib/__tests__/order-matching.test.ts
git commit -m "feat: add getCompanyContact for server-side buyer email lookup"
```

---

### Task 3: `lib/message-template.ts` — `buildBuyerEmail`

**Files:**
- Modify: `lib/message-template.ts`
- Test: `lib/__tests__/message-template.test.ts` (create — check first whether this file already exists; if it does, read it and add to it instead of overwriting)

**Interfaces:**
- Consumes: `escapeHtml` from `lib/email.ts` (Task 1, unchanged signature), `OrderItem` from `lib/types`.
- Produces: `buildBuyerEmail(items: OrderItem[], customerName: string, customerPhone: string | undefined, customerEmail: string | undefined): { subject: string; html: string }`. Task 4 (`/api/leads`) uses this to build the email sent to the matched buyer.

- [ ] **Step 1: Check for an existing test file**

Run: `ls lib/__tests__/message-template.test.ts 2>/dev/null || echo "does not exist"` — if it exists, read it first and add the new test alongside what's there instead of following Step 2 as a full-file write.

- [ ] **Step 2: Write the failing test**

If `lib/__tests__/message-template.test.ts` does not exist, create it with this content. If it does exist, add this `describe` block to it and add `buildBuyerEmail` to the existing import line.

```typescript
import { describe, it, expect } from 'vitest'
import { buildBuyerEmail } from '@/lib/message-template'
import type { OrderItem } from '@/lib/types'

describe('buildBuyerEmail', () => {
  const items: OrderItem[] = [
    { brand: 'OneTouch Verio', count: 2, expiration: '2027-01', condition: 'sealed' },
  ]

  it('includes the customer name in the subject', () => {
    const { subject } = buildBuyerEmail(items, 'Jane Doe', undefined, undefined)
    expect(subject).toContain('Jane Doe')
  })

  it('includes item details in the html body', () => {
    const { html } = buildBuyerEmail(items, 'Jane Doe', undefined, undefined)
    expect(html).toContain('OneTouch Verio')
    expect(html).toContain('2027-01')
    expect(html).toContain('sealed')
  })

  it('includes phone and email when provided', () => {
    const { html } = buildBuyerEmail(items, 'Jane Doe', '5551234567', 'jane@example.com')
    expect(html).toContain('5551234567')
    expect(html).toContain('jane@example.com')
  })

  it('omits phone/email lines when not provided', () => {
    const { html } = buildBuyerEmail(items, 'Jane Doe', undefined, undefined)
    expect(html).not.toContain('Phone:')
    expect(html).not.toContain('Email:')
  })

  it('escapes html-unsafe characters in the customer name', () => {
    const { html } = buildBuyerEmail(items, '<script>alert(1)</script>', undefined, undefined)
    expect(html).not.toContain('<script>')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- message-template.test`
Expected: FAIL — `buildBuyerEmail` is not exported yet.

- [ ] **Step 4: Add `buildBuyerEmail` to `lib/message-template.ts`**

Read the current file first, then append (keep the existing `buildQuoteMessage` function unchanged — it's left in place per the spec, not removed):

```typescript
import { escapeHtml } from './email'

export function buildBuyerEmail(
  items: OrderItem[],
  customerName: string,
  customerPhone: string | undefined,
  customerEmail: string | undefined
): { subject: string; html: string } {
  const itemRows = items
    .map(
      (item) =>
        `<li>${escapeHtml(item.brand)} × ${item.count} box${item.count === 1 ? '' : 'es'} (exp: ${escapeHtml(item.expiration)}, ${escapeHtml(item.condition)})</li>`
    )
    .join('')

  const contactLines = [
    `<p><strong>Name:</strong> ${escapeHtml(customerName)}</p>`,
    customerPhone ? `<p><strong>Phone:</strong> ${escapeHtml(customerPhone)}</p>` : '',
    customerEmail ? `<p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>` : '',
  ].join('')

  const html = `
    <p>New quote request from cash4teststripsusa.com:</p>
    ${contactLines}
    <p><strong>Items:</strong></p>
    <ul>${itemRows}</ul>
  `

  return {
    subject: `New quote request from ${customerName} — cash4teststripsusa.com`,
    html,
  }
}
```

Add the `import { escapeHtml } from './email'` line at the top of `lib/message-template.ts`, alongside the existing `import type { OrderItem } from './types'` line.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- message-template.test`
Expected: PASS (5/5)

- [ ] **Step 6: Commit**

```bash
git add lib/message-template.ts lib/__tests__/message-template.test.ts
git commit -m "feat: add buildBuyerEmail for server-side lead notifications"
```

---

### Task 4: `/api/leads` — buyer lookup, real send, drop `channel`

**Files:**
- Modify: `app/api/leads/route.ts` (full replacement)
- Modify: `app/api/leads/__tests__/route.test.ts` (full replacement)

**Interfaces:**
- Consumes: `getCompanyContact` (Task 2), `buildBuyerEmail` (Task 3), `sendEmailOrThrow` (Task 1), `createServerSupabaseClient` (existing), `createLead` (existing, unchanged signature — `channel` is now always passed as `'email'`).
- Produces: `POST /api/leads` request body no longer accepts/requires `channel`; requires `matchedCompanyId` (was previously optional/nullable — now required, since the buyer lookup depends on it). Response body on success is `{ leadId: string }` (previously also returned `message`; the client already has the buyer's name in its own state and no longer needs a message back). Task 5 (`SellFlowClient`) is the only consumer of this route.

Read the current `app/api/leads/route.ts` and `app/api/leads/__tests__/route.test.ts` in full before editing — the test file already has a `createServerSupabaseClient` mock pattern from earlier work; keep that pattern, add a `sendEmailOrThrow` mock alongside it.

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

vi.mock('@/lib/email', () => ({
  sendEmailOrThrow: (...args: unknown[]) => mockSendEmailOrThrow(...args),
}))

const { POST } = await import('../route')

const cleanupLeadIds: string[] = []
const cleanupCompanyIds: string[] = []

afterEach(async () => {
  if (cleanupLeadIds.length) {
    await supabaseAdmin.from('leads').delete().in('id', cleanupLeadIds)
    cleanupLeadIds.length = 0
  }
  if (cleanupCompanyIds.length) {
    await supabaseAdmin.from('companies').delete().in('id', cleanupCompanyIds)
    cleanupCompanyIds.length = 0
  }
})

async function createTestCompany(overrides: { email?: string | null } = {}) {
  const suffix = Date.now()
  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert({
      name: `Leads Route Test Co ${suffix}`,
      slug: `leads-route-test-co-${suffix}`,
      email: overrides.email === undefined ? `buyer-test-${suffix}@example.com` : overrides.email,
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
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(401)
  })

  it('returns 400 when items is empty', async () => {
    const response = await POST(makeRequest({ items: [], matchedCompanyId: 'irrelevant', name: 'Jane Doe' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when matchedCompanyId is missing', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
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
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when name is blank', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: 'irrelevant',
        name: '   ',
      })
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when the matched buyer has no email on file', async () => {
    const companyId = await createTestCompany({ email: null })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
    expect(mockSendEmailOrThrow).not.toHaveBeenCalled()
  })

  it('returns 400 when the matched buyer does not exist', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: '00000000-0000-0000-0000-000000000000',
        name: 'Jane Doe',
      })
    )
    expect(response.status).toBe(400)
  })

  it('creates a lead and emails the buyer, CC-ing the owner', async () => {
    const companyId = await createTestCompany({ email: 'buyer-real@example.com' })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
        sourcePage: '/sell',
        name: 'Jane Doe',
        phone: '5551234567',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.leadId).toBeDefined()
    cleanupLeadIds.push(body.leadId)

    expect(mockSendEmailOrThrow).toHaveBeenCalledTimes(1)
    const callArgs = mockSendEmailOrThrow.mock.calls[0][0]
    expect(callArgs.to).toBe('buyer-real@example.com')
    expect(callArgs.cc).toBe('feldon.richards@gmail.com')
    expect(callArgs.subject).toContain('Jane Doe')
    expect(callArgs.html).toContain('OneTouch Verio')
  })

  it('returns 500 and does not lose the lead when the email send fails', async () => {
    mockSendEmailOrThrow.mockRejectedValueOnce(new Error('SMTP down'))
    const companyId = await createTestCompany({ email: 'buyer-real@example.com' })
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: companyId,
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
Expected: FAIL — the route still requires `channel`, doesn't look up the buyer, doesn't call `sendEmailOrThrow`.

- [ ] **Step 3: Replace `app/api/leads/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createLead } from '@/lib/leads'
import { buildBuyerEmail } from '@/lib/message-template'
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
    const { items, matchedCompanyId, sourcePage, name, email, phone } = body ?? {}

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
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    }

    const buyer = await getCompanyContact(matchedCompanyId)
    if (!buyer || !buyer.email) {
      return NextResponse.json({ error: 'This buyer cannot be reached right now. Please try another buyer.' }, { status: 400 })
    }

    const trimmedPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : undefined
    const trimmedEmail = typeof email === 'string' && email.trim() ? email.trim() : undefined

    const lead = await createLead({
      items: items as OrderItem[],
      matchedCompanyId,
      channel: 'email',
      sourcePage: sourcePage ?? null,
      name: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
    })

    const { subject, html } = buildBuyerEmail(items as OrderItem[], name.trim(), trimmedPhone, trimmedEmail)

    try {
      await sendEmailOrThrow({ to: buyer.email, cc: OWNER_EMAIL, subject, html })
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- app/api/leads`
Expected: PASS (9/9)

- [ ] **Step 5: Commit**

```bash
git add app/api/leads/route.ts app/api/leads/__tests__/route.test.ts
git commit -m "feat: send buyer notification email server-side from /api/leads"
```

---

### Task 5: `SellFlowClient` — one "Request Quote" button, drop deep links

**Files:**
- Modify: `app/sell/SellFlowClient.tsx`

**Interfaces:**
- Consumes: `POST /api/leads` (Task 4) — no longer sends `channel` in the request body, expects `{ leadId: string }` on success (no longer reads `body.message`).
- Produces: no new exports — this is the final integration point where the customer sees the new flow.

Read the current `app/sell/SellFlowClient.tsx` in full before editing. This task only touches: the `message` state declaration, `handleSend`, the `"sent"` stage render, and the buyer-card button block inside the `"results"` stage. Do not touch anything else in this 538-line file (the `"build"` stage, item-building logic, the auto-fill effect, `RequiresAccount`/`AccountModal` wiring, or `runMatch`/`refreshMatchAfterAuth` — all unchanged).

- [ ] **Step 1: Remove the `message` state**

Find:

```tsx
  const [message, setMessage] = useState("");
```

Delete this line entirely.

- [ ] **Step 2: Replace `handleSend`**

Find:

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
      setMessage(body.message);
      setStage("sent");
      if (channel === "sms" && buyer.phone) {
        window.open(`sms:${buyer.phone}?body=${encodeURIComponent(body.message)}`, "_blank");
      } else if (channel === "email" && buyer.email) {
        window.open(`mailto:${buyer.email}?subject=${encodeURIComponent("Quote request from cash4teststripsusa.com")}&body=${encodeURIComponent(body.message)}`, "_blank");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }
```

Replace with:

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

- [ ] **Step 3: Replace the `"sent"` stage**

Find:

```tsx
  if (stage === "sent" && selectedBuyer) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-emerald-700 font-medium">Message ready for {selectedBuyer.name}.</p>
        <p className="text-sm text-gray-500">If your phone/email app didn&apos;t open, copy this and send it yourself:</p>
        <textarea readOnly value={message} className="border border-gray-200 rounded-lg p-3 text-sm h-40" />
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
      </div>
    );
  }
```

- [ ] **Step 4: Replace the buyer-card button block**

Find (inside the `"results"` stage, within `{cards.map((c) => ( ... ))}`):

```tsx
                <RequiresAccount onRequestAccount={() => setAccountModalOpen(true)}>
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
                </RequiresAccount>
```

Replace with (only render the gate/button at all when the buyer has an email — a phone-only buyer gets no button and no "create an account" prompt, since there'd be nothing behind it):

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

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: succeeds

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the updated `app/api/leads/__tests__/route.test.ts` from Task 4.

- [ ] **Step 8: Manual browser + live email verification**

Start `npm run dev`, then in a browser:

1. Log in as a real (or freshly-created test) account.
2. Build an order, search a state that matches a buyer with a real email on file (or use a test buyer you create for this — see cleanup note below).
3. Confirm the buyer card shows exactly one "Request Quote" button (no Text/Email split).
4. Click it. Confirm the page moves to a confirmation screen reading "Request sent to {buyer name}." with no textarea.
5. Check the buyer's actual inbox (or, if using a test buyer email you control, that inbox) — confirm a real email arrived with the correct subject, order items, customer contact info, and that `feldon.richards@gmail.com` is CC'd.
6. Search a state where the only match is a phone-only buyer (no email on file) — confirm that buyer's card shows no button and no "create an account" message.
7. If you created any test data (test company, test lead, test user) during this verification, clean it up the same way prior tasks in this project have, and confirm via SQL against the live Supabase project (`whgwneuarnrsktolmqdj`) that no stray rows remain.

Stop the dev server when done.

- [ ] **Step 9: Commit**

```bash
git add app/sell/SellFlowClient.tsx
git commit -m "feat: replace Text/Email deep links with a single server-sent Request Quote"
```

---

## Self-Review Notes

- **Spec coverage:** Architecture/Components (Tasks 1-4 build the pieces, Task 5 wires them in), Data Flow (Task 5's manual checklist walks the exact 3-step flow from the spec), Error Handling (buyer-no-email 400, send-failure 500 with lead preserved — both covered by Task 4's tests), Scope Discovery (phone-only buyers get no button — Task 5 Step 4), Out of Scope items (no migration, `buildQuoteMessage` left in place, `/directory`/`/company` untouched — none of this plan's tasks touch them) all have a task or are explicitly not touched.
- **Placeholder scan:** none found — every step has complete, runnable code.
- **Type consistency:** `getCompanyContact`'s return type (Task 2) — `{ name: string; email: string | null } | null` — matches exactly how Task 4's route destructures `buyer.email`/checks `!buyer.email`. `buildBuyerEmail`'s signature (Task 3) matches exactly how Task 4 calls it (`items`, `name.trim()`, `trimmedPhone`, `trimmedEmail` in that order). `sendEmailOrThrow`'s `SendEmailInput` (Task 1, with `cc?`) matches exactly how Task 4 calls it (`{ to, cc, subject, html }`).
