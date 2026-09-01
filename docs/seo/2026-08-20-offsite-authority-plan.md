# Off-Site Authority Plan — cash4teststripsusa.com
**Date:** 2026-08-20  
**Status:** Active plan — supersedes the strategic section of 2026-08-12-link-plan.md (anchor-text strategy and 12-month table there remain valid)  
**Problem being solved:** 53 pages "Discovered – currently not indexed" + 15 "Crawled – currently not indexed" despite clean technical setup. GSC shows 1 click, ~6 impressions (trailing 3 months). Cause is confirmed: near-zero domain authority, not technical failure. Google is rationing crawl budget for an unproven domain.  
**Goal:** Earn enough real off-site signals in 60–90 days to push crawl frequency from "occasionally" to "regularly" and tip the indexed page count from ~20 toward the full 164.

---

## Ground Rules (Do Not Skip This Section)

Every tactic below was chosen to survive scrutiny. The diabetic supply resale space has real diversion/fraud enforcement history. One manual action at this stage would be fatal — there's no authority cushion.

- **No paid links, no link exchanges, no PBNs.** Not even "gray" stuff. Not worth it at this scale.
- **No personal-name attribution.** Business-name bylines only: "Cash For Test Strips USA," "Albany Test Strips Buyer," etc.
- **No GBP or review-link solicitation.** Already declined; not in this plan.
- **Self-owned cross-links (albanyteststripsbuyer.com ↔ cash4teststripsusa.com) already exist and are discounted.** They're not counted here.
- **The legitimacy test:** would a local Chamber of Commerce find this embarrassing? If yes, don't do it.

---

## The Two-Week Quick Wins

These are the only things that can move the needle before September. Every other tactic takes longer than that to yield a link, let alone a crawl.

### QW-1: Manual GSC Request — Targeted Surgical Use
**What:** Use the 10/day GSC URL Inspection quota strategically on the 15 "Crawled – currently not indexed" pages, not the 53 "Discovered" ones. Crawled = Google visited, looked, and made a judgment. If the content was thin or near-duplicate at crawl time but has since been improved, re-requesting can flip them. Discovered pages won't benefit much — Google already knows they exist; more signals are what they need.  
**How:** Prioritize in this order: (1) product brand pages (Dexcom, Libre, Omnipod, OneTouch) — highest commercial value; (2) the most-populated state pages; (3) any page that has gained internal links since the last crawl.  
**Effort:** 15 minutes/day for 2–3 days. Feldon's GSC account. No help needed, but use the 10/day quota carefully — this is shared across all his properties.  
**Probability:** High for genuinely improved pages; low for pages that are still thin. Don't submit pages that haven't been improved.  
**Honest note:** This is a band-aid that buys time while real authority is being built. It does not solve the crawl-budget problem.

---

### QW-2: Buyer Backlink Ask — The 5 Genuine Third-Party Buyers
**The 5 non-Feldon buyers already listed:** 864 Medex, Hawks Sport Electronics, Jaime Cardoso, PGH Phone Buyer, Vancouver Test Strips Buyer.  
**The ask:** A short, professional email to each: "We've built you a free listing at [URL]. A link back from your site helps the directory rank better, which means more seller leads for you. Here's the link snippet: `<a href="https://cash4teststripsusa.com/company/[slug]">Find us on Cash For Test Strips USA</a>`."  
**Why they'd say yes:** They're already listed. A higher-ranking directory = more inbound leads to them. There's genuine mutual upside.  
**Effort:** 30 minutes total. No personal attribution needed — the email comes from Cash For Test Strips USA. Feldon should sign off as the company, not by name.  
**Probability:** 3 out of 5 respond; 2 actually add the link. These are small buyers, not editorial sites — some will have no website at all (Hawks Sport Electronics likely doesn't). Followed links. Low DA but legitimate.  
**Why this matters beyond the links:** A link from a real third-party buyer confirms to Google this is a real directory, not a self-promotional hub.

---

### QW-3: Structured Data + Entity Signals — No Links Required
This is not a link tactic but it directly addresses one of the two "Crawled – currently not indexed" causes. Google rejects pages it can't confidently understand. Adding structured data (Schema.org) to the key pages gives it a machine-readable declaration of what the site is.

**What to add:**
- `Organization` schema on the homepage: name, URL, description, sameAs (LinkedIn company page URL if it exists, or create one — see QW-4 below)
- `LocalBusiness` schema on city pages: name, address, areaServed, telephone (use CFTS Albany's number since Feldon's name can't be used)
- `ItemList` schema on the directory/buyer-listing pages
- `FAQPage` schema on the /is-it-legal-to-sell-diabetic-test-strips page — this is the single most useful page for featured snippet capture

**Effort:** A developer task (probably 2–4 hours if the site uses a template-based approach). Feldon's involvement: approving the phone number and address to use in LocalBusiness schema.  
**Probability:** Not a link-ranking factor; this is an entity clarity signal. It won't generate links but it reduces the chance that crawled pages get rejected for ambiguity. High value, low risk.

---

## The 3–6 Month Compounding Plays

These are the actual authority-builders. None yield results in 2 weeks, but without them the site will stay at near-zero authority indefinitely.

---

### P-1: Payout Data PR — The Highest-Leverage Play
This is the only tactic that could yield multiple high-DA editorial links from a single effort. It was outlined in the Aug 12 plan; this version is more specific.

**The asset to build:** A page titled something like "What Do Test Strip Buyers Actually Pay? [2026 Price Data]" — a clean, citable research page showing payout rates by brand (pulling from the existing `tier-pricing.ts` data), which brands are most accepted, and what sellers should know about condition requirements.

**Why this is linkable when a directory page isn't:** It answers a specific question no other authoritative source answers publicly. Buyer payout data is scattered, anecdotal, and often outdated. A structured, updated, sourced page is a genuine resource.

**Specific target publications — verified as covering this angle:**

1. **DiabetesMine (diabetesmine.com)** — Amy Tenderich's outlet covers the financial side of diabetes management regularly. They've written about test strip accuracy, affordability programs, and gray-market concerns. The angle "here's what your unused strips are actually worth, and who pays more" fits their editorial voice. Contact their editorial team directly. Pitch the data page, not the directory.

2. **diatribe.org** — Nonprofit diabetes media, strong on affordability/access angles. They've covered time-in-range, CGM affordability, and supply costs. Pitch: "Millions of strips are discarded annually; here's where that money goes instead." They're interested in systemic stories, not product pitches.

3. **Diabetes Daily (diabetesdaily.com)** — Community + editorial hybrid. Their forum users regularly ask "what do I do with extra strips." Pitch the data page as a community resource. They also publish community-contributed articles under contributor bylines — business name byline is acceptable on community platforms.

4. **The Penny Hoarder (thepennyhoarder.com)** — DA ~80. They have published "ways to make money with medical supplies" articles before. The angle: "Selling unused test strips: what it's worth and how to do it legally." This is a transactional personal-finance piece they'd write themselves; pitch yourself as a primary source, not for a guest post. Be prepared to be quoted anonymously by business name if they write it.

5. **Patient Advocate Foundation blog (patientadvocate.org)** — Covers financial assistance for medical costs. The angle: "When insurance overpays and you have surplus supplies — here's how to recover value." Niche but highly trusted domain.

**Pitch format:** Not a guest post pitch. A "here's our research, do you want access to the full dataset?" pitch. Keep it short. Lead with the data hook, not the directory.  
**Effort:** Building the data page is a developer + content task (1–2 weeks). The outreach is simple. Feldon does not need to be personally involved in the pitch — it goes from "Cash For Test Strips USA research team." No byline problem.  
**Timeline:** 4–8 weeks from data page publish to first link.  
**Probability:** 1–2 links from the 5 targets. DiabetesMine and Penny Hoarder are the most likely — they have editorial email inboxes that actually get read. diatribe.org is a long shot (tight editorial standards). That said, 1 link from DiabetesMine is worth more than 20 directory submissions.  
**Link type:** Editorial, followed.

---

### P-2: Estate / Caregiver Resource Placements
This was in the Aug 12 plan and it's the right call. Making it actionable here.

**Why this niche works:** Estate liquidators and caregivers who find a deceased relative's supplies have exactly zero information about what to do. "Can I sell mom's test strips?" is a real search query with no authoritative answer. The /is-it-legal page already targets this; it needs a companion outreach push.

**Specific checkable targets:**

1. **National Association of Senior Move Managers (nasmm.org)** — They maintain a member resource library. Contact their member resources coordinator and offer the /is-it-legal page as a reference resource for their practitioners. Followed link from a real professional organization. Probability: Medium (they're selective, but this is genuinely useful to their members who handle medical supply questions constantly).

2. **estatesales.net blog** — The dominant estate sale listing platform. They have an active blog aimed at estate sale companies. A piece like "What to do with medical supplies at an estate sale" would fit their editorial calendar. Pitch as a contributed piece, business-name byline. Probability: Medium-low (they have an editorial team that's hard to reach, but the angle is genuinely useful to their readership).

3. **Caring.com (caring.com)** — DA ~70. Eldercare resource site. They have a "caregiver resources" section with external links to useful tools. The legal/how-to page is a natural link target. Email their editorial team. Probability: Low (they're a large site), but the link would be high value.

4. **AgingCare.com (agingcare.com)** — Similar to Caring.com but more community-driven. Their forum users ask exactly these questions. Contributing a factual answer with a link in the forum would be nofollowed but drives real referral traffic and branded search. The editorial team also accepts contributed expert articles. Probability: Medium for forum contribution; low for editorial placement.

5. **Local funeral home websites** — This sounds odd but it's real: funeral homes in major metro areas (Albany, Charlotte, Las Vegas — the T1 markets with city pages) often have "what to do after a loved one passes" resource pages. A handful of them include links to useful services. An email to 20–30 funeral homes in T1 cities asking if they'd add a resource link to the /is-it-legal page is low effort and occasionally converts. Probability per email: very low (5%). At 30 emails that's 1–2 links. DA will be low, but the diversity signal matters for a new domain.

**What Feldon needs to do personally:** None of these require personal attribution. Outreach goes from "Cash For Test Strips USA." The funeral home emails especially are templatable and can be batched.  
**Timeline:** 4–10 weeks.  
**Probability overall:** 3–6 links from this cluster.

---

### P-3: Legitimate Health/Finance Directory Listings
Low glamour, medium value. New domains with zero authority need foundational citation signals before editorial links become easier to get. The Aug 12 plan listed these; here's the concrete list.

**Specific directories — verified real, legitimate, non-paid:**

1. **Better Business Bureau (bbb.org)** — Free basic listing for legitimate businesses. Uses Cash For Test Strips Albany's address and phone. Followed link. Probability: High (just requires business verification). **This one Feldon must do personally** — BBB requires proof of business ownership.

2. **Yelp Business Listing (biz.yelp.com)** — For the directory site, not the Albany location (that's a separate listing). List cash4teststripsusa.com as a "business services / health" category. Nofollow link, but Yelp is a strong entity signal. Probability: High. Feldon must verify via phone/email.

3. **HealthConnections (healthconnections.com)** — Healthcare resource directory. Free basic listing for health-adjacent businesses. Followed link, low DA (~30) but legitimate. Probability: Medium.

4. **Justia Legal Guides / Avvo** — The /is-it-legal page can be submitted as a legal resource to Justia's health law section. Justia accepts contributed resources. Not a client directory — submit the page as a public legal information resource. Followed, DA ~70. Probability: Medium (they're selective about what they list).

5. **Manta.com and Hotfrog.com** — Small-business citation directories. Low DA, free, followed links. No Feldon involvement needed. Do these in bulk in a single afternoon — they take 10 minutes each. Probability: High (anyone can list).

6. **D&B (Dunn & Bradstreet) Credibility Profile (dnb.com)** — Not a link per se, but a business entity signal. Adding a D&B profile for Cash For Test Strips USA (the directory entity) signals to Google that it's a real business. This matters for Google's entity graph. Low-effort, legitimate.

**What Feldon must do:** BBB verification (requires proof of business ownership/phone verification). Yelp phone verification.  
**Timeline:** 1–3 weeks.  
**Total links from this cluster:** 4–8, mostly low-to-medium DA.

---

### P-4: Local Media Pitching — Albany as Proof of Concept
Local TV and news affiliate websites carry very high DA (often 70–90) and they accept story pitches. This is the highest-DA link opportunity outside of national health media.

**The angle:** "Albany business helps diabetics turn unused supplies into cash — and it's completely legal." This is genuinely a local-interest story. A person cleans out a cabinet and gets $200 for strips they were going to throw away. Human interest. Zero politics.

**Specific Albany-area targets:**

1. **WNYT NewsChannel 13 (wnyt.com)** — DA ~70. They run "local consumer" segments. Contact their consumer reporter. Pitch is about the Albany location (albanyteststripsbuyer.com) as the local business; cash4teststripsusa.com is the national resource they built. The story is about the local company, the national directory is the "for others to find this in their area" hook. Both sites get mentioned/linked.

2. **Times Union (timesunion.com)** — Albany's paper of record. DA ~80. Business section covers local consumer stories. Same pitch as above — local business with a national reach angle.

3. **Spectrum News 1 Albany (spectrumnews1.com/ny/capital-region)** — Cable news, strong local coverage. Their "getting results" segments cover exactly this type of story.

**What this requires:** Feldon's genuine involvement. A media pitch for a local business story needs the business owner or a spokesperson to be willing to do a short phone interview or brief TV appearance. This is the one tactic where Feldon cannot fully delegate. If he's comfortable being referenced as the business owner (not by name in the article, but as the contact behind the pitch), this is the highest single-link-value opportunity on the list. If not, skip this tactic.  
**Timeline:** 6–12 weeks (pitches often get slow-walked; follow up 2x before abandoning).  
**Probability:** 1 out of 3 runs a story if the pitch is well-timed. A single WNYT or Times Union placement would generate significant referral traffic and a high-DA followed link.  
**Honest note:** This is a long shot requiring Feldon's real involvement. The reward is proportionally high — a Times Union link is likely worth more than 30 directory submissions for crawl-budget purposes.

---

## Non-Link Authority Signals

These don't produce links but they affect how Google understands and trusts the entity behind cash4teststripsusa.com. For a new domain with zero authority history, entity clarity is the fastest non-link lever.

### A: LinkedIn Company Page
Create a LinkedIn company page for "Cash For Test Strips USA." Add it to the `sameAs` field in the Organization schema. LinkedIn company pages are trusted by Google as entity verification signals. Takes 30 minutes. Requires Feldon to create it (LinkedIn ties pages to real user accounts), but the page itself is the business — no personal attribution in external content.

### B: Crunchbase / Wikipedia Alternatives
Crunchbase is traditionally for funded startups but accepts any company. A basic Crunchbase profile (free tier) with the company description, website, and founding date is another sameAs signal. Wikipedia is out of reach for now (notability requirements). Wikidata is not — a Wikidata entity for "Cash For Test Strips USA" can be created by anyone and is a direct Google Knowledge Graph input. This is a real tactic used by entity-SEO practitioners in 2025–2026. Takes 1–2 hours to set up correctly.

### C: Consistent NAP Across Citations
Every directory listing must use the exact same Name, Address, Phone format. Using Cash For Test Strips Albany's physical address is fine — this is the parent business. Inconsistent NAP (different spellings, abbreviations, old addresses) dilutes the entity signal. Worth auditing every existing citation before building new ones.

### D: Unlinked Brand Mentions — Convert the Easy Ones
Search `"cash4teststripsusa" OR "cash for test strips usa" -site:cash4teststripsusa.com` to find any unlinked mentions. If a forum, article, or resource mentions the site without linking, that's a warm outreach target — email them and ask for a link. For a new site this inventory is small right now, but set up a Google Alert for both variants and catch new mentions as they happen.

### E: Supplier Relationships as Social Proof
If any of the 24 CFTS-network buyer locations have operating relationships with pharmacies, medical supply stores, or healthcare nonprofits — ask those entities to add the directory URL to their "resources" page. A pharmacy chain's "how to dispose of medical supplies" page linking to a sell-your-strips directory is a relevant, legitimate placement.

---

## What NOT to Do

These look attractive in this niche and they're all bad ideas:

**1. Paying for placements on diabetes/health "resource" sites.** There are dozens of sites offering "sponsored posts" or "resource listing fees" in the health space. These are link farms with health-themed content. Google's manual action team focuses heavily on health-adjacent link schemes. At 1 click/month, you have everything to lose.

**2. Reciprocal links with other test strip buyers.** "You link to me, I'll link to you" is a textbook link scheme. It doesn't matter if the other buyer is legitimate. This is the tactic Google has flagged explicitly in multiple core updates.

**3. Forum signature links.** Adding a link to a forum signature and posting in diabetes communities. This was a 2012 tactic. It doesn't work, it's spammy, and it risks getting the brand name associated with spam on the communities that are genuinely good targets (r/diabetes, TuDiabetes). Save those communities for genuine helpfulness.

**4. Bulk directory submissions to general business directories.** 50 submissions to random business directories in one week looks unnatural and provides no topical signal. The directories listed in P-3 above are chosen because they're topically relevant or legitimately authoritative. Generic submissions (Yellow Pages clones, etc.) are noise at best, a footprint at worst.

**5. Announcing the directory in diabetes Facebook groups with a link.** These groups will delete the post and ban the account. Build reputation there slowly and organically, or not at all. The Facebook group approach only works after the brand already has organic goodwill from being genuinely helpful.

**6. Aggressive exact-match anchor text asks.** When asking buyers to link back, never specify anchor text like "sell test strips near me" or "diabetic supply buyers." Ask for a natural mention or a branded anchor. Over-optimized anchors from low-DA sites trigger Penguin-era pattern detection that's still active in 2026's core algorithm.

---

## Priority Order and Timeline

### Weeks 1–2
| Action | Who | Est. Time |
|--------|-----|-----------|
| QW-1: GSC surgical submissions on "Crawled" pages | Feldon (his GSC account) | 15 min/day × 3 days |
| QW-2: Email the 5 third-party buyers re: backlink | Anyone (business-name email) | 30 min |
| QW-3: Add Organization + FAQ schema to homepage and legal page | Developer | 2–4 hrs |
| P-3 quick listings: Manta, Hotfrog, D&B profile | Anyone | 2–3 hrs |
| BBB listing (requires ownership verification) | Feldon | 30 min |
| LinkedIn Company Page | Feldon | 30 min |
| Wikidata entity | Anyone (takes research) | 1–2 hrs |

### Weeks 3–8
| Action | Who | Est. Time |
|--------|-----|-----------|
| P-1: Build the Payout Data research page | Developer + content | 1–2 weeks |
| P-1: Pitch DiabetesMine, Penny Hoarder, diatribe | Anyone (business email) | 1 hr to write, ongoing follow-up |
| P-2: NASMM and estatesales.net outreach | Anyone | 1–2 hrs |
| P-2: Funeral home email batch (T1 cities) | Anyone | 3–4 hrs to template + send 30 emails |
| P-3: Yelp, HealthConnections, Justia submission | Feldon (needs account verification) | 2 hrs |
| P-4: Albany media pitch — if Feldon willing | Feldon | Pitch: 30 min. Interview: 30 min. |

### Weeks 9–24
| Action | Who | Est. Time |
|--------|-----|-----------|
| P-1: Follow up on PR pitches; submit to Patient Advocate Foundation | Anyone | Ongoing |
| P-2: Caring.com and AgingCare.com outreach | Anyone | 1–2 hrs |
| Continue monitoring Google Alert for unlinked brand mentions | Anyone | 15 min/week |
| Quarterly: Refresh the Payout Data page; repitch with updated numbers | Content | 2–4 hrs/quarter |

---

## Honest Assessment: When Does Crawl Budget Move?

The realistic timeline:

**30 days:** QW-1 (surgical GSC submissions) should tip a handful of the 15 "Crawled" pages into indexed. The "Discovered" pool will not meaningfully shrink from this. Entity schema additions reduce rejection risk for future crawls but don't accelerate them.

**60–90 days:** If 3–5 third-party links land (buyer backlinks + directory listings + one PR placement), Googlebot should start crawling more frequently. The signal threshold is not 1 link — it's demonstrable evidence that other real sites consider this worth linking to. Five or six diverse legitimate links from non-owned domains is probably the minimum viable credibility signal for a new domain in a moderately competitive niche.

**90–180 days:** With a real PR placement (DiabetesMine, Times Union, or similar), the domain's crawl frequency should shift from "occasionally checks in" to "regular crawl schedule." That's when the 53 "Discovered" pages start converting to indexed. It will not happen all at once — Google will continue to index in batches.

**What won't happen:** A sudden jump to full indexation from any single tactic. Crawl budget for a new domain builds incrementally. The progress curve will look flat for weeks, then it will inflect. The inflection comes from cumulative signal weight, not a single event.

**Bottom line:** 60–90 days to measurable crawl-frequency improvement. 4–6 months to meaningful indexed-page growth across the "Discovered" pool. The best-leverage item is P-1 (Payout Data PR) because it has the potential to generate editorial links from trusted health or personal-finance domains — those carry disproportionate crawl-budget weight versus equivalent links from lower-DA sites.
