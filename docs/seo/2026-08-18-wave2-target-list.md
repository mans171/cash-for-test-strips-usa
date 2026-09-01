# Wave 2 City-Page Target List
**Date:** 2026-08-18  
**Author:** SEO Agent / Dev Donna  
**Depends on:** `2026-08-12-city-page-spec.md`, `lib/city-geo.ts`, live Supabase `companies` table

---

## Publication Gate — Read Before Acting

**This document is preparation, not a green light.**

Wave 2 does not start until Wave 1's 27 city pages show crawl evidence in Google Search Console — meaning pages appearing in the Coverage report (Discovered, Crawled, or Indexed). See the rollout cadence in `2026-08-12-city-page-spec.md` (Waves table, gate column).

**GSC gate status as of 2026-08-19** (Page Indexing report, last updated 8/16, plus per-URL Inspection run 8/19):

Property is a **URL-prefix property** (`https://cash4teststripsusa.com/`), not a domain property — the domain-property URL 403s.

Site-wide: **96 indexed / 68 not indexed**, two reasons only — Discovered-currently-not-indexed (53) and Crawled-currently-not-indexed (15). Notably there is **no duplicate/near-duplicate reason left in the report**, which is the differentiation work paying off.

**All 27 Wave 1 city pages are still unindexed**, split as:
- **Crawled - currently not indexed (13)** — crawled Aug 18, awaiting Google's indexing decision: New York NY, Dallas TX, Denver CO, Miami FL, Charlotte NC, Boston MA, Philadelphia PA, Pittsburgh PA, Raleigh NC, Baltimore MD, Durham NC, Aurora CO, Fort Worth TX.
  - Baltimore and Durham were recorded as "already indexed" on 8/18; they now sit in Crawled-not-indexed. Treat the 8/18 reading as unreliable, not as a regression.
  - Aurora and Fort Worth were crawled by Google on its own, without a manual request.
- **Discovered - currently not indexed (14)** — never crawled (`Last crawled: N/A`): Las Vegas NV, Henderson NV, San Diego CA, Sacramento CA, Stockton CA, Portland OR, San Antonio TX, Arlington TX, Kansas City MO, Colorado Springs CO, Greensboro NC, Baton Rouge LA, Charleston WV, Huntington WV.

**Manual submissions made 2026-08-19 (10, all confirmed "Indexing requested"):** Las Vegas NV, Henderson NV, San Diego CA, Sacramento CA, Stockton CA, Portland OR, San Antonio TX, Arlington TX, Kansas City MO, Colorado Springs CO.

**Quota is real and it is 10/day on this property.** The 11th request returned "Quota Exceeded — you've exceeded your daily quota. Please try submitting this again tomorrow." Greensboro NC was the one that hit it and was NOT submitted.

**Still to submit (next session, 4):** Greensboro NC, Baton Rouge LA, Charleston WV, Huntington WV.

Every inspected city page reports `Sitemaps: No referring sitemaps detected` and `Referring page: None detected`, even though the sitemap was read on 8/16 with 164 pages and the state pages do link their cities (`app/sell-test-strips/[state]/page.tsx`). This is GSC discovery-attribution lag on URLs Google has not crawled, not a missing-link defect — but re-check it once these pages are crawled.

**Verdict: gate is NOT clear.** Zero of 27 Wave 1 city pages are indexed. Recheck in 3-4 days after this batch of submissions has had time to crawl. Wave 2 stays blocked.

Do not build or publish Wave 2 pages until that recheck clears.

---

## How Verified

- **Date:** 2026-08-18
- **Data source:** Live Supabase project `whgwneuarnrsktolmqdj`, `companies` table, anon key
- **Method:** Fetched all 29 companies. 28 returned non-null lat/lng. Filtered to "in-person buyers" — companies whose `transaction_modes` array includes any of: drop-off, in-person, pickup, local, walk, meet. Result: **28 in-person buyers with coordinates**. For each candidate city, computed haversine distance (`haversineMiles()` from `lib/geo.ts`) from city center (downtown coordinates, same convention as `lib/city-geo.ts`) to every in-person buyer. Nearest buyer and its distance recorded. Path classification applied per spec Rule 2: ≤100mi = directory-eligible; >100mi = informational-path only (requires 600+ words unique prose, higher production cost, not recommended for first Wave 2 batch).
- **Active-column filter:** The `Company` type in `lib/types.ts` carries no `active` boolean column — the companies table as queried does not expose one. All 29 companies were treated as active. If an `active` column exists in Supabase but is excluded from `COMPANY_COLUMNS`, re-run this verification with that filter applied before publishing any page that cites buyer count.
- **Wave 1 exclusions:** 27 cities in `lib/city-geo.ts` as of 2026-08-15 excluded. Washington DC excluded per city-geo.ts documentation (no state-page parent).

---

## Data Quality Flags (affects Rule 1 for specific pages)

Per `docs/seo/README.md`, five listings have empty `accepted_brands`, `payment_methods`, and `response_time` fields — deliberately left blank because the data was unconfirmed:

| Buyer | City | Effect on nearby Wave 2 cities |
|-------|------|-------------------------------|
| 864 Medex | Greenville, SC | Greenville SC page: payout-range and transaction-mode blocks will be sparse. Also affects Augusta GA (98mi), Columbia SC (85mi nearest = Charlotte, not this buyer). |
| Jaime Cardoso | Charlotte, NC | Nearest buyer for Columbia SC (85mi) and Charleston SC (177mi — informational). Sparse data reduces Columbia's Rule 1 confidence. |
| PGH Phone Buyer | Pittsburgh, PA | Nearest buyer for Akron OH (91mi). Sparse data reduces Akron's Rule 1 confidence. |

For pages where the nearest in-person buyer has empty fields, populate Rule 1 blocks from verified data only (zip coverage, FAQs, city-specific context) or hold the page until buyer data is confirmed.

**Additional note — Toledo / Detroit / Cleveland shared buyer:** All three cities' nearest in-person buyer is "Cash For Test Strips - Toledo, OH / Detroit, MI." Their buyer-roster blocks will be structurally identical. These three pages must differentiate via ZIP coverage (distinct per city), city-specific FAQs, and lead paragraphs. Rule 1 is passable but requires care in execution.

---

## Full Candidate Table — All Verified

Wave 1 cities (excluded), Washington DC (excluded), and duplicate-slug entries (Charleston / Charleston SC at same coordinates) have been de-duplicated. 70 unique candidates evaluated; 28 directory-eligible, 40 informational-path only, 2 skipped as Wave 1.

### Directory-Eligible Candidates (buyer ≤ 100mi) — 28 cities

| # | City | State | Slug | Lat | Lng | Nearest In-Person Buyer | Distance (mi) | Est. Priority |
|---|------|-------|------|-----|-----|------------------------|---------------|---------------|
| 1 | Orlando | FL | orlando | 28.5383 | -81.3792 | Cash For Test Strips – Orlando, FL | 0.0 | High |
| 2 | Albany | NY | albany | 42.6526 | -73.7562 | Cash for Diabetic Test Strips & CGM Supplies – Albany, NY | 0.0 | High |
| 3 | Kansas City | KS | kansas-city | 39.1141 | -94.6275 | Cash For Test Strips – Kansas City, KS | 0.0 | High† |
| 4 | Vancouver | WA | vancouver | 45.6387 | -122.6615 | Vancouver Test Strips Buyer – Vancouver, WA | 0.0 | High‡ |
| 5 | Greenville | SC | greenville | 34.8526 | -82.3940 | 864 Medex – Greenville, SC | 0.0 | Medium* |
| 6 | Toledo | OH | toledo | 41.6639 | -83.5552 | Cash For Test Strips – Toledo, OH / Detroit, MI | 1.2 | High |
| 7 | Camden | NJ | camden | 39.9259 | -75.1196 | Cash For Test Strips – Philadelphia, PA | 3.0 | Medium |
| 8 | Newark | NJ | newark | 40.7357 | -74.1724 | Cash For Test Strips – New York, NY | 8.9 | High |
| 9 | Wilmington | DE | wilmington | 39.7447 | -75.5483 | Cash For Test Strips – Philadelphia, PA | 24.9 | Medium |
| 10 | Fort Lauderdale | FL | fort-lauderdale | 26.1224 | -80.1373 | Cash For Test Strips – Miami, FL | 25.2 | High |
| 11 | Trenton | NJ | trenton | 40.2171 | -74.7429 | Cash For Test Strips – Philadelphia, PA | 28.9 | Medium |
| 12 | Allentown | PA | allentown | 40.6084 | -75.4902 | Cash For Test Strips – Hazleton, PA | 35.0 | Medium |
| 13 | Scranton | PA | scranton | 41.4090 | -75.6624 | Cash For Test Strips – Hazleton, PA | 35.1 | Low-Med |
| 14 | Worcester | MA | worcester | 42.2626 | -71.8023 | Cash For Test Strips – Boston, MA | 38.6 | Medium |
| 15 | Providence | RI | providence | 41.8240 | -71.4128 | Cash For Test Strips – Boston, MA | 41.2 | Medium |
| 16 | Fort Wayne | IN | fort-wayne | 41.0793 | -85.1394 | Cash For Test Strips Indiana – Goshen, IN | 50.1 | Medium |
| 17 | Detroit | MI | detroit | 42.3314 | -83.0458 | Cash For Test Strips – Toledo, OH / Detroit, MI | 53.3 | High |
| 18 | Harrisburg | PA | harrisburg | 40.2732 | -76.8867 | Cash For Test Strips – Greencastle, PA | 55.6 | Medium |
| 19 | Springfield | MA | springfield | 42.1015 | -72.5898 | Cash for Diabetic Test Strips & CGM Supplies – Albany, NY | 70.7 | Low-Med |
| 20 | San Francisco | CA | san-francisco | 37.7749 | -122.4194 | Cash For Test Strips – Sacramento, CA | 75.0 | High |
| 21 | New Orleans | LA | new-orleans | 29.9511 | -90.0715 | Cash For Test Strips – Baton Rouge, LA | 75.1 | High |
| 22 | Tampa | FL | tampa | 27.9506 | -82.4572 | Cash For Test Strips – Orlando, FL | 77.2 | High |
| 23 | Hartford | CT | hartford | 41.7658 | -72.6851 | Cash for Diabetic Test Strips & CGM Supplies – Albany, NY | 82.2 | Medium |
| 24 | Columbia | SC | columbia | 34.0007 | -81.0348 | Jaime Cardoso – Charlotte, NC | 85.4 | Low-Med* |
| 25 | Akron | OH | akron | 41.0814 | -81.5190 | PGH Phone Buyer – Pittsburgh, PA | 91.2 | Low-Med* |
| 26 | Chicago | IL | chicago | 41.8781 | -87.6298 | Cash For Test Strips Indiana – Goshen, IN | 94.8 | High |
| 27 | Cleveland | OH | cleveland | 41.4993 | -81.6944 | Cash For Test Strips – Toledo, OH / Detroit, MI | 95.9 | High |
| 28 | Augusta | GA | augusta | 33.4735 | -82.0105 | 864 Medex – Greenville, SC | 97.8 | Low* |

**Footnotes:**
- `*` Nearest buyer has sparse data (empty `accepted_brands`/`payment_methods`/`response_time`). Confirm buyer fields before publishing; Rule 1 block coverage is reduced.
- `†` Kansas City KS (slug: `/sell-test-strips/ks/kansas-city`) is geographically adjacent to Wave 1's Kansas City MO (`/sell-test-strips/mo/kansas-city`). Both are publishable as distinct state-URL pages, but content must differ meaningfully: different ZIP codes, distinct FAQ, buyer listed is the KS buyer (different record). Do not reuse Wave 1 prose.
- `‡` Vancouver WA (`/sell-test-strips/wa/vancouver`) is distinct from Wave 1's Portland OR (`/sell-test-strips/or/portland`) — different state, different slug. The buyer (Vancouver Test Strips Buyer) is the same entity serving both markets. Content differentiation requires Vancouver-specific ZIP codes, WA-side FAQ, and WA state-page parent link.

---

### Informational-Path Only (buyer > 100mi) — 40 cities

These require 600+ words of genuinely unique, hand-written prose (not template-generated). Not recommended for the first Wave 2 batch. Include in planning for later Wave 2 sub-batches or Wave 3 as buyer recruitment progresses.

| City | State | Slug | Nearest Buyer | Distance (mi) | Notes |
|------|-------|------|---------------|---------------|-------|
| Richmond | VA | richmond | Cash For Test Strips – Silver Spring, MD | 102.6 | Near the 100mi line; recruit MD/VA buyer first |
| Reno | NV | reno | Cash For Test Strips – Sacramento, CA | 111.4 | |
| Los Angeles | CA | los-angeles | Cash For Test Strips – San Diego, CA | 111.5 | Major market — recruit LA buyer, high priority |
| Knoxville | TN | knoxville | 864 Medex – Greenville, SC | 115.1 | High diabetes rate |
| Columbus | OH | columbus | Cash For Test Strips – Toledo, OH / Detroit, MI | 120.2 | Large city; OH buyer recruitment target |
| Syracuse | NY | syracuse | Cash for Diabetic Test Strips – Albany, NY | 124.2 | |
| Jacksonville | FL | jacksonville | Cash For Test Strips – Orlando, FL | 125.1 | |
| Indianapolis | IN | indianapolis | Cash For Test Strips Indiana – Goshen, IN | 126.5 | Goshen buyer covers NE corner, not Indy |
| Dayton | OH | dayton | Cash For Test Strips – Toledo, OH / Detroit, MI | 135.3 | |
| Seattle | WA | seattle | Vancouver Test Strips Buyer – Vancouver, WA | 136.8 | Vancouver WA buyer covers Portland metro only |
| Atlanta | GA | atlanta | 864 Medex – Greenville, SC | 137.0 | Major market; recruit GA buyer |
| Jackson | MS | jackson | Cash For Test Strips – Baton Rouge, LA | 140.7 | High diabetes rate |
| Milwaukee | WI | milwaukee | Cash For Test Strips Indiana – Goshen, IN | 146.1 | |
| Norfolk | VA | norfolk | Cash For Test Strips – Raleigh-Durham, NC | 150.4 | |
| Virginia Beach | VA | virginia-beach | Cash For Test Strips – Silver Spring, MD | 158.4 | |
| Omaha | NE | omaha | Cash For Test Strips – Kansas City, KS | 163.3 | |
| Cincinnati | OH | cincinnati | Cash For Test Strips – West Virginia | 163.7 | |
| Chattanooga | TN | chattanooga | 864 Medex – Greenville, SC | 165.7 | |
| Rochester | NY | rochester | Cash For Test Strips – Hazleton, PA | 173.8 | |
| Wichita | KS | wichita | Cash For Test Strips – Kansas City, KS | 176.4 | |
| Charleston | SC | charleston | Jaime Cardoso – Charlotte, NC | 177.2 | |
| Shreveport | LA | shreveport | Cash For Test Strips – Dallas, TX | 178.1 | |
| Buffalo | NY | buffalo | PGH Phone Buyer – Pittsburgh, PA | 178.6 | |
| Des Moines | IA | des-moines | Cash For Test Strips – Kansas City, KS | 178.8 | |
| Mobile | AL | mobile | Cash For Test Strips – Baton Rouge, LA | 188.0 | High diabetes rate |
| Houston | TX | houston | Cash For Test Strips – San Antonio, TX | 189.1 | Major market; Houston-specific buyer needed |
| Oklahoma City | OK | oklahoma-city | Cash For Test Strips – Dallas, TX | 190.4 | High diabetes rate |
| Savannah | GA | savannah | 864 Medex – Greenville, SC | 205.7 | |
| Tulsa | OK | tulsa | Cash For Test Strips – Kansas City, KS | 217.7 | |
| Louisville | KY | louisville | Cash For Test Strips – West Virginia | 223.8 | High diabetes rate |
| Huntsville | AL | huntsville | 864 Medex – Greenville, SC | 238.0 | |
| St. Louis | MO | st-louis | Cash For Test Strips – Kansas City, KS | 240.5 | |
| Phoenix | AZ | phoenix | Cash For Test Strips – Las Vegas, NV | 256.1 | Major market; recruit AZ buyer |
| Nashville | TN | nashville | 864 Medex – Greenville, SC | 262.8 | High-value; recruit TN buyer |
| Birmingham | AL | birmingham | 864 Medex – Greenville, SC | 268.7 | High diabetes rate |
| Albuquerque | NM | albuquerque | Hawks Sport Electronics – Colorado Springs, CO | 278.0 | |
| Montgomery | AL | montgomery | 864 Medex – Greenville, SC | 282.8 | |
| Spokane | WA | spokane | Vancouver Test Strips Buyer – Vancouver, WA | 284.8 | |
| Little Rock | AR | little-rock | Cash For Test Strips – Dallas, TX | 292.5 | |
| Memphis | TN | memphis | Cash For Test Strips – Baton Rouge, LA | 331.3 | High diabetes rate |
| Tucson | AZ | tucson | Cash For Test Strips – Las Vegas, NV | 361.9 | |
| Salt Lake City | UT | salt-lake-city | Cash For Test Strips – Las Vegas, NV | 362.6 | |
| Minneapolis | MN | minneapolis | Cash For Test Strips – Kansas City, KS | 411.1 | |
| El Paso | TX | el-paso | Hawks Sport Electronics – Colorado Springs, CO | 497.5 | |

---

## Recommended First Batch (~24 cities, directory-path only)

This batch prioritizes: verified in-city buyer (0mi) first, then metro population × search volume proxy, then miles to nearest buyer. Excludes the four cities with sparse-data buyer concerns from the leading batch, marks them separately.

| Rank | City | State | Slug | Miles to Buyer | Rationale |
|------|------|-------|------|----------------|-----------|
| 1 | Orlando | FL | orlando | 0.0 | In-city buyer; 300k+ city / 2.7M metro; FL is strong |
| 2 | Chicago | IL | chicago | 94.8 | 3rd-largest US city; largest unserved metro; high volume |
| 3 | Detroit | MI | detroit | 53.3 | 670k city / 4.4M metro; strong diabetes rate; OH/MI buyer |
| 4 | San Francisco | CA | san-francisco | 75.0 | 880k city; large metro; Sacramento buyer within range |
| 5 | Tampa | FL | tampa | 77.2 | 395k city / 3.2M metro; FL second cluster after Orlando |
| 6 | Cleveland | OH | cleveland | 95.9 | 370k city; completes OH cluster with Toledo |
| 7 | Newark | NJ | newark | 8.9 | NYC metro overflow; distinct NJ URL; 280k city |
| 8 | Albany | NY | albany | 0.0 | In-city buyer (Feldon's operation); 100k city; 900k metro |
| 9 | Fort Lauderdale | FL | fort-lauderdale | 25.2 | South FL cluster with Wave 1 Miami; 185k city |
| 10 | New Orleans | LA | new-orleans | 75.1 | 380k city; high diabetes rate; distinct from Wave 1 Baton Rouge |
| 11 | Toledo | OH | toledo | 1.2 | In-metro buyer; 275k city; anchor for OH cluster |
| 12 | Worcester | MA | worcester | 38.6 | 185k city; MA second city after Wave 1 Boston |
| 13 | Providence | RI | providence | 41.2 | 190k city; creates RI state-page anchor |
| 14 | Hartford | CT | hartford | 82.2 | 120k city; creates CT page; Albany buyer within range |
| 15 | Kansas City | KS | kansas-city | 0.0 | In-city buyer; distinct URL from Wave 1 MO; 155k city† |
| 16 | Vancouver | WA | vancouver | 0.0 | In-city buyer; 190k city; distinct from Wave 1 Portland‡ |
| 17 | Fort Wayne | IN | fort-wayne | 50.1 | 265k city; IN second city; Goshen buyer |
| 18 | Harrisburg | PA | harrisburg | 55.6 | PA metro completion; 50k city / 575k metro |
| 19 | Allentown | PA | allentown | 35.0 | 120k city; Hazleton buyer; PA third cluster |
| 20 | Wilmington | DE | wilmington | 24.9 | Creates DE page; 70k city; Philly buyer |
| 21 | Trenton | NJ | trenton | 28.9 | NJ second city; Philly buyer; 90k city |
| 22 | Springfield | MA | springfield | 70.7 | MA third city; Albany buyer; 155k city |
| 23 | Camden | NJ | camden | 3.0 | NJ third city; Philly buyer; note content must differ from Newark and Trenton |
| 24 | Scranton | PA | scranton | 35.1 | PA fourth cluster; Hazleton buyer; 75k city |

**Hold for second sub-batch (data quality):**
- Greenville SC — in-city buyer but 864 Medex has sparse data fields
- Akron OH — PGH Phone Buyer has sparse data fields
- Columbia SC — Jaime Cardoso (Charlotte) has sparse data fields
- Augusta GA — 864 Medex has sparse data fields

Publish these once buyer data is confirmed, or publish with ZIP coverage + FAQ driving Rule 1 and omit the payout/brand blocks.

---

## Rule 1 Confidence Notes for First Batch

Most first-batch cities will populate at least 3 of 5 Rule 1 blocks as follows:

- **Buyer roster with real distances** — available for all 24 (buyer confirmed within 100mi)
- **ZIP code list** — available for all 24 via `zipsNearPoint()` (state-scoped, within 30mi of city center)
- **Transaction modes** — available for all 24 (in-person buyers carry mode data)
- **Payout range** — available only if buyer's `accepted_brands` is populated; verify before building
- **City-specific FAQ** — requires hand-written question; do not template-generate

All 24 cities can meet the 3-of-5 threshold on buyer roster + ZIP list + transaction modes alone, before touching the other two blocks. Cities where the nearest buyer has sparse accepted_brands data still clear the gate via those three.

---

## Buyer Recruitment Targets Unlocked by This Analysis

The informational-path cities reveal where a single buyer addition would convert a high-value metro from informational to directory-eligible. Priority recruits:

| Metro | State | Miles gap | Impact if buyer added |
|-------|-------|-----------|----------------------|
| Los Angeles | CA | 111.5mi from SD buyer | Largest single-city unlock; 4M+ city |
| Houston | TX | 189.1mi from SA buyer | 2.3M city; huge volume |
| Atlanta | GA | 137mi from Greenville | 500k city / 6M metro |
| Seattle | WA | 136.8mi from Vancouver | 750k city / 4M metro |
| Nashville | TN | 262.8mi from Greenville | 680k city; high diabetes rate |
| Columbus | OH | 120.2mi from Toledo | 900k city; near the line |
| Indianapolis | IN | 126.5mi from Goshen | 875k city; IN buyer is NE corner only |

Columbus and Indianapolis are both within plausible recruiting distance of existing buyers — a buyer in either city also narrows the gap for Dayton, Cincinnati, and other OH/IN cities downstream.

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total candidates evaluated | 70 |
| Wave 1 already live (excluded) | 27 (+2 caught as duplicates in candidate list) |
| Directory-eligible (≤100mi in-person buyer) | 28 |
| Informational-path only (>100mi) | 40 |
| Recommended first Wave 2 batch | 24 |
| Held pending buyer data confirmation | 4 |
| In-city buyer (0mi) in first batch | 4 (Orlando, Albany, Kansas City KS, Vancouver WA) |
| Supabase live at time of verification | Yes — 29 companies total, 28 with lat/lng |
