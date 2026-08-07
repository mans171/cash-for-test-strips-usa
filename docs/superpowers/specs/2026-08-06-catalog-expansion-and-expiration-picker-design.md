# Catalog Expansion & Expiration Picker Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-06
**Status:** Approved

---

## Overview

Two related follow-ups to the visual brand picker shipped earlier today:

1. **Catalog expansion** — the brand picker's product lines were too generic (e.g. a single "G7 Sensors" line, or a combined REF-code hint). Verified against twomomsbuyteststrips.com's full live catalog (`/sell-your-test-strips`, which lists every SKU they buy across Test Strips, Glucose Monitors/CGM, Insulin Supplies, and Lancets), every brand's `lines` array is expanded to per-SKU granularity, a new **Lancets** category is added, and two new brand tiles (FreeStyle test strips, Microlet) are introduced.
2. **Expiration picker** — replaces the free-text expiration input with a "months from now" dropdown, and applies a rolling 25th-of-month cutoff rule to warn the customer when their selection is effectively already expired.

Both changes are scoped to `lib/product-catalog.ts` and `app/sell/SellFlowClient.tsx`. No backend, API, or database changes — `OrderItem.brand` and `OrderItem.expiration` remain plain strings.

---

## Part 1: Catalog Expansion

### Source of truth

Verified live against `https://www.twomomsbuyteststrips.com/sell-your-test-strips` on 2026-08-06. Items twomoms marks "OVERSTOCK / CURRENTLY NOT ACCEPTED" are included in our catalog (without any such label) per explicit approval — our own buyer network may still want them even when twomoms doesn't. Brands that exist in our catalog but not on twomoms (True Metrix, Accu-Chek SmartView) are kept as-is — they come from Feldon's own verified accepted-products list, independent of twomoms.

### Full catalog

**Test Strips:**

| Brand tile | Image | Lines |
|---|---|---|
| Contour / Bayer *(renamed from "Contour Next")* | `contour-next.jpg` (existing) | Contour 50ct, Contour 100ct, Contour NEXT 50ct, Contour NEXT 100ct |
| Accu-Chek | `accu-chek.jpg` (existing) | Aviva Plus 50ct, Aviva Plus 100ct, Guide 50ct, Guide 100ct, SmartView |
| True Metrix | `true-metrix.jpg` (existing) | True Metrix *(unchanged)* |
| OneTouch | `onetouch.jpg` (existing) | Ultra 50ct, Ultra 100ct, VERIO 50ct, VERIO 100ct |
| FreeStyle *(new tile)* | `freestyle.jpg` (**new — generate**) | Lite 50ct, Lite 100ct, InsuLinx 50ct, InsuLinx 100ct |

**CGM:**

| Brand tile | Image | Lines |
|---|---|---|
| Dexcom | `dexcom.jpg` (existing) | *(unchanged from earlier fix)* G6 Receivers, G6 Sensors (STS-OE-001 / STS-OR-001), G6 Transmitters, G7 10 Day Sensors (STP-AT-011/-012/-018), G7 15 Day Sensors (STP-FT-010/-012), G7 Receivers |
| FreeStyle Libre | `freestyle-libre.jpg` (existing) | Libre 14 Day Sensor, Libre 2 Sensor, Libre 2 Plus Sensor, Libre 2 Reader, Libre 3 Sensor, Libre 3 Plus Sensor, Libre 3 Reader |
| Omnipod | `omnipod.jpg` (existing) | 5 (Purple) G6/G7, 5 (Purple) G6/L2, 5 (Purple) L2/L3, 5 Starter Kit (w/ PDM), DASH (5 Pack Pods) |
| Medtronic Guardian *(new tile)* | `medtronic.jpg` (reused — same manufacturer family) | Guardian Sensor 3, Guardian Sensor 4 |

**Infusion Sets:**

| Brand tile | Image | Lines |
|---|---|---|
| Medtronic / MiniMed | `medtronic.jpg` (existing) | AutoSoft 90, AutoSoft XC, Extended Infusion Set (10x), Mio Advance, Mio Infusion Set, Quick-Set, Reservoir |
| Tandem | `tandem.jpg` (existing) | AutoSoft 90 Infusion Set, AutoSoft XC Infusion Set, TruSteel Infusion Set *(replaces the old "t:slim X2" line — twomoms doesn't list the pump itself as a purchasable SKU, only its infusion sets)* |

**Lancets** *(new category)*:

| Brand tile | Image | Lines |
|---|---|---|
| Accu-Chek | `accu-chek.jpg` (reused) | Fastclix, Softclix |
| OneTouch | `onetouch.jpg` (reused) | Delica Plus, Ultrasoft 2 |
| FreeStyle | `freestyle.jpg` (reused, same new image as the Test Strips tile) | Lancets |
| Microlet *(new tile)* | `microlet.jpg` (**new — generate**) | Lancets |

### Data model change

`ProductBrand.category` gains a fourth value:

```typescript
export type ProductBrand = {
  key: string
  label: string
  category: 'Test Strips' | 'CGM' | 'Infusion Sets' | 'Lancets'
  image: string
  lines: string[]
}
```

The same `key` can appear more than once across categories (e.g. `medtronic` in both CGM and Infusion Sets, `accu-chek` in both Test Strips and Lancets) — each row is a distinct tile scoped to its own category, matching the existing pattern where a brand's identity is really "brand + category," not just brand.

This means `key` alone is no longer sufficient to identify a selected tile: `SellFlowClient.tsx` currently tracks `selectedBrandKeys: (string | null)[]`, comparing `selectedBrandKeys[i] === brand.key`. With repeated keys, selecting the Lancets "Accu-Chek" tile would also visually highlight the Test Strips "Accu-Chek" tile in the same item row, since both share `key: 'accu-chek'`. **Fix:** identify a selected tile by `category + key` together, not `key` alone. Change `selectBrand` to take the full `ProductBrand` object (not just its key string) and store a composite identifier:

```typescript
function brandIdentity(brand: ProductBrand) {
  return `${brand.category}:${brand.key}`
}
```

`selectedBrandKeys` becomes `selectedBrandIdentities: (string | null)[]`, populated via `brandIdentity(brand)` in `selectBrand`, and compared the same way in the tile's `className` and in both `PRODUCT_BRANDS.find(...)` lookups that currently match on `b.key === selectedBrandKeys[i]` — those become `brandIdentity(b) === selectedBrandIdentities[i]`.

### New images

Two new product photos, generated via the same Nano Banana/Arcads pipeline used for the first four (`accu-chek.jpg`, `onetouch.jpg`, `medtronic.jpg`, `tandem.jpg`):
- `freestyle.jpg` — FreeStyle Lite test strip box, clean white background, matching the existing images' style
- `microlet.jpg` — Microlet lancets box, clean white background, matching style

---

## Part 2: Expiration Picker

### Current behavior

A free-text input (`placeholder="Expiration (e.g. 2027-01)"`) that the customer must manually type into.

### New behavior

Replaced with a `<select>` labeled "Months until expiration" with options for 0 through 24 months plus a "24+ months" catch-all (26 options total):

```
Already expired / less than 1 month
1 month
2 months
...
24 months
24+ months
```

### Rolling 25th-cutoff rule

Confirmed with Feldon: the cutoff rolls on the 25th of each month, not the 1st. If today's day-of-month is past the 25th, the current month no longer counts as a "full month" — the counting cycle has already rolled into next month. Concretely: today = Aug 27, box says "expires 09/2027" (next calendar month) → naively that reads as "1 month remaining," but since Aug 27 is past the Aug 25 cutoff, the effective months-remaining is `1 - 1 = 0`, which counts as expired.

**Computation:**
```typescript
const cutoffAdjust = new Date().getDate() > 25 ? 1 : 0
const effectiveMonthsRemaining = selectedMonths - cutoffAdjust
const isEffectivelyExpired = effectiveMonthsRemaining <= 0
```

Where `selectedMonths` is the numeric value behind the customer's dropdown choice (0 for "Already expired / less than 1 month" through 24, with "24+ months" mapped to 25 for this calculation — good enough since anything ≥24 months is nowhere near the expiry boundary).

**Warning display:** if `isEffectivelyExpired`, show an inline notice under the dropdown: "This may already be considered expired by most buyers — you can still submit, but let the buyer know when you message them." Per Feldon's explicit choice, this is a warning only — it does not block submission.

**Stored value:** `OrderItem.expiration` remains a plain `"YYYY-MM"` string for backend/message-building compatibility. It's computed from today's actual date plus `selectedMonths` calendar months (not the cutoff-adjusted figure — the stored month reflects what's genuinely printed on the box, the cutoff logic only drives the on-screen warning):

```typescript
function monthsFromNowToYYYYMM(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
```

---

## Testing

- Unit tests for `lib/product-catalog.ts`: existing "every brand has non-empty lines/image" test still passes with the expanded data (15 brand-tile rows total now — 9 old + FreeStyle Test Strips + Medtronic Guardian + 4 Lancets tiles + note some `key`s repeat across categories, so the "unique keys" test must change to "unique key+category pairs").
- Unit tests for the new expiration-math helper (`monthsFromNowToYYYYMM` and the cutoff-adjust warning logic) — pure functions, easy to test without mocking dates by injecting a reference date rather than reading `new Date()` directly inside the testable function.
- Manual browser verification: walk the new Lancets category end to end, confirm a Contour NEXT 50ct selection lands correctly in a `leads` row, confirm the expiration dropdown produces the correct warning at the boundary (test on a day > 25 and a day ≤ 25, or by injecting a fixed date into the helper's test).

---

## Out of Scope

- Per-SKU photos (still brand-level only, consistent with the original picker design)
- Prices anywhere (this app never shows prices)
- Blocking submission on an expired selection (warning only, per explicit decision)
- Any change to `/buyer` or `/admin`
