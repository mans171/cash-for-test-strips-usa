# Visual Brand Picker for /sell Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-06
**Status:** Approved

---

## Overview

Replaces `/sell`'s free-text "Brand" input with a visual brand picker, inspired by twomomsbuyteststrips.com's product-selection UX (browsed live for reference — no content copied). Scoped to **brand-level** photos, not per-SKU photos like the reference site: ~9 brand tiles with real box photography, each expanding to a simple dropdown of that brand's specific accepted product lines. No prices are shown anywhere, consistent with the rest of this app's design.

---

## Brand & Product Line Data

Sourced from the verified Albany TSB accepted-products catalog (memory: `project-albany-tsb-product-catalog`), organized by category exactly as that list already separates them (avoids the Dexcom-doesn't-make-test-strips / FreeStyle-Lite-vs-Libre mix-ups flagged in that memory).

| Brand tile | Category | Product lines (dropdown options) | Image source |
|---|---|---|---|
| Contour Next | Test Strips | Contour Next | Existing: `Contour Next 100.jpg` |
| Accu-Chek | Test Strips | Guide, Aviva, SmartView | **New — generate** |
| True Metrix | Test Strips | True Metrix | Existing: `True Metrix.jpg` |
| OneTouch | Test Strips | Verio, Ultra, Other OneTouch | **New — generate** |
| Dexcom | CGM | G6 Receivers, G6 Sensors (STS-OE-001 / STS-OR-001), G6 Transmitters, G7 10 Day Sensors (STP-AT-011/-012/-018), G7 15 Day Sensors (STP-FT-010/-012), G7 Receivers — verified against twomomsbuyteststrips.com's live Dexcom SKU listing | Existing: `dexcom-g7.jpg` |
| FreeStyle Libre | CGM | Libre 1, Libre 2, Libre 3 | Existing: `Libre 3+.jpg` |
| Omnipod | CGM/Pump | 5 Pods (5-box), DASH Pods (5-box), Classic Pods (10-box) | Existing: `omnipod-5-box-clean.jpg` |
| Medtronic / MiniMed | Infusion Sets | AutoSoft 90, AutoSoft XC, Quick-set, Guardian Sensor (non-B), MiniMed Pumps & Sets | **New — generate** |
| Tandem | Infusion Sets | t:slim X2 | **New — generate** |

`FreeStyle Lite` (test strip) is intentionally NOT bundled into the `FreeStyle Libre` tile — different product category, per the memory's explicit warning. It has no existing reference photo and isn't in scope for this pass (can be added as a 10th tile later if Feldon wants it split out).

---

## Image Sourcing

- **5 existing images** copied from `~/Ai Meta Ads/references/products/` (an internal asset library already used for ad creative — legitimate product photography Feldon has rights to reuse, not scraped from any competitor): `Contour Next 100.jpg`, `True Metrix.jpg`, `dexcom-g7.jpg`, `Libre 3+.jpg`, `omnipod-5-box-clean.jpg`.
- **4 new images** (Accu-Chek, OneTouch, Medtronic/MiniMed, Tandem) generated via the same AI pipeline as the existing asset library (Gemini/Nano Banana), matching the existing images' style: clean product box, white background, no hands/scene. Generated once, saved into the same asset library folder for reuse in future ad creative too, then copied into the app.
- All images placed in `public/products/` in the Next.js app, referenced by a static filename per brand — no database table needed for images themselves (this is presentation data, not something that changes via the buyer-submission flow).

---

## Data Model

No database changes. Brand/product-line data is static application data (it changes only when Feldon decides to add/remove an accepted brand — a code change, not a runtime one), living in a new `lib/product-catalog.ts`:

```typescript
export type ProductBrand = {
  key: string
  label: string
  category: 'Test Strips' | 'CGM' | 'Infusion Sets'
  image: string // path under /products/
  lines: string[] // dropdown options
}

export const PRODUCT_BRANDS: ProductBrand[] = [ /* the 9 rows from the table above */ ]
```

---

## UI Changes to `/sell`

Current flow: state picker → item rows with a free-text "Brand" input → find buyers → results.

New flow for each item row:
1. **Brand tile grid** (image + label, grouped by category headers) replaces the free-text brand field. Clicking a tile selects it (visual highlight) and reveals:
2. **Product line dropdown** — populated from the selected brand's `lines` array.
3. Existing fields unchanged: box count, expiration, condition (sealed/unsealed).

The `OrderItem` type's `brand: string` field is populated from `${brand.label} — ${selectedLine}` (e.g. `"Accu-Chek — Guide"`) when the order is submitted — no backend/API changes needed, `buildQuoteMessage` and the `leads`/`submissions` tables already just store `brand` as a free-text string. This is purely a `/sell` UI change plus a new static data file.

"Add another item" still works the same way — each item row gets its own independent brand-tile + dropdown state.

---

## Testing

- Unit test for `lib/product-catalog.ts`: confirms all 9 brands have a non-empty `lines` array and a defined `image` path.
- Manual browser verification: walk the new picker for at least one brand per category (Contour Next, Dexcom, Medtronic), confirm the submitted order's `brand` field lands correctly in a `leads` row via SQL check.

---

## Out of Scope

- Per-SKU photos (rejected in favor of brand-level, per discussion)
- Prices anywhere in the picker (this app never shows prices)
- FreeStyle Lite as its own tile (no reference image yet, can follow up)
- Any change to the `/buyer` portal or `/admin` dashboard
