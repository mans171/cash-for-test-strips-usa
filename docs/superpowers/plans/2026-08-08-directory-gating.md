# Directory Gating + Nav Login State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the Contact/Visit-site buyer actions on `/directory` and `/company/[slug]` behind login, and make the site nav show a Login link (logged out) or the user's email + Log out (logged in).

**Architecture:** Both pages stay Server Components with unchanged public content (name, city, description, ratings, states, payment methods). Only the Contact/Visit-site action elements get wrapped in the existing `RequiresAccount` client component, which gains an optional `className` prop so callers can preserve layout sizing (e.g. `flex-1`) without touching its internal structure. `SiteNav` gains `useUser()`/`signOut()` from the existing `lib/auth-client.tsx`.

**Tech Stack:** Next.js 16.2.9 App Router, existing auth infrastructure (`useUser`, `signOut`, `RequiresAccount`) — no new dependencies, no new API routes, no schema changes.

## Global Constraints

- Public/crawlable content (name, city, description, ratings, states served, payment methods, "View details" navigation) stays fully visible and ungated on both pages — only the actual Contact/Visit-site action is gated.
- Never wrap a `RequiresAccount` around an element that would otherwise render nothing (`null`) — if there's nothing behind the gate, don't render the gate either (matches the fix already applied on `/sell` for phone-only buyers).
- `RequiresAccount`'s existing authenticated-user return path (`<>{children}</>`, a React Fragment with no wrapping DOM node) must NOT change — any layout fix must go through the loading/logged-out branches only, to avoid regressing the already-shipped `/sell` gating.
- No new automated tests — this repo has no component-test tooling; verification is manual browser checks, consistent with the `/sell` gating work.

---

### Task 1: `RequiresAccount` gains an optional `className`

**Files:**
- Modify: `app/components/RequiresAccount.tsx` (full replacement)

**Interfaces:**
- Consumes: `useUser()` (unchanged).
- Produces: `RequiresAccount({ children, onRequestAccount?, className? })` — `className` is applied to the loading-state wrapper div and the logged-out-state wrapper div only. The authenticated-state return (`<>{children}</>`) is unchanged, so every existing call site on `/sell` (which don't pass `className`) keeps working identically. Tasks 2 and 3 use `className="flex-1"` where layout requires it.

- [ ] **Step 1: Read the current file first**

Read `app/components/RequiresAccount.tsx` in full — confirm it matches what's described below before editing (it should, from the customer-accounts sub-project).

- [ ] **Step 2: Replace the file**

```tsx
// app/components/RequiresAccount.tsx
"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { useUser } from "@/lib/auth-client"

export function RequiresAccount({
  children,
  onRequestAccount,
  className,
}: {
  children: ReactNode
  onRequestAccount?: () => void
  className?: string
}) {
  const { user, loading } = useUser()

  if (loading) {
    return <div className={`opacity-50 pointer-events-none ${className ?? ""}`}>{children}</div>
  }

  if (!user) {
    return (
      <div className={`flex flex-col gap-1 ${className ?? ""}`}>
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

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors — the `RequiresAccount` usages on `/sell` (which don't pass `className`) still typecheck fine since it's optional.

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: succeeds

- [ ] **Step 5: Commit**

```bash
git add app/components/RequiresAccount.tsx
git commit -m "feat: RequiresAccount accepts an optional className for layout sizing"
```

---

### Task 2: Gate `/directory`'s Contact/Visit-site button

**Files:**
- Modify: `app/directory/page.tsx`

**Interfaces:**
- Consumes: `RequiresAccount` (Task 1, with `className="flex-1"`).
- Produces: no new exports.

- [ ] **Step 1: Read the current file first**

Read `app/directory/page.tsx` in full.

- [ ] **Step 2: Add the import**

Find:

```tsx
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { DirectoryFilters } from "./filters";
import { STATE_LABELS } from "@/lib/states";
import type { Company } from "@/lib/types";
```

Replace with:

```tsx
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { DirectoryFilters } from "./filters";
import { STATE_LABELS } from "@/lib/states";
import type { Company } from "@/lib/types";
import { RequiresAccount } from "@/app/components/RequiresAccount";
```

- [ ] **Step 3: Wrap the Contact/Visit-site action**

Find (inside `DirectoryCard`):

```tsx
      <div className="flex gap-2 mt-auto pt-1">
        <Link
          href={`/company/${company.slug}`}
          className="flex-1 text-center text-xs font-medium border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:border-emerald-400 hover:text-emerald-700 transition-colors"
        >
          View details
        </Link>
        {company.url ? (
          <a
            href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Visit site →
          </a>
        ) : (
          <a
            href={`tel:${company.phone ?? "5187799751"}`}
            className="flex-1 text-center text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Contact
          </a>
        )}
      </div>
```

Replace with:

```tsx
      <div className="flex gap-2 mt-auto pt-1">
        <Link
          href={`/company/${company.slug}`}
          className="flex-1 text-center text-xs font-medium border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:border-emerald-400 hover:text-emerald-700 transition-colors"
        >
          View details
        </Link>
        <RequiresAccount className="flex-1">
          {company.url ? (
            <a
              href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Visit site →
            </a>
          ) : (
            <a
              href={`tel:${company.phone ?? "5187799751"}`}
              className="flex-1 text-center text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Contact
            </a>
          )}
        </RequiresAccount>
      </div>
```

This always renders something behind the gate (either the buyer's real URL/phone, or a fallback to the site owner's own number), so no null-guard is needed here, unlike Task 3's bottom CTA.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Build check**

Run: `npm run build`
Expected: succeeds

- [ ] **Step 6: Manual browser verification**

Start `npm run dev`, then in a browser:

1. Logged out, visit `/directory`. Confirm every card still shows name/city/description/ratings/states/payment methods and a working "View details" link. Confirm the Contact/Visit-site button is greyed out with "Create an account to view this information."
2. Click the gate's "Create an account" link — confirm it goes to `/signup`.
3. Log in (existing test account or create one), return to `/directory`. Confirm the Contact/Visit-site button is now fully visible and clickable for every card.

Stop the dev server when done.

- [ ] **Step 7: Commit**

```bash
git add app/directory/page.tsx
git commit -m "feat: gate directory Contact/Visit-site buttons behind login"
```

---

### Task 3: Gate `/company/[slug]`'s CTAs

**Files:**
- Modify: `app/company/[slug]/page.tsx`

**Interfaces:**
- Consumes: `RequiresAccount` (Task 1).
- Produces: no new exports.

- [ ] **Step 1: Read the current file first**

Read `app/company/[slug]/page.tsx` in full.

- [ ] **Step 2: Add the import**

Find:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { STATE_LABELS } from "@/lib/states";
```

Replace with:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { STATE_LABELS } from "@/lib/states";
import { RequiresAccount } from "@/app/components/RequiresAccount";
```

- [ ] **Step 3: Wrap the header "Visit Website" button**

Find:

```tsx
          {company.url && (
            <a
              href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 bg-emerald-600 text-white font-semibold px-5 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
            >
              Visit Website →
            </a>
          )}
```

Replace with:

```tsx
          {company.url && (
            <RequiresAccount className="shrink-0">
              <a
                href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-emerald-600 text-white font-semibold px-5 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
              >
                Visit Website →
              </a>
            </RequiresAccount>
          )}
```

This is already conditionally rendered only when `company.url` exists, so nothing behind the gate is ever empty here.

- [ ] **Step 4: Wrap the bottom "Ready to sell?" CTA**

Find:

```tsx
          {company.url ? (
            <a
              href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
            >
              Visit site →
            </a>
          ) : company.phone ? (
            <a
              href={`tel:${company.phone}`}
              className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
            >
              Contact
            </a>
          ) : null}
```

Replace with:

```tsx
          {(company.url || company.phone) && (
            <RequiresAccount>
              {company.url ? (
                <a
                  href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
                >
                  Visit site →
                </a>
              ) : (
                <a
                  href={`tel:${company.phone}`}
                  className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
                >
                  Contact
                </a>
              )}
            </RequiresAccount>
          )}
```

The `(company.url || company.phone) &&` guard is important: if a buyer has neither, nothing should render — including no gate, matching the constraint that a `RequiresAccount` must never wrap an empty/null child.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Build check**

Run: `npm run build`
Expected: succeeds

- [ ] **Step 7: Manual browser verification**

Start `npm run dev`, then in a browser:

1. Logged out, visit a `/company/[slug]` page for a buyer with a URL on file. Confirm the header "Visit Website" button and the bottom CTA are both greyed out with the gate message; confirm the rest of the page (description, states, payment methods, brands, owner name) is fully visible.
2. Visit a `/company/[slug]` page for a buyer with neither URL nor phone on file (if one exists; otherwise confirm via code reading that the `(company.url || company.phone) &&` guard is correct). Confirm no gate message appears where there's nothing to gate.
3. Log in, revisit both pages. Confirm the CTAs are now fully visible and clickable.

Stop the dev server when done.

- [ ] **Step 8: Commit**

```bash
git add "app/company/[slug]/page.tsx"
git commit -m "feat: gate company detail page CTAs behind login"
```

---

### Task 4: Nav shows Login (logged out) or email + Log out (logged in)

**Files:**
- Modify: `app/SiteNav.tsx` (full replacement)

**Interfaces:**
- Consumes: `useUser()`, `signOut()` from `lib/auth-client.tsx` (both already exist, unchanged).
- Produces: no new exports — final integration point.

- [ ] **Step 1: Read the current file first**

Read `app/SiteNav.tsx` in full.

- [ ] **Step 2: Replace the file**

```tsx
// app/SiteNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, signOut } from "@/lib/auth-client";

const NAV_LINKS = [
  { href: "/directory", label: "Find a Buyer" },
  { href: "/blog", label: "Blog" },
  { href: "/", label: "How It Works" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    setOpen(false);
    router.push("/");
  }

  return (
    <nav className="max-w-6xl mx-auto px-4 relative">
      <div className="h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-emerald-700 tracking-tight">
          CashForTestStrips<span className="text-gray-900">USA</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-emerald-700 transition-colors">
              {link.label}
            </Link>
          ))}
          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{user.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hover:text-emerald-700 transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link href="/login" className="hover:text-emerald-700 transition-colors">
                Login
              </Link>
            )
          )}
          <Link
            href="/sell"
            className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors"
          >
            Get Cash Now
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <Link
            href="/sell"
            className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Get Cash Now
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="p-2 -mr-2 text-gray-700"
          >
            {open ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden absolute left-0 right-0 top-16 bg-white border-b border-gray-100 shadow-lg flex flex-col px-4 py-3 gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {!loading && (
            user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="py-2 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors text-left"
              >
                Log out ({user.email})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors"
              >
                Login
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: succeeds

- [ ] **Step 5: Manual browser verification**

Start `npm run dev`, then in a browser:

1. Logged out, confirm the desktop nav shows a "Login" link that goes to `/login`. Confirm the mobile menu (narrow viewport or resize) also shows "Login."
2. Log in. Confirm the desktop nav now shows your email and a "Log out" button instead of "Login." Confirm the mobile menu shows "Log out (email)."
3. Click "Log out" (desktop or mobile). Confirm you're signed out (nav reverts to "Login") and redirected to `/`.

Stop the dev server when done.

- [ ] **Step 6: Commit**

```bash
git add app/SiteNav.tsx
git commit -m "feat: show login/logout state in site nav"
```

---

## Self-Review Notes

- **Spec coverage:** Architecture (Task 1's `className` addition enables Tasks 2-3's layout-safe gating), Components (directory card — Task 2; company detail CTAs — Task 3; nav — Task 4), Data Flow (all 4 steps from the spec are covered: gated view → signup link → return logged in → nav reflects state), Testing (each task's manual verification maps directly to the spec's Testing section bullets).
- **Placeholder scan:** none found — every step has complete, runnable code.
- **Type consistency:** `RequiresAccount`'s new `className?: string` prop (Task 1) is used identically in Task 2 (`className="flex-1"`) and Task 3 (`className="shrink-0"` and the no-className default). `useUser()`/`signOut()` signatures (unchanged, pre-existing) match exactly how Task 4 calls them (`{ user, loading }` destructuring, `await signOut()`).
