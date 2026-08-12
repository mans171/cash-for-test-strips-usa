# Design: Replace visible dollar pricing with payout tiers

**Date:** 2026-08-12
**Status:** Approved by Feldon, pending spec review before planning

## Goal

Dollar-specific pricing on the Price Guide page and in every blog post's embedded price table discourages form completions — seeing a specific range up front gives sellers a reason to bounce instead of calling/filling out the sell form. Replace exact dollar figures with a simple 3-tier payout ranking (Top / Mid / Lower), grounded in real buyback data, everywhere except the homepage hero hook, which stays as a single high anchor figure for conversion.

## Current state

Three places on `cash-for-test-strips-usa` show dollar amounts:

1. **`app/how-much-are-diabetic-test-strips-worth/page.tsx`** — the dedicated, SEO-targeted Price Guide page. Two hardcoded arrays (`TEST_STRIP_PRICES`, `CGM_PRICES`) render as tables with brand, price range, and a notes column. An `FAQS` array also cites specific $ ranges in its answers, and those answers feed `buildFaqPageSchema` — the numbers are embedded in the page's FAQPage JSON-LD, not just the visible copy.
2. **`app/blog/[slug]/page.tsx`** (lines ~364–370) — the same brand-by-brand price table, duplicated as a second hardcoded array inside the blog post template, rendered identically on all 50 state-specific posts.
3. **`app/page.tsx`** homepage hero — "Local buyers pay **up to $100 a box**..." — a single high anchor figure driving the ZIP-search CTA, not a table. Out of scope for removal; gets a small wording tweak (below).

Nowhere else on the site shows dollar figures (verified via `grep -rE '\$[0-9]' app/ lib/`) — company profiles, directory, state pages, and the About page all describe payment *speed* and *method*, never amounts.

## Non-goals

- Homepage hero copy is **not** losing its price hook — it's the one place a high number helps conversion rather than hurting it.
- Not touching `/sell-test-strips/[state]` pages, `/directory`, or company profiles — none of them show dollar amounts today.
- Not re-deriving or changing CFTS Albany's actual buyback pricing engine (`cftsalbany/src/lib/*-pricing.ts`) — those files are read-only reference data for this design, informing what tier each brand belongs in on this consumer-facing guide. Nothing in `cftsalbany` changes.
- Not building an A/B test or tracking conversion impact — out of scope for this pass.

## Tier assignments (grounded in real data, confirmed with Feldon)

Sourced from `cftsalbany/src/lib/mercury-pricing.ts` (Mercury, the primary buyer) and cross-checked against the other 12 buyer-pricing files for brands Mercury doesn't carry. Top-tier price shown here is context for *why*, not something that ships on the page.

**Test strips:**
| Brand / line | Tier | Why |
|---|---|---|
| Accu-Chek Aviva / SmartView | Top | Mercury's own top strip price: $60–63/box (100ct) |
| FreeStyle Lite | Top | $40/box on Mercury; consistent $35–50 across other buyers |
| OneTouch Verio/Ultra | Top | Not on Mercury's sheet, but routes to Sunny Med at $40/box fresh 100ct — matches FreeStyle Lite. Only its small-count/mail-order variants are cheap ($12–13) |
| True Metrix | Top | Not on Mercury's sheet, but routes to First Class at $42/box fresh 100ct — beats FreeStyle Lite |
| Contour Next | Mid | $31/box on Mercury, $25–34 range elsewhere |
| Accu-Chek Guide (generic/unnamed line) | Mid | $18/box — the "default" Accu-Chek line real order text usually means, well below Aviva/SmartView |
| Lancets (all brands) | Lower | $1–3/box across every buyer and brand — an order of magnitude below strips |

**CGM / pods:**
| Product | Tier | Why |
|---|---|---|
| Omnipod (all variants) | Top | $200–220/box top tier on Mercury |
| Dexcom G6 | Top | Best G6 SKU matches Omnipod at $220; Feldon's call to anchor top rather than on the lower-value G6 variants |
| Dexcom G7 | Mid | $77–85/box top tier |
| FreeStyle Libre 3 | Mid | $58–62/box top tier |

**Note on Accu-Chek and Dexcom G6 specifically:** both brands span a huge internal range (Accu-Chek: $18–63 depending on line; G6: $50–220 depending on SKU/kit type). Accu-Chek splits into two rows on the page so that gap doesn't hide inside one tier badge (Feldon's call). G6 does not split — it's a single row anchored to its best SKU, same tier as Omnipod (Feldon's call, differs from the Accu-Chek treatment because G6's highest-value SKU is common enough to anchor on, per Feldon).

## Architecture: one shared data module

Today the Price Guide page and the blog template each hold their own hardcoded price-table array — the exact duplication pattern that's already caused real drift bugs in this account (`cftsalbany/src/lib/pricing.ts` silently diverging from its published sheet; the schema test filename collision earlier in this project's own AEO work). Fix it here before it repeats:

**New file: `lib/tier-pricing.ts`**
```ts
export type Tier = "top" | "mid" | "lower";

export interface TierRow {
  brand: string;
  tier: Tier;
  note: string;
}

export const TEST_STRIP_TIERS: TierRow[] = [ /* 7 rows per the table above */ ];
export const CGM_TIERS: TierRow[] = [ /* 4 rows per the table above */ ];
```

Both `app/how-much-are-diabetic-test-strips-worth/page.tsx` and `app/blog/[slug]/page.tsx` import from this module instead of holding their own copy. One place to update tiers in the future.

## Visual treatment

A new `TierBadge` component in `app/components/ui.tsx`, matching the existing `VerifiedBadge`/`FeaturedBadge` pattern exactly (`text-[11px] font-extrabold ... px-1.5 py-0.5 rounded-md uppercase tracking-wide`, one color pairing per tier):

```tsx
export function TierBadge({ tier }: { tier: Tier }) {
  const styles = {
    top:   "text-green-800 bg-green-100",
    mid:   "text-amber-700 bg-amber-50",
    lower: "text-gray-600 bg-gray-100",
  };
  const labels = { top: "Top Tier", mid: "Mid Tier", lower: "Lower Tier" };
  return (
    <span className={`inline-flex text-[11px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${styles[tier]}`}>
      {labels[tier]}
    </span>
  );
}
```

This replaces the "Price" column header/cells in both Price Guide tables. Brand names, notes columns, and table structure otherwise stay as-is.

## Content changes

**Price Guide page (`app/how-much-are-diabetic-test-strips-worth/page.tsx`):**
- `TEST_STRIP_PRICES`/`CGM_PRICES` arrays deleted; tables render from `TEST_STRIP_TIERS`/`CGM_TIERS` (imported), rendering a `TierBadge` where the price cell was.
- Accu-Chek row splits into "Accu-Chek Aviva / SmartView" and "Accu-Chek Guide" as two table rows.
- Add a Lancets row to the test-strips table (not present today, but named explicitly in the tier data and in Feldon's original framing).
- `FAQS` array answers rewritten to remove $ ranges and correct the factual claim that "OneTouch Verio and Ultra typically pay the most" (they don't, on Mercury specifically — Accu-Chek Aviva/SmartView does; all four Top-tier brands are now roughly comparable). New answers describe relative tiers in words, not numbers. This also updates the FAQPage JSON-LD content, since it's built directly from this array.
- Page `metadata.description` was rewritten (see the implementation plan) from "...cash prices..." framing to "...payout tiers..." framing, matching the rest of the page.

**Blog template (`app/blog/[slug]/page.tsx`):**
- Hardcoded price array (lines ~364–370) replaced with the same `TierBadge` rendering, sourced from the shared module. Same visual treatment as the Price Guide page, rendered on all 50 posts.

**Homepage (`app/page.tsx`):**
- Hero copy, two edits to the same sentence: the linked phrase (lines 90–92) changes from `up to $100 a box` to `up to $100+ a box` (link target and styling untouched — text only); the trailing clause (line 93) changes from `for sealed, unexpired supplies. Cash in hand, same day.` to `for qualifying, sealed, unexpired supplies. Cash in hand, same day.` Full sentence reads: "Local buyers pay **up to $100+ a box** for qualifying, sealed, unexpired supplies. Cash in hand, same day."

## Testing

- Existing test suite must stay green; any tests referencing the old `TEST_STRIP_PRICES`/`CGM_PRICES` arrays or asserting on $ text in rendered output need updating to assert tier badges instead.
- New unit coverage for `lib/tier-pricing.ts` isn't really testable in isolation (it's static data) — coverage comes from the page-level tests asserting the right tier badge renders for a few representative brands.
- Anon-leak-style grep check: `curl` the Price Guide page and a sample blog post, confirm zero `\$[0-9]` matches remain (mirrors the pattern already used for anon-contact-leak checks elsewhere in this codebase).
- Visual check at true 390px (iframe technique, not `resize_window` — see this session's own notes on why) for both the Price Guide page and one blog post, confirming the tables/badges don't overflow.
