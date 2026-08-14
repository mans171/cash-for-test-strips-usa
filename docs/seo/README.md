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
| `state-health-data-sources.md` | Sources, vintages and regeneration steps for the generated per-state datasets that the blog and state pages derive their content from |

---

## Execution Order

1. ~~Fix www redirect + homepage canonical~~ — **DONE 2026-08-13, commit `91cfdbe`**
2. ~~State-page differentiation pass~~ — **DONE 2026-08-13, commit `f2edddd`** (see status below)
3. ~~Blog near-duplicate pass (50 posts)~~ — **DONE 2026-08-14** (see status below). The
   measurement gate was lifted deliberately: near-duplicate collapse is a known defect
   independent of what GSC eventually reports, and holding 38% of the site's URLs for three
   weeks to confirm what the state-page measurement already demonstrated was the worse trade.
4. **← WE ARE HERE: measurement gate.** Both differentiation passes have now shipped.
   Check whether GSC indexed pages climb past ~5.
5. Buyer recruitment in T2 priority states — run in parallel with everything; it is the real ceiling
6. Wave 1 city pages (T1 metros with verified buyers)
7. Link building tactics B and F (buyer backlinks + directory listings)
8. Wave 2 city pages + link tactics C, D, E
9. Payout Data PR product + outreach

---

## Open Workstreams

### DONE 2026-08-14 — Blog differentiation pass (50 posts)

**Note the count.** This was recorded as "52 posts" throughout the earlier planning. It is
**50** — there is no DC post and no Canada post, and `STATE_LABELS` carries a `CANADA`
pseudo-code with no post behind it. Corrected here so the URL arithmetic downstream is right.

**The defect, measured before the fix** (live site, same method as the state pages — fetch,
strip tags, normalise the state name out, `difflib.SequenceMatcher` over visible text):

| Pair | Identical |
|------|-----------|
| Alabama vs Texas | 93.2% |
| New York vs Pennsylvania | 97.1% |
| Wyoming vs North Dakota | 96.0% |

Mean across ten sampled pairs: **95.5%**. Each post carried ~6,080 visible characters, of
which about 395 were unique — the single `intro` field. Everything else was one 473-line
template with the state name substituted through it.

**What shipped:**

- `lib/state-health-data.ts` — generated per-state dataset: diagnosed-diabetes prevalence at
  city and state level, uninsured rate, 65+ share, population, ZIP count, each with its own
  vintage. Sources and regeneration in `state-health-data-sources.md`. Every figure traces to
  CDC PLACES (BRFSS) or Census; nothing modelled.
- `lib/blog-angles.ts` — generated, frozen angle per state across ten angles. `estate`,
  `safe-mail-in` and `local-buyers` are earned from data by rank; the rest are product and
  format angles by rotation. `ANGLE_RATIONALE` records why each state got its angle.
- `lib/blog-post-content.ts` — pure derivation: titles, descriptions, leads, angle sections,
  a per-state context paragraph, requirements wording and FAQs, all from real figures, with
  every data-dependent sentence omitted rather than padded when its figure is absent.
- `app/blog/[slug]/page.tsx` rewritten to consume it. Titles and descriptions now derive
  through `lib/blog-posts.ts`, so index, sitemap and post cannot drift apart.
- **Two live bugs closed while in there**, both the same ones the state-page pass removed:
  the sibling-link block hardcoded `.slice(0, 12)`, linking the same 12 states from all 50
  posts and leaving 38 with no inbound blog link; and the legality section asserted selling
  "is legal in {state} and throughout the United States", unqualified, inside a page carrying
  FAQPage schema. Both gone. A test now fails on any bare legality claim.
- 39 new tests, 230 passing overall.

**Measured result, all 1,225 post pairs:**

| | Before | After |
|---|---|---|
| Mean, all pairs | ~95.5% | **55.5%** |
| Different-angle pairs | — | 52.9% (max 72.5%) |
| Same-angle pairs | — | 83.4% (max 93.2%) |

**Be honest about the residual.** Twelve pairs still measure ≥90%, and every one of them is
two states sharing an angle — GA/TN (both `worth`), IA/NM and IA/UT (both `dexcom`), MO/OK
(`omnipod`), CT/RI (`expired`). Within an angle group the prose skeleton is shared and only
the figures differ. The structural shape has changed a lot regardless: it was previously one
block of 50 mutually near-identical pages, and it is now ten clusters of five, with
cross-cluster similarity at 53%.

Closing that last gap needs per-state variants of each angle's prose — roughly ten angles ×
five variants of genuine writing. That is a scope decision, not a technical one, and it is
not started.

**What was tried and did not work, so nobody repeats it:** separating same-angle states
geographically does nothing for text similarity — two far-apart states sharing an angle still
share the same skeleton. The levers that did move the number were structural: expanding one
product-catalogue category per post instead of six (that block alone was a single 2,573-char
identical run, ~46% of the page), showing payout tables only on posts actually about pricing,
and rotating both the expanded category and the context paragraph *within* an angle group.

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
