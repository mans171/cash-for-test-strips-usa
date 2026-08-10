# AEO Technical Implementation Design — cash-for-test-strips-usa

**Date:** 2026-08-10
**Status:** Approved

## Overview

Implements Priority 1 + Priority 2 of the AEO (Answer Engine Optimization) audit produced earlier this session: structured data (JSON-LD schema), a sitemap, robots.txt, llms.txt, canonical tags, and a default OG image — plus wiring in the 3 new content pages + homepage FAQ section whose copy was drafted separately by content-agent. This is the code-only sub-project ("Sub-project A"); the content copywriting ("Sub-project B") already ran in parallel and its output is incorporated here as static content, not re-written.

## Why

The AEO audit found the site has strong underlying content (51 state blog posts with FAQ/pricing/legality sections, company profiles with structured data already in Postgres) but **zero machine-readable markup** — no JSON-LD anywhere, no sitemap, no robots.txt. AI answer engines (ChatGPT, Perplexity, Google AI Overviews) and traditional search both rely on this markup to parse, cite, and rank the site. Two additional bugs were discovered and already hotfixed outside this plan's scope: (1) the 51-post blog was built in June but never committed to git, so it 404'd in production the whole time — now shipped (commit `6769521`); (2) `metadataBase` pointed at `cashforteststripsusa.com`, an unrelated third-party WordPress site, not this app — now corrected to `cash4teststripsusa.com` (commit `17bc628`). This plan builds on top of both fixes.

## Locked Decisions

- **Canonical domain:** `https://cash4teststripsusa.com` (confirmed live Vercel deployment; `cashforteststripsusa.com` is NOT owned by Feldon and must never appear in schema/canonical/OG URLs).
- **Blog post dates:** the 51 existing posts get a new `datePublished` field, backdated with staggered dates spread across the ~2-3 months leading up to 2026-08-10 (not all identical — avoids looking synthetic).
- **OG image:** one static branded image (brand name + tagline, site's emerald/teal palette). Built via Next.js's `ImageResponse` file convention (`app/opengraph-image.tsx`, a single site-wide root-level image, not per-route) so it's generated from JSX/CSS at build time with no external design tool or AI image generation needed — Next.js's own documented pattern for exactly this case. No per-page dynamic OG images beyond this one root-level default — out of scope for this pass.
- **Content pages:** copy already drafted by content-agent (see `.superpowers/sdd/` transcript from this session, or ask Donna to re-fetch it) — this plan wires it into pages, doesn't rewrite it. Chosen slugs:
  - `/about`
  - `/is-it-legal-to-sell-diabetic-test-strips` (national legality hub)
  - `/how-much-are-diabetic-test-strips-worth` (price guide)
  - Homepage FAQ: a new section on `app/page.tsx`, not a separate route.

## Architecture

A single new shared module, **`lib/schema.ts`**, exports small builder functions (`buildFaqPageSchema`, `buildBreadcrumbSchema`, `buildLocalBusinessSchema`, `buildArticleSchema`, `buildWebsiteSchema`, `buildItemListSchema`) that each return a plain JS object matching a schema.org type. Every page that needs JSON-LD imports the relevant builder(s) and renders the result via a small shared `<JsonLd data={...} />` component (also in `lib/schema.ts` or a sibling `app/components/JsonLd.tsx`) that outputs `<script type="application/ld+json">{JSON.stringify(data)}</script>`. This avoids 8+ pages each hand-rolling `<script>` tags and keeps the schema shape centrally testable.

FAQ content that's currently inline JSX (blog posts, state pages) gets extracted into a named `const FAQS = [...]` array once per page, used both for rendering AND for the schema builder — single source of truth, no duplication between what's displayed and what's marked up.

## Components

1. **`lib/schema.ts`** — schema builder functions + types. New file, ~150-200 lines given 6 builders.
2. **`app/components/JsonLd.tsx`** — tiny shared render component. New file, ~10 lines.
3. **`app/sitemap.ts`** — Next.js sitemap convention. Queries Supabase for company slugs, combines with static blog slugs (`STATE_BLOG_POSTS`), state codes (`sell-test-strips/[state]`), and static routes. New file.
4. **`app/robots.ts`** — Next.js robots convention. Allow GPTBot, PerplexityBot, ClaudeBot, Googlebot, Bingbot explicitly; disallow `/admin`, `/api`. New file.
5. **`public/llms.txt`** — static text file describing the site and its URL patterns. New file.
6. **`lib/blog-posts.ts`** — `StateBlogPost` type gains `datePublished: string` (ISO date); all 51 entries get a staggered date.
7. **`app/blog/[slug]/page.tsx`** — extract FAQ array to a const; add FAQPage + Article + BreadcrumbList JSON-LD via the new builders; add `alternates.canonical` to `generateMetadata`.
8. **`app/sell-test-strips/[state]/page.tsx`** — same treatment: extract FAQ array, add FAQPage + BreadcrumbList JSON-LD, canonical tag.
9. **`app/company/[slug]/page.tsx`** — add LocalBusiness JSON-LD built from the existing company row fields (name, phone, url, description, states → areaServed, payment_methods → paymentAccepted).
10. **`app/directory/page.tsx`** — add ItemList JSON-LD enumerating visible companies with links to their `/company/[slug]` pages.
11. **`app/page.tsx`** (homepage) — add WebSite + Service JSON-LD; add a new FAQ section (visual, using content-agent's 6 Q&A pairs) with FAQPage JSON-LD built from the same array.
12. **`app/opengraph-image.tsx`** — new file using Next.js's `ImageResponse` convention; Next.js auto-generates the image at build time and auto-injects the correct `<meta property="og:image">` tags site-wide with no manual wiring in `app/layout.tsx` needed. `metadataBase` (required for this convention to produce absolute URLs) already fixed in commit `17bc628`.
13. **`app/about/page.tsx`** — new route, content-agent's About copy, standard metadata + canonical.
14. **`app/is-it-legal-to-sell-diabetic-test-strips/page.tsx`** — new route, content-agent's legality-hub copy, FAQPage JSON-LD for its own FAQ block, standard metadata + canonical.
15. **`app/how-much-are-diabetic-test-strips-worth/page.tsx`** — new route, content-agent's price-guide copy, FAQPage JSON-LD for its own FAQ block, standard metadata + canonical.

## Data Flow

No new database tables or API routes. `lib/blog-posts.ts` and the 3 new content pages are static content compiled at build time (matches the existing pattern for state pages). `app/company/[slug]/page.tsx` and `app/directory/page.tsx` already fetch company rows from Supabase — the LocalBusiness/ItemList schema is derived from data already being fetched, not a new query.

## Testing

This repo's existing test suite (`npm test`, Vitest) covers `lib/` functions and API routes — it does not currently test page components or rendered HTML output. Consistent with that existing boundary:
- **`lib/schema.ts`'s builder functions get unit tests** (`lib/__tests__/schema-builders.test.ts` — new file) — pure functions, easy to assert exact shape (e.g. `buildFaqPageSchema([{q,a}])` returns the right `@type`/`mainEntity` structure). This is genuinely new testable logic, unlike the page-level JSX wiring.
- **Page-level JSON-LD rendering is verified manually** (build + browser check that the `<script>` tags render with valid JSON, plus running the output through Google's Rich Results Test / Schema.org validator conceptually — no test file, matching how `AdminDashboardClient.tsx`/`SellFlowClient.tsx` UI work is verified in this repo already).
- `npm run build` must stay clean (it already generates 79+ static pages; this adds ~4 more routes and schema to existing ones — build failures here are the primary regression signal for the new content pages' correctness).
- `npx tsc --noEmit` and `npm run lint` must stay clean (matching the established baseline from the buyer-accounts feature).

## Out of Scope

- Dynamic/per-post OG image generation (`next/og` ImageResponse) — a static default image only.
- Submitting the sitemap to Google Search Console / Bing Webmaster Tools — that's a manual account-access step for Feldon after this ships, not something this plan can do.
- Any change to `/buyer`, `/sell`, `/admin`, or the claims feature shipped earlier this session.
- The two stray uncommitted migration files (`20260618_add_vancouver_tim.sql`, `20260618_update_orlando_url.sql`) — unrelated data seeds, explicitly deferred.
