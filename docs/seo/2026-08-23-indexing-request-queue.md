# Request-Indexing queue — the 39 "Discovered - currently not indexed" URLs

**Created:** 2026-08-23. Source: GSC Page indexing → "Discovered - currently not indexed" (39 pages,
first detected 8/15). All 39 verified HTTP 200 and all 39 verified present in `/sitemap.xml`.

## The constraint

Request Indexing is capped at **~10 per day PER GOOGLE ACCOUNT**, shared with
albanyteststripsbuyer.com. **Duplicate submissions of the same URL still consume a slot** — proven
8/23: 9 distinct URLs + 2 accidental re-submissions = 11 attempts, and the 11th returned
"Quota Exceeded". Budget 10 *clicks*, not 10 *new URLs*.

## Day 1 — 2026-08-23 ✅ DONE (9 of 10; 10th hit the quota wall)

Each confirmed by the persistent "✓ Indexing requested / REQUEST AGAIN" state, not just the toast.

- [x] /sell-test-strips/pa
- [x] /sell-test-strips/mo
- [x] /sell-test-strips/sc
- [x] /sell-test-strips/or
- [x] /sell-test-strips/ok
- [x] /sell-test-strips/ut
- [x] /sell-test-strips/ks
- [x] /sell-test-strips/nc/greensboro
- [x] /sell-test-strips/wv/charleston

## Day 2 — 2026-08-31 ✅ DONE (all 9 remaining blog posts)

**Day 2 was never run on 8/24–8/30 — the queue sat idle for 8 days.** Resumed 8/31 and
re-prioritised: every unindexed BLOG post first (Feldon's ask), state/city and company pages
deferred to day 3. All 9 confirmed by the "Indexing requested / URL was added to a priority crawl
queue" panel; WV additionally confirmed by the persistent "✓ Indexing requested / REQUEST AGAIN"
state.

- [x] /blog/sell-diabetic-test-strips-north-carolina
- [x] /blog/sell-diabetic-test-strips-missouri
- [x] /blog/sell-diabetic-test-strips-wisconsin
- [x] /blog/sell-diabetic-test-strips-louisiana
- [x] /blog/sell-diabetic-test-strips-west-virginia   ← cost 2 clicks (see note below)
- [x] /blog/sell-diabetic-test-strips-delaware
- [x] /blog/sell-diabetic-test-strips-idaho
- [x] /blog/sell-diabetic-test-strips-north-dakota
- [x] /blog/sell-test-strips-albany-ny

**10 of 10 clicks spent** (9 URLs + 1 re-verify on WV). Quota exhausted for 8/31.

### New UI note learned 8/31 — the toast is NOT reliable

The green "Indexing requested" toast sometimes never appears even on a successful submit, and the
button text stays "REQUEST INDEXING" while the toast is up. The **only** reliable confirmation is the
row settling into **"✓ Indexing requested / REQUEST AGAIN"**. On WV no toast appeared, a re-click was
spent to confirm, and the row then showed the persistent state — meaning the first click had probably
already worked. **Next time: after clicking, wait ~20s and check for "REQUEST AGAIN" before
re-clicking.** Do not re-click on a missing toast alone.

Also: submits now run a "Testing if live URL can be indexed" pre-check that can take 30–60s before
the confirmation lands. Budget ~60s per URL, not 10s.

## Day 3 — state + city pages, then company profiles

- [ ] /sell-test-strips/wv/huntington   ← quota-blocked on day 1, do FIRST
- [ ] /sell-test-strips/wv
- [ ] /sell-test-strips/nh
- [ ] /sell-test-strips/hi
- [ ] /sell-test-strips/ak
- [ ] /buyer
- [ ] /company/kevin-silver-new-york-ny
- [ ] /company/busie-philadelphia-pa
- [ ] /company/ricky-dallas-tx
- [ ] /company/liliana-orlando-fl

## Day 4 — remaining company profiles

- [ ] /company/jaime-cardoso-charlotte-nc
- [ ] /company/rene-ramirez-san-diego-ca
- [ ] /company/rj-las-vegas-nv
- [ ] /company/pgh-phone-buyer-pittsburgh-pa
- [ ] /company/curtis-raleigh-durham-nc
- [ ] /company/nirav-raleigh-greensboro-nc
- [ ] /company/tim-vancouver-wa
- [ ] /company/leonard-fields-baton-rouge-la
- [ ] /company/alex-quintana-greencastle-pa
- [ ] /company/cash-for-test-strips-indiana
- [ ] /company/michele-wilson-west-virginia

## How to do it (GSC UI quirks, learned 8/23)

1. Property is the **URL-prefix** form: `https://search.google.com/search-console?resource_id=https%3A%2F%2Fcash4teststripsusa.com%2F`
   (the `sc-domain:` form 403s for this site).
2. Paste the URL into the top "Inspect any URL" box → Enter → wait ~10s for the inspection to load.
3. **Verify the header shows the URL you intended before clicking REQUEST INDEXING.** The success
   toast overlays the search box and silently swallows typed input, so the next URL can fail to load
   and you end up re-requesting the previous one — which costs a quota slot. Dismiss the toast first.
4. A request can take **>10s** ("Submitting request" spinner). Judge success by the row changing to
   **"✓ Indexing requested / REQUEST AGAIN"**, not by catching the toast.

## Related finding — internal linking gap (not yet fixed)

Every one of these URLs inspects as "Referring page: None detected". Contributing structural facts,
verified live 8/23:
- `/sell-test-strips` (the natural hub for all 50 states) **404s — it does not exist.**
- `/directory` links to **zero** state pages.
- The homepage links to only 10 state pages: ca, fl, ga, ma, nc, nj, ny, oh, pa, tx. The other 40
  are reachable only via neighbor-state cross-links on state pages.

Caveat against over-reading this: **PA is linked from the homepage and is still unindexed**, so link
depth is not the whole story — authority is still the primary driver. But a `/sell-test-strips` hub
listing all 50 states, plus state links on `/directory` (already indexed, 29 impressions/28d), is a
free structural fix worth shipping alongside the off-site work in
`2026-08-20-offsite-authority-plan.md`.
