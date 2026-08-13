# Metro Target Map — cash4teststripsusa.com
**Date:** 2026-08-12
**Owner:** SEO Agent / Dev Donna

---

## Baseline as of 2026-08-12

| Metric | Value |
|--------|-------|
| GSC trailing 3-month clicks | 0 |
| GSC trailing 3-month impressions | 6 |
| GSC average position | 51.5 |
| Pages submitted to GSC + Bing | 137 |
| Pages Google actually indexes | ~5 (homepage, /sell, /sell-test-strips/tx, /directory?state=california, /directory?state=indiana, /how-much-are-diabetic-test-strips-worth) |
| Domain age | Brand new (GSC verified 2026-08-10) |

**Read:** The 50 state pages are being collapsed as near-duplicates. This is the #1 structural problem. Virtually nothing outside the homepage and two informational pages is indexed. Everything below is built on top of fixing that first.

---

## P0 Technical Fixes (pre-condition for all SEO work)

These must ship before launching city pages. Detailed in the city-page spec.

1. **www redirect broken. — RESOLVED 2026-08-13, commit `91cfdbe`.** `https://www.cash4teststripsusa.com/` returned 200 instead of redirecting to the apex. Google had indexed the homepage three times (http apex, https apex, https www), splitting PageRank and burning crawl budget. Fixed via a permanent host redirect in `next.config.ts` (in-repo and version-controlled, rather than invisible Vercel dashboard state), plus per-page `alternates.canonical` added to the four public pages that lacked one: home, `/sell`, `/blog`, `/company/[slug]`.

   **Note:** the canonical was deliberately NOT placed in `app/layout.tsx`. Root-layout metadata cascades to every page that does not override it, which would make blog posts and company pages all declare the homepage as their canonical URL and effectively deindex themselves. Set canonicals per-page; the existing state-page and `/directory` implementations already follow this pattern.

2. **State-page differentiation pass required.** State pages are collapsing as near-duplicates because the template is structurally identical across all 50. City pages must solve this at launch or they will suffer the same fate. Both fixes are described in `2026-08-12-city-page-spec.md`.

---

## Search Demand Model

**Honest caveat on volume figures:** No Ahrefs, Semrush, or GSC keyword data is available for this domain or its competitors. All volume estimates below are modeled, not sourced. Method: national query volume for "sell diabetic test strips near me" estimated at ~8,000–14,000/month based on diabetes prevalence data (38.4M US diabetics per CDC, roughly 10% actively managing with strips at any time) and ad spend behavior in adjacent niches. City-level volume is allocated proportionally by metro population × state diabetes rate. These are planning-grade estimates only. Validate against GSC/Ahrefs before allocating production effort.

**Core query cluster (intent: transactional):**
- "sell test strips near me"
- "sell diabetic test strips [city]"
- "where to sell test strips in [city]"
- "cash for test strips [city]"
- "sell unused test strips [city] [state]"

**Secondary cluster (intent: commercial investigation):**
- "how much can I get for test strips"
- "best price for diabetic test strips"
- "test strip buyers [city]"

---

## Buyer Coverage by State (as of 2026-08-12)

States with at least one verified buyer in the seed data:

| State | # Buyers | Notable Cities Covered |
|-------|----------|----------------------|
| PA | 4 | Philadelphia, Pittsburgh, Harrisburg |
| TX | 3 | Dallas, Houston, San Antonio |
| NC | 3 | Raleigh, Greensboro, Charlotte, Durham |
| NY | 2 | Albany, New York City |
| FL | 2 | (cities unconfirmed from seed — verify in Supabase) |
| CO | 2 | Denver, Colorado Springs |
| CA | 2 | (cities unconfirmed — verify) |
| OH | 2 | Columbus, Cleveland (one buyer also lists MI) |
| IN | 1 | Goshen (NE Indiana — Indianapolis not covered) |
| KS | 1 | (city unconfirmed) |
| SC | 1 | (city unconfirmed) |
| NV | 1 | Las Vegas |
| GA | 1 | Atlanta |
| NJ | 1 | (city unconfirmed) |
| MA | 1 | Boston area |
| MD | 1 | Baltimore area |
| LA | 1 | New Orleans / Baton Rouge |
| MO | 1 | St. Louis or Kansas City |
| WA | 1 | Vancouver WA (Portland metro, not Seattle) |
| WV | 1 | Charleston / Huntington |
| MI | 1 | (shared with OH buyer) |

**Note:** Buyer city and lat/lng data are stored in Supabase — actual 50-mile coverage radii must be confirmed by querying `companies` table with `haversineMiles()` against each metro's centroid before publishing any city page that claims local coverage.

**Zero-buyer states (30):** AK, AL, AR, AZ, CT, DE, HI, IA, ID, IL, KY, ME, MN, MS, MT, ND, NE, NH, NM, OK, OR, RI, SD, TN, UT, VA, VT, WI, WY, and one additional depending on exact seed count.

---

## Priority Tier Definitions

| Tier | Criteria | Action |
|------|----------|--------|
| T1 — Fast Win | Verified buyer within 50 miles of metro center. City page can launch with real buyer data immediately. | Build and publish in Wave 1 (weeks 1–4) |
| T2 — Buyer-Gated | No local buyer but metro 500k+ pop / high diabetes rate. High search volume potential. | Recruit buyer first; publish page only after buyer confirmed OR with a well-structured zero-buyer template |
| T3 — Long Tail | No local buyer, metro under 500k. Lower individual volume but cumulative authority. | Wave 3 (weeks 13–24); pair with buyer recruitment |

---

## Tier 1 Metro List — Fast Wins (buyer within ~50 miles)

Verify all distances against live Supabase data before publishing.

| Metro | State | Est. Monthly Volume (cluster) | Competition | Has Buyer ≤50mi | Priority |
|-------|-------|-------------------------------|-------------|-----------------|----------|
| New York City | NY | 800–1,400 (est.) | High | Likely yes (Albany buyer is ~150mi; NYC buyer in seed) | T1 |
| Philadelphia | PA | 500–900 (est.) | High | Yes (4 PA buyers) | T1 |
| Dallas | TX | 600–1,100 (est.) | High | Yes | T1 |
| Houston | TX | 700–1,200 (est.) | High | Verify — Dallas buyer may be 250+ mi | T1/T2 |
| Charlotte | NC | 300–550 (est.) | Medium | Yes | T1 |
| Raleigh | NC | 300–500 (est.) | Medium | Yes | T1 |
| Atlanta | GA | 500–900 (est.) | High | Yes | T1 |
| Denver | CO | 350–600 (est.) | Medium | Yes | T1 |
| Las Vegas | NV | 300–550 (est.) | Medium | Yes | T1 |
| Pittsburgh | PA | 250–450 (est.) | Medium | Yes | T1 |
| Columbus | OH | 250–450 (est.) | Medium | Yes | T1 |
| Cleveland | OH | 250–400 (est.) | Medium | Yes | T1 |
| Baltimore | MD | 250–400 (est.) | Medium | Yes | T1 |
| Boston | MA | 400–700 (est.) | High | Yes | T1 |
| New Orleans | LA | 200–350 (est.) | Low-Med | Yes | T1 |
| Kansas City | MO | 200–350 (est.) | Low-Med | Yes (if MO buyer) | T1 |
| St. Louis | MO | 200–350 (est.) | Low-Med | Yes (if MO buyer) | T1 |
| Charleston SC | SC | 150–280 (est.) | Low | Yes | T1 |
| Greensboro | NC | 150–280 (est.) | Low | Yes | T1 |
| Durham | NC | 150–250 (est.) | Low | Yes | T1 |
| Colorado Springs | CO | 150–250 (est.) | Low | Yes | T1 |
| Los Angeles | CA | 800–1,400 (est.) | High | Verify CA buyer location | T1/T2 |
| San Diego | CA | 350–600 (est.) | High | Verify | T1/T2 |
| San Francisco | CA | 350–600 (est.) | High | Verify | T1/T2 |
| Albany | NY | 100–200 (est.) | Low | Yes (Feldon's operation) | T1 |
| Fort Wayne | IN | 80–150 (est.) | Low | Yes (Goshen buyer nearby) | T1 |
| Vancouver WA / Portland OR | WA | 300–550 (est.) | Medium | Yes (Vancouver WA buyer covers Portland metro) | T1 |
| Detroit | MI | 350–600 (est.) | Medium | Yes (OH/MI buyer) | T1 |

**T1 city page count: 25–30 metros.** Many will produce 3–5 sub-pages (e.g., Dallas, Fort Worth, Arlington all separate pages once volume justifies).

---

## Tier 2 Metro List — Buyer-Gated (publish after recruitment)

These are the highest-leverage buyer recruitment targets. City pages should be built but held unpublished until a buyer within 100 miles is confirmed OR a structured zero-buyer template is approved (see city-page spec for that threshold).

| Metro | State | Est. Monthly Volume (cluster) | Why It Matters |
|-------|-------|-------------------------------|----------------|
| Chicago | IL | 900–1,600 (est.) | 3rd-largest US city; IL has zero buyers |
| Phoenix | AZ | 550–900 (est.) | Fast-growing, high diabetes rate |
| San Antonio | TX | 350–600 (est.) | Large city; verify Dallas buyer range |
| Nashville | TN | 300–500 (est.) | No TN buyers; high diabetes belt |
| Memphis | TN | 250–450 (est.) | Mississippi Delta diabetes rates |
| Seattle | WA | 450–750 (est.) | Vancouver WA buyer covers Portland, not Seattle |
| Minneapolis | MN | 300–500 (est.) | Large, no MN buyers |
| Tampa | FL | 400–700 (est.) | Verify FL buyer locations |
| Miami | FL | 500–850 (est.) | Verify FL buyer locations |
| Jacksonville | FL | 300–500 (est.) | Verify FL buyer locations |
| Orlando | FL | 350–600 (est.) | Verify FL buyer locations |
| Milwaukee | WI | 200–350 (est.) | No WI buyers |
| Virginia Beach | VA | 200–350 (est.) | No VA buyers; DC suburb market |
| Richmond | VA | 200–350 (est.) | No VA buyers |
| Northern Virginia / DC | VA | 350–600 (est.) | High-income, high diabetes rate |
| Portland OR | OR | 300–500 (est.) | OR buyer needed (WA buyer is Portland-adjacent) |
| Oklahoma City | OK | 200–350 (est.) | High diabetes rate, no OK buyers |
| Tulsa | OK | 150–280 (est.) | No OK buyers |
| Salt Lake City | UT | 200–350 (est.) | No UT buyers |
| Louisville | KY | 200–350 (est.) | No KY buyers; high diabetes rate |
| Birmingham | AL | 150–280 (est.) | High diabetes rate, no AL buyers |
| Indianapolis | IN | 250–450 (est.) | IN has a buyer but Goshen is NE corner; Indy needs dedicated buyer |
| Hartford | CT | 150–280 (est.) | No CT buyers |

---

## Tier 3 Metro List — Long Tail (weeks 13–24)

Not listing all ~200 individually here. Selection criteria for Wave 3:
- Population 150k–500k
- State diabetes rate above national average (37.5% of adults with prediabetes/diabetes per CDC)
- No existing state-level competition from well-established sites

Priority Tier 3 states to pull metros from: MS, WV, AL, KY, TN, OK, AR, LA (all above-average diabetes rates — these small metros will over-index on volume per capita relative to their population size).

---

## What to Build First

Given that only ~5 pages are indexed right now:

1. Fix www redirect + homepage canonical (P0, no city pages until this ships)
2. Differentiate existing state pages (P0 — before adding any new pages)
3. T1 city pages for metros with verified buyer coverage (Wave 1, 25–30 pages)
4. Recruit buyers in top T2 states (parallel track)
5. T2 city pages after buyers confirmed (Wave 2)
6. T3 city pages as supply fills in (Wave 3)

See `2026-08-12-city-page-spec.md` for the full template and rollout cadence.
