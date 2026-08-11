# Directory Redesign — "Cash Energy" Look + Real Proximity Search

**Date:** 2026-08-11
**Status:** Approved by Feldon (design sections 1–8, all "Looks right")
**Goal:** Make cash4teststripsusa.com the #1 directory in the world for diabetic supply buyers — a premium visual identity plus the core directory mechanics (ZIP proximity search, distance-sorted results, richer cards/profiles, a gate that feels premium) that make it function like a world-class directory.

---

## 1. Context

### Current state (audited 2026-08-11)
- 29 active local buyers + 1 mail-in listing ("CFTS Mail-In", Feldon's own operation) in Supabase. All 29 have `city`; 0 have `rating`; 0 have `logo_url`; 9 have `url`; 23 have `phone`; 3 featured.
- Design is a generic emerald Tailwind-starter look: text logo, no imagery, 29 near-identical text cards, single state dropdown, no search bar, no proximity anything despite "Near You" in the title tag.
- The free-account contact gate renders as a grayed-out button + red underlined "Create an account to view" on every card — reads as an error/broken state, ~30 times per page.
- Profile pages are thin: name, city, one sentence, states served, one gated button.
- No geo data in the schema (`city` text + `states[]` only).

### Competitive research (full agent report, 2026-08-11 session)
- **Not the only directory:** SellDiabeticSuppliesUSA.com is a real competitor — ~24 national mail-in buyers, cards with logos, star ratings + review counts, tag filters, sponsored slots, open browsing, affiliate-link monetization. **But it has zero local/proximity element.** Remaining competition is conflicted listicles and one fake-local city-guide page.
- **The open lane:** local-first + distance-sorted + mail-in fallback ("the Zocdoc of diabetic supply buyers") has no incumbent. That is the #1 position this redesign claims.
- Patterns adopted: ZIP-first hero search (Houzz/Zocdoc), distance tiers that never dead-end, richer cards that show enough to choose and hide only the connection (The Knot), gate-at-moment-of-intent (never gate browsing), verification badge Feldon actually stands behind (Clutch), price *signal* without per-buyer prices (honest "up to $X" anchored by the existing Price Guide page), labeled Featured slots, methodology blurb ("How we vet buyers").
- Anti-patterns avoided: red/error-styled gates, fake stars, unlabeled pay-to-rank, no-results dead ends, gating the browse.

## 2. Decisions log (from brainstorming)

| Decision | Choice |
|---|---|
| Scope | Look + directory UX (reviews/monetization/platform features deferred) |
| Empty-radius behavior | Local first, **CFTS Mail-In fallback** — Feldon handles mail-in for all states with no local buyer |
| Visual direction | **B — "Cash Energy"**: dark ink-green heroes, electric cash-green accents, heavy type, big numbers (chosen from 3 rendered mockups) |
| Price hook | **"up to $100 a box"** in the hero, linking to /how-much-are-diabetic-test-strips-worth |
| Build depth | **Real proximity, no map, no new npm dependencies** (map view = possible later round) |
| Brand display name | Stays **"Cash For Test Strips USA"** spelled out (standing decision; do not rename to match domain) — rendered in the new heavy type, "USA" in electric green |

## 3. Design

### 3.1 Pages

**Homepage (`app/page.tsx`)**
- Dark ink-green hero: heavy display headline "Turn extra supplies into cash today." Subline: "Local buyers pay up to $100 a box for sealed, unexpired supplies" with "up to $100 a box" linking to the Price Guide (final copy may be tuned during build, hook and link are fixed).
- Hero centerpiece: **ZIP search bar** (ZIP input + "Find Buyers" button → `/directory?zip=XXXXX`).
- Stat row: local-buyer count (live from DB — total active, not the verified subset, so it never reads "0" before Feldon curates badges), "24-hr payouts", "50 states".
- Light body: How It Works (restyled 3 steps), Featured Buyers (shared BuyerCard), Browse by State (kept — SEO), FAQ (kept verbatim — carries FAQPage schema), dark final CTA.
- All existing JSON-LD schema calls preserved.

**Directory (`app/directory/page.tsx`)**
- ZIP search bar at top (pre-filled from `?zip=` or cookie); state dropdown kept for browse.
- With ZIP: results grouped into labeled distance tiers:
  1. **"Near you"** — geocoded buyers ≤ 25 mi
  2. **"Within driving distance"** — ≤ 100 mi
  3. **"Serving {State}"** — buyers whose `states[]` contains the ZIP's state (incl. non-geocoded)
  4. **Mail-in fallback** — the CFTS Mail-In card, always rendered last ("No local buyer near you? We buy by mail in all 50 states — free shipping label."). A searched ZIP must never produce an empty page.
- Without ZIP: current browse-all (featured first, then name), new cards.
- Featured listings keep a visible "FEATURED" label (labeled placement, never unlabeled).
- Existing canonical tag (all filtered views → bare /directory) stays; ItemList schema stays.

**Company profile (`app/company/[slug]/page.tsx`)** — trust dossier:
- Header: monogram avatar, name, ✓ VERIFIED badge (when `verified`), Featured badge, city + "~X mi from you" (when ZIP known via param/cookie).
- Sections: What They Buy (brand chips from `accepted_brands`); How This Buyer Works (`transaction_modes` chips: Meetup / Pickup / Mail-in); Payment & Speed (`payment_methods` + response_time when set); About (description); gated contact CTA; **"Other buyers nearby"** (up to 3 BuyerCards by distance from this buyer's coords, else same-state) so the page never dead-ends.
- LocalBusiness schema stays.

**Sell flow (`app/sell/*`)** — visual reskin only (tiles, wizard steps, buttons, typography to the new tokens). Logic, steps, and API calls untouched. State select pre-filled from ZIP cookie's state when present.

**State pages (`app/sell-test-strips/[state]/page.tsx`), blog, content pages** — new shell (nav, footer, cards, buttons); body content and all AEO/schema untouched.

**Nav (`app/SiteNav.tsx`) / footer (`app/layout.tsx`)**
- Dark nav: brand "Cash For Test Strips USA" in heavy type ("USA" electric green), links: Find a Buyer, Price Guide (promoted from footer), Blog, How It Works, Login, "Get Cash Now" CTA.
- Footer: dark, richer link groups (Directory, Learn: price guide/legality/about, Buyers: manage your listing, Contact).

### 3.2 Buyer card (shared component)

New `app/components/BuyerCard.tsx` replacing the 3 near-duplicate card implementations (homepage, directory, state pages).

Anatomy:
- Monogram avatar (initials, deterministic background tint from name hash) — no logo assets exist; `logo_url` rendering can be added later when logos exist.
- Name + **✓ VERIFIED** chip (only when `verified = true`).
- Distance pill "~4.2 MI" (only when searcher ZIP known and buyer geocoded).
- City · state(s).
- Brand chips: first 3 `accepted_brands` + "+N".
- Payment row: `payment_methods` + "Pays same day"-style speed line (response_time when set).
- Rating badge **only when `rating` is non-null** (0 today — no fake stars; cards lean on badges until real data exists).
- CTAs: "View profile" (secondary) + contact CTA (primary, gated per 3.3).
- FEATURED pill when featured.

### 3.3 The gate

- **Security unchanged:** server-side `stripCompanyContact()` gating stays exactly as-is (tested, hardened 2026-08-09/10).
- UI: replace the 40%-opacity button + red underlined text with a full-opacity dark **"Unlock contact"** button (lock glyph) + microcopy "Free account · takes 10 seconds".
- Click (anon) → opens the existing `AccountModal` **in place** (currently only used in /sell). On success → `router.refresh()` → server re-renders with session → contact revealed at the same scroll position. No more bounce to /signup.
- Signed-in users see the direct actions (Visit site via /api/track, tel: link) exactly as today.
- Verify `useUser()`/auth-client context is available on all pages that mount the modal (it may currently be provided only in the sell flow); mount whatever provider is needed at layout level if not.

### 3.4 Proximity engine (no new npm dependencies)

- **`zip_centroids` table**: `zip text primary key, lat double precision, lng double precision, state text` (~33k rows from the **US Census Bureau ZCTA Gazetteer** — true public domain, no attribution requirement). Seeded by SQL migration. RLS: public read. Coverage caveat: ZCTAs skip some PO-box-only ZIPs — those fall into the existing "ZIP not found" inline-error path, which still shows browse-all.
- **`companies` additions**: `lat`, `lng` (city-centroid, backfilled by matching each buyer's city+state against the centroid dataset; manual spot-check), `verified boolean default false`, `transaction_modes text[] default '{meetup}'`, `response_time text` (nullable, admin-set), `est_year int` (nullable).
- **`lib/geo.ts`**: pure Haversine (miles) + tier bucketing (`NEAR_MI = 25`, `DRIVE_MI = 100`) — unit-tested.
- Server component flow: `?zip=` → validate 5-digit → look up centroid → compute distance per geocoded buyer → sort asc → bucket into tiers → render. Invalid/unknown ZIP → inline error + browse-all below.
- Distances displayed as approximate ("~6 mi") — city-center to city-center.
- ZIP persisted in a `c4ts_zip` cookie (30 days) so /company pages and return visits show distance. ZIP never logged server-side.
- CFTS Mail-In (`mail_in = true`) is excluded from distance tiers and browse-all (as today) but always rendered as the fallback card in ZIP results.

### 3.5 Visual system

`globals.css` `@theme` tokens:
- Ink green `#071b10` / `#052e16` (nav, hero, final CTA backgrounds)
- Cash green `#16a34a` (primary buttons), electric `#4ade80` (accents on dark)
- Warm-white ground `#f7f9f7`, white cards, neutral grays; amber reserved for FEATURED.
- Typography: Geist (already loaded, variable 100–900 — zero new deps). Display headings: black weight, tight tracking. Big stat numerals. Bold caps CTA labels.
- Shared primitives in `app/components/`: chip, badge, button styles (composable classNames or tiny components) — end the 29 copies of inline card classes.
- Small inline SVG glyphs (lock, pin, check) — no icon library.

### 3.6 Edge cases

- Invalid ZIP → inline error, browse-all remains.
- Two buyers in one city → identical distance; tie-break featured desc, then name asc.
- **Ottawa, Canada listing** (`states = ["CANADA"]`): remains in browse-all with a "Canada" tag; naturally excluded from all US ZIP tiers. Feldon may deactivate it later if he wants the directory USA-pure.
- Buyers without coordinates (geocode miss): appear in tier 3 (state match) and browse-all; never in distance tiers.
- ZIP with zero same-state buyers → tiers 1–3 empty → mail-in fallback card carries the page (plus a "Browse all buyers" link).

### 3.7 Non-goals (explicitly deferred)

- Map view (possible fast-follow; would add react-leaflet dependency — requires separate approval).
- Native review collection / star ratings (rating column renders when data exists, but no collection UI).
- Buyer portal / claims flow changes (shipped 2026-08-10, untouched).
- Monetization features (paid tiers, sponsored slots beyond existing Featured flag).
- Reverse "get offers" marketplace flow.
- /sell logic changes, blog/state-page content changes, URL structure changes.

## 4. Data flow summary

```
User enters ZIP (hero or /directory)
  → GET /directory?zip=12208
  → server: validate → zip_centroids lookup → { lat, lng, state }
  → fetch active local companies (existing query)
  → per-company Haversine (companies with lat/lng)
  → tiers: ≤25mi | ≤100mi | states[] ∋ state | CFTS Mail-In fallback
  → auth check → stripCompanyContact for anon (unchanged)
  → render tiered BuyerCards; set c4ts_zip cookie
```

## 5. Migrations (3)

1. `create_zip_centroids` — table + RLS public-read + seed (~41k rows, batched inserts).
2. `companies_geo_and_trust` — add `lat`, `lng`, `verified`, `transaction_modes`, `response_time`, `est_year`.
3. `backfill_company_coords` — UPDATE per company from city+state centroid match (generated, hand-reviewed).

Per standing convention (feedback-migration-push-consent): approval of the implementation plan = consent to `db push` these within that plan.

## 6. Testing & success criteria

- Unit: Haversine known-distance cases, tier bucketing boundaries (25/100 mi), ZIP validation, tie-breaks; existing `stripCompanyContact` regression suite stays green.
- Full suite: all 143 existing tests pass.
- Anon `curl` of /, /directory, /directory?zip=…, /company/[slug], state pages → **zero** contact values / `/api/track` links in HTML (regression of the 2026-08-09/10 bug class).
- ZIP 12208 (Albany) → Albany buyer first with ~mi distance; remote ZIP (e.g. Montana) → no dead end, mail-in fallback renders.
- Mobile 390px + desktop pass on all reskinned pages; no horizontal scroll.
- Build clean, push, **live-verify in browser** (anon + signed-in) per repo convention — "pushed and confirmed deployed" is the definition of done.

## 7. Open items for Feldon (post-ship data curation)

- Flip `verified = true` for the buyers he actually vouches for (badge is only as honest as this list).
- Optionally fill `response_time` / `est_year` / `transaction_modes` per buyer for richer cards.
- Decide Ottawa: keep as browse-only Canada listing vs deactivate.
- Longer-term: recruit more local buyers per metro (supply is the real moat; directory design now scales to it).
