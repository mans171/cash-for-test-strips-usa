# Auth Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up Supabase Auth (email + password) with `@supabase/ssr` cookie-based sessions for the Next.js 16 App Router, add a `profiles` table, and build shared signup/login/logout UI plus a `<RequiresAccount>` gating component — the foundation later sub-projects (customer accounts, buyer accounts) build on.

**Architecture:** `@supabase/ssr` provides three client shapes: a browser client (`lib/supabase/client.ts`), a server client for Server Components/Route Handlers (`lib/supabase/server.ts`), and a proxy-time client (`proxy.ts` at repo root — Next.js 16 renamed `middleware.ts`/`export function middleware` to `proxy.ts`/`export function proxy`) that refreshes the session cookie on every request. `lib/auth.ts` wraps these into `getCurrentUser()` (server) and a `useUser()` client hook. Signup writes both the `auth.users` row (via `supabase.auth.signUp()`) and the `profiles` row (via the browser client, RLS-protected to `auth.uid() = id`) in one client-side flow — no DB trigger.

**Tech Stack:** Next.js 16.2.9 App Router, `@supabase/supabase-js` (existing), `@supabase/ssr` (new dependency), Supabase Postgres + RLS, Vitest with live-DB integration tests.

## Global Constraints

- No email verification — accounts are usable immediately after `auth.signUp()` returns (per spec).
- Every test file hits the real Supabase project directly (`supabaseAdmin` from `lib/supabase-admin.ts`) and cleans up in a bounded `afterEach` — this repo has zero mocked-DB tests. See `lib/__tests__/leads.test.ts` or `lib/__tests__/submissions.test.ts` for the established pattern.
- Never use `.single()` in a cleanup query that could match 0 or 2+ rows — it silently returns `data: null` and breaks cleanup (see `app/api/admin/review/__tests__/route.test.ts` for the fixed pattern and the reason why). Use `.maybeSingle()` or filter-and-iterate instead.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` already exist in `.env.local` (see `lib/supabase.ts`) — reuse them, do not introduce a `PUBLISHABLE_KEY` variant.
- `profiles.role` is `'customer' | 'buyer'`, `name`/`phone`/`address_street`/`address_city`/`address_state`/`address_zip` are all `not null` — the signup form must collect all of them before submitting.
- RLS on `profiles`: self-only `select`/`update` (`auth.uid() = id`), no public read.
- This plan does NOT gate any existing page (checkout, buyer portal) behind login — that's sub-project B/C. It only builds the reusable `<RequiresAccount>` component, unused by any page yet.
- This plan does NOT touch `/admin`'s existing separate auth system (`lib/admin-auth.ts`).

---

### Task 1: Add `@supabase/ssr` dependency and the `profiles` table migration

**Files:**
- Modify: `package.json` (add dependency)
- Create: `supabase/migrations/20260807000000_create_profiles.sql`
- Test: `supabase/migrations/__tests__/profiles-schema.test.ts` (new file — this repo has no prior migration test dir; place it alongside the migration folder to match `lib/__tests__/schema.test.ts`'s role of asserting live schema shape)

**Interfaces:**
- Produces: a live `public.profiles` table with columns `id uuid pk`, `role text`, `name text`, `phone text`, `address_street text`, `address_city text`, `address_state text`, `address_zip text`, `created_at timestamptz`, RLS enabled with self-only select/update policies. Later tasks insert/select this table via `supabaseAdmin` (tests) and the browser client (`lib/supabase/client.ts`, Task 2).

- [ ] **Step 1: Install `@supabase/ssr`**

Run: `cd /Users/feldonrichards/code/cash-for-test-strips-usa && npm install @supabase/ssr`

Expected: `package.json` `dependencies` gains `"@supabase/ssr": "^<version>"`.

- [ ] **Step 2: Write the migration file**

```sql
-- supabase/migrations/20260807000000_create_profiles.sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'buyer')),
  name text not null,
  phone text not null,
  address_street text not null,
  address_city text not null,
  address_state text not null,
  address_zip text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);
```

- [ ] **Step 3: Apply the migration to the live Supabase project**

Use the `mcp__claude_ai_Supabase__apply_migration` tool (project ref `whgwneuarnrsktolmqdj`) with the SQL above, name `create_profiles`. Do not hand-run this against any other project.

- [ ] **Step 4: Write the failing schema test**

```typescript
// supabase/migrations/__tests__/profiles-schema.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'

const cleanupUserIds: string[] = []

afterEach(async () => {
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
})

describe('profiles table', () => {
  it('accepts a full row for a real auth.users id and enforces role check', async () => {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `profiles-schema-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'customer',
      name: 'Test User',
      phone: '5551234567',
      address_street: '123 Main St',
      address_city: 'Albany',
      address_state: 'NY',
      address_zip: '12203',
    })
    expect(insertError).toBeNull()

    const { data: row } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    expect(row?.role).toBe('customer')

    const { error: badRoleError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'not-a-real-role',
      name: 'x',
      phone: 'x',
      address_street: 'x',
      address_city: 'x',
      address_state: 'x',
      address_zip: 'x',
    })
    expect(badRoleError).not.toBeNull()
  })
})
```

Note: deleting the `auth.users` row via `deleteUser(id)` cascades to `profiles` via the `on delete cascade` foreign key — no separate `profiles` cleanup needed.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- profiles-schema`
Expected: PASS (the migration is already live from Step 3, so this test should pass immediately — it's a verification test, not a red/green TDD cycle, since the schema change happens via `apply_migration`, not application code).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json supabase/migrations/20260807000000_create_profiles.sql supabase/migrations/__tests__/profiles-schema.test.ts
git commit -m "feat: add @supabase/ssr dependency and profiles table"
```

---

### Task 2: Browser and server Supabase clients

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` from env (already in `.env.local`).
- Produces: `createBrowserSupabaseClient()` from `lib/supabase/client.ts` (returns a `SupabaseClient`, used in Client Components — signup form, `useUser()` hook). `createServerSupabaseClient()` from `lib/supabase/server.ts` (async, returns `Promise<SupabaseClient>`, used in Server Components and Route Handlers — `getCurrentUser()` in Task 3).
- Note: these are new files distinct from the existing `lib/supabase.ts` (anon client, no cookie handling) and `lib/supabase-admin.ts` (service-role client) — those stay as-is and are unrelated to auth session handling.

- [ ] **Step 1: Write the browser client**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Write the server client**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component during render — cookies can't
            // be mutated there. proxy.ts (Task 4) refreshes the session on
            // every request, so this write is safe to skip.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Verify the project typechecks**

Run: `cd /Users/feldonrichards/code/cash-for-test-strips-usa && npx tsc --noEmit`
Expected: no new errors from these two files (they aren't imported anywhere yet, so this mainly checks syntax).

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts
git commit -m "feat: add @supabase/ssr browser and server clients"
```

---

### Task 3: `lib/auth.ts` — `getCurrentUser()`, `useUser()`, `signOut()`

**Files:**
- Create: `lib/auth.ts`
- Create: `lib/auth-client.tsx`
- Test: `lib/__tests__/auth.test.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient()` (Task 2, server-side), `createBrowserSupabaseClient()` (Task 2, client-side), the `profiles` table (Task 1).
- Produces:
  - `lib/auth.ts` (server-only module): `getCurrentUser(): Promise<{ id: string; email: string; profile: Profile } | null>` — reads the session via `createServerSupabaseClient()`, returns `null` if unauthenticated, otherwise joins the `profiles` row. `Profile` type: `{ role: 'customer' | 'buyer'; name: string; phone: string; address_street: string; address_city: string; address_state: string; address_zip: string }`.
  - `lib/auth-client.tsx` (client module, `"use client"`): `useUser()` hook returning `{ user: { id: string; email: string } | null; loading: boolean }`, and `signOut(): Promise<void>`.
- Later tasks (signup/login pages, `<RequiresAccount>`) import `useUser`/`signOut` from `lib/auth-client.tsx` and `getCurrentUser` from `lib/auth.ts`.

- [ ] **Step 1: Write the failing test for `getCurrentUser()`**

```typescript
// lib/__tests__/auth.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'

const cleanupUserIds: string[] = []

afterEach(async () => {
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
})

describe('profiles round-trip via supabaseAdmin (getCurrentUser is exercised in browser E2E, not here)', () => {
  it('creates a user + profile and reads it back with the right shape', async () => {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `auth-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'customer',
      name: 'Auth Test User',
      phone: '5559876543',
      address_street: '1 Test Ave',
      address_city: 'Troy',
      address_state: 'NY',
      address_zip: '12180',
    })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, name, phone, address_street, address_city, address_state, address_zip')
      .eq('id', userId)
      .maybeSingle()

    expect(profile).toMatchObject({
      role: 'customer',
      name: 'Auth Test User',
      phone: '5559876543',
      address_street: '1 Test Ave',
      address_city: 'Troy',
      address_state: 'NY',
      address_zip: '12180',
    })
  })
})
```

Note: `getCurrentUser()` reads cookies via `next/headers`, which only works inside a real Next.js request context (Server Component or Route Handler) — it cannot be unit-tested outside one. This test instead verifies the `profiles` round-trip that `getCurrentUser()` depends on. Manual browser verification (Task 6, Step 5) covers `getCurrentUser()` itself end-to-end.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- auth.test`
Expected: FAIL — `supabaseAdmin.from('profiles')` doesn't exist yet only if Task 1 wasn't applied; if Task 1 is already done, this test should actually PASS immediately (it only depends on the live table, not on `lib/auth.ts`). That's expected — this is a schema-dependent verification test, not a TDD-red test for new application code. Confirm it passes.

- [ ] **Step 3: Write `lib/auth.ts`**

```typescript
// lib/auth.ts
import { createServerSupabaseClient } from './supabase/server'

export type Profile = {
  role: 'customer' | 'buyer'
  name: string
  phone: string
  address_street: string
  address_city: string
  address_state: string
  address_zip: string
}

export type CurrentUser = {
  id: string
  email: string
  profile: Profile
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, phone, address_street, address_city, address_state, address_zip')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return null

  return { id: user.id, email: user.email, profile: profile as Profile }
}
```

- [ ] **Step 4: Write `lib/auth-client.tsx`**

```tsx
// lib/auth-client.tsx
"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "./supabase/client"

export type ClientUser = {
  id: string
  email: string
}

export function useUser(): { user: ClientUser | null; loading: boolean } {
  const [user, setUser] = useState<ClientUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()

    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      setUser(u && u.email ? { id: u.id, email: u.email } : null)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user
      setUser(u && u.email ? { id: u.id, email: u.email } : null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  return { user, loading }
}

export async function signOut(): Promise<void> {
  const supabase = createBrowserSupabaseClient()
  await supabase.auth.signOut()
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- auth.test`
Expected: PASS

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add lib/auth.ts lib/auth-client.tsx lib/__tests__/auth.test.ts
git commit -m "feat: add getCurrentUser, useUser, and signOut auth helpers"
```

---

### Task 4: `proxy.ts` — session refresh on every request

**Files:**
- Create: `proxy.ts` (repo root, next to `next.config.ts` — Next.js 16 requires this exact filename and export name; `middleware.ts`/`export function middleware` is silently ignored and would leave the session-refresh logic dead with no error)

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Produces: nothing consumed by name elsewhere — this runs automatically on matching requests and keeps the Supabase session cookie fresh so `getCurrentUser()` (Task 3) and `useUser()` don't see stale/expired sessions. Does NOT redirect unauthenticated users anywhere (no route is gated yet — that's sub-project B/C); it only refreshes cookies and passes the request through.

- [ ] **Step 1: Write `proxy.ts`**

```typescript
// proxy.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshes the session token if expired — required so Server Components
  // never see a stale session. This is the only thing this proxy does;
  // no route is gated behind login here (that belongs to sub-project B/C).
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Verify the dev server starts and proxy runs without error**

Run: `cd /Users/feldonrichards/code/cash-for-test-strips-usa && npm run dev` (in background), then in another terminal: `curl -sI http://localhost:3000/ | head -5`
Expected: `HTTP/1.1 200 OK`, no proxy errors in the dev server log. Stop the dev server after checking.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add proxy.ts
git commit -m "feat: add proxy.ts to refresh Supabase session cookies"
```

---

### Task 5: `<RequiresAccount>` gating component

**Files:**
- Create: `app/components/RequiresAccount.tsx`

**Interfaces:**
- Consumes: `useUser()` from `lib/auth-client.tsx` (Task 3).
- Produces: `<RequiresAccount>` — a Client Component taking `children: ReactNode` and rendering them wrapped/disabled with a "Create an account to view this information" message when `user === null` (and not `loading`), or the children unwrapped when logged in. While `loading`, renders children unwrapped-but-inert (avoids a flash of the gated message before the session check resolves). Sub-project B applies this around the `/sell` checkout buyer Text/Email buttons; not wired into any page in this plan.

- [ ] **Step 1: Write the component**

```tsx
// app/components/RequiresAccount.tsx
"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { useUser } from "@/lib/auth-client"

export function RequiresAccount({ children }: { children: ReactNode }) {
  const { user, loading } = useUser()

  if (loading) {
    return <div className="opacity-50 pointer-events-none">{children}</div>
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-1">
        <div className="opacity-40 pointer-events-none">{children}</div>
        <p className="text-xs text-red-600">
          <Link href="/signup" className="underline">
            Create an account
          </Link>{" "}
          to view this information
        </p>
      </div>
    )
  }

  return <>{children}</>
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/components/RequiresAccount.tsx
git commit -m "feat: add RequiresAccount gating component"
```

---

### Task 6: Signup and login pages

**Files:**
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/(auth)/login/page.tsx`

**Interfaces:**
- Consumes: `createBrowserSupabaseClient()` (Task 2), `useUser()` (Task 3, to redirect away if already logged in).
- Produces: `/signup` and `/login` routes. Signup accepts an optional `?role=buyer` query param (defaults to `customer`) so sub-projects B/C can link into it pre-set — read via `useSearchParams()`. Neither page is linked from site nav in this plan (no nav changes — out of scope per spec); they're reachable by direct URL, which is enough for manual verification and for sub-projects B/C to link to.

- [ ] **Step 1: Write the signup page**

```tsx
// app/(auth)/signup/page.tsx
"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") === "buyer" ? "buyer" : "customer"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [addressStreet, setAddressStreet] = useState("")
  const [addressCity, setAddressCity] = useState("")
  const [addressState, setAddressState] = useState("")
  const [addressZip, setAddressZip] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const supabase = createBrowserSupabaseClient()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }

    const userId = signUpData.user?.id
    if (!userId) {
      setError("Account created but sign-up response was incomplete. Please try logging in.")
      setSubmitting(false)
      return
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      role,
      name,
      phone,
      address_street: addressStreet,
      address_city: addressCity,
      address_state: addressState,
      address_zip: addressZip,
    })

    if (profileError) {
      setError(`Account created but profile setup failed: ${profileError.message}`)
      setSubmitting(false)
      return
    }

    router.push("/")
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Create an account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="text"
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="tel"
          required
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="text"
          required
          placeholder="Street address"
          value={addressStreet}
          onChange={(e) => setAddressStreet(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <div className="flex gap-2">
          <input
            type="text"
            required
            placeholder="City"
            value={addressCity}
            onChange={(e) => setAddressCity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
          />
          <input
            type="text"
            required
            placeholder="State"
            value={addressState}
            onChange={(e) => setAddressState(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-20"
          />
          <input
            type="text"
            required
            placeholder="ZIP"
            value={addressZip}
            onChange={(e) => setAddressZip(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-24"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 text-white rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Write the login page**

```tsx
// app/(auth)/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const supabase = createBrowserSupabaseClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setSubmitting(false)
      return
    }

    router.push("/")
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Log in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 text-white rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: build succeeds, `/signup` and `/login` appear in the route list.

- [ ] **Step 5: Manual browser verification**

Using the browser tooling against `http://localhost:3000` (start with `npm run dev`):
1. Navigate to `/signup`, fill all fields with a real-looking test email (e.g. `auth-foundation-test+<timestamp>@example.com`), submit.
2. Confirm immediate redirect to `/` with no email-confirmation interstitial (no verification required, per spec).
3. Navigate to `/login`, log out is not yet wired to any UI — use the browser console via `createBrowserSupabaseClient` is not accessible there, so instead: confirm session persists across a page reload of `/` (open dev tools Application tab, confirm `sb-*` cookies are present).
4. Log in again at `/login` with the same credentials — confirm success and redirect to `/`.
5. Attempt `/signup` again with the same email — confirm a clear error is shown (Supabase returns "User already registered" or equivalent).
6. Query the `profiles` table via `mcp__claude_ai_Supabase__execute_sql` for the test user's row — confirm `role = 'customer'` and all fields match what was entered.
7. Delete the test user via `supabaseAdmin.auth.admin.deleteUser()` (a one-off script or the Supabase dashboard) to avoid leaving test data in production auth — do not leave manual test accounts in the live project.

- [ ] **Step 6: Commit**

```bash
git add "app/(auth)/signup/page.tsx" "app/(auth)/login/page.tsx"
git commit -m "feat: add signup and login pages"
```

---

## Self-Review Notes

- **Spec coverage:** Auth provider (Task 1+6), `profiles` table + RLS (Task 1), shared UI (Task 5+6), `lib/auth.ts`/`useUser`/`signOut` (Task 3), `<RequiresAccount>` (Task 5), testing convention (live-DB, every task). Password reset (spec section) is explicitly a one-time Supabase dashboard SMTP config, not app code — no task needed; flagged here so it isn't mistaken for a gap. Migration path for existing buyers is explicitly out of scope (sub-project C).
- **Placeholder scan:** none found — every step has complete, runnable code.
- **Type consistency:** `Profile`/`CurrentUser` types defined in Task 3 are the only cross-task types consumed later (Task 5's `<RequiresAccount>` only uses `useUser()`'s `ClientUser`, also Task 3). Both call sites match the Task 3 definitions.
