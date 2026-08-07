# Per-Line Product Photos Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-07
**Status:** Approved

## Overview

The line card grid (built in the card-grid picker work) currently reuses each brand's single photo for every one of that brand's lines — e.g. every FreeStyle Libre line (14 Day Sensor, 2 Sensor, 2 Reader, 3 Sensor, 3 Plus Sensor, 3 Reader) shows the same Libre 3+ box photo, even though a Reader (a handheld device) and a Sensor (a small adhesive patch) are visually nothing alike. Confirmed with Feldon: fix this for the whole catalog, matching twomoms' per-SKU photo approach — not just the lines that are most visually different.

## Scope

12 of the 15 catalog brand rows have more than one line and need a distinct real photo per line (51 lines total):

| Brand | Lines needing photos |
|---|---|
| Contour / Bayer | 4 |
| Accu-Chek (Test Strips) | 5 |
| OneTouch (Test Strips) | 4 |
| FreeStyle (Test Strips) | 4 |
| Dexcom | 6 |
| FreeStyle Libre | 7 |
| Omnipod | 5 |
| Medtronic Guardian | 2 |
| Medtronic / MiniMed (Infusion Sets) | 7 |
| Tandem | 3 |
| Accu-Chek (Lancets) | 2 |
| OneTouch (Lancets) | 2 |

The 3 single-line brands (True Metrix, FreeStyle/Lancets, Microlet) already have exactly one photo per their one line — no change needed there.

## Sourcing

Same method used for the brand-level photos: search official manufacturer sites first, retailer product photography where no official shot exists, verify each URL is a real accessible image, visually confirm it shows the correct specific product before using it (not a generic/wrong variant, no garbled text, no watermarks where avoidable).

## Data Model Change

`ProductLine` gains an `image` field:

```typescript
export type ProductLine = {
  label: string
  code?: string
  image: string
}
```

`ProductBrand.image` stays as-is — it's still used for the top-level brand tile (the first click, before a specific line is chosen). Only the second-level line card grid switches from `brand.image` to `productLine.image`.

## UI Change

In `SellFlowClient.tsx`'s line card grid, each card's `<Image>` uses `productLine.image` instead of `brand.image`.

## Testing

- Unit test: every line across all 15 brands has a non-empty `image` path, and the referenced file exists in `public/products/`.
- Manual browser verification: spot-check a few brands where lines are visually distinct (Dexcom, FreeStyle Libre, Omnipod, Medtronic/MiniMed infusion sets) and confirm each line card shows its own distinct photo, not a repeated brand-level one.

## Out of Scope

- Any change to the brand tile grid (still one image per brand)
- Any change to pricing, expiration, or backend/API/database
