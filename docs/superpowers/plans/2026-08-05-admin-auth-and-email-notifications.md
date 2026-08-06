# Admin Password Reset & Email Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the admin password from an env var into the database (hashed) with a real "forgot password" email flow, and send automatic email notifications (buyer on approve/reject, Feldon on new submission) via the existing Gmail SMTP account.

**Architecture:** `lib/email.ts` wraps `nodemailer` behind a `sendEmail()` helper that never throws (failures are logged, not surfaced) — the only mocked test in this codebase, deliberately, since we never want real emails sent on every test run. `lib/admin-auth.ts` grows scrypt-based password hashing and reset-token lifecycle functions, all reading/writing two new RLS-locked (no policies, service-role-only) tables. Notification sends are wired directly into the existing `lib/submissions.ts` functions as fire-and-forget calls after each DB write succeeds.

**Tech Stack:** Next.js 16 App Router, TypeScript (strict), `@supabase/supabase-js`, Vitest, `nodemailer` (new dependency for this plan), Node's built-in `crypto` (scrypt) for hashing — no new hashing dependency.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-05-admin-auth-and-email-notifications-design.md`
- Email sends must NEVER block or fail the underlying operation (submission create, approve, reject) — every call site wraps `sendEmail` so a failure is logged, never thrown
- `admin_credentials` and `admin_reset_tokens`: RLS enabled, zero policies — only the service-role client (`supabaseAdmin`) may read/write either table
- Reset tokens are single-use (`used_at`) and expire in 30 minutes
- Never print or log the actual value of `SMTP_PASSWORD`, `ADMIN_PASSWORD`, or any password/token value in reports or commits
- Supabase project ID for all migrations/queries: `whgwneuarnrsktolmqdj`
- Admin notification recipient and reset-link recipient: `process.env.ADMIN_NOTIFY_EMAIL` (already set to `feldon.richards@gmail.com` in `.env.local` and Vercel Production)

---

## Task 1: Add nodemailer and `lib/email.ts`

**Files:**
- Modify: `package.json`
- Create: `lib/email.ts`
- Create: `lib/__tests__/email.test.ts`

**Interfaces:**
- Produces: `sendEmail(input: { to: string; subject: string; html: string }): Promise<void>` — never throws

- [ ] **Step 1: Install nodemailer**

```bash
cd /Users/feldonrichards/code/cash-for-test-strips-usa && npm install nodemailer && npm install -D @types/nodemailer
```

- [ ] **Step 2: Write the failing test**

This is the one deliberately-mocked test in the codebase — every other test in this repo hits the live database, but we never want a test run to send a real email. Mock `nodemailer` itself.

```typescript
// lib/__tests__/email.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const sendMailMock = vi.fn()
vi.mock('nodemailer', () => ({
  default: {
    createTransport: () => ({ sendMail: sendMailMock }),
  },
}))

const { sendEmail } = await import('@/lib/email')

describe('sendEmail', () => {
  beforeEach(() => {
    sendMailMock.mockReset()
  })

  it('sends with the expected fields', async () => {
    sendMailMock.mockResolvedValueOnce(undefined)
    await sendEmail({ to: 'test@example.com', subject: 'Hi', html: '<p>hi</p>' })
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'test@example.com', subject: 'Hi', html: '<p>hi</p>' })
    )
  })

  it('catches a failed send and does not throw', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP down'))
    await expect(
      sendEmail({ to: 'test@example.com', subject: 'Hi', html: '<p>hi</p>' })
    ).resolves.toBeUndefined()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- email.test.ts`
Expected: FAIL with "Cannot find module '@/lib/email'"

- [ ] **Step 4: Write the implementation**

```typescript
// lib/email.ts
import nodemailer from 'nodemailer'

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
  subject: string
  html: string
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: input.to,
      subject: input.subject,
      html: input.html,
    })
  } catch (error) {
    console.error('[sendEmail] failed to send', { to: input.to, subject: input.subject }, error)
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- email.test.ts`
Expected: 2 passed

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/email.ts lib/__tests__/email.test.ts
git commit -m "feat: add sendEmail helper (nodemailer, mocked test)"
```

---

## Task 2: Database migration — admin_credentials + admin_reset_tokens

**Files:**
- Create: `supabase/migrations/20260805000002_admin_credentials_and_reset_tokens.sql`
- Create: `lib/__tests__/admin-credentials-schema.test.ts`

**Interfaces:**
- Produces: `admin_credentials` table (`id`, `password_hash`, `updated_at`), `admin_reset_tokens` table (`id`, `token_hash`, `expires_at`, `used_at`, `created_at`) — both RLS-enabled with zero policies

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260805000002_admin_credentials_and_reset_tokens.sql

create table admin_credentials (
  id uuid primary key default gen_random_uuid(),
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table admin_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table admin_credentials enable row level security;
alter table admin_reset_tokens enable row level security;
-- No policies on either table: only the service-role client (supabaseAdmin,
-- which bypasses RLS) may read or write. Nothing here is ever anon-accessible.
```

- [ ] **Step 2: Apply the migration**

Use the Supabase MCP `apply_migration` tool against project `whgwneuarnrsktolmqdj` with the SQL above (name: `admin_credentials_and_reset_tokens`).

- [ ] **Step 3: Write a schema verification test**

```typescript
// lib/__tests__/admin-credentials-schema.test.ts
import { describe, it, expect } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

describe('admin_credentials / admin_reset_tokens schema', () => {
  it('service-role client can query both new tables', async () => {
    const credentials = await supabaseAdmin.from('admin_credentials').select('id').limit(1)
    expect(credentials.error).toBeNull()

    const tokens = await supabaseAdmin.from('admin_reset_tokens').select('id').limit(1)
    expect(tokens.error).toBeNull()
  })

  it('anon client cannot read admin_credentials (no RLS policy)', async () => {
    const { data } = await supabase.from('admin_credentials').select('id')
    expect(data).toEqual([])
  })

  it('anon client cannot read admin_reset_tokens (no RLS policy)', async () => {
    const { data } = await supabase.from('admin_reset_tokens').select('id')
    expect(data).toEqual([])
  })
})
```

- [ ] **Step 4: Run it**

Run: `npm test -- admin-credentials-schema.test.ts`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260805000002_admin_credentials_and_reset_tokens.sql lib/__tests__/admin-credentials-schema.test.ts
git commit -m "feat: migrate admin_credentials and admin_reset_tokens tables"
```

---

## Task 3: Password hashing + DB-backed checkPassword

**Files:**
- Modify: `lib/admin-auth.ts`
- Modify: `lib/__tests__/admin-auth.test.ts`
- Modify: `app/api/admin/login/route.ts`
- Create (temporary, one-time use — delete after running): `scripts/seed-admin-password.mjs`

**Interfaces:**
- Consumes: `admin_credentials` table (Task 2), `supabaseAdmin` from `lib/supabase-admin.ts`
- Produces: `hashPassword(password: string): string`, `verifyPassword(password: string, storedHash: string): boolean`, `checkPassword(password: string): Promise<boolean>` (now async — was sync before this task)

- [ ] **Step 1: Write the failing test (replaces the old checkPassword test)**

```typescript
// lib/__tests__/admin-auth.test.ts
import { describe, it, expect } from 'vitest'
import { checkPassword, hashPassword, verifyPassword, signSession, isValidSession } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

describe('hashPassword / verifyPassword', () => {
  it('a password verifies against its own hash', () => {
    const hash = hashPassword('correct-horse-battery-staple')
    expect(verifyPassword('correct-horse-battery-staple', hash)).toBe(true)
  })

  it('a wrong password does not verify', () => {
    const hash = hashPassword('correct-horse-battery-staple')
    expect(verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('a malformed stored hash does not verify (no crash)', () => {
    expect(verifyPassword('anything', 'not-a-valid-hash')).toBe(false)
  })
})

describe('checkPassword (DB-backed)', () => {
  it('accepts whatever password is currently stored in admin_credentials, rejects others', async () => {
    const testHash = hashPassword('test-only-password-Task3')
    await supabaseAdmin.from('admin_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('admin_credentials').insert({ password_hash: testHash })

    expect(await checkPassword('test-only-password-Task3')).toBe(true)
    expect(await checkPassword('definitely-wrong')).toBe(false)
  })

  it('rejects everything if no row exists in admin_credentials', async () => {
    await supabaseAdmin.from('admin_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    expect(await checkPassword('anything')).toBe(false)
  })
})

describe('sessions (unchanged behavior)', () => {
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

Run: `npm test -- admin-auth.test.ts`
Expected: FAIL — `hashPassword`/`verifyPassword` don't exist yet, `checkPassword` is still sync and env-var-based

- [ ] **Step 3: Write the implementation**

```typescript
// lib/admin-auth.ts
import crypto from 'crypto'
import { supabaseAdmin } from './supabase-admin'

export const ADMIN_SESSION_COOKIE_NAME = 'cfts_admin_session'

const SESSION_VALUE = 'admin-authenticated'
const SCRYPT_KEY_LENGTH = 64

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH)
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, keyHex] = storedHash.split(':')
  if (!saltHex || !keyHex) return false

  const salt = Buffer.from(saltHex, 'hex')
  const expectedKey = Buffer.from(keyHex, 'hex')
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH)
  if (derivedKey.length !== expectedKey.length) return false
  return crypto.timingSafeEqual(derivedKey, expectedKey)
}

export async function checkPassword(password: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('admin_credentials')
    .select('password_hash')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return false
  return verifyPassword(password, data.password_hash)
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

- [ ] **Step 4: Update the login route for the now-async checkPassword**

In `app/api/admin/login/route.ts`, change:
```typescript
    if (typeof password !== 'string' || !checkPassword(password)) {
```
to:
```typescript
    if (typeof password !== 'string' || !(await checkPassword(password))) {
```

- [ ] **Step 5: Seed admin_credentials from the current ADMIN_PASSWORD (one-time)**

Create a throwaway seed script — this uses the exact same hash algorithm as `lib/admin-auth.ts` above, duplicated inline since it's a one-time plain-JS script (not worth a build step to import the TS module):

```javascript
// scripts/seed-admin-password.mjs
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const password = process.env.ADMIN_PASSWORD
if (!password) throw new Error('ADMIN_PASSWORD is not set')

const salt = crypto.randomBytes(16)
const derivedKey = crypto.scryptSync(password, salt, 64)
const hash = `${salt.toString('hex')}:${derivedKey.toString('hex')}`

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { error } = await supabase.from('admin_credentials').insert({ password_hash: hash })
if (error) throw error
console.log('Seeded admin_credentials from ADMIN_PASSWORD.')
```

Run it once:
```bash
cd /Users/feldonrichards/code/cash-for-test-strips-usa
node --env-file=.env.local scripts/seed-admin-password.mjs
```

Confirm it printed the success message, then delete the script — it's one-time use and its logic is now redundant with `hashPassword` in `lib/admin-auth.ts`:
```bash
rm scripts/seed-admin-password.mjs
```

- [ ] **Step 6: Run the real tests to verify they pass**

Run: `npm test -- admin-auth.test.ts`
Expected: 8 passed

- [ ] **Step 7: Manually confirm login still works end to end**

Run `npm run dev`, go to `/admin/login`, log in with the actual current admin password (the same one you've been using — it should still work, since it's now verified against the freshly-seeded hash of that same password). Confirm it redirects to `/admin`.

- [ ] **Step 8: Commit**

```bash
git add lib/admin-auth.ts lib/__tests__/admin-auth.test.ts app/api/admin/login/route.ts
git commit -m "feat: move admin password from env var to hashed DB row"
```

Note: `ADMIN_PASSWORD` env var is now unused by the app (only the seed script read it, and that script is deleted). Leave the env var in place in `.env.local`/Vercel for now — removing it from Vercel is a separate deliberate step, not part of this task.

---

## Task 4: Reset token lifecycle

**Files:**
- Modify: `lib/admin-auth.ts`
- Modify: `lib/__tests__/admin-auth.test.ts`

**Interfaces:**
- Consumes: `admin_reset_tokens` table (Task 2), `hashPassword` (Task 3)
- Produces: `createResetToken(): Promise<string>` (returns the raw token), `verifyResetToken(rawToken: string): Promise<boolean>`, `consumeResetToken(rawToken: string, newPassword: string): Promise<void>` (throws if invalid/expired/used)

- [ ] **Step 1: Write the failing test**

Append to `lib/__tests__/admin-auth.test.ts`:

```typescript
describe('reset token lifecycle', () => {
  it('a freshly created token verifies as valid', async () => {
    const token = await createResetToken()
    expect(await verifyResetToken(token)).toBe(true)
  })

  it('an unknown token does not verify', async () => {
    expect(await verifyResetToken('not-a-real-token')).toBe(false)
  })

  it('consumeResetToken updates the password and checkPassword reflects it', async () => {
    const token = await createResetToken()
    await consumeResetToken(token, 'brand-new-password-Task4')
    expect(await checkPassword('brand-new-password-Task4')).toBe(true)
  })

  it('a token cannot be consumed twice', async () => {
    const token = await createResetToken()
    await consumeResetToken(token, 'first-use-password-Task4')
    await expect(consumeResetToken(token, 'second-use-password-Task4')).rejects.toThrow()
  })

  it('an expired token cannot be consumed', async () => {
    const token = await createResetToken()
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    await supabaseAdmin
      .from('admin_reset_tokens')
      .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
      .eq('token_hash', tokenHash)
    await expect(consumeResetToken(token, 'should-not-work')).rejects.toThrow()
  })
})
```

Add `crypto` is already imported in the test file's scope via `import crypto from 'crypto'` at the top if not already present — add it, and import the four new functions from `@/lib/admin-auth` in the existing import line.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- admin-auth.test.ts`
Expected: FAIL — `createResetToken`/`verifyResetToken`/`consumeResetToken` don't exist yet

- [ ] **Step 3: Write the implementation**

Append to `lib/admin-auth.ts`:

```typescript
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export async function createResetToken(): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()

  const { error } = await supabaseAdmin.from('admin_reset_tokens').insert({
    token_hash: tokenHash,
    expires_at: expiresAt,
  })
  if (error) throw new Error(`Failed to create reset token: ${error.message}`)

  return rawToken
}

export async function verifyResetToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken)
  const { data } = await supabaseAdmin
    .from('admin_reset_tokens')
    .select('id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!data) return false
  if (data.used_at) return false
  if (new Date(data.expires_at).getTime() < Date.now()) return false
  return true
}

export async function consumeResetToken(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken)
  const { data } = await supabaseAdmin
    .from('admin_reset_tokens')
    .select('id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!data) throw new Error('Invalid or expired reset link')
  if (data.used_at) throw new Error('This reset link has already been used')
  if (new Date(data.expires_at).getTime() < Date.now()) throw new Error('This reset link has expired')

  const { error: insertError } = await supabaseAdmin
    .from('admin_credentials')
    .insert({ password_hash: hashPassword(newPassword) })
  if (insertError) throw new Error(`Failed to update password: ${insertError.message}`)

  const { error: updateError } = await supabaseAdmin
    .from('admin_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id)
  if (updateError) throw new Error(`Failed to mark reset token used: ${updateError.message}`)
}
```

Note: `checkPassword` already orders by `updated_at desc limit 1`, so inserting a new `admin_credentials` row (rather than updating the existing one) naturally makes the new password the active one — old rows are just left as history, harmless.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- admin-auth.test.ts`
Expected: 13 passed

- [ ] **Step 5: Commit**

```bash
git add lib/admin-auth.ts lib/__tests__/admin-auth.test.ts
git commit -m "feat: add reset token create/verify/consume lifecycle"
```

---

## Task 5: API routes — forgot-password and reset-password

**Files:**
- Create: `app/api/admin/forgot-password/route.ts`
- Create: `app/api/admin/reset-password/route.ts`
- Create: `app/api/admin/reset-password/__tests__/route.test.ts`

**Interfaces:**
- Consumes: `createResetToken`, `consumeResetToken` from `lib/admin-auth.ts`, `sendEmail` from `lib/email.ts`
- Produces: `POST /api/admin/forgot-password` — no body needed, response `{ ok: true }` always (never reveals whether anything went wrong, to avoid giving an attacker signal); `POST /api/admin/reset-password` — body `{ token: string, newPassword: string }`, response `{ ok: true }` (200) or `{ error: string }` (400)

- [ ] **Step 1: Write the forgot-password route**

```typescript
// app/api/admin/forgot-password/route.ts
import { NextResponse } from 'next/server'
import { createResetToken } from '@/lib/admin-auth'
import { sendEmail } from '@/lib/email'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_ATTEMPTS = 5
const attempts = new Map<string, { count: number; resetAt: number }>()

function getClientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count += 1
  return entry.count > RATE_LIMIT_MAX_ATTEMPTS
}

export async function POST(request: Request) {
  try {
    const key = getClientKey(request)
    if (isRateLimited(key)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const token = await createResetToken()
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cash4teststripsusa.com'}/admin/reset?token=${token}`
    const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL

    if (notifyEmail) {
      await sendEmail({
        to: notifyEmail,
        subject: 'Reset your Cash4TestStripsUSA admin password',
        html: `<p>Click the link below to set a new admin password. This link expires in 30 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/admin/forgot-password]', error)
    return NextResponse.json({ ok: true })
  }
}
```

Note: the catch block still returns `{ ok: true }` (200), not an error — this endpoint deliberately never reveals failure details to the caller, matching the "don't leak information" spirit of a password-reset endpoint. The real error is logged server-side via `console.error`.

- [ ] **Step 2: Write the failing test for reset-password**

```typescript
// app/api/admin/reset-password/__tests__/route.test.ts
import { describe, it, expect } from 'vitest'
import { createResetToken } from '@/lib/admin-auth'
import { POST } from '../route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/reset-password', () => {
  it('returns 400 for a missing token or password', async () => {
    const response = await POST(makeRequest({ token: 'x' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for an invalid token', async () => {
    const response = await POST(makeRequest({ token: 'not-a-real-token', newPassword: 'whatever-Task5' }))
    expect(response.status).toBe(400)
  })

  it('resets the password for a valid token', async () => {
    const token = await createResetToken()
    const response = await POST(makeRequest({ token, newPassword: 'reset-via-route-Task5' }))
    expect(response.status).toBe(200)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- reset-password`
Expected: FAIL with "Cannot find module '../route'"

- [ ] **Step 4: Write the reset-password route**

```typescript
// app/api/admin/reset-password/route.ts
import { NextResponse } from 'next/server'
import { consumeResetToken } from '@/lib/admin-auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, newPassword } = body ?? {}

    if (typeof token !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'A token and a password of at least 8 characters are required' },
        { status: 400 }
      )
    }

    try {
      await consumeResetToken(token, newPassword)
    } catch (consumeError) {
      const message = consumeError instanceof Error ? consumeError.message : 'Invalid or expired reset link'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/admin/reset-password]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- reset-password`
Expected: 3 passed

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/forgot-password/route.ts app/api/admin/reset-password/route.ts "app/api/admin/reset-password/__tests__/route.test.ts"
git commit -m "feat: add forgot-password and reset-password API routes"
```

---

## Task 6: UI — forgot-password and reset pages, login page link

**Files:**
- Create: `app/admin/forgot-password/page.tsx`
- Create: `app/admin/reset/page.tsx`
- Modify: `app/admin/login/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/forgot-password`, `POST /api/admin/reset-password`

- [ ] **Step 1: Add the "Forgot password?" link to the login page**

In `app/admin/login/page.tsx`, add inside the `<form>`, right after the closing `</form>` tag (or just before it, either is fine — place it so it reads naturally below the submit button):

```typescript
        <button type="submit" className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">Log in</button>
      </form>
      <a href="/admin/forgot-password" className="block text-center text-xs text-gray-400 hover:text-emerald-600 mt-4">
        Forgot password?
      </a>
```

(This replaces just the closing `</form>` line with `</form>` followed by the new link — the rest of the file is unchanged.)

- [ ] **Step 2: Write the forgot-password page**

```typescript
// app/admin/forgot-password/page.tsx
"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    await fetch("/api/admin/forgot-password", { method: "POST" });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24 text-center">
      <h1 className="text-xl font-bold mb-4">Reset Admin Password</h1>
      {sent ? (
        <p className="text-sm text-gray-600">
          If everything's set up correctly, a reset link is on its way to your email. It expires in 30 minutes.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-6">
            We'll email a one-time reset link to the admin address on file.
          </p>
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </>
      )}
      <a href="/admin/login" className="block text-xs text-gray-400 hover:text-emerald-600 mt-6">
        Back to login
      </a>
    </div>
  );
}
```

- [ ] **Step 3: Write the reset page**

```typescript
// app/admin/reset/page.tsx
"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      router.push("/admin/login");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-xl font-bold mb-4">Set a New Password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2"
          placeholder="New password"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2"
          placeholder="Confirm new password"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Saving..." : "Set new password"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Manual browser verification**

Run `npm run dev`:
1. Go to `/admin/login` → confirm "Forgot password?" link is visible and goes to `/admin/forgot-password`
2. Click "Send reset link" → confirm the success message appears (this will actually attempt to send a real email — that's expected and fine, it's the real SMTP account)
3. Check the real `feldon.richards@gmail.com` inbox for the reset email; click the link
4. Confirm it lands on `/admin/reset?token=...` with a working form
5. Set a new password, confirm it redirects to `/admin/login`
6. Log in with the NEW password → confirm it works
7. Log in with the OLD password → confirm it's rejected (401)

- [ ] **Step 5: Commit**

```bash
git add app/admin/forgot-password/page.tsx app/admin/reset/page.tsx app/admin/login/page.tsx
git commit -m "feat: add forgot-password and reset-password pages"
```

---

## Task 7: Wire notification emails into submissions.ts

**Files:**
- Modify: `lib/submissions.ts`
- Modify: `lib/__tests__/submissions.test.ts`

**Interfaces:**
- Consumes: `sendEmail` from `lib/email.ts`

- [ ] **Step 1: Add the admin-notify send to createSubmission**

In `lib/submissions.ts`, add the import at the top:
```typescript
import { sendEmail } from './email'
```

After the successful insert in `createSubmission` (right after `if (error) throw new Error(...)`, before the `return { ... }` statement), add:

```typescript
  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL
  if (notifyEmail) {
    void sendEmail({
      to: notifyEmail,
      subject: `New ${input.targetCompanyId ? 'edit' : 'buyer'} submission: ${input.payload.name}`,
      html: `<p>${input.payload.name} (${input.submittedPhone}) submitted ${input.targetCompanyId ? 'an edit to their listing' : 'a new buyer profile'}.</p><p><a href="https://cash4teststripsusa.com/admin">Review it in the admin dashboard</a>.</p>`,
    })
  }
```

Note: `void sendEmail(...)` (not `await`) — this is intentionally fire-and-forget. `sendEmail` never throws (Task 1), and `createSubmission`'s caller (`POST /api/submissions`) must not wait on an email round-trip before responding to the buyer's browser.

- [ ] **Step 2: Add the buyer-notify send to approveSubmission**

In `approveSubmission`, after the final `if (statusError) throw new Error(...)` line (the last thing in the function, before its closing brace), add:

```typescript
  if (payload.email) {
    void sendEmail({
      to: payload.email,
      subject: 'Your listing is live on Cash4TestStripsUSA',
      html: `<p>Hi ${payload.owner_name ?? payload.name},</p><p>Your listing "${payload.name}" is now live on Cash4TestStripsUSA. Customers in your area can find and contact you.</p>`,
    })
  }
```

- [ ] **Step 3: Add the buyer-notify send to rejectSubmission**

`rejectSubmission` currently only updates status by id — it needs the submission's payload to know the buyer's email and name. Rewrite it to fetch first, then update:

```typescript
export async function rejectSubmission(submissionId: string): Promise<void> {
  const { data: submission } = await supabaseAdmin
    .from('submissions')
    .select('payload')
    .eq('id', submissionId)
    .single()

  const { error } = await supabaseAdmin
    .from('submissions')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', submissionId)
  if (error) throw new Error(`Failed to reject submission: ${error.message}`)

  const payload = submission?.payload as SubmissionPayload | undefined
  if (payload?.email) {
    void sendEmail({
      to: payload.email,
      subject: 'Update on your Cash4TestStripsUSA submission',
      html: `<p>Hi ${payload.owner_name ?? payload.name},</p><p>Your recent submission to Cash4TestStripsUSA was not approved. If you think this is a mistake, reply to this email or contact us directly.</p>`,
    })
  }
}
```

- [ ] **Step 4: Run the existing test suite to confirm nothing broke**

Run: `npm test -- submissions.test.ts`
Expected: all existing tests still pass (none of them assert on email — `sendEmail` is fire-and-forget and mocked-safe since `ADMIN_NOTIFY_EMAIL`/payload emails in test fixtures either aren't set or point at fake addresses that the real `sendEmail` will just fail-and-log for, which is fine and expected — it never throws)

- [ ] **Step 5: Commit**

```bash
git add lib/submissions.ts lib/__tests__/submissions.test.ts
git commit -m "feat: send buyer and admin notification emails on submission events"
```

---

## Task 8: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, pristine output

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: builds cleanly, no type errors

- [ ] **Step 3: Full manual walkthrough — password reset**

Already covered in Task 6 Step 4 — re-confirm it still works after Task 7's changes (they touch a different file, but confirm nothing regressed).

- [ ] **Step 4: Full manual walkthrough — new-submission alert**

1. Go to `/buyer`, submit a new profile with a real-looking but test name (e.g. "E2E Test Buyer Co") and a phone number
2. Check `feldon.richards@gmail.com` for the "New buyer submission" email — confirm it arrived and links to `/admin`
3. In `/admin`, approve or reject that test submission
4. If it had an email in the payload, confirm the corresponding "listing is live" / "not approved" email arrived
5. Clean up: delete the test company/submission rows via the Supabase MCP tool if the company went live

- [ ] **Step 5: Final commit check**

```bash
git status
```

Confirm nothing from this plan is left uncommitted.
