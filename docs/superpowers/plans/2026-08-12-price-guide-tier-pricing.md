# Price Guide Tier Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace visible dollar-figure pricing on the Price Guide page and in every blog post's embedded price table with a 3-tier payout ranking (Top/Mid/Lower), grounded in real CFTS Albany buyback data. Homepage hero hook stays, tweaked to "$100+ / qualifying products."

**Architecture:** One new shared data module (`lib/tier-pricing.ts`) is the single source of truth for tier assignments, consumed by both the Price Guide page and the blog post template (today they hold two separately-hardcoded, already-inconsistent copies of the same table). One new presentational component (`TierBadge` in `app/components/ui.tsx`) renders a tier, matching the existing `VerifiedBadge`/`FeaturedBadge` visual pattern exactly.

**Tech Stack:** Next.js 16 (Turbopack), React Server Components, Tailwind, Vitest.

## Global Constraints

- No new dependencies.
- Match existing badge styling exactly: `text-[11px] font-extrabold ... px-1.5 py-0.5 rounded-md uppercase tracking-wide` (see `app/components/ui.tsx`'s `VerifiedBadge`/`FeaturedBadge`).
- No dollar signs anywhere in the Price Guide page or blog post template's price table (including brand/note text) — this is the whole point of the feature; Task 1's test enforces it as a regression guard.
- Homepage hero's linked "$100+" phrase and its href/styling are otherwise untouched — text-only edit.
- Full spec: `docs/superpowers/specs/2026-08-12-price-guide-tier-pricing-design.md` — read it before starting; exact tier assignments and their rationale live there, not repeated in full here.

**Parallelization note:** Tasks 2, 3, and 4 touch entirely disjoint files and share no data dependency beyond consuming Task 1's already-completed output — they can run as parallel subagents once Task 1 is merged, rather than strictly sequentially. Task 5 must run last, after 2–4 all land.

---

### Task 1: Tier data module + `TierBadge` component

**Files:**
- Create: `lib/tier-pricing.ts`
- Create: `lib/__tests__/tier-pricing.test.ts`
- Modify: `app/components/ui.tsx` (append `TierBadge`; no changes to existing exports)

**Interfaces:**
- Produces: `Tier` type (`"top" | "mid" | "lower"`), `TierRow` interface (`{ brand: string; tier: Tier; note: string }`), `TEST_STRIP_TIERS: TierRow[]` (7 rows), `CGM_TIERS: TierRow[]` (4 rows) from `lib/tier-pricing.ts`; `TierBadge({ tier }: { tier: Tier })` from `app/components/ui.tsx`. Tasks 2 and 3 both import all of these.

- [ ] **Step 1: Write the failing test** — create `lib/__tests__/tier-pricing.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { TEST_STRIP_TIERS, CGM_TIERS } from '@/lib/tier-pricing'

describe('tier-pricing data', () => {
  const allRows = [...TEST_STRIP_TIERS, ...CGM_TIERS]

  it('every row has a valid tier', () => {
    for (const row of allRows) {
      expect(['top', 'mid', 'lower']).toContain(row.tier)
    }
  })

  it('every row has a non-empty brand name and note', () => {
    for (const row of allRows) {
      expect(row.brand.length).toBeGreaterThan(0)
      expect(row.note.length).toBeGreaterThan(0)
    }
  })

  it('has no duplicate brand names within a single list', () => {
    const testStripNames = TEST_STRIP_TIERS.map((r) => r.brand)
    expect(new Set(testStripNames).size).toBe(testStripNames.length)
    const cgmNames = CGM_TIERS.map((r) => r.brand)
    expect(new Set(cgmNames).size).toBe(cgmNames.length)
  })

  it('no row text mentions a dollar sign — the whole point of this data', () => {
    for (const row of allRows) {
      expect(row.brand).not.toMatch(/\$/)
      expect(row.note).not.toMatch(/\$/)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/tier-pricing.test.ts`
Expected: FAIL — `Cannot find module '@/lib/tier-pricing'`

- [ ] **Step 3: Create `lib/tier-pricing.ts`**

```ts
export type Tier = "top" | "mid" | "lower";

export interface TierRow {
  brand: string;
  tier: Tier;
  note: string;
}

export const TEST_STRIP_TIERS: TierRow[] = [
  { brand: "Accu-Chek Aviva / SmartView", tier: "top", note: "Our best-paying Accu-Chek line — consistently outperforms the standard Guide line." },
  { brand: "FreeStyle Lite", tier: "top", note: "Large, consistent buyer base." },
  { brand: "OneTouch Verio / Ultra", tier: "top", note: "Widely accepted; competitive with other top-tier brands when sold fresh." },
  { brand: "True Metrix", tier: "top", note: "Strong buyer demand once matched to the right buyer — call to confirm your specific SKU." },
  { brand: "Contour Next (all versions)", tier: "mid", note: "Solid mid-tier brand; moves well in bulk." },
  { brand: "Accu-Chek Guide", tier: "mid", note: "The line most orders default to when a specific model isn't named; solid demand, standard pricing." },
  { brand: "Lancets (all brands)", tier: "lower", note: "Accepted alongside strip orders, but the lowest per-box value of anything we buy." },
];

export const CGM_TIERS: TierRow[] = [
  { brand: "Omnipod Pods (5, DASH, Classic)", tier: "top", note: "Expired pods also accepted — call for pricing." },
  { brand: "Dexcom G6 Sensors", tier: "top", note: "High-demand product — call for a current quote." },
  { brand: "Dexcom G7 Sensors (10-Day and 15-Day)", tier: "mid", note: "Expired G7 sensors are also accepted by some buyers." },
  { brand: "FreeStyle Libre Sensors (1, 2, 2 Plus, 3, 3 Plus)", tier: "mid", note: "Libre 3 is the strongest-performing Libre generation. U.S. retail versions only." },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/tier-pricing.test.ts`
Expected: PASS, 4/4 tests

- [ ] **Step 5: Append `TierBadge` to `app/components/ui.tsx`** — add after the existing `FeaturedBadge` function (do not modify anything above it):

```tsx
export function TierBadge({ tier }: { tier: Tier }) {
  const styles: Record<Tier, string> = {
    top: "text-green-800 bg-green-100",
    mid: "text-amber-700 bg-amber-50",
    lower: "text-gray-600 bg-gray-100",
  };
  const labels: Record<Tier, string> = { top: "Top Tier", mid: "Mid Tier", lower: "Lower Tier" };
  return (
    <span className={`inline-flex text-[11px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${styles[tier]}`}>
      {labels[tier]}
    </span>
  );
}
```

Add the import at the top of `app/components/ui.tsx`: `import type { Tier } from "@/lib/tier-pricing"` (alongside the existing `import { monogramFromName } from "@/lib/monogram"` line).

- [ ] **Step 6: `npm test` + `npm run build`** green.
- [ ] **Step 7: Commit** — `git add lib/tier-pricing.ts lib/__tests__/tier-pricing.test.ts app/components/ui.tsx && git commit -m "feat: tier-pricing data module + TierBadge component"`

---

### Task 2: Price Guide page — tiers replace price tables

**Files:**
- Modify: `app/how-much-are-diabetic-test-strips-worth/page.tsx` (full content shown below for context; only the pieces described change)

**Interfaces:**
- Consumes: `TEST_STRIP_TIERS`, `CGM_TIERS`, `Tier` from `@/lib/tier-pricing` (Task 1); `TierBadge` from `@/app/components/ui` (Task 1).

- [ ] **Step 1: Delete the `TEST_STRIP_PRICES` and `CGM_PRICES` consts** (currently defined right after the `FAQS` array) and replace the import line `import { buildFaqPageSchema } from '@/lib/schema'` with:

```ts
import { buildFaqPageSchema } from '@/lib/schema'
import { TEST_STRIP_TIERS, CGM_TIERS } from '@/lib/tier-pricing'
import { TierBadge } from '@/app/components/ui'
```

- [ ] **Step 2: Update `metadata.description`** from `'Brand-by-brand cash prices for diabetic test strips and CGM supplies in 2026. See what OneTouch, FreeStyle, Accu-Chek, Contour, Dexcom, and more pay.'` to:

```
'Brand-by-brand payout tiers for diabetic test strips and CGM supplies in 2026. See how OneTouch, FreeStyle, Accu-Chek, Contour, Dexcom, and more compare.'
```

- [ ] **Step 3: Rewrite the first `FAQS` entry** (`q: "What's the highest-paying brand of test strips?"`) — replace its `a` field with:

```
a: 'Accu-Chek Aviva/SmartView, FreeStyle Lite, OneTouch Verio/Ultra, and True Metrix are all top-tier — real payouts are close enough between them that brand alone rarely decides your offer. Contour Next and the standard Accu-Chek Guide line are solid mid-tier performers. CGM sensors and pods (Omnipod, Dexcom, Libre) pay more per box than test strips but serve a narrower buyer market.',
```

Leave the other four `FAQS` entries untouched — none of them cite a dollar figure.

- [ ] **Step 4: Rewrite the intro paragraph** (the one starting "What you get for unused diabetic test strips depends on...") from:

```
What you get for unused diabetic test strips depends on the brand, the quantity, how much time
is left before expiration, and whether the box is sealed. The price ranges below reflect what
buyers in our network are currently paying for standard retail boxes in good condition. Bulk
lots of 10 or more boxes typically receive a higher per-box rate than individual boxes.
```

to:

```
What you get for unused diabetic test strips depends on the brand, the quantity, how much time
is left before expiration, and whether the box is sealed. The tiers below reflect how brands
rank against each other based on what buyers in our network are currently paying for standard
retail boxes in good condition — call for your exact quote. Bulk lots of 10 or more boxes
typically receive a higher per-box rate than individual boxes.
```

- [ ] **Step 5: Update the test-strips table.** Change the `<th>` reading `Price` to `Payout Tier`. Change the body from `{TEST_STRIP_PRICES.map((row) => (...))}` — replace the whole `<tbody>` block:

```tsx
<tbody>
  {TEST_STRIP_TIERS.map((row) => (
    <tr key={row.brand} className="border border-gray-100">
      <td className="px-4 py-2 text-gray-600">{row.brand}</td>
      <td className="px-4 py-2"><TierBadge tier={row.tier} /></td>
      <td className="px-4 py-2 text-gray-500 text-xs">{row.note}</td>
    </tr>
  ))}
</tbody>
```

- [ ] **Step 6: Update the CGM table the same way** — same `<th>` change (`Price` → `Payout Tier`), same `<tbody>` pattern but with `CGM_TIERS`:

```tsx
<tbody>
  {CGM_TIERS.map((row) => (
    <tr key={row.brand} className="border border-gray-100">
      <td className="px-4 py-2 text-gray-600">{row.brand}</td>
      <td className="px-4 py-2"><TierBadge tier={row.tier} /></td>
      <td className="px-4 py-2 text-gray-500 text-xs">{row.note}</td>
    </tr>
  ))}
</tbody>
```

- [ ] **Step 7: Rewrite the closing paragraph** (the one starting "The ranges above are what buyers...") from:

```
The ranges above are what buyers in our network pay for standard-condition, single-box
transactions. Your actual offer may be higher or lower depending on lot size, expiration
dates, and demand. Call{' '}
<a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> — we&apos;ll
give you a number on the spot.
```

to:

```
The tiers above reflect how buyers in our network currently value each brand relative to the
others. Your actual offer depends on lot size, expiration dates, and demand. Call{' '}
<a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> — we&apos;ll
give you a number on the spot.
```

- [ ] **Step 8: Dev verification** — `npm run dev`, visit `/how-much-are-diabetic-test-strips-worth`: both tables render 7 and 4 rows respectively with colored tier badges instead of price text; `curl -s http://localhost:3000/how-much-are-diabetic-test-strips-worth | grep -c '\$[0-9]'` → `0`.
- [ ] **Step 9: `npm test` + `npm run build`** green.
- [ ] **Step 10: Commit** — `git add app/how-much-are-diabetic-test-strips-worth/page.tsx && git commit -m "feat: Price Guide page shows payout tiers instead of dollar figures"`

---

### Task 3: Blog post template — same tier treatment, all 50 posts

**Files:**
- Modify: `app/blog/[slug]/page.tsx:349-386` (the "How Much Can I Get for My Test Strips?" section only — everything else in the file is untouched)

**Interfaces:**
- Consumes: `TEST_STRIP_TIERS`, `CGM_TIERS`, `Tier` from `@/lib/tier-pricing` (Task 1); `TierBadge` from `@/app/components/ui` (Task 1).

- [ ] **Step 1: Add imports** at the top of the file, alongside the existing `import { JsonLd } from "@/app/components/JsonLd";`:

```ts
import { TEST_STRIP_TIERS, CGM_TIERS } from "@/lib/tier-pricing";
import { TierBadge } from "@/app/components/ui";
```

- [ ] **Step 2: Replace the price table section** (lines 349–386, the whole `<section>` starting `<h2 className="text-xl font-bold text-gray-900 mb-3">How Much Can I Get for My Test Strips?</h2>` through its closing `</section>`) with:

```tsx
<section>
  <h2 className="text-xl font-bold text-gray-900 mb-3">How Much Can I Get for My Test Strips?</h2>
  <p>
    Payout depends on brand, quantity, and expiration date. Here&apos;s how brands compare:
  </p>
  <div className="mt-4 overflow-x-auto">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-gray-50">
          <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Item</th>
          <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Payout Tier</th>
        </tr>
      </thead>
      <tbody>
        {[...TEST_STRIP_TIERS, ...CGM_TIERS].map((row) => (
          <tr key={row.brand} className="border border-gray-100">
            <td className="px-4 py-2 text-gray-600">{row.brand}</td>
            <td className="px-4 py-2"><TierBadge tier={row.tier} /></td>
          </tr>
        ))}
        <tr className="border border-gray-100">
          <td className="px-4 py-2 text-gray-600">Other brands / items</td>
          <td className="px-4 py-2 text-gray-500 text-xs">Call for a quote</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p className="mt-3 text-sm text-gray-400">
    Bulk lots of 10+ boxes typically receive a higher per-box rate. Call{" "}
    <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a>{" "}
    for an exact quote.
  </p>
</section>
```

- [ ] **Step 3: Dev verification** — visit any state post, e.g. `/blog/sell-diabetic-test-strips-alabama`: table shows 11 rows (7 test strip + 4 CGM) with tier badges plus the "Other brands" row, no price text; spot-check a second post to confirm the template applies everywhere: `curl -s http://localhost:3000/blog/sell-diabetic-test-strips-alaska | grep -c '\$[0-9]'` → `0`.
- [ ] **Step 4: `npm test` + `npm run build`** green (build regenerates all 50 static blog pages — confirm the page count in the build output is unchanged).
- [ ] **Step 5: Commit** — `git add "app/blog/[slug]/page.tsx" && git commit -m "feat: blog post price table shows payout tiers, matches Price Guide page"`

---

### Task 4: Homepage hero copy

**Files:**
- Modify: `app/page.tsx:89-93`

**Interfaces:**
- None — pure copy change, no new imports or exports.

- [ ] **Step 1: Edit the hero paragraph.** Current (lines 88–94):

```tsx
<p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8">
  Local buyers pay{" "}
  <Link href="/how-much-are-diabetic-test-strips-worth" className="font-extrabold text-white underline decoration-electric decoration-2 underline-offset-4 hover:text-electric transition-colors">
    up to $100 a box
  </Link>{" "}
  for sealed, unexpired supplies. Cash in hand, same day.
</p>
```

Change to (link's `href`/`className` untouched, only the two text pieces in bold below):

```tsx
<p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8">
  Local buyers pay{" "}
  <Link href="/how-much-are-diabetic-test-strips-worth" className="font-extrabold text-white underline decoration-electric decoration-2 underline-offset-4 hover:text-electric transition-colors">
    up to $100+ a box
  </Link>{" "}
  for qualifying, sealed, unexpired supplies. Cash in hand, same day.
</p>
```

- [ ] **Step 2: Dev verification** — visit `/`, hero reads "Local buyers pay **up to $100+ a box** for qualifying, sealed, unexpired supplies. Cash in hand, same day." with the link still pointing at the Price Guide page.
- [ ] **Step 3: `npm test` + `npm run build`** green.
- [ ] **Step 4: Commit** — `git add app/page.tsx && git commit -m "fix: homepage hero — \$100+ / qualifying products wording"`

---

### Task 5: Full verification pass

**Files:**
- No new files (fixes only, if this audit finds anything).

- [ ] **Step 1: Full suite** — `npm test`. Expected: every existing test plus the new `tier-pricing.test.ts` (4 tests) passes.
- [ ] **Step 2: Dollar-sign leak grep across all three changed surfaces**, dev server running:

```bash
for p in "/" "/how-much-are-diabetic-test-strips-worth" "/blog/sell-diabetic-test-strips-alabama" "/blog/sell-diabetic-test-strips-wyoming"; do
  echo "== $p =="
  curl -s "http://localhost:3000$p" | grep -oE '\$[0-9]+' || echo "(none)"
done
```

Expected: `(none)` on the Price Guide page and both blog posts. The homepage is expected to show exactly one match — `$100` (from the hero's `$100+` link) — confirm it's that one and nothing else.

- [ ] **Step 3: Mobile pass at true 390px** — `resize_window` is clamped by macOS window minimums and silently tests the wrong breakpoint (see this repo's own session notes). Use the same-origin iframe technique instead: inject a fixed-position `390x844` iframe pointing at the route under test via `javascript_tool`, then check `contentDocument.documentElement.scrollWidth <= contentWindow.innerWidth` for the Price Guide page and one blog post. Expected: no overflow, tier badges wrap/fit cleanly in the table's `overflow-x-auto` container.
- [ ] **Step 4: `npm run build`** clean, same page count as before this plan (86 pages, per the last full build in this repo).
- [ ] **Step 5: Commit any fixes found** — `git add -A && git commit -m "fix: tier-pricing audit pass"` (skip if nothing changed).
