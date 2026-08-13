# City Page Spec — /sell-test-strips/[state]/[city]
**Date:** 2026-08-12
**Depends on:** P0 fixes documented in `2026-08-12-metro-target-map.md` (www redirect, homepage canonical)

---

## The Core Problem This Spec Solves

Google is collapsing all 50 state pages as near-duplicates. The state-page template produces structurally identical pages where the only changing content is the state name string. City pages will suffer the same fate unless each page is built from real, record-level data that differs between pages. That is the design constraint everything below flows from.

---

## URL Structure

```
/sell-test-strips/[state]/[city]
```

Examples:
- `/sell-test-strips/nc/charlotte`
- `/sell-test-strips/tx/dallas`
- `/sell-test-strips/oh/columbus`

State segment matches existing routing (`app/sell-test-strips/[state]/`). City segment is a new nested dynamic route: `app/sell-test-strips/[state]/[city]/page.tsx`.

City slugs: lowercase, hyphenated, no state abbreviation repeated (the state is already in the URL). "New York City" → `new-york-city`. "Fort Worth" → `fort-worth`.

---

## Anti-Duplicate Content Rules (the hard gate)

These rules determine whether a city page is allowed to be published at all. They are not aspirational — they are a publish/no-publish binary.

### Rule 1: Minimum unique data threshold

A city page MUST contain at least three of the following five data blocks where the content differs from every other city page on the site:

| Block | Data source | What makes it unique |
|-------|-------------|---------------------|
| Buyer roster with real distances | `companies` table + `haversineMiles()` | Buyer names, miles from city center, accepted brands, transaction modes — all record-level |
| ZIP code list | `zip_centroids` WHERE state = X AND haversine distance ≤ 30mi of city center | Actual ZCTA ZIPs within the metro — differs for every city |
| Payout range for top brands | `accepted_brands` + `tier-pricing.ts` tiers, filtered to what nearby buyers actually accept | If buyer A accepts FreeStyle Lite (top tier) and buyer B does not, that's unique data |
| Transaction modes | `companies.transaction_modes` array, aggregated across nearby buyers | "Drop-off available" vs "mail-in only" varies by city |
| City-specific FAQ | 1 question written specifically for this city's context | Cannot be template-generated from state name alone |

**If fewer than three blocks can be populated with real, distinct data, do not publish the page.**

### Rule 2: Zero-buyer metro rule

If no buyer exists within 100 miles of the city center (queried via `haversineMiles()` against all active, non-mail-in companies):

**Do not publish a city page yet.**

Instead: ensure the state page exists, has the mail-in fallback CTA, and links to `/sell`. Add the city to the buyer recruitment target list in `2026-08-12-supply-recruitment.md`. A placeholder page with thin content is worse than no page — it dilutes crawl budget and establishes a thin-content footprint that's hard to recover from.

Exception: a metro may get a page with zero local buyers IF it has a dedicated, city-specific informational section (diabetes prevalence in that city, what the sell process looks like for mail-in, FAQ unique to that city) AND the mail-in buyer is surfaced prominently. This is the "informational" path, not the "directory" path. Word count floor: 600 words of genuinely unique prose. Do not generate this content from templates.

### Rule 3: State-page differentiation (parallel workstream)

The 50 existing state pages need a differentiation pass before or alongside Wave 1 city page launches. Without this, Google's duplicate-collapse problem persists at the state level and may spread to city pages. Required additions per state page:

- Live buyer count from Supabase rendered into the page (`{n} active buyers in {State}`)
- Grid of top 5 city links for states that have city pages (creates structural difference between states with/without city pages)
- Brand-acceptance summary (which top-tier brands do buyers in this state accept, pulled from `companies.accepted_brands`)
- One state-specific data point (diabetes rate, notable cities, etc.) — hand-written, not templated

This pass is a prerequisite for Wave 1 city pages in states where the state page is the parent.

---

## Required Page Sections (in order)

1. **Breadcrumb** — Home / Directory / [State] / [City]. Matches existing pattern in `buildBreadcrumbSchema()`.

2. **H1** — "Sell Diabetic Test Strips in [City], [State Abbrev]"

3. **Lead paragraph** — 2–3 sentences unique to this city. Must name the city and reference at least one local detail (buyer count, distance to nearest buyer, or local context). Not template-generated.

4. **Buyer roster** — Cards for all buyers within 100 miles, sorted by distance ascending (nearest first), using `withDistance()` from `lib/geo.ts`. Each card shows: buyer name, actual distance in miles ("4.2 miles away"), accepted brands, transaction modes, payment methods. Contact info gated behind free account (existing pattern via `stripCompanyContact()`).

5. **ZIP coverage block** — "We serve these ZIP codes near [City]:" — list of ZIPs from `zip_centroids` within 30 miles of city center, grouped visually. Limit display to 20 ZIPs max to avoid bloat; link to `/directory?zip=[nearest-zip]` for the full proximity search.

6. **Payout range table** — Brand + tier (top/mid/lower from `tier-pricing.ts`) + "available from [n] local buyers" count. Do not publish dollar figures unless real buyer quote data exists — the tier system is sufficient.

7. **City-specific FAQ** — 3–4 questions. One must be city-specific (e.g., "Where do buyers in Charlotte pay in person?"). Remaining 2–3 can reuse the state-page FAQ structure but with city name substituted. Rendered with `buildFaqPageSchema()`.

8. **Internal links** — See section below.

9. **State page link** — "See all [State] buyers →" links back to the state page.

---

## Schema Per City Page

| Schema type | Builder | Notes |
|-------------|---------|-------|
| BreadcrumbList | `buildBreadcrumbSchema()` | 4 levels: Home, Directory, State, City |
| FAQPage | `buildFaqPageSchema()` | City-specific questions |
| Service | New builder needed | `serviceType: "Diabetic Test Strip Buyer"`, `areaServed: { "@type": "City", name: "[City], [State]" }` |

The existing `buildLocalBusinessSchema()` is designed for a single named business. For city pages listing multiple buyers, emit one `LocalBusiness` schema block per buyer rendered on the page (in a `@graph` array). This requires a new schema builder: `buildCityPageGraph()` that wraps BreadcrumbList + FAQPage + Service + N × LocalBusiness into a single `@graph`.

---

## Title / Meta Patterns

- **Title tag:** `Sell Diabetic Test Strips in [City], [ST] — [N] Cash Buyers Near You`
- **Meta description:** `[N] buyers within [X] miles of [City] pay cash for unused diabetic test strips via PayPal, Zelle, or check. Compare payout rates and contact a buyer in minutes.`
- **Canonical:** `https://cash4teststripsusa.com/sell-test-strips/[state]/[city]` (no trailing slash, no www)

For zero-buyer pages (informational path only):
- **Title tag:** `Sell Diabetic Test Strips in [City], [ST] — Mail-In Buyers Available`

---

## Internal Linking

| Link direction | Implementation |
|----------------|---------------|
| City → State page | Footer of every city page |
| City → /directory?zip=[city-center-zip] | "Search by ZIP near [City]" in buyer roster section |
| City → Company pages | Each buyer card links to `/company/[slug]` (existing pattern) |
| State page → City pages | Add "Browse cities in [State]" section to each state page as part of the differentiation pass |
| Blog posts → City pages | Any blog post mentioning the city by name should link to the city page |
| Company page → City page | If a buyer's city matches a published city page, link to it from the company page |

---

## Rollout Cadence

Do not dump all pages at once. Rapid mass-publishing of structurally similar pages is the pattern that caused the state-page collapse. Drip cadence gives Google time to index and assign signals before the next wave arrives.

| Wave | Timing | Pages | Gate |
|------|--------|-------|------|
| 0 — State differentiation pass | Before Wave 1 | All 50 state pages updated | Must ship first |
| 1 — Verified buyer metros | Weeks 1–4 | 25–30 city pages (T1 metros only) | Buyer within 50mi confirmed in Supabase |
| 2 — Expanded coverage | Weeks 5–12 | 60–80 additional cities | Buyer within 100mi confirmed OR buyer recruited |
| 3 — Long tail | Weeks 13–24 | Remaining 150–200 cities | Buyer confirmed OR informational-path standard met |

No wave starts until the previous wave's pages show crawl evidence in GSC (pages appearing in Coverage report, even as Discovered or Crawled).
