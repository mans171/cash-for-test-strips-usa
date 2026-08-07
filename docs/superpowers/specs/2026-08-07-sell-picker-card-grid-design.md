# Sell Picker Card Grid & Single-Line Auto-Select Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-07
**Status:** Approved

## Overview

Two related UX fixes to `/sell`'s product picker, informed by reviewing twomomsbuyteststrips.com's actual selection flow (`/sell-your-test-strips` → `/manufacturer/contour-bayer` → `/product/bayer-contour-50ct-retail-7080g`):

1. **Card grid instead of a dropdown.** Twomoms shows each specific line as its own clickable card (product image + name + ref code where applicable), not a plain `<select>`. Our line-picker currently is a bare dropdown with no visual identity per option. Replace it with a clickable card grid.
2. **Single-line brands auto-select.** Brands with only one possible line (True Metrix; FreeStyle and Microlet under Lancets) currently still force an extra "Select the specific product" click even though there's only one real option. Clicking the brand tile itself should complete the selection for these brands.

## Card Images

Twomoms uses a distinct photo per SKU. Sourcing ~50 individual SKU photos (one per line across all 15 catalog rows) is out of scope — confirmed with Feldon. Each line's card reuses that brand's single existing image (already in `public/products/`), not a new per-SKU photo.

## Ref Codes

Only add a `code` where we have a verified one from twomoms' live catalog — no fabricated codes. Currently that's just Dexcom's existing REF-code lines (already verified in an earlier pass) and nothing else; no other brand's lines map unambiguously to a single twomoms SKU with a known code (e.g. our "Contour 50ct" line doesn't distinguish twomoms' separate Mail Order (7097C) vs Retail (7080G) SKUs, so no code is attached to it — attaching either would be a guess).

## Data Model Change

`lines: string[]` becomes `lines: ProductLine[]`:

```typescript
export type ProductLine = {
  label: string
  code?: string
}

export type ProductBrand = {
  key: string
  label: string
  category: 'Test Strips' | 'CGM' | 'Infusion Sets' | 'Lancets'
  image: string
  lines: ProductLine[]
}
```

Every existing plain-string line becomes `{ label: '<same text>' }`. Dexcom's 6 lines — currently string literals with the REF code hand-embedded in parentheses, e.g. `'G6 Sensors (STS-OE-001 / STS-OR-001)'` — are split into `{ label: 'G6 Sensors', code: 'STS-OE-001 / STS-OR-001' }`, so the code renders as a distinct subheader instead of being baked into the label text.

## UI Changes to `/sell`

**Brand tile click (`selectBrand`):**
- If the clicked brand has exactly 1 line: immediately complete the selection (set the composed brand string on the item) — no card grid renders for this brand, matching how True Metrix, FreeStyle (Lancets), and Microlet behave today after this change.
- If the clicked brand has 2+ lines: highlight the tile and render the card grid below it, same as today's dropdown position. Nothing is selected yet.

**Line card grid** (replaces the `<select>`):
- One card per line, in a responsive grid (matching the brand-tile grid's visual style).
- Each card: the brand's image (small, consistent size across all cards in the grid — reused, not a new photo), the line's `label` as the primary text, and — only when `code` is present — the code as a smaller, muted-color subheader beneath the label.
- Clicking a card selects that line and highlights it (same selected-state styling as brand tiles); clicking a different card in the same grid switches the selection.

**Composed brand string** (stored in `item.brand`, unchanged contract — still a plain string, no backend changes): `${brand.label} — ${line.label}` when there's no code, or `${brand.label} — ${line.label} (${line.code})` when there is — preserving the exact format Dexcom's lines already produce today, just now built from structured data instead of a hand-embedded string.

## Testing

- Unit test for `lib/product-catalog.ts`: every line has a non-empty `label`; every `code` (where present) is a non-empty string; Dexcom's 4 coded lines match the exact codes already verified in the earlier catalog pass.
- Manual browser verification: click a single-line brand (e.g. True Metrix) and confirm the item is selected immediately with no card grid appearing; click a multi-line brand (e.g. Dexcom) and confirm the card grid appears with each card showing the brand image, line label, and — for the 4 coded lines — the REF code as a visible subheader; confirm submitting an order still produces the same composed brand string format as before in the `leads` row.

## Out of Scope

- Per-SKU photos (still brand-level images only, reused across all of a brand's line cards)
- Adding new ref codes beyond Dexcom's already-verified ones
- Any change to `/buyer`, `/admin`, or the expiration picker
- Any backend/API/database change
