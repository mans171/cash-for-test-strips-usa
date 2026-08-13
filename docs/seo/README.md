# SEO Plan — cash4teststripsusa.com

**Authored:** 2026-08-12 by SEO Agent  
**Goal:** Rank #1 for "sell test strips near me" across the top 300–500 US metros

---

## Files in This Folder

| File | Contents |
|------|----------|
| `2026-08-12-metro-target-map.md` | GSC baseline, P0 technical fixes (www redirect + canonical), buyer coverage by state, and the full T1/T2/T3 metro priority list with estimated search volumes |
| `2026-08-12-city-page-spec.md` | URL structure, anti-duplicate content rules (the hard publish gate), required page sections, schema builders needed, title/meta patterns, internal linking map, and rollout cadence by wave |
| `2026-08-12-link-plan.md` | Six link-building tactics with named target sites, pitch angles, effort/timeline per tactic, and anchor text strategy. 50–150 domain target over 12 months. |
| `2026-08-12-supply-recruitment.md` | Where to find buyers, 3-step outreach sequence, priority recruitment states, volume targets (29→250 buyers), and the interim fallback content standard for zero-coverage state pages |

---

## Execution Order

1. ~~Fix www redirect + homepage canonical~~ — **DONE 2026-08-13, commit `91cfdbe`**
2. ~~State-page differentiation pass~~ — **DONE 2026-08-13, commit `f2edddd`** (see status below)
3. **← WE ARE HERE: measurement gate.** Wait 2–3 weeks, then check whether GSC indexed pages climb past ~5. Nothing else should start until that reads out — see "Open Workstreams" below for why.
4. Buyer recruitment in T2 priority states — run in parallel with everything; it is the real ceiling
5. Wave 1 city pages (T1 metros with verified buyers)
6. Link building tactics B and F (buyer backlinks + directory listings)
7. Wave 2 city pages + link tactics C, D, E
8. Payout Data PR product + outreach

---

## Open Workstreams

### QUEUED — Blog near-duplicate pass (52 posts)

**Not started. Deliberately gated on the step 3 measurement, do not begin early.**

The 52 state blog posts (`lib/blog-posts.ts` + `app/blog/[slug]/page.tsx`) have the same
defect the state pages had, and worse. Measured 2026-08-13 against the live site, comparing
visible page text with the state name normalised out:

| Pair | Identical |
|------|-----------|
| Alabama vs Texas | 93.0% |
| Alabama vs Montana | 94.8% |
| Montana vs California | 95.4% |

Each post carries ~5,900 characters of visible text. Alabama vs Texas share 5,509 of those
characters — about **395 characters unique per post**, which is exactly the one `intro` field
in `lib/blog-posts.ts`. Everything else is one shared 473-line template with the state name
substituted through it.

Scale matters here: these 52 posts are **38% of the site's 137 URLs**. A block of
near-identical pages that large is a domain-level drag, not just 52 pages that fail to rank.

**The fix** is the same playbook that worked on the state pages: derive the body from real
per-state data rather than substituting a noun. The inputs already exist — buyer rosters,
haversine distances from `lib/state-geo.ts`, cities served, `lib/tier-pricing.ts`, and the
`accepted_brands`/`payment_methods`/`response_time` fields backfilled on 2026-08-13.

**Why it is gated rather than queued for immediate work:** the state-page differentiation
shipped the same day and has not been re-crawled yet, so there is no evidence yet that this
class of fix moves indexing on this domain. Running it across 52 posts before that reads out
risks repeating an ineffective fix at scale. Re-measure with the same method after the
indexing check and decide then.

**Also true, and the reason not to expect too much:** with 29 buyers across 20 states there
is a real limit to how much genuinely distinct material exists to build 52 different posts
from. Supply constrains this the same way it constrains everything else here.

### Sparse buyer data on third-party listings

Five listings still have empty `accepted_brands` / `payment_methods` / `response_time`,
left deliberately blank rather than asserting unverified claims about businesses Feldon does
not own: 864 Medex (Greenville SC), Hawks Sport Electronics (Colorado Springs CO), Jaime
Cardoso (Charlotte NC), PGH Phone Buyer (Pittsburgh PA), Vancouver Test Strips Buyer
(Vancouver WA). Fill in only with details confirmed by the buyers themselves.

### Geo rank tracking not yet set up

GSC average position blends all locations into one number and will mislead on a "near me"
query. Per-metro rank tracking (~$50–150/mo) is needed before anyone can honestly say whether
this is working.

---

## Key Constraints to Keep in Mind

- City pages require a buyer within 100 miles OR the informational-path standard (see city-page-spec.md Rule 2). No exceptions.
- Volume figures throughout are estimates, not sourced data. Validate against Ahrefs/GSC before allocating production sprint time.
- No unqualified legal claims anywhere — the legality page carries a "not legal advice" disclaimer; match that standard across all new pages.
- **Measure duplication, do not eyeball it.** The method used throughout this folder: fetch the live pages, strip scripts/styles/tags, normalise the state name out, and run `difflib.SequenceMatcher` over the visible text. Pre-fix state pages were ~100% identical; post-fix they range 21–89%. Use the same method to judge any future differentiation work so the numbers stay comparable.
- **Residual duplication between neighbouring empty states is a supply problem, not a copy problem.** Montana vs North Dakota still measures 89% because they genuinely share the same three nearest buyers and differ only in distance. No rewrite fixes that; a buyer in the Dakotas does.
