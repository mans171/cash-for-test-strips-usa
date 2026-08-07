# Sell Picker Cart & Active-Item Focus Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-07
**Status:** Approved

## Overview

Two related fixes to `/sell`'s multi-item order builder:

1. **Remove item** — no way to delete an item from the order today.
2. **Active-item focus** — with multiple items, every item's full picker (brand grid + line grid) renders simultaneously, which is overwhelming and doesn't match the nycphonebuyer.com reference's one-step-at-a-time wizard feel. Confirmed approach: only the item currently being picked shows its full-size picker; already-completed items collapse into a compact cart-row list.
3. **Back arrow** — nycphonebuyer.com shows a "← Back" link when drilled into a sub-step (e.g. product list within a brand). Add the same for the brand → line-picker drill-down.

## Design

### Active item tracking

New state: `activeIndex: number | null`, the index of the item currently showing its full picker. Starts at `0` (the initial empty item is active by default).

### Rendering per item

- **Item `i === activeIndex`** (the active item): render exactly as today — brand grid (or "Selected: X" + Change once a product is picked) + count/expiration/condition fields once a product is picked.
- **Item `i !== activeIndex`** (any other item — these always have a completed `brand`, since an item only stops being active once "+ Add another item" is clicked, which requires a completed brand first): render as a compact cart row: `{item.brand} × {item.count} box(es) (exp: {item.expiration})` with a "Remove" button. No grids, no full card.

### "+ Add another item"

Only enabled once the active item has a non-empty `brand`. On click: push a new empty item, set `activeIndex` to its index. The previously-active item (now has a completed brand) automatically renders as a compact row on the next render, since it's no longer `activeIndex`.

### Remove item

A "Remove" button appears on every compact (non-active) row, and also next to "Change" on the active item's settled summary (only when there's more than one item total — never let removal drop below 1 item). Removing an item:
- Splices it out of `items` (and the parallel `selectedBrandIdentities`/`selectedLines`/`selectedMonths` arrays).
- If the removed item's index was before `activeIndex`, decrement `activeIndex` by 1 so it still points at the same logical item.
- If the removed item WAS the active item, set `activeIndex` to the item that's now at the same index (or the last item's index if it was the last one) — i.e. focus moves to a sensible neighboring item, still in the compact-row state if it has a brand, or shows its picker if it doesn't (this only happens if you remove the active item while it still has an empty brand, which can only occur if there's another item to fall back to — the single-item case is blocked by the "at least 1 item" rule above, but a not-yet-completed active item can be removed if a completed item exists elsewhere; falling back is fine since that completed item just renders as a compact row, matching the state it was already in).

### Back arrow

When the active item has a brand selected but is showing the line card grid (multi-line brand, no line picked yet), add a "← Back" link above "Which specific product?" that clears the brand selection and returns to the brand tile grid — same underlying action as `selectBrand`'s reset path, just without picking a new brand first.

## Testing

Manual browser verification: add 3 items across different brands, confirm only the currently-active one shows its full picker while the other two show compact rows; confirm "+ Add another item" is disabled until the active item has a product picked; remove a compact row and confirm the list updates correctly and no item drops the array out of sync; remove down to 1 item and confirm the Remove control disappears/is disabled on the last one; click "← Back" mid-line-picking and confirm it returns to the brand grid without needing to complete a selection first.

## Out of Scope

- Editing/re-opening an already-completed compact row's fields inline (use the existing pattern: there is no "resume editing a compact row" in this pass — if you need to change a completed item, remove it and re-add)
- Any change to `/buyer`, `/admin`, expiration logic, or per-line photos
- Any backend/API/database change
