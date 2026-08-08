# Customer Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate buyer contact info (Text/Email buttons) on `/sell` behind a real account, using an inline modal so the customer's in-progress order is never lost, and update homepage messaging to match.

**Architecture:** Extract the existing `/signup` page's form logic into a reusable `SignupForm` component parameterized by an `onSuccess` callback and an optional `role`. A new `AccountModal` wraps that form in an overlay for use from `/sell` (no navigation, no state loss). `RequiresAccount` (already built, unused) gains an `onRequestAccount` prop so it can open the modal instead of linking to `/signup`. `SellFlowClient` wraps each buyer card's contact buttons in `RequiresAccount`, renders the modal, and auto-fills the existing Contact Information fields from the logged-in user's profile via a small testable helper.

**Tech Stack:** Next.js 16.2.9 App Router, `@supabase/ssr` (already installed), Supabase Postgres + RLS, Vitest with live-DB integration tests.

## Global Constraints

- No new dependencies.
- Only contact actions (Text/Email buttons) are gated — buyer name/city and the search/results flow itself stay ungated for anonymous visitors.
- The customer's in-progress order (`items`, `buyers`, `state`, etc. — all React state in `SellFlowClient`) must never be lost by the account-creation flow. No `router.push`/navigation away from `/sell` for this flow.
- Profile auto-fill (name/phone from `profiles`, email from the session) must fail silently on any error and never block checkout — it's a convenience default, not a required step.
- Auto-filled Contact Information fields stay editable; auto-fill only sets a field if it's still empty (never overwrites something the customer already typed).
- Every test file hits the real Supabase project directly via `supabaseAdmin` (`lib/supabase-admin.ts`) or a real signed-in client, with bounded `afterEach` cleanup — no mocked-DB tests in this repo. Never use `.single()` in a query that could match 0 or 2+ rows — use `.maybeSingle()`.
- Homepage copy: both occurrences of `"Free to use · No account needed"` become `"Free to use · Free account required"` (`app/page.tsx`, the meta description and the visible hero badge).

---

### Task 1: Extract `SignupForm` from the `/signup` page

**Files:**
- Create: `app/components/SignupForm.tsx`
- Modify: `app/(auth)/signup/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `createBrowserSupabaseClient()` (`lib/supabase/client.ts`), `useUser()` (`lib/auth-client.tsx`).
- Produces: `SignupForm({ onSuccess, role }: { onSuccess: () => void; role?: 'customer' | 'buyer' })` — a client component with no navigation of its own; all "done" paths (already-logged-in on mount, successful profile insert) call `onSuccess()` instead of `router.push`. Task 2 (`AccountModal`) and this task's rewritten `signup/page.tsx` both consume this component.

This is a pure refactor — the current `app/(auth)/signup/page.tsx` (read it first to confirm it matches) has this exact logic embedded directly in the page; this task moves it out unchanged except for replacing `router.push("/")` with `onSuccess()` in the two places it appears, and taking `role` as a prop instead of deriving it from `useSearchParams()` internally.

- [ ] **Step 1: Create `app/components/SignupForm.tsx`**

```tsx
// app/components/SignupForm.tsx
"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/auth-client"

export function SignupForm({
  onSuccess,
  role = "customer",
}: {
  onSuccess: () => void
  role?: "customer" | "buyer"
}) {
  const { user, loading } = useUser()

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
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user && !pendingUserId && !submitting) {
      onSuccess()
    }
  }, [loading, user, pendingUserId, submitting, onSuccess])

  async function insertProfile(userId: string) {
    const supabase = createBrowserSupabaseClient()
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
      setPendingUserId(userId)
      setSubmitting(false)
      return
    }

    onSuccess()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const supabase = createBrowserSupabaseClient()

    // NOTE: this flow assumes "Confirm email" is OFF in Supabase Auth
    // settings (Authentication > Providers > Email), so signUp() returns a
    // live session immediately. If it's ever turned back on, signUp()
    // returns session: null and we can't insert the profile yet (no
    // authenticated session for RLS) — handled below.
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

    if (!signUpData.session) {
      setError("Check your email to confirm your account before continuing.")
      setSubmitting(false)
      return
    }

    await insertProfile(userId)
  }

  async function handleRetryProfile() {
    if (!pendingUserId) return
    setError(null)
    setSubmitting(true)
    await insertProfile(pendingUserId)
  }

  if (loading || (user && !pendingUserId && !submitting)) {
    return null
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
        {error && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-red-600">{error}</p>
            {pendingUserId && (
              <button
                type="button"
                onClick={handleRetryProfile}
                disabled={submitting}
                className="self-start text-sm font-medium text-emerald-700 underline disabled:opacity-50"
              >
                {submitting ? "Retrying..." : "Try again"}
              </button>
            )}
          </div>
        )}
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

- [ ] **Step 2: Replace `app/(auth)/signup/page.tsx` with a thin wrapper**

```tsx
// app/(auth)/signup/page.tsx
"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SignupForm } from "@/app/components/SignupForm"

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  )
}

function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") === "buyer" ? "buyer" : "customer"

  return <SignupForm role={role} onSuccess={() => router.push("/")} />
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: succeeds, `/signup` still listed as a route, no Suspense-boundary error (Next.js 16 requires `useSearchParams()` inside a `<Suspense>` boundary, preserved here).

- [ ] **Step 5: Manual regression check**

Start `npm run dev`, visit `/signup`, confirm the form renders identically to before (all 8 fields, same layout) — this is a pure refactor, so a visual/behavioral diff here would mean a mistake in the extraction, not an intentional change. Stop the dev server when done.

- [ ] **Step 6: Commit**

```bash
git add app/components/SignupForm.tsx "app/(auth)/signup/page.tsx"
git commit -m "refactor: extract SignupForm into a reusable component"
```

---

### Task 2: `AccountModal` component

**Files:**
- Create: `app/components/AccountModal.tsx`

**Interfaces:**
- Consumes: `SignupForm` (Task 1) — `{ onSuccess, role? }`.
- Produces: `AccountModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void })` — a client component rendering `SignupForm` inside a full-screen overlay. Task 5 (`SellFlowClient`) renders this conditionally and supplies both callbacks.

- [ ] **Step 1: Create `app/components/AccountModal.tsx`**

```tsx
// app/components/AccountModal.tsx
"use client"

import { SignupForm } from "./SignupForm"

export function AccountModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          &times;
        </button>
        <SignupForm onSuccess={onSuccess} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/components/AccountModal.tsx
git commit -m "feat: add AccountModal for inline account creation"
```

---

### Task 3: `RequiresAccount` gains an `onRequestAccount` prop

**Files:**
- Modify: `app/components/RequiresAccount.tsx` (full replacement)

**Interfaces:**
- Consumes: `useUser()` (`lib/auth-client.tsx`) — unchanged.
- Produces: `RequiresAccount({ children, onRequestAccount? }: { children: ReactNode; onRequestAccount?: () => void })`. When `onRequestAccount` is provided, the "Create an account" text renders as a button calling it (used by Task 5 to open `AccountModal`). When omitted, it renders the original `<Link href="/signup">` — this keeps the component backward-compatible for any future non-modal usage.

- [ ] **Step 1: Replace `app/components/RequiresAccount.tsx`**

```tsx
// app/components/RequiresAccount.tsx
"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { useUser } from "@/lib/auth-client"

export function RequiresAccount({
  children,
  onRequestAccount,
}: {
  children: ReactNode
  onRequestAccount?: () => void
}) {
  const { user, loading } = useUser()

  if (loading) {
    return <div className="opacity-50 pointer-events-none">{children}</div>
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-1">
        <div className="opacity-40 pointer-events-none">{children}</div>
        <p className="text-xs text-red-600">
          {onRequestAccount ? (
            <button type="button" onClick={onRequestAccount} className="underline">
              Create an account
            </button>
          ) : (
            <Link href="/signup" className="underline">
              Create an account
            </Link>
          )}{" "}
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
git commit -m "feat: RequiresAccount supports opening a modal instead of navigating"
```

---

### Task 4: `fetchOwnProfileContact` helper for Contact Information auto-fill

**Files:**
- Create: `lib/profile-lookup.ts`
- Test: `lib/__tests__/profile-lookup.test.ts`

**Interfaces:**
- Consumes: any `SupabaseClient` instance (from `@supabase/supabase-js`) and a `userId: string`.
- Produces: `fetchOwnProfileContact(client: SupabaseClient, userId: string): Promise<{ name: string; phone: string } | null>` — returns `null` on any error or missing row. Task 5 (`SellFlowClient`) calls this with a browser client and the logged-in user's id to auto-fill the Contact Information fields (email comes from `useUser()`'s session data directly, not from this helper — `profiles` has no `email` column, it lives on `auth.users`).

- [ ] **Step 1: Write the failing test**

```typescript
// lib/__tests__/profile-lookup.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchOwnProfileContact } from '@/lib/profile-lookup'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const cleanupUserIds: string[] = []

afterEach(async () => {
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
})

describe('fetchOwnProfileContact', () => {
  it("returns the signed-in user's own name and phone", async () => {
    const email = `profile-lookup-test-${Date.now()}@example.com`
    const password = 'test-password-123'

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'customer',
      name: 'Auto Fill Test',
      phone: '5551239999',
      address_street: '1 Test Ave',
      address_city: 'Troy',
      address_state: 'NY',
      address_zip: '12180',
    })
    expect(profileError).toBeNull()

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    expect(signInError).toBeNull()

    const contact = await fetchOwnProfileContact(client, userId)
    expect(contact).toEqual({ name: 'Auto Fill Test', phone: '5551239999' })

    await client.auth.signOut()
  })

  it('returns null when no profile row exists for the given id', async () => {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `profile-lookup-noprofile-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const contact = await fetchOwnProfileContact(supabaseAdmin, userId)
    expect(contact).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- profile-lookup`
Expected: FAIL — `lib/profile-lookup.ts` doesn't exist yet ("Cannot find module '@/lib/profile-lookup'").

- [ ] **Step 3: Write `lib/profile-lookup.ts`**

```typescript
// lib/profile-lookup.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export type OwnProfileContact = {
  name: string
  phone: string
}

export async function fetchOwnProfileContact(
  client: SupabaseClient,
  userId: string
): Promise<OwnProfileContact | null> {
  const { data, error } = await client
    .from('profiles')
    .select('name, phone')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return { name: data.name, phone: data.phone }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- profile-lookup`
Expected: PASS (2/2)

- [ ] **Step 5: Commit**

```bash
git add lib/profile-lookup.ts lib/__tests__/profile-lookup.test.ts
git commit -m "feat: add fetchOwnProfileContact helper for checkout auto-fill"
```

---

### Task 5: Wire gating, modal, and auto-fill into `SellFlowClient`

**Files:**
- Modify: `app/sell/SellFlowClient.tsx`

**Interfaces:**
- Consumes: `useUser()` (`lib/auth-client.tsx`), `createBrowserSupabaseClient()` (`lib/supabase/client.ts`), `fetchOwnProfileContact()` (Task 4), `RequiresAccount` (Task 3), `AccountModal` (Task 2).
- Produces: no new exports — this is the integration point where everything from Tasks 1-4 becomes visible to a real customer.

Read `app/sell/SellFlowClient.tsx` first — it's 472 lines and this task only touches the top of the file (imports, state) and the `stage === "results"` branch. Do not touch the `"build"` or `"sent"` stage rendering, or any of the item-building logic above the `stage === "results"` block.

- [ ] **Step 1: Update the import block**

Find this line near the top of the file:

```tsx
import { useState } from "react";
```

Replace it with:

```tsx
import { useEffect, useRef, useState } from "react";
```

Then add these new imports directly below the existing `import { EXPIRATION_MONTH_OPTIONS, ... } from "@/lib/expiration";` line:

```tsx
import { useUser } from "@/lib/auth-client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { fetchOwnProfileContact } from "@/lib/profile-lookup";
import { RequiresAccount } from "@/app/components/RequiresAccount";
import { AccountModal } from "@/app/components/AccountModal";
```

- [ ] **Step 2: Add account-modal state and the auto-fill effect**

Find this line (the last of the existing `useState` declarations, right before `function brandIdentity(...)`):

```tsx
  const [customerEmail, setCustomerEmail] = useState("");
```

Immediately after it, add:

```tsx
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const { user } = useUser();
  const hasAutoFilledRef = useRef(false);

  useEffect(() => {
    if (!user || hasAutoFilledRef.current) return;
    hasAutoFilledRef.current = true;
    setCustomerEmail((prev) => prev || user.email);
    const supabase = createBrowserSupabaseClient();
    fetchOwnProfileContact(supabase, user.id).then((contact) => {
      if (!contact) return;
      setCustomerName((prev) => prev || contact.name);
      setCustomerPhone((prev) => prev || contact.phone);
    });
  }, [user]);
```

This only sets a field when it's currently empty (`prev || ...`), so it never overwrites something the customer already typed, and `hasAutoFilledRef` ensures it only runs once per login detection rather than on every re-render.

- [ ] **Step 3: Gate the Text/Email buttons**

Find this block inside the `stage === "results"` branch (it's the button group for each buyer card):

```tsx
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
```

Replace it with the same block wrapped in `RequiresAccount`:

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

- [ ] **Step 4: Render the modal**

Find the closing of the `stage === "results"` return statement:

```tsx
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    );
  }
```

Replace it with (wrapping the existing `<div>` in a fragment and adding the modal as a sibling):

```tsx
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
      {accountModalOpen && (
        <AccountModal
          onClose={() => setAccountModalOpen(false)}
          onSuccess={() => setAccountModalOpen(false)}
        />
      )}
    </>
    );
  }
```

And find the opening of that same return statement:

```tsx
    return (
      <div className="flex flex-col gap-4">
```

Replace it with:

```tsx
    return (
      <>
      <div className="flex flex-col gap-4">
```

(Indentation of the fragment tags doesn't need to match the rest of the block precisely — this repo doesn't enforce a formatter on indentation of wrapping tags; just make sure the JSX is syntactically valid, i.e., the `<>` and the `<div className="flex flex-col gap-4">` both open before any content, and both `</div>` and `</>` close in the right order at the end.)

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: succeeds

- [ ] **Step 7: Manual browser verification**

Start `npm run dev`, then in a browser:

1. **Logged out:** go to `/sell`, build a simple order (any product, count, expiration, condition), select a state with at least one matched buyer, hit "Find My Buyer." Confirm the buyer card renders with the Text/Email buttons visibly greyed out and a "Create an account to view this information" message with a "Create an account" button (not a link navigating away).
2. Click "Create an account." Confirm a modal opens over the page — the order summary and buyer cards underneath are still there (page did not navigate).
3. Fill out the signup form inside the modal with a real-looking test email (e.g. `customer-accounts-test+<timestamp>@example.com`) and submit. Confirm the modal closes and the Text/Email buttons for that buyer are now enabled (no more grey-out, no gate message).
4. Confirm the Contact Information "Your name" and "Phone" fields are now pre-filled from the profile just created, and the "Email" field is pre-filled with the signup email — and confirm all three are still editable (type into one, confirm it accepts input).
5. Confirm the order itself (items, buyer list) is exactly what it was before opening the modal — nothing was lost.
6. Reload the page (still logged in via the session cookie) and repeat step 1's search. Confirm the buttons are unlocked and fields pre-filled immediately, with no modal ever appearing.
7. Clean up: delete the test user created in step 3 the same way prior tasks in this project have (via `supabaseAdmin.auth.admin.deleteUser()` in a one-off script, removed after running), and verify via SQL against the live Supabase project (`whgwneuarnrsktolmqdj`) that no stray `auth.users`/`profiles` rows remain.

Stop the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add app/sell/SellFlowClient.tsx
git commit -m "feat: gate buyer contact buttons behind account creation on /sell"
```

---

### Task 6: Homepage copy update

**Files:**
- Modify: `app/page.tsx:8` and `app/page.tsx:56`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed elsewhere — pure copy change, independent of every other task in this plan.

- [ ] **Step 1: Update the meta description**

Find (near the top of `app/page.tsx`, inside `export const metadata`):

```tsx
  description:
    "Find local cash buyers for your unused diabetic test strips. Get paid fast via PayPal, Zelle, or check. Free to use. No account needed.",
```

Replace with:

```tsx
  description:
    "Find local cash buyers for your unused diabetic test strips. Get paid fast via PayPal, Zelle, or check. Free to use. Free account required.",
```

- [ ] **Step 2: Update the visible hero badge**

Find:

```tsx
            Free to use · No account needed
```

Replace with:

```tsx
            Free to use · Free account required
```

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: succeeds

- [ ] **Step 4: Manual check**

Start `npm run dev`, visit `/`, confirm the hero badge now reads "Free to use · Free account required." Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "docs: update homepage copy for required accounts"
```

---

## Self-Review Notes

- **Spec coverage:** Architecture (Tasks 1-2), Components section (Tasks 1-4), Data Flow (Task 5 realizes all 5 steps of the spec's flow), Error Handling (unchanged `SignupForm` error paths carried through Task 1's extraction; auto-fill failure handling in Task 5's effect, which silently no-ops on any `fetchOwnProfileContact` rejection since `.then()` with no `.catch()` on a promise that itself never rejects — `fetchOwnProfileContact` catches its own Supabase error internally and returns `null`, so there's nothing to unhandled-reject), Homepage (Task 6), Testing (Task 4's live-DB test covers the one new pure-logic unit; Task 5's manual checklist covers the full spec's manual-verification list).
- **Placeholder scan:** none found — every step has complete, runnable code.
- **Type consistency:** `SignupForm`'s `{ onSuccess, role? }` (Task 1) is consumed identically by `signup/page.tsx` (Task 1) and `AccountModal` (Task 2, `role` omitted → defaults to `'customer'`). `RequiresAccount`'s `onRequestAccount?: () => void` (Task 3) matches how `SellFlowClient` calls it in Task 5 (`() => setAccountModalOpen(true)`). `fetchOwnProfileContact`'s return shape `{ name: string; phone: string } | null` (Task 4) matches exactly how Task 5 destructures `contact.name`/`contact.phone`.
