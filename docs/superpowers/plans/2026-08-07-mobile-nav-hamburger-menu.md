# Mobile Nav Hamburger Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the header's un-responsive nav row with a hamburger menu below the `md` (768px) breakpoint.

**Architecture:** A new client component `app/SiteNav.tsx` owns the toggle state and renders both the desktop link row and the mobile hamburger + dropdown panel. `app/layout.tsx` (a Server Component, required for its `metadata` export) renders `<SiteNav />` inside `<header>` in place of the current inline `<nav>`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind. No new dependencies — hamburger/X icon is inline SVG.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-07-mobile-nav-hamburger-menu-design.md`
- No new npm dependencies
- Desktop (≥ md) visual behavior must be pixel-identical to today
- `app/layout.tsx` must remain a Server Component (keeps its `metadata` export)

---

## Task 1: Extract nav into SiteNav.tsx with hamburger menu

**Files:**
- Create: `app/SiteNav.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `SiteNav` (default export, no props) — a client component rendering the full header nav content (logo + links + CTA + mobile menu)

- [ ] **Step 1: Read the current layout.tsx nav block**

The current block to replace lives in `app/layout.tsx` inside `<header>`:

```tsx
        <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
          <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg text-emerald-700 tracking-tight">
              CashForTestStrips<span className="text-gray-900">USA</span>
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/directory" className="hover:text-emerald-700 transition-colors">
                Find a Buyer
              </Link>
              <Link href="/blog" className="hover:text-emerald-700 transition-colors">
                Blog
              </Link>
              <Link href="/" className="hover:text-emerald-700 transition-colors">
                How It Works
              </Link>
              <Link
                href="/sell"
                className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors"
              >
                Get Cash Now
              </Link>
            </div>
          </nav>
        </header>
```

- [ ] **Step 2: Create app/SiteNav.tsx**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/directory", label: "Find a Buyer" },
  { href: "/blog", label: "Blog" },
  { href: "/", label: "How It Works" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);

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
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 3: Update layout.tsx to use SiteNav**

Add the import near the top of `app/layout.tsx`:

```tsx
import SiteNav from "./SiteNav";
```

Replace the `<header>...</header>` block (shown in Step 1) with:

```tsx
        <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
          <SiteNav />
        </header>
```

- [ ] **Step 4: Run the build to confirm no type errors**

Run: `npm run build`
Expected: builds cleanly, no type errors

- [ ] **Step 5: Manual browser verification**

Run `npm run dev`, open the homepage:
1. At a wide viewport (≥768px): confirm the header looks identical to before — logo, 3 links, CTA button, no hamburger visible
2. Resize the browser to a narrow viewport (e.g. 375px): confirm the 3 links disappear, the CTA button and a hamburger icon remain
3. Click the hamburger: confirm a dropdown panel appears below the header with the 3 links stacked, and the icon changes to an X
4. Click a link in the panel: confirm it navigates to the right page and the panel closes
5. Click the hamburger again (icon should be showing X): confirm it closes the panel without navigating
6. Confirm the CTA button remains clickable and correctly styled at both widths

- [ ] **Step 6: Commit**

```bash
git add app/SiteNav.tsx app/layout.tsx
git commit -m "feat: add mobile hamburger menu to site nav"
```
