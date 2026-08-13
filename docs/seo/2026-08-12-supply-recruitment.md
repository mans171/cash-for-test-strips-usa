# Supply Recruitment Plan — Getting from 29 Buyers to 250+
**Date:** 2026-08-12
**Context:** 29 active buyers cover 21 states. 30 states have zero local buyers. City pages cannot be published for a metro without a buyer within 100 miles — so buyer growth directly gates SEO growth.

---

## Where Buyers Come From

Diabetic test strip buyers are not organized in one place. They operate as individuals and small businesses, often advertising informally. Primary sourcing channels:

**1. Craigslist "Wanted" ads**
Search `site:craigslist.org "diabetic test strips" wanted` in each target metro. Active Craigslist buyers are already doing this as a business and are likely to respond to a free directory listing.

**2. Facebook groups**
Groups like "Diabetic Test Strip Buyers and Sellers," "Sell Your Diabetic Supplies," and state-specific diabetes groups contain active buyers. Search Facebook for "[state] diabetic test strips buy" to find groups with buyer members.

**3. eBay "wanted" listings and completed sales**
Sellers of test strips on eBay are sometimes buyers too. Search completed sales for "diabetic test strips" — high-volume sellers may also buy locally.

**4. Google search for local buyers**
`"cash for test strips" [city]` — buyers who already have Google Business Profiles or basic websites are the easiest recruits because they understand the model.

**5. Referrals from current buyers**
Each of the 29 buyers likely knows other buyers in adjacent markets. A single outreach email asking "do you know anyone buying strips in [nearby city]?" is the highest-conversion channel.

**6. The /buyer portal (existing)**
The existing `/buyer` claim flow already accepts new listing submissions. The current version is anonymous phone-lookup — the buyer-accounts feature (described in `docs/handoff-2026-08-09.md`) will formalize this with real accounts and admin review. Passive inbound from sellers who mention "I know a buyer" is a real channel once the site has traffic.

---

## Outreach Sequence

Three-step sequence per prospect. Keep it short — buyers are informal operators, not corporate contacts.

**Step 1 (Day 1): Initial email or DM**

Subject: `Free listing for your test strip buying business`

> Hi [Name], I run Cash For Test Strips USA (cash4teststripsusa.com) — a free national directory connecting sellers with local buyers like you. I'd like to add a free listing for your business in [City]. No cost, no catch — we send you seller leads. Takes 2 minutes to set up at cash4teststripsusa.com/buyer. Let me know if you have questions.

**Step 2 (Day 5): One follow-up**

> Just following up on the free directory listing for [City]. We're getting seller inquiries in your area and want to make sure they can reach you. Happy to set it up for you if it's easier — just reply with your contact info.

**Step 3 (Day 12): Final attempt**

> Last note — we're adding a buyer in [City] this week. If that's not you, no worries. If you want to be listed, reply here or go to cash4teststripsusa.com/buyer.

After step 3, move on. No more than 3 touches per prospect.

---

## Priority Recruitment States (by SEO impact)

Rank based on metro size × diabetes rate × current zero-coverage status:

| Priority | State | Key Metros to Unlock | Why |
|----------|-------|----------------------|-----|
| 1 | IL | Chicago | Largest uncovered metro in the US for this niche |
| 2 | TN | Nashville, Memphis | High diabetes belt; strong search demand |
| 3 | VA | Northern VA/DC suburbs, Richmond | High population density near existing MD buyer |
| 4 | AZ | Phoenix, Tucson | Large, fast-growing, high diabetes rate |
| 5 | MN | Minneapolis | Large metro, no coverage |
| 6 | WI | Milwaukee, Madison | No coverage; adjacent to covered markets |
| 7 | OR | Portland | Vancouver WA buyer is nearby but OR-specific searches go unfilled |
| 8 | OK | Oklahoma City, Tulsa | High diabetes rate |
| 9 | UT | Salt Lake City | Large metro, no coverage |
| 10 | KY | Louisville, Lexington | High diabetes rate; no coverage |

---

## Volume Targets

| Timeframe | Buyer target | States covered | City pages unlocked |
|-----------|-------------|----------------|---------------------|
| 90 days | 50 buyers | 30+ states | ~60 city pages |
| 6 months | 120 buyers | 42+ states | ~150 city pages |
| 12 months | 250 buyers | All 50 states | ~300+ city pages |

These are goals, not guarantees. The conversion rate from outreach to active listed buyer is unknown — treat 90-day target as a calibration point and adjust.

---

## Interim Fallback for Zero-Coverage States (the "no buyer yet" template)

While a state has no local buyer, the state page must not be empty or useless. Current state-page behavior (shows "No buyers listed yet" amber box + link to directory) is acceptable as a placeholder but not strong enough to hold rankings for zero-coverage states once competition arrives.

Interim content standard for zero-coverage state pages:

1. **Mail-in buyer featured prominently.** The existing mail-in fallback in `/directory` shows how — adapt this pattern to state pages. "No local buyers in [State] yet — our mail-in service ships free and pays within 24 hours" with a direct link to `/sell`.

2. **State-specific payout context.** Pull from `tier-pricing.ts` — the brand tier rankings are the same nationally, but present them as "What sells best from [State]" since the mail-in buyer accepts all states.

3. **"Be the first buyer in [State]" CTA.** A visible, styled call-to-action linking to `/buyer` for any test strip buyer in that state who finds the page. This both recruits buyers and signals to Google that the page has a purpose beyond thin geo-pages.

4. **No fabricated local context.** Do not write copy implying local buyers exist if they don't. The legality page and how-much-are-strips-worth page are the right cross-links — both are informational and do not imply local coverage.

---

## Tracking Recruitment Progress

Maintain a simple spreadsheet (or Supabase table if volume warrants) tracking:

| Field | Purpose |
|-------|---------|
| Prospect name | Who was contacted |
| City / State | Target metro |
| Source | Where found (CL, FB, Google, referral) |
| Outreach date | Step 1 sent |
| Status | Contacted / Responded / Listed / Declined |
| Listed date | When they went live in Supabase |

Review weekly. If a state hits 2+ active buyers, escalate that state's city pages to Wave 1 priority.
