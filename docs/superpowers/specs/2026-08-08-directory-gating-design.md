# Directory Gating + Nav Login State Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-08
**Status:** Approved

## Overview

Gates buyer contact actions (Contact/Visit-site) on the public `/directory` and `/company/[slug]` pages behind login, and adds a login-state-aware link to the site nav. This reverses an earlier explicit decision (made during the customer-accounts sub-project) to leave the directory ungated — the user confirmed on the live site that anyone could still click through to a buyer's phone number or website with no account, and wants that closed.

## Why

The whole point of requiring accounts is to gate access to buyer contact info. `/directory` and `/company/[slug]` were an unguarded side door to the exact same data `/sell` now protects — a visitor never needed to touch the account-gated checkout flow at all if they just browsed the directory directly.

## Architecture

Both pages stay Server Components with unchanged data fetching — name, city, description, ratings, states served, and payment methods remain publicly visible and crawlable (no SEO regression). Only the Contact/Visit-site actions get wrapped in the existing `<RequiresAccount>` component (already a client component, already proven safe to nest inside server-rendered pages via `/sell`). Since neither page has in-progress form state to protect, `RequiresAccount` uses its default behavior (no `onRequestAccount` modal override) — a logged-out visitor sees the greyed-out button plus a "Create an account" link straight to `/signup`.

## Components

- **`app/directory/page.tsx`**: in `DirectoryCard`, "View details" (links to `/company/[slug]`) stays ungated. The `Contact`/`Visit site` action gets wrapped in `<RequiresAccount>`.
- **`app/company/[slug]/page.tsx`**: both CTA instances (the header "Visit Website" button and the bottom "Ready to sell?" CTA section) get wrapped in `<RequiresAccount>`.
- **`app/SiteNav.tsx`**: gains `useUser()` (already `"use client"`, no conversion needed). Logged out: adds a "Login" link to `/login`, in both the desktop nav and the mobile menu. Logged in: replaces it with the user's email and a "Log out" action calling the existing `signOut()` from `lib/auth-client.tsx`.

## Data Flow

1. Anonymous visitor browses `/directory` or a `/company/[slug]` page — sees full listing content, sees the Contact/Visit-site button greyed out with "Create an account to view this information."
2. Clicks the link → `/signup` → creates an account → lands on `/` (existing `/signup` behavior, unchanged — no return-to-directory redirect in this spec's scope).
3. Returns to the directory/company page already logged in (session persists via cookie) — button is now live.
4. Nav bar reflects session state on every page: "Login" link when logged out; email + "Log out" when logged in.

## Testing

No new automated tests — this repo has no component-test tooling, consistent with how the `/sell` gating work was verified. Manual verification: logged-out `/directory` shows every card's Contact/Visit-site button gated; logged-out `/company/[slug]` shows the gated CTA in both locations; logged-in versions of both show working buttons; nav shows "Login" (desktop + mobile) when logged out and email + "Log out" when logged in.

## Out of Scope

- Any change to what content is publicly visible/crawlable on these pages (name, description, ratings, states, payment methods all stay public).
- A return-to-directory redirect after signup (out of scope; `/signup` already redirects to `/` today, unchanged).
- Buyer accounts / the shared-link claim migration (still queued as its own future sub-project).
