# Buyer Self-Service Portal & Order Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared-link buyer self-service portal (`/buyer`) and a price-free order builder (`/sell`) with buyer/mail-in matching, prefilled quote-request messaging, and a password-gated admin dashboard (`/admin`) — all backed by a review queue so nothing goes live without approval.

**Architecture:** Next.js 16 App Router, server components + route handlers, Supabase Postgres. Two Supabase clients: the existing anon client (`lib/supabase.ts`, RLS-restricted) for public reads/inserts, and a new service-role client (`lib/supabase-admin.ts`, RLS-bypassing) for admin-only reads and the approve/reject writes. Business logic lives in small, independently-testable `lib/*.ts` modules; route handlers and pages are thin wrappers around them.

**Tech Stack:** Next.js 16.2.9, React 19, TypeScript (strict), `@supabase/supabase-js`, Vitest (new dev dependency for this plan).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-04-buyer-portal-and-order-flow-design.md`
- No paid SMS/email service — messages open via `sms:`/`mailto:` links on the customer's own device (spec: "Send mechanism")
- `submissions` and `leads` tables: anon `INSERT` only, no anon `SELECT`, no anon `UPDATE` on `companies` — all admin reads/writes go through the service-role client (spec: "Error Handling — RLS enforcement")
- Every new buyer-facing route must be manually verified in a browser before being marked done (project convention: UI changes need a real browser check, not just automated tests)
- Supabase project ID for all migrations/queries: `whgwneuarnrsktolmqdj`
- Do not touch or commit unrelated pending local changes in this repo (`app/layout.tsx`, `app/blog/`, `lib/blog-posts.ts`, existing untracked migrations) — those are separate in-progress work

---

## Task 1: Add Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/__tests__/sanity.test.ts`

**Interfaces:**
- Produces: `npm test` script that all later tasks' tests run under

- [ ] **Step 1: Install Vitest**

```bash
cd /Users/feldonrichards/code/cash-for-test-strips-usa && npm install -D vitest
```

- [ ] **Step 2: Add the config file**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Add the test script to package.json**

In the `"scripts"` block, add:
```json
"test": "vitest run"
```

- [ ] **Step 4: Write a sanity test**

```typescript
// lib/__tests__/sanity.test.ts
import { describe, it, expect } from 'vitest'

describe('vitest setup', () => {
  it('runs a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: 1 passed

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/__tests__/sanity.test.ts
git commit -m "test: add vitest"
```

---

## Task 2: Service-role Supabase client

**Files:**
- Create: `lib/supabase-admin.ts`
- Modify: `.env.local` (not committed — gitignored)

**Interfaces:**
- Produces: `supabaseAdmin` — a Supabase client exported from `lib/supabase-admin.ts`, used by every later task that needs to bypass RLS

- [ ] **Step 1: Get the service-role key and add env vars**

This key is not retrievable via any automated tool — get it from the Supabase dashboard: https://supabase.com/dashboard/project/whgwneuarnrsktolmqdj/settings/api-keys → copy the `service_role` secret key.

Add to `.env.local` (create the keys, do not print the values anywhere):
```
SUPABASE_SERVICE_ROLE_KEY=<paste from dashboard>
ADMIN_PASSWORD=<pick a password for the admin dashboard>
ADMIN_SESSION_SECRET=<any long random string>
```

Also add these same three to the Vercel project's Production env vars (Project → Settings → Environment Variables) before this ships — flag this to the user rather than doing it silently, since it's a production env var change.

- [ ] **Step 2: Write the client**

```typescript
// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
```

- [ ] **Step 3: Write a smoke test**

```typescript
// lib/__tests__/supabase-admin.test.ts
import { describe, it, expect } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'

describe('supabaseAdmin', () => {
  it('can query companies bypassing RLS active filter', async () => {
    const { data, error } = await supabaseAdmin.from('companies').select('id').limit(1)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })
})
```

- [ ] **Step 4: Run it**

Run: `npm test`
Expected: PASS. If it fails with an auth error, double check `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase-admin.ts lib/__tests__/supabase-admin.test.ts
git commit -m "feat: add service-role Supabase client"
```

---

## Task 3: Database migration — schema + RLS + mail-in row

**Files:**
- Create: `supabase/migrations/20260804000000_buyer_portal_and_orders.sql`
- Create: `lib/__tests__/schema.test.ts`

**Interfaces:**
- Produces: `companies.email`, `companies.mail_in`, `submissions` table, `leads.items`/`leads.channel`/`leads.matched_company_id`, one `mail_in = true` row in `companies` with slug `cfts-mail-in`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260804000000_buyer_portal_and_orders.sql

alter table companies add column email text;
alter table companies add column mail_in boolean not null default false;

create table submissions (
  id uuid primary key default gen_random_uuid(),
  target_company_id uuid references companies(id),
  payload jsonb not null,
  submitted_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table submissions enable row level security;

create policy submissions_insert_anon on submissions
  for insert
  to public
  with check (true);

alter table leads add column items jsonb;
alter table leads add column channel text check (channel in ('sms', 'email'));
alter table leads add column matched_company_id uuid references companies(id);

insert into companies (name, slug, phone, mail_in, active, description, states)
values (
  'CFTS Mail-In',
  'cfts-mail-in',
  '5187799751',
  true,
  true,
  'Mail-in option for states without a local buyer.',
  '{}'
);
```

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool against project `whgwneuarnrsktolmqdj` with the SQL above (name: `buyer_portal_and_orders`). Do not use `execute_sql` for this — it's a schema change (DDL), which the project's tooling reserves for `apply_migration`.

- [ ] **Step 3: Write a schema + RLS verification test**

```typescript
// lib/__tests__/schema.test.ts
import { describe, it, expect } from 'vitest'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase-admin'

describe('buyer portal schema', () => {
  it('companies has email and mail_in columns', async () => {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('email, mail_in')
      .limit(1)
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })

  it('has exactly one active mail_in company with the CFTS Mail-In slug', async () => {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('id, slug, phone, active')
      .eq('mail_in', true)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].slug).toBe('cfts-mail-in')
    expect(data![0].active).toBe(true)
  })

  it('anon key can insert into submissions but cannot read it back', async () => {
    // NOTE: Postgres RLS governs INSERT...RETURNING through SELECT policies, not
    // the INSERT policy. Since anon has no SELECT policy on submissions (by design —
    // customers can write but not read others' data), any `.insert().select()` call
    // fails outright, even though the bare insert succeeds. So this test — and every
    // later insert into submissions/leads from the anon client — generates its own id
    // client-side and inserts it explicitly, instead of relying on RETURNING.
    const insertedId = crypto.randomUUID()
    const { error: insertError } = await supabase
      .from('submissions')
      .insert({
        id: insertedId,
        target_company_id: null,
        payload: { name: 'Schema Test Co', states: ['NY'] },
        submitted_phone: '5555550000',
      })
    expect(insertError).toBeNull()

    const { data: readBack } = await supabase
      .from('submissions')
      .select('id')
      .eq('id', insertedId)
    expect(readBack).toEqual([])

    // cleanup via admin client, since anon has no delete policy
    await supabaseAdmin.from('submissions').delete().eq('id', insertedId)
  })
})
```

- [ ] **Step 4: Run it**

Run: `npm test`
Expected: 3 passed

- [ ] **Step 4b: Tighten the insert policy (follow-up, found during review)**

Task review flagged that `submissions_insert_anon`'s `with check (true)` lets any anon caller (not just this app) insert a row with `status: 'approved'` and a fake `reviewed_at` already set, bypassing the intended pending→admin-review flow. The app's own `createSubmission` (Task 9) never sets those fields on insert, so this tightening has no effect on legitimate behavior.

Create `supabase/migrations/20260805000000_tighten_submissions_insert_policy.sql`:

```sql
-- supabase/migrations/20260805000000_tighten_submissions_insert_policy.sql

alter policy submissions_insert_anon on submissions
  with check (status = 'pending' and reviewed_at is null);
```

Apply via `apply_migration` against project `whgwneuarnrsktolmqdj` (name: `tighten_submissions_insert_policy`).

Add one more test to `lib/__tests__/schema.test.ts`, inside the `describe('buyer portal schema')` block:

```typescript
  it('rejects an anon insert that tries to pre-set status to approved', async () => {
    const spoofedId = crypto.randomUUID()
    const { error } = await supabase.from('submissions').insert({
      id: spoofedId,
      target_company_id: null,
      payload: { name: 'Spoof Test Co', states: ['NY'] },
      submitted_phone: '5555550099',
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    })
    expect(error).not.toBeNull()

    // cleanup in case the insert somehow succeeded
    await supabaseAdmin.from('submissions').delete().eq('id', spoofedId)
  })
```

Run `npm test` again — 4 tests in this file should now pass, output pristine.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260804000000_buyer_portal_and_orders.sql supabase/migrations/20260805000000_tighten_submissions_insert_policy.sql lib/__tests__/schema.test.ts
git commit -m "feat: migrate schema for buyer portal and order flow"
```

---

## Task 4: Shared types and state list (dedupe existing STATE_LABELS)

**Files:**
- Create: `lib/types.ts`
- Create: `lib/states.ts`
- Modify: `app/directory/page.tsx` (remove local `STATE_LABELS`, import from `lib/states.ts`)
- Modify: `app/company/[slug]/page.tsx` (remove local `STATE_LABELS`, import from `lib/states.ts`)
- Create: `lib/__tests__/states.test.ts`

**Interfaces:**
- Produces: `Company`, `OrderItem`, `SubmissionPayload` types from `lib/types.ts`; `STATE_LABELS: Record<string, string>` and `VALID_STATE_CODES: Set<string>` from `lib/states.ts`

- [ ] **Step 1: Write the shared types**

```typescript
// lib/types.ts
export type Company = {
  id: string
  name: string
  slug: string
  url: string | null
  email: string | null
  city: string | null
  owner_name: string | null
  states: string[]
  payment_methods: string[]
  accepted_brands: string[]
  rating: number | null
  description: string | null
  featured: boolean
  phone: string | null
}

export type OrderItem = {
  brand: string
  count: number
  expiration: string
  condition: 'sealed' | 'unsealed'
}

export type SubmissionPayload = {
  name: string
  phone?: string | null
  email?: string | null
  url?: string | null
  city?: string | null
  owner_name?: string | null
  states: string[]
  payment_methods?: string[]
  accepted_brands?: string[]
  description?: string | null
}
```

- [ ] **Step 2: Write the shared state list**

```typescript
// lib/states.ts
export const STATE_LABELS: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  CANADA: "Canada",
}

export const VALID_STATE_CODES = new Set(Object.keys(STATE_LABELS))
```

- [ ] **Step 3: Refactor `app/directory/page.tsx`**

Delete the local `STATE_LABELS` object (currently lines 27-39) and its `export` keyword usage elsewhere in that file. Add at the top of the file:

```typescript
import { STATE_LABELS } from "@/lib/states";
```

Also delete the local `Company` type (currently lines 12-25) and import it instead:

```typescript
import type { Company } from "@/lib/types";
```

- [ ] **Step 4: Refactor `app/company/[slug]/page.tsx`**

Same change: delete the local `STATE_LABELS` object (currently lines 6-18), add:

```typescript
import { STATE_LABELS } from "@/lib/states";
```

- [ ] **Step 5: Write a test for the state list**

```typescript
// lib/__tests__/states.test.ts
import { describe, it, expect } from 'vitest'
import { STATE_LABELS, VALID_STATE_CODES } from '@/lib/states'

describe('states', () => {
  it('has 50 states plus Canada', () => {
    expect(Object.keys(STATE_LABELS)).toHaveLength(51)
  })

  it('VALID_STATE_CODES matches STATE_LABELS keys', () => {
    expect(VALID_STATE_CODES.has('NY')).toBe(true)
    expect(VALID_STATE_CODES.has('CANADA')).toBe(true)
    expect(VALID_STATE_CODES.has('XX')).toBe(false)
  })
})
```

- [ ] **Step 6: Run it**

Run: `npm test`
Expected: all previous tests still pass, plus 2 new passes. Also run `npm run build` to confirm the two refactored pages still typecheck.

- [ ] **Step 7: Commit**

```bash
git add lib/types.ts lib/states.ts lib/__tests__/states.test.ts app/directory/page.tsx "app/company/[slug]/page.tsx"
git commit -m "refactor: extract shared types and state list"
```

---

## Task 5: Quote message template

**Files:**
- Create: `lib/message-template.ts`
- Create: `lib/__tests__/message-template.test.ts`

**Interfaces:**
- Consumes: `OrderItem` from `lib/types.ts`
- Produces: `buildQuoteMessage(items: OrderItem[]): string`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/__tests__/message-template.test.ts
import { describe, it, expect } from 'vitest'
import { buildQuoteMessage } from '@/lib/message-template'

describe('buildQuoteMessage', () => {
  it('includes the fixed intro line', () => {
    const message = buildQuoteMessage([
      { brand: 'OneTouch Verio', count: 3, expiration: '2027-01', condition: 'sealed' },
    ])
    expect(message).toContain(
      'I got your information from cash4teststripsusa.com. You are my local buyer. Can you give me a quote for the items in my cart?'
    )
  })

  it('lists each item with brand, count, expiration, and condition', () => {
    const message = buildQuoteMessage([
      { brand: 'OneTouch Verio', count: 3, expiration: '2027-01', condition: 'sealed' },
      { brand: 'FreeStyle Lite', count: 1, expiration: '2026-11', condition: 'unsealed' },
    ])
    expect(message).toContain('- OneTouch Verio × 3 boxes (exp: 2027-01, sealed)')
    expect(message).toContain('- FreeStyle Lite × 1 box (exp: 2026-11, unsealed)')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '@/lib/message-template'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/message-template.ts
import type { OrderItem } from './types'

export function buildQuoteMessage(items: OrderItem[]): string {
  const itemLines = items
    .map(
      (item) =>
        `- ${item.brand} × ${item.count} box${item.count === 1 ? '' : 'es'} (exp: ${item.expiration}, ${item.condition})`
    )
    .join('\n')

  return `I got your information from cash4teststripsusa.com. You are my local buyer. Can you give me a quote for the items in my cart?\n\n${itemLines}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add lib/message-template.ts lib/__tests__/message-template.test.ts
git commit -m "feat: add quote message template"
```

---

## Task 6: Buyer matching by state + mail-in fallback

**Files:**
- Create: `lib/order-matching.ts`
- Create: `lib/__tests__/order-matching.test.ts`

**Interfaces:**
- Consumes: `Company` from `lib/types.ts`, `supabase` from `lib/supabase.ts`
- Produces: `matchBuyersForState(stateCode: string): Promise<Company[]>`, `getMailInFallback(): Promise<Company | null>`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/__tests__/order-matching.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { matchBuyersForState, getMailInFallback } from '@/lib/order-matching'

const TEST_SLUG_FEATURED = 'test-order-matching-featured-vt'
const TEST_SLUG_PLAIN = 'test-order-matching-plain-vt'

beforeAll(async () => {
  await supabaseAdmin.from('companies').insert([
    { name: 'Test Featured VT Buyer', slug: TEST_SLUG_FEATURED, states: ['VT'], active: true, featured: true },
    { name: 'Test Plain VT Buyer', slug: TEST_SLUG_PLAIN, states: ['VT'], active: true, featured: false },
  ])
})

afterAll(async () => {
  await supabaseAdmin.from('companies').delete().in('slug', [TEST_SLUG_FEATURED, TEST_SLUG_PLAIN])
})

describe('matchBuyersForState', () => {
  it('returns matching active buyers with featured first', async () => {
    const results = await matchBuyersForState('VT')
    const slugs = results.map((c) => c.slug)
    expect(slugs.indexOf(TEST_SLUG_FEATURED)).toBeLessThan(slugs.indexOf(TEST_SLUG_PLAIN))
  })

  it('returns an empty array for a state with no buyers', async () => {
    const results = await matchBuyersForState('WY')
    expect(results.find((c) => c.slug === TEST_SLUG_FEATURED)).toBeUndefined()
  })
})

describe('getMailInFallback', () => {
  it('returns the CFTS Mail-In company', async () => {
    const result = await getMailInFallback()
    expect(result?.slug).toBe('cfts-mail-in')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '@/lib/order-matching'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/order-matching.ts
import { supabase } from './supabase'
import type { Company } from './types'

const COMPANY_FIELDS =
  'id, name, slug, url, email, city, owner_name, states, payment_methods, accepted_brands, rating, description, featured, phone'

export async function matchBuyersForState(stateCode: string): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_FIELDS)
    .eq('active', true)
    .eq('mail_in', false)
    .contains('states', [stateCode.toUpperCase()])
    .order('featured', { ascending: false })
    .order('name')

  if (error) throw new Error(`Match query failed: ${error.message}`)
  return (data ?? []) as Company[]
}

export async function getMailInFallback(): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_FIELDS)
    .eq('active', true)
    .eq('mail_in', true)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Mail-in lookup failed: ${error.message}`)
  return data as Company | null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add lib/order-matching.ts lib/__tests__/order-matching.test.ts
git commit -m "feat: add buyer matching by state and mail-in fallback"
```

---

## Task 7: Buyer lookup by phone

**Files:**
- Create: `lib/buyer-lookup.ts`
- Create: `lib/__tests__/buyer-lookup.test.ts`

**Interfaces:**
- Consumes: `Company` from `lib/types.ts`, `supabaseAdmin` from `lib/supabase-admin.ts`
- Produces: `lookupCompaniesByPhone(phone: string): Promise<Company[]>`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/__tests__/buyer-lookup.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { lookupCompaniesByPhone } from '@/lib/buyer-lookup'

const TEST_SLUG = 'test-buyer-lookup-phone'
const TEST_PHONE = '555-010-2000'

beforeAll(async () => {
  await supabaseAdmin
    .from('companies')
    .insert({ name: 'Test Lookup Co', slug: TEST_SLUG, phone: TEST_PHONE, states: [], active: false })
})

afterAll(async () => {
  await supabaseAdmin.from('companies').delete().eq('slug', TEST_SLUG)
})

describe('lookupCompaniesByPhone', () => {
  it('finds a company by phone regardless of formatting, even if inactive', async () => {
    const results = await lookupCompaniesByPhone('5550102000')
    expect(results.some((c) => c.slug === TEST_SLUG)).toBe(true)
  })

  it('returns an empty array when no phone matches', async () => {
    const results = await lookupCompaniesByPhone('0000000000')
    expect(results).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '@/lib/buyer-lookup'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/buyer-lookup.ts
import { supabaseAdmin } from './supabase-admin'
import type { Company } from './types'

const COMPANY_FIELDS =
  'id, name, slug, url, email, city, owner_name, states, payment_methods, accepted_brands, rating, description, featured, phone'

export async function lookupCompaniesByPhone(phone: string): Promise<Company[]> {
  const normalized = phone.replace(/[^0-9]/g, '')
  const { data, error } = await supabaseAdmin.from('companies').select(COMPANY_FIELDS)

  if (error) throw new Error(`Lookup failed: ${error.message}`)
  return (data ?? []).filter(
    (c) => c.phone && c.phone.replace(/[^0-9]/g, '') === normalized
  ) as Company[]
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add lib/buyer-lookup.ts lib/__tests__/buyer-lookup.test.ts
git commit -m "feat: add buyer lookup by phone"
```

---

## Task 8: Admin session auth

**Files:**
- Create: `lib/admin-auth.ts`
- Create: `lib/__tests__/admin-auth.test.ts`

**Interfaces:**
- Produces: `checkPassword(password: string): boolean`, `signSession(): string`, `isValidSession(cookieValue: string | undefined): boolean`, `ADMIN_SESSION_COOKIE_NAME: string`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/__tests__/admin-auth.test.ts
import { describe, it, expect } from 'vitest'
import { checkPassword, signSession, isValidSession } from '@/lib/admin-auth'

describe('admin-auth', () => {
  it('checkPassword accepts the configured password and rejects others', () => {
    expect(checkPassword(process.env.ADMIN_PASSWORD!)).toBe(true)
    expect(checkPassword('definitely-wrong')).toBe(false)
  })

  it('a freshly signed session is valid', () => {
    const session = signSession()
    expect(isValidSession(session)).toBe(true)
  })

  it('a tampered or missing session is invalid', () => {
    expect(isValidSession(undefined)).toBe(false)
    expect(isValidSession('admin-authenticated.tampered-signature')).toBe(false)
  })

  it('a session with no dot or extra dots is invalid', () => {
    expect(isValidSession('admin-authenticated')).toBe(false)
    expect(isValidSession('admin-authenticated.sig.extra')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '@/lib/admin-auth'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/admin-auth.ts
import crypto from 'crypto'

export const ADMIN_SESSION_COOKIE_NAME = 'cfts_admin_session'

const SESSION_VALUE = 'admin-authenticated'

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return password === expected
}

function sign(value: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return crypto.createHmac('sha256', secret).update(value).digest('hex')
}

export function signSession(): string {
  return `${SESSION_VALUE}.${sign(SESSION_VALUE)}`
}

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return false
  const [value, sig] = parts
  if (value !== SESSION_VALUE || !sig) return false

  const expectedSig = sign(SESSION_VALUE)
  const sigBuffer = Buffer.from(sig)
  const expectedBuffer = Buffer.from(expectedSig)
  if (sigBuffer.length !== expectedBuffer.length) return false
  return crypto.timingSafeEqual(sigBuffer, expectedBuffer)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add lib/admin-auth.ts lib/__tests__/admin-auth.test.ts
git commit -m "feat: add admin session auth"
```

---

## Task 9: Submissions — validate, create, approve, reject

**Files:**
- Create: `lib/submissions.ts`
- Create: `lib/__tests__/submissions.test.ts`

**Interfaces:**
- Consumes: `SubmissionPayload` from `lib/types.ts`, `VALID_STATE_CODES` from `lib/states.ts`, `supabase` from `lib/supabase.ts`, `supabaseAdmin` from `lib/supabase-admin.ts`
- Produces: `validateSubmissionPayload(payload): { valid: boolean; errors: string[] }`, `createSubmission(input): Promise<Submission>`, `approveSubmission(id: string): Promise<void>`, `rejectSubmission(id: string): Promise<void>`, types `CreateSubmissionInput`, `Submission`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/__tests__/submissions.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  validateSubmissionPayload,
  createSubmission,
  approveSubmission,
  rejectSubmission,
} from '@/lib/submissions'

const cleanupCompanySlugs: string[] = []
const cleanupSubmissionIds: string[] = []

afterEach(async () => {
  // Submissions before companies: submissions.target_company_id has a foreign
  // key to companies(id), so deleting the company first would violate the
  // constraint and silently leave the company orphaned (found during Task 9).
  if (cleanupSubmissionIds.length) {
    await supabaseAdmin.from('submissions').delete().in('id', cleanupSubmissionIds)
    cleanupSubmissionIds.length = 0
  }
  if (cleanupCompanySlugs.length) {
    await supabaseAdmin.from('companies').delete().in('slug', cleanupCompanySlugs)
    cleanupCompanySlugs.length = 0
  }
})

describe('validateSubmissionPayload', () => {
  it('requires a name', () => {
    const result = validateSubmissionPayload({ name: '', states: ['NY'], phone: '5551234567' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Business name is required')
  })

  it('requires at least one contact method', () => {
    const result = validateSubmissionPayload({ name: 'Test Co', states: ['NY'] })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one contact method (phone or email) is required')
  })

  it('requires at least one valid state', () => {
    const result = validateSubmissionPayload({ name: 'Test Co', states: [], phone: '5551234567' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one state is required')
  })

  it('rejects invalid state codes', () => {
    const result = validateSubmissionPayload({ name: 'Test Co', states: ['ZZ'], phone: '5551234567' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid state code: ZZ')
  })

  it('accepts a valid payload', () => {
    const result = validateSubmissionPayload({ name: 'Test Co', states: ['NY'], phone: '5551234567' })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })
})

describe('createSubmission + approveSubmission (new buyer)', () => {
  it('creates a pending submission, then approving it inserts a new active company', async () => {
    const submission = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5559990001',
      payload: { name: 'Test New Buyer Co', states: ['NY'], phone: '5559990001' },
    })
    cleanupSubmissionIds.push(submission.id)
    expect(submission.status).toBe('pending')

    await approveSubmission(submission.id)

    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, name, active, slug')
      .eq('phone', '5559990001')
      .single()
    expect(company?.name).toBe('Test New Buyer Co')
    expect(company?.active).toBe(true)
    if (company) cleanupCompanySlugs.push(company.slug)

    const { data: updatedSubmission } = await supabaseAdmin
      .from('submissions')
      .select('status, reviewed_at')
      .eq('id', submission.id)
      .single()
    expect(updatedSubmission?.status).toBe('approved')
    expect(updatedSubmission?.reviewed_at).not.toBeNull()
  })
})

describe('createSubmission + approveSubmission (edit existing buyer)', () => {
  it('applies the payload onto the target company', async () => {
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test Edit Target Co', slug: 'test-edit-target-co', states: ['NY'], active: true, phone: '5559990002' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(existing!.slug)

    const submission = await createSubmission({
      targetCompanyId: existing!.id,
      submittedPhone: '5559990002',
      payload: { name: 'Test Edit Target Co', states: ['NY', 'NJ'], phone: '5559990099' },
    })
    cleanupSubmissionIds.push(submission.id)

    await approveSubmission(submission.id)

    const { data: updated } = await supabaseAdmin
      .from('companies')
      .select('states, phone')
      .eq('id', existing!.id)
      .single()
    expect(updated?.phone).toBe('5559990099')
    expect(updated?.states).toEqual(['NY', 'NJ'])
  })

  it('the FK constraint prevents deleting a company a pending submission still targets', async () => {
    // Correction from an earlier version of this plan: it asked for a test where
    // a target company is deleted before approval, expecting approveSubmission to
    // throw on the resulting zero-row update. Verified during implementation that
    // this scenario is actually unreachable — submissions.target_company_id -> companies.id
    // has no ON DELETE clause (default NO ACTION), so Postgres itself refuses the
    // delete with a foreign-key-violation (23503) while the submission still exists.
    // This test documents that protection directly, and the .select('id').single()
    // added to approveSubmission's update branch remains as defense-in-depth for
    // any other path that could produce a zero-row update (e.g. a bad id).
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Test FK Target Co', slug: 'test-fk-target-co', states: ['NY'], active: true, phone: '5559990098' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(existing!.slug)

    const submission = await createSubmission({
      targetCompanyId: existing!.id,
      submittedPhone: '5559990098',
      payload: { name: 'Test FK Target Co', states: ['NY'], phone: '5559990098' },
    })
    cleanupSubmissionIds.push(submission.id)

    const { error } = await supabaseAdmin.from('companies').delete().eq('id', existing!.id)
    expect(error).not.toBeNull()
    expect(error?.code).toBe('23503')
  })
})

describe('rejectSubmission', () => {
  it('marks the submission rejected without touching companies', async () => {
    const submission = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5559990003',
      payload: { name: 'Test Rejected Co', states: ['NY'], phone: '5559990003' },
    })
    cleanupSubmissionIds.push(submission.id)

    await rejectSubmission(submission.id)

    const { data: updatedSubmission } = await supabaseAdmin
      .from('submissions')
      .select('status')
      .eq('id', submission.id)
      .single()
    expect(updatedSubmission?.status).toBe('rejected')

    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('phone', '5559990003')
    expect(company).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '@/lib/submissions'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/submissions.ts
import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import { VALID_STATE_CODES } from './states'
import type { SubmissionPayload } from './types'

export function validateSubmissionPayload(payload: SubmissionPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!payload.name || payload.name.trim().length === 0) {
    errors.push('Business name is required')
  }
  if (!payload.phone && !payload.email) {
    errors.push('At least one contact method (phone or email) is required')
  }
  if (!payload.states || payload.states.length === 0) {
    errors.push('At least one state is required')
  } else {
    for (const state of payload.states) {
      if (!VALID_STATE_CODES.has(state)) {
        errors.push(`Invalid state code: ${state}`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

export type CreateSubmissionInput = {
  targetCompanyId: string | null
  payload: SubmissionPayload
  submittedPhone: string
}

export type Submission = {
  id: string
  target_company_id: string | null
  payload: SubmissionPayload
  submitted_phone: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at: string | null
}

export async function createSubmission(input: CreateSubmissionInput): Promise<Submission> {
  const validation = validateSubmissionPayload(input.payload)
  if (!validation.valid) {
    throw new Error(`Invalid submission: ${validation.errors.join(', ')}`)
  }

  // Generate the id client-side and insert it explicitly rather than relying on
  // `.select()`/RETURNING: Postgres RLS governs RETURNING through SELECT policies,
  // and anon intentionally has no SELECT policy on submissions (write-only, by design).
  // `.insert().select()` would fail outright even though the bare insert succeeds.
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const { error } = await supabase.from('submissions').insert({
    id,
    target_company_id: input.targetCompanyId,
    payload: input.payload,
    submitted_phone: input.submittedPhone,
  })

  if (error) throw new Error(`Failed to create submission: ${error.message}`)

  return {
    id,
    target_company_id: input.targetCompanyId,
    payload: input.payload,
    submitted_phone: input.submittedPhone,
    status: 'pending',
    created_at: createdAt,
    reviewed_at: null,
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function approveSubmission(submissionId: string): Promise<void> {
  const { data: submission, error: fetchError } = await supabaseAdmin
    .from('submissions')
    .select('id, target_company_id, payload, status')
    .eq('id', submissionId)
    .single()

  if (fetchError || !submission) throw new Error('Submission not found')
  if (submission.status !== 'pending') throw new Error('Submission already reviewed')

  const payload = submission.payload as SubmissionPayload
  const companyData = {
    name: payload.name,
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    url: payload.url ?? null,
    city: payload.city ?? null,
    owner_name: payload.owner_name ?? null,
    states: payload.states,
    payment_methods: payload.payment_methods ?? [],
    accepted_brands: payload.accepted_brands ?? [],
    description: payload.description ?? null,
    active: true,
  }

  if (submission.target_company_id) {
    // .select().single() is safe here (supabaseAdmin bypasses RLS) and catches
    // the case where the target company was deleted between submission and
    // approval — Supabase-js doesn't error on a zero-row update by default,
    // so without this the submission would silently mark itself approved
    // even though nothing was actually updated.
    const { error } = await supabaseAdmin
      .from('companies')
      .update(companyData)
      .eq('id', submission.target_company_id)
      .select('id')
      .single()
    if (error) throw new Error(`Failed to update company: ${error.message}`)
  } else {
    const { error } = await supabaseAdmin
      .from('companies')
      .insert({ ...companyData, slug: slugify(payload.name) })
    if (error) throw new Error(`Failed to create company: ${error.message}`)
  }

  const { error: statusError } = await supabaseAdmin
    .from('submissions')
    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
  if (statusError) throw new Error(`Failed to update submission status: ${statusError.message}`)
}

export async function rejectSubmission(submissionId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('submissions')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
  if (error) throw new Error(`Failed to reject submission: ${error.message}`)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add lib/submissions.ts lib/__tests__/submissions.test.ts
git commit -m "feat: add submission validate/create/approve/reject"
```

---

## Task 10: Leads

**Files:**
- Create: `lib/leads.ts`
- Create: `lib/__tests__/leads.test.ts`

**Interfaces:**
- Consumes: `OrderItem` from `lib/types.ts`, `supabase` from `lib/supabase.ts`
- Produces: `createLead(input: CreateLeadInput): Promise<Lead>`, types `CreateLeadInput`, `Lead`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/__tests__/leads.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLead } from '@/lib/leads'

const cleanupIds: string[] = []

afterEach(async () => {
  if (cleanupIds.length) {
    await supabaseAdmin.from('leads').delete().in('id', cleanupIds)
    cleanupIds.length = 0
  }
})

describe('createLead', () => {
  it('inserts a lead with items, channel, and matched company', async () => {
    const lead = await createLead({
      items: [{ brand: 'OneTouch Verio', count: 2, expiration: '2027-01', condition: 'sealed' }],
      matchedCompanyId: null,
      channel: 'sms',
      sourcePage: '/sell',
    })
    cleanupIds.push(lead.id)

    expect(lead.channel).toBe('sms')
    expect(lead.items).toHaveLength(1)
    expect(lead.source_page).toBe('/sell')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '@/lib/leads'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/leads.ts
import { supabase } from './supabase'
import type { OrderItem } from './types'

export type CreateLeadInput = {
  items: OrderItem[]
  matchedCompanyId: string | null
  channel: 'sms' | 'email'
  sourcePage: string | null
}

export type Lead = {
  id: string
  items: OrderItem[]
  matched_company_id: string | null
  channel: string
  source_page: string | null
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
  })

  if (error) throw new Error(`Failed to create lead: ${error.message}`)

  return {
    id,
    items: input.items,
    matched_company_id: input.matchedCompanyId,
    channel: input.channel,
    source_page: input.sourcePage,
    created_at: createdAt,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add lib/leads.ts lib/__tests__/leads.test.ts
git commit -m "feat: add lead creation"
```

---

## Task 11: API route — buyer lookup

**Files:**
- Create: `app/api/buyer-lookup/route.ts`
- Create: `app/api/buyer-lookup/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `lookupCompaniesByPhone` from `lib/buyer-lookup.ts`
- Produces: `POST` handler — request body `{ phone: string }`, response `{ companies: Company[] }` (200) or `{ error: string }` (400)

- [ ] **Step 1: Write the failing test**

```typescript
// app/api/buyer-lookup/__tests__/route.test.ts
import { describe, it, expect } from 'vitest'
import { POST } from '../route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/buyer-lookup', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/buyer-lookup', () => {
  it('returns 400 when phone is missing', async () => {
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns an empty companies array for an unknown phone', async () => {
    const response = await POST(makeRequest({ phone: '0000000000' }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.companies).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../route'"

- [ ] **Step 3: Write the implementation**

```typescript
// app/api/buyer-lookup/route.ts
import { NextResponse } from 'next/server'
import { lookupCompaniesByPhone } from '@/lib/buyer-lookup'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const phone = body?.phone

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 })
    }

    const companies = await lookupCompaniesByPhone(phone)
    return NextResponse.json({ companies })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add app/api/buyer-lookup/route.ts "app/api/buyer-lookup/__tests__/route.test.ts"
git commit -m "feat: add buyer lookup API route"
```

---

## Task 12: API route — submissions

**Files:**
- Create: `app/api/submissions/route.ts`
- Create: `app/api/submissions/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `createSubmission` from `lib/submissions.ts`
- Produces: `POST` handler — body `{ targetCompanyId: string | null, submittedPhone: string, payload: SubmissionPayload }`, response `{ submissionId: string }` (200) or `{ error: string }` (400)

- [ ] **Step 1: Write the failing test**

```typescript
// app/api/submissions/__tests__/route.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { POST } from '../route'

const cleanupIds: string[] = []

afterEach(async () => {
  if (cleanupIds.length) {
    await supabaseAdmin.from('submissions').delete().in('id', cleanupIds)
    cleanupIds.length = 0
  }
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/submissions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/submissions', () => {
  it('returns 400 for an invalid payload', async () => {
    const response = await POST(
      makeRequest({ targetCompanyId: null, submittedPhone: '5551234567', payload: { name: '', states: [] } })
    )
    expect(response.status).toBe(400)
  })

  it('creates a pending submission for a valid payload', async () => {
    const response = await POST(
      makeRequest({
        targetCompanyId: null,
        submittedPhone: '5551234568',
        payload: { name: 'Route Test Co', states: ['NY'], phone: '5551234568' },
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.submissionId).toBeDefined()
    cleanupIds.push(body.submissionId)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../route'"

- [ ] **Step 3: Write the implementation**

```typescript
// app/api/submissions/route.ts
import { NextResponse } from 'next/server'
import { createSubmission, validateSubmissionPayload } from '@/lib/submissions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { targetCompanyId, submittedPhone, payload } = body ?? {}

    if (!submittedPhone || !payload) {
      return NextResponse.json({ error: 'submittedPhone and payload are required' }, { status: 400 })
    }

    const validation = validateSubmissionPayload(payload)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 })
    }

    const submission = await createSubmission({
      targetCompanyId: targetCompanyId ?? null,
      submittedPhone,
      payload,
    })

    return NextResponse.json({ submissionId: submission.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add app/api/submissions/route.ts "app/api/submissions/__tests__/route.test.ts"
git commit -m "feat: add submissions API route"
```

---

## Task 13: API route — leads (order send)

**Files:**
- Create: `app/api/leads/route.ts`
- Create: `app/api/leads/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `createLead` from `lib/leads.ts`, `buildQuoteMessage` from `lib/message-template.ts`
- Produces: `POST` handler — body `{ items: OrderItem[], matchedCompanyId: string | null, channel: 'sms' | 'email', sourcePage?: string }`, response `{ leadId: string, message: string }` (200) or `{ error: string }` (400)

- [ ] **Step 1: Write the failing test**

```typescript
// app/api/leads/__tests__/route.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { POST } from '../route'

const cleanupIds: string[] = []

afterEach(async () => {
  if (cleanupIds.length) {
    await supabaseAdmin.from('leads').delete().in('id', cleanupIds)
    cleanupIds.length = 0
  }
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/leads', () => {
  it('returns 400 when items is empty', async () => {
    const response = await POST(makeRequest({ items: [], matchedCompanyId: null, channel: 'sms' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for an invalid channel', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'carrier-pigeon',
      })
    )
    expect(response.status).toBe(400)
  })

  it('creates a lead and returns the prefilled message', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'sms',
        sourcePage: '/sell',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.leadId).toBeDefined()
    expect(body.message).toContain('OneTouch Verio')
    cleanupIds.push(body.leadId)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../route'"

- [ ] **Step 3: Write the implementation**

```typescript
// app/api/leads/route.ts
import { NextResponse } from 'next/server'
import { createLead } from '@/lib/leads'
import { buildQuoteMessage } from '@/lib/message-template'
import type { OrderItem } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, matchedCompanyId, channel, sourcePage } = body ?? {}

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }
    if (channel !== 'sms' && channel !== 'email') {
      return NextResponse.json({ error: 'channel must be sms or email' }, { status: 400 })
    }

    const lead = await createLead({
      items: items as OrderItem[],
      matchedCompanyId: matchedCompanyId ?? null,
      channel,
      sourcePage: sourcePage ?? null,
    })
    const message = buildQuoteMessage(items as OrderItem[])

    return NextResponse.json({ leadId: lead.id, message })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add app/api/leads/route.ts "app/api/leads/__tests__/route.test.ts"
git commit -m "feat: add leads API route"
```

---

## Task 14: API routes — admin login and review

**Files:**
- Create: `app/api/admin/login/route.ts`
- Create: `app/api/admin/review/route.ts`
- Create: `app/api/admin/review/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `checkPassword`, `signSession`, `isValidSession`, `ADMIN_SESSION_COOKIE_NAME` from `lib/admin-auth.ts`; `approveSubmission`, `rejectSubmission` from `lib/submissions.ts`
- Produces: `POST /api/admin/login` — body `{ password: string }`, sets cookie on success; `POST /api/admin/review` — body `{ submissionId: string, action: 'approve' | 'rejected' }`, requires valid session cookie

- [ ] **Step 1: Write the failing test for the review route**

```typescript
// app/api/admin/review/__tests__/route.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { signSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { createSubmission } from '@/lib/submissions'
import { POST } from '../route'

const cleanupSubmissionIds: string[] = []
const cleanupCompanySlugs: string[] = []

afterEach(async () => {
  if (cleanupSubmissionIds.length) {
    await supabaseAdmin.from('submissions').delete().in('id', cleanupSubmissionIds)
    cleanupSubmissionIds.length = 0
  }
  if (cleanupCompanySlugs.length) {
    await supabaseAdmin.from('companies').delete().in('slug', cleanupCompanySlugs)
    cleanupCompanySlugs.length = 0
  }
})

function makeRequest(body: unknown, cookie?: string) {
  return new Request('http://localhost/api/admin/review', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookie}` } : {}),
    },
  })
}

describe('POST /api/admin/review', () => {
  it('rejects requests without a valid admin session', async () => {
    const response = await POST(makeRequest({ submissionId: 'x', action: 'approve' }))
    expect(response.status).toBe(401)
  })

  it('approves a pending submission when authenticated', async () => {
    const submission = await createSubmission({
      targetCompanyId: null,
      submittedPhone: '5551110000',
      payload: { name: 'Admin Review Test Co', states: ['NY'], phone: '5551110000' },
    })
    cleanupSubmissionIds.push(submission.id)

    const response = await POST(makeRequest({ submissionId: submission.id, action: 'approve' }, signSession()))
    expect(response.status).toBe(200)

    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('slug')
      .eq('phone', '5551110000')
      .single()
    if (company) cleanupCompanySlugs.push(company.slug)
    expect(company).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Cannot find module '../route'"

- [ ] **Step 3: Write the login route**

```typescript
// app/api/admin/login/route.ts
import { NextResponse } from 'next/server'
import { checkPassword, signSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const password = body?.password

    if (typeof password !== 'string' || !checkPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_SESSION_COOKIE_NAME, signSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 4: Write the review route**

```typescript
// app/api/admin/review/route.ts
import { NextResponse } from 'next/server'
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { approveSubmission, rejectSubmission } from '@/lib/submissions'

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? ''
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))
  return match?.slice(name.length + 1)
}

export async function POST(request: Request) {
  try {
    const session = getCookie(request, ADMIN_SESSION_COOKIE_NAME)
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { submissionId, action } = body ?? {}

    if (!submissionId || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'submissionId and a valid action are required' }, { status: 400 })
    }

    if (action === 'approve') {
      await approveSubmission(submissionId)
    } else {
      await rejectSubmission(submissionId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/login/route.ts app/api/admin/review/route.ts "app/api/admin/review/__tests__/route.test.ts"
git commit -m "feat: add admin login and review API routes"
```

---

## Task 15: Buyer portal page (`/buyer`)

**Files:**
- Create: `app/buyer/page.tsx`
- Create: `app/buyer/BuyerPortalClient.tsx`

**Interfaces:**
- Consumes: `POST /api/buyer-lookup`, `POST /api/submissions`, `STATE_LABELS` from `lib/states.ts`, `Company`/`SubmissionPayload` from `lib/types.ts`

- [ ] **Step 1: Write the page shell**

```typescript
// app/buyer/page.tsx
import type { Metadata } from "next";
import { BuyerPortalClient } from "./BuyerPortalClient";

export const metadata: Metadata = {
  title: "Manage Your Buyer Listing — Cash4TestStripsUSA",
  description: "Claim or create your buyer listing on Cash4TestStripsUSA.",
};

export default function BuyerPortalPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Your Listing</h1>
      <p className="text-gray-500 text-sm mb-8">
        Enter your phone number to edit your existing listing, or create a new one. Changes are reviewed before going live.
      </p>
      <BuyerPortalClient />
    </div>
  );
}
```

- [ ] **Step 2: Write the client component**

```typescript
// app/buyer/BuyerPortalClient.tsx
"use client";

import { useState } from "react";
import { STATE_LABELS } from "@/lib/states";
import type { Company, SubmissionPayload } from "@/lib/types";

type Stage = "phone" | "choose" | "form" | "submitted";

export function BuyerPortalClient() {
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [matches, setMatches] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [form, setForm] = useState<SubmissionPayload>({ name: "", states: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/buyer-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    const companies = body.companies as Company[];
    if (companies.length === 0) {
      setForm({ name: "", states: [], phone });
      setSelected(null);
      setStage("form");
    } else if (companies.length === 1) {
      setSelected(companies[0]);
      setForm({
        name: companies[0].name,
        phone: companies[0].phone,
        email: companies[0].email,
        url: companies[0].url,
        city: companies[0].city,
        owner_name: companies[0].owner_name,
        states: companies[0].states,
        payment_methods: companies[0].payment_methods,
        accepted_brands: companies[0].accepted_brands,
        description: companies[0].description,
      });
      setStage("form");
    } else {
      setMatches(companies);
      setStage("choose");
    }
  }

  function chooseCompany(company: Company) {
    setSelected(company);
    setForm({
      name: company.name,
      phone: company.phone,
      email: company.email,
      url: company.url,
      city: company.city,
      owner_name: company.owner_name,
      states: company.states,
      payment_methods: company.payment_methods,
      accepted_brands: company.accepted_brands,
      description: company.description,
    });
    setStage("form");
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.phone && !form.email) {
      setError("Enter a phone number or email so buyers/customers can reach you.");
      return;
    }
    if (form.states.length === 0) {
      setError("Select at least one state you serve.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetCompanyId: selected?.id ?? null, submittedPhone: phone, payload: form }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    setStage("submitted");
  }

  function toggleState(code: string) {
    setForm((f) => ({
      ...f,
      states: f.states.includes(code) ? f.states.filter((s) => s !== code) : [...f.states, code],
    }));
  }

  if (stage === "submitted") {
    return <p className="text-emerald-700 font-medium">Submitted — pending review. We'll email or call you once it's live.</p>;
  }

  if (stage === "phone") {
    return (
      <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Your phone number</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2"
          placeholder="518-555-0100"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
          {loading ? "Looking up..." : "Continue"}
        </button>
      </form>
    );
  }

  if (stage === "choose") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">Multiple listings share that phone number — which one is you?</p>
        {matches.map((c) => (
          <button
            key={c.id}
            onClick={() => chooseCompany(c)}
            className="text-left border border-gray-200 rounded-lg px-4 py-3 hover:border-emerald-400"
          >
            <p className="font-medium text-gray-900">{c.name}</p>
            <p className="text-xs text-gray-400">{c.city}</p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Business name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
        <input
          type="tel"
          value={form.phone ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Email (optional)</label>
        <input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">City</label>
        <input
          type="text"
          value={form.city ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">States you serve</label>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-2">
          {Object.entries(STATE_LABELS).map(([code, label]) => (
            <button
              type="button"
              key={code}
              onClick={() => toggleState(code)}
              className={`text-xs px-2 py-1 rounded-full border ${
                form.states.includes(code) ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
        {loading ? "Submitting..." : "Submit for review"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Manual browser verification**

Run `npm run dev`, open `http://localhost:3000/buyer`:
1. Enter a phone number not in the database → confirm the blank "create new profile" form appears
2. Fill in a name, phone, and at least one state, submit → confirm "Submitted — pending review" appears
3. Check via SQL (`select * from submissions order by created_at desc limit 1`) that the row landed with `status = 'pending'`
4. Enter an existing buyer's phone number (e.g. one from the current directory) → confirm the form pre-fills their real data
5. Submit with no phone or email filled in → confirm the inline validation error shows and nothing is submitted

- [ ] **Step 4: Commit**

```bash
git add app/buyer/page.tsx app/buyer/BuyerPortalClient.tsx
git commit -m "feat: add buyer self-service portal page"
```

---

## Task 16: Order builder page (`/sell`)

**Files:**
- Create: `app/sell/page.tsx`
- Create: `app/sell/SellFlowClient.tsx`

**Interfaces:**
- Consumes: `POST /api/leads`, `STATE_LABELS` from `lib/states.ts`, `Company`/`OrderItem` from `lib/types.ts`
- Produces: a new server route `app/api/sell/match/route.ts` (added in Step 1 below) wrapping `matchBuyersForState`/`getMailInFallback` for client-side fetch

- [ ] **Step 1: Add the matching API route**

```typescript
// app/api/sell/match/route.ts
import { NextResponse } from 'next/server'
import { matchBuyersForState, getMailInFallback } from '@/lib/order-matching'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const state = body?.state

    if (!state || typeof state !== 'string') {
      return NextResponse.json({ error: 'state is required' }, { status: 400 })
    }

    const buyers = await matchBuyersForState(state)
    if (buyers.length > 0) {
      return NextResponse.json({ buyers, mailIn: null })
    }

    const mailIn = await getMailInFallback()
    return NextResponse.json({ buyers: [], mailIn })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write the page shell**

```typescript
// app/sell/page.tsx
import type { Metadata } from "next";
import { SellFlowClient } from "./SellFlowClient";

export const metadata: Metadata = {
  title: "Sell Your Test Strips — Cash4TestStripsUSA",
  description: "Build your order and get connected to a local cash buyer — no prices, no signup.",
};

export default function SellPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Sell Your Test Strips</h1>
      <p className="text-gray-500 text-sm mb-8">Tell us what you have — we'll connect you to a local buyer.</p>
      <SellFlowClient />
    </div>
  );
}
```

- [ ] **Step 3: Write the client component**

```typescript
// app/sell/SellFlowClient.tsx
"use client";

import { useState } from "react";
import { STATE_LABELS } from "@/lib/states";
import type { Company, OrderItem } from "@/lib/types";

type Stage = "build" | "results" | "sent";

const emptyItem: OrderItem = { brand: "", count: 1, expiration: "", condition: "sealed" };

export function SellFlowClient() {
  const [stage, setStage] = useState<Stage>("build");
  const [state, setState] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ ...emptyItem }]);
  const [buyers, setBuyers] = useState<Company[]>([]);
  const [mailIn, setMailIn] = useState<Company | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<Company | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateItem(index: number, patch: Partial<OrderItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  async function handleFindBuyers(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!state) {
      setError("Select your state.");
      return;
    }
    if (items.some((i) => !i.brand || !i.count)) {
      setError("Fill in brand and count for every item.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/sell/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    setBuyers(body.buyers ?? []);
    setMailIn(body.mailIn ?? null);
    setStage("results");
  }

  async function handleSend(buyer: Company, channel: "sms" | "email") {
    setSelectedBuyer(buyer);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, matchedCompanyId: buyer.id, channel, sourcePage: "/sell" }),
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
  }

  if (stage === "sent" && selectedBuyer) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-emerald-700 font-medium">Message ready for {selectedBuyer.name}.</p>
        <p className="text-sm text-gray-500">If your phone/email app didn't open, copy this and send it yourself:</p>
        <textarea readOnly value={message} className="border border-gray-200 rounded-lg p-3 text-sm h-40" />
      </div>
    );
  }

  if (stage === "results") {
    const cards = buyers.length > 0 ? buyers : mailIn ? [mailIn] : [];
    if (cards.length === 0) {
      return (
        <p className="text-sm text-gray-500">
          We couldn't find a buyer for your area right now. Email{" "}
          <a href="mailto:feldon.richards@gmail.com" className="text-emerald-600 hover:underline">feldon.richards@gmail.com</a>{" "}
          or call <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> directly and we'll help you sell your strips.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {buyers.length === 0 && mailIn && (
          <p className="text-sm text-gray-500">No local buyer in your state yet — here's our mail-in option.</p>
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
                  className="text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg"
                >
                  Text
                </button>
              )}
              {c.email && (
                <button
                  onClick={() => handleSend(c, "email")}
                  className="text-xs font-medium border border-emerald-600 text-emerald-700 px-3 py-2 rounded-lg"
                >
                  Email
                </button>
              )}
            </div>
          </div>
        ))}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleFindBuyers} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Your state</label>
        <select value={state} onChange={(e) => setState(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2">
          <option value="">Select a state</option>
          {Object.entries(STATE_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 border border-gray-100 rounded-lg p-3">
          <input
            placeholder="Brand (e.g. OneTouch Verio)"
            value={item.brand}
            onChange={(e) => updateItem(i, { brand: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1 col-span-2"
          />
          <input
            type="number"
            min={1}
            placeholder="Box count"
            value={item.count}
            onChange={(e) => updateItem(i, { count: Number(e.target.value) })}
            className="border border-gray-200 rounded-lg px-2 py-1"
          />
          <input
            placeholder="Expiration (e.g. 2027-01)"
            value={item.expiration}
            onChange={(e) => updateItem(i, { expiration: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1"
          />
          <select
            value={item.condition}
            onChange={(e) => updateItem(i, { condition: e.target.value as OrderItem["condition"] })}
            className="border border-gray-200 rounded-lg px-2 py-1 col-span-2"
          >
            <option value="sealed">Sealed</option>
            <option value="unsealed">Unsealed</option>
          </select>
        </div>
      ))}
      <button type="button" onClick={addItem} className="text-sm text-emerald-600 self-start">+ Add another item</button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
        {loading ? "Finding buyers..." : "Find My Buyer"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Manual browser verification**

Run `npm run dev`, open `http://localhost:3000/sell`:
1. Pick a state with an existing active buyer, add one item, submit → confirm that buyer's card appears with a "Text" button
2. Click "Text" → confirm an `sms:` link attempt fires and the fallback message textarea shows the correct itemized text including the fixed intro line
3. Pick a state with zero buyers (e.g. one still blank in your master list) → confirm the "CFTS Mail-In" card appears instead
4. Check via SQL (`select * from leads order by created_at desc limit 1`) that the lead was logged with the right `items`, `channel`, and `matched_company_id`

- [ ] **Step 5: Commit**

```bash
git add app/api/sell/match/route.ts app/sell/page.tsx app/sell/SellFlowClient.tsx
git commit -m "feat: add order builder and buyer matching page"
```

---

## Task 17: Admin dashboard (`/admin`)

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/page.tsx`
- Create: `app/admin/AdminDashboardClient.tsx`
- Create: `app/api/admin/data/route.ts`

**Interfaces:**
- Consumes: `isValidSession`, `ADMIN_SESSION_COOKIE_NAME` from `lib/admin-auth.ts`, `supabaseAdmin` from `lib/supabase-admin.ts`, `POST /api/admin/review`

- [ ] **Step 1: Write the admin data API route**

```typescript
// app/api/admin/data/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
  if (!isValidSession(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [submissions, leads, clicks, missingPhones] = await Promise.all([
    supabaseAdmin.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('clicks').select('*').order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.from('companies').select('id, name, city, states').or('phone.is.null,phone.eq.'),
  ])

  return NextResponse.json({
    submissions: submissions.data ?? [],
    leads: leads.data ?? [],
    clicks: clicks.data ?? [],
    missingPhones: missingPhones.data ?? [],
  })
}
```

- [ ] **Step 2: Write the login page**

```typescript
// app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Wrong password");
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2"
          placeholder="Password"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">Log in</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Write the guarded admin page**

```typescript
// app/admin/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from "@/lib/admin-auth";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  if (!isValidSession(session)) {
    redirect("/admin/login");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <AdminDashboardClient />
    </div>
  );
}
```

- [ ] **Step 4: Write the dashboard client**

```typescript
// app/admin/AdminDashboardClient.tsx
"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  submissions: Array<{ id: string; payload: { name: string }; submitted_phone: string; target_company_id: string | null; created_at: string }>;
  leads: Array<{ id: string; items: unknown; channel: string; created_at: string }>;
  clicks: Array<{ id: string; company_id: string; created_at: string }>;
  missingPhones: Array<{ id: string; name: string; city: string | null }>;
};

export function AdminDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<"submissions" | "leads" | "clicks" | "missingPhones">("submissions");

  async function load() {
    const res = await fetch("/api/admin/data");
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function review(submissionId: string, action: "approve" | "reject") {
    await fetch("/api/admin/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId, action }),
    });
    load();
  }

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(["submissions", "leads", "clicks", "missingPhones"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm px-3 py-1.5 rounded-full border ${tab === t ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 text-gray-600"}`}
          >
            {t} ({data[t].length})
          </button>
        ))}
      </div>

      {tab === "submissions" && (
        <div className="flex flex-col gap-3">
          {data.submissions.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{s.payload.name}</p>
                <p className="text-xs text-gray-400">{s.target_company_id ? "Edit" : "New"} · submitted from {s.submitted_phone}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => review(s.id, "approve")} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg">Approve</button>
                <button onClick={() => review(s.id, "reject")} className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg">Reject</button>
              </div>
            </div>
          ))}
          {data.submissions.length === 0 && <p className="text-sm text-gray-400">No pending submissions.</p>}
        </div>
      )}

      {tab === "leads" && (
        <div className="flex flex-col gap-2">
          {data.leads.map((l) => (
            <div key={l.id} className="border border-gray-100 rounded-lg p-3 text-sm">
              <p>{l.channel} · {new Date(l.created_at).toLocaleString()}</p>
              <pre className="text-xs text-gray-500 mt-1">{JSON.stringify(l.items)}</pre>
            </div>
          ))}
        </div>
      )}

      {tab === "clicks" && (
        <div className="flex flex-col gap-2">
          {data.clicks.map((c) => (
            <div key={c.id} className="border border-gray-100 rounded-lg p-3 text-sm">
              {c.company_id} · {new Date(c.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      )}

      {tab === "missingPhones" && (
        <div className="flex flex-col gap-2">
          {data.missingPhones.map((c) => (
            <div key={c.id} className="border border-gray-100 rounded-lg p-3 text-sm">
              {c.name} — {c.city}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Manual browser verification**

Run `npm run dev`, open `http://localhost:3000/admin`:
1. Confirm it redirects to `/admin/login`
2. Enter the wrong password → confirm it shows "Wrong password"
3. Enter the correct `ADMIN_PASSWORD` from `.env.local` → confirm it redirects to `/admin` and shows tabs
4. Confirm the "submissions" tab shows any pending submission created during Task 15/16 testing, and that clicking "Approve" makes it disappear from the list and the corresponding company shows up in the live `/directory`
5. Confirm the "missingPhones" tab lists the same buyers found in the earlier manual query

- [ ] **Step 6: Commit**

```bash
git add app/admin/login/page.tsx app/admin/page.tsx app/admin/AdminDashboardClient.tsx app/api/admin/data/route.ts
git commit -m "feat: add admin dashboard"
```

---

## Task 18: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests across all tasks pass

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: builds cleanly with no type errors

- [ ] **Step 3: Full manual walkthrough — buyer edit flow**

1. `npm run dev`, go to `/buyer`
2. Enter a real existing buyer's phone number, change their city, submit
3. Go to `/admin`, log in, approve the submission
4. Go to `/directory`, confirm the city change is now live

- [ ] **Step 4: Full manual walkthrough — customer order flow**

1. Go to `/sell`, pick a state with an active buyer, add two items with different brands/conditions, submit
2. Pick the buyer, click "Text", confirm the fallback message textarea has the correct intro line and both items listed correctly
3. Go to `/admin` → "leads" tab, confirm the order shows up with the right items and channel

- [ ] **Step 5: Clean up any test data created during manual verification**

Check `select * from companies where name ilike '%test%'` and `select * from submissions` / `select * from leads` for anything created during manual walkthroughs (not the automated test suite, which already cleans up after itself) and delete via `supabaseAdmin` if needed.

- [ ] **Step 6: Final commit**

```bash
git status
```

Confirm nothing is left uncommitted from this plan (unrelated pre-existing changes noted in Global Constraints are fine to leave as-is).
