# Homepage Design Spec — Cash4TestStripsUSA

**Date:** 2026-06-15  
**Status:** Approved

---

## Overview

Replace the Next.js scaffold placeholder with a full SEO-optimized homepage. The page is a server component that fetches featured buyers from Supabase, with a client-side hero search bar and geolocation button.

---

## Visual Direction

- **Palette:** Dark navy (`#0f2d52`) + teal-green (`#27ae60`) + sky blue accent (`#4fc3f7`)
- **Feel:** Medical & trustworthy — credible, professional, not flashy
- **Font:** Geist Sans (already installed via layout.tsx)
- **Brand name displayed:** Cash4TestStripsUSA

---

## Page Sections (top to bottom)

### 1. Nav
- Logo: `Cash4TestStripsUSA` (navy bg, sky-blue accent on "TestStrips")
- Links: Directory · By State · Blog · How It Works
- Right CTA: "Find a Buyer" green button → `/directory`
- Static — no data fetching

### 2. Hero
- Eyebrow badge: "🩺 Free · No Signup · Trusted Buyers"
- H1: "Sell Your Unused Test Strips for Fast Cash"
- Subtext: "Find a verified cash buyer near you — no middleman, no hassle."
- **Search bar** (client component): text input placeholder "Search by state, city, or buyer name…" + Search button → navigates to `/directory?q={query}`
- **"Use My Location" button** (client component):
  1. Calls `navigator.geolocation.getCurrentPosition()`
  2. On success: reverse-geocodes coords using BigDataCloud free API (`https://api.bigdatacloud.net/data/reverse-geocode-client`) to extract state name
  3. Redirects to `/sell-test-strips/[state-slug]`
  4. On denial or error: redirects to `/directory`
  - State slug format: lowercase hyphenated full name, e.g. `NY` → `new-york`, `SC` → `south-carolina`. A lookup map converts the abbreviation returned by the geocoding API.
- Stats strip below search: "33+ Verified Buyers · 20+ States Covered · Free To Use"

### 3. How It Works
- Label: "Simple Process"
- Title: "How It Works"
- 3 steps in a grid:
  1. Find Your State — search or browse
  2. Contact a Buyer — direct, no middleman, most respond same day
  3. Get Paid — PayPal, Zelle, Venmo, or check
- Static — no data fetching

### 4. Featured Buyers
- Label: "Top Picks"
- Title: "Featured Buyers"
- Fetches from Supabase server-side: `companies` where `active = true`, ordered by `featured DESC`, limit 6
- Displays as a 3-column grid of buyer cards
- Each card: name, city + state badge, tags (state, payment methods), "Visit Site →" button (routes through `/api/track`) if the company has a URL, or "📞 Call to Sell" (`tel:5187799751`) if no URL
- Featured companies get a green border + "⭐ Featured" badge
- "View all X buyers →" link to `/directory`

### 5. State Strip
- Dark navy background
- Title: "Find Buyers by State"
- Pill links for all states that have at least one active buyer (hardcoded list for v1 — 13 states shown + "More States →")
- Each pill links to `/sell-test-strips/[state-slug]`
- Static for v1

### 6. Blog Teasers
- Label: "Learn More"
- Title: "From the Blog"
- 3-column grid of blog cards
- For v1: hardcoded placeholder posts (no blog system yet)
- Each card: colored gradient thumbnail, category label, post title

### 7. Footer
- Brand description blurb
- Two link columns: Directory (All Buyers, By State, Featured) · Resources (Blog, How It Works, FAQ)
- Bottom bar: copyright + disclaimer ("Not affiliated with any test strip manufacturer")
- Static

---

## Data Fetching

| Section | Source | Method |
|---|---|---|
| Featured Buyers | Supabase `companies` | Server-side in `page.tsx` |
| Search | URL param `?q=` | Client navigation |
| Geolocation | Browser API + BigDataCloud | Client-side in HeroSearch |
| Everything else | Static | N/A |

---

## Components

| File | Type | Purpose |
|---|---|---|
| `app/page.tsx` | Server component | Page shell, fetches featured companies, composes sections |
| `components/Nav.tsx` | Server component | Site navigation |
| `components/HeroSearch.tsx` | **Client component** | Search input + geolocation button |
| `components/BuyerCard.tsx` | Server component | Reusable card for a single buyer |
| `components/HowItWorks.tsx` | Server component | Static 3-step section |
| `components/FeaturedBuyers.tsx` | Server component | Grid of BuyerCards |
| `components/StateStrip.tsx` | Server component | State pill links |
| `components/BlogTeaser.tsx` | Server component | Placeholder blog cards |
| `components/Footer.tsx` | Server component | Site footer |

---

## SEO

- `generateMetadata` exported from `app/page.tsx`:
  - Title: `"Sell Diabetic Test Strips for Cash | Cash4TestStripsUSA"`
  - Description: `"Find local cash buyers for unused diabetic test strips. Free directory of 33+ verified buyers across the USA."`
  - OG image: placeholder for now
- No schema markup in v1 (add in a later pass)

---

## Click Tracking

All "Visit Site" buttons on buyer cards must route through `/api/track?company={id}&url={encodedUrl}` — never link directly to buyer sites.

---

## Out of Scope (this spec)

- Blog system (posts are placeholder cards only)
- State page content (`/sell-test-strips/[state]`)
- Directory page with full filtering (`/directory`)
- Admin dashboard
- Lead capture form
