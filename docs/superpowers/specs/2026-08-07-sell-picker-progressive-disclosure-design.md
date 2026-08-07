# Sell Picker Progressive Disclosure Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-07
**Status:** Approved

## Overview

`/sell`'s item card currently shows the brand grid, the line card grid (when applicable), and the count/expiration/condition fields all at once, regardless of whether a product has been selected yet — so picking a product card doesn't feel like it "completes" anything, it just fills in fields that were already visible elsewhere on the page.

Reference: nycphonebuyer.com's trade-in widget (`/#Choose`) — after answering each step, the question collapses into a settled one-line summary (e.g. "What condition...? **Mint**") and the next section reveals below it. Adapted here without the price-bar/price-trend chart (this app never shows prices) and without per-field step-by-step accordion granularity (count/expiration/condition are simple enough to reveal together, not one at a time).

## Design

**Before a product is selected** (item's `brand` is empty): show the category headers + brand tile grid (and the line card grid, if a multi-line brand is highlighted but no line chosen yet), same as today. Count/expiration/condition are hidden.

**Once a product is selected** (item's `brand` is non-empty — either via single-line auto-select or a line-card click): the brand tile grid and line card grid collapse into a single settled summary row: `Selected: {item.brand}` with a small "Change" link/button beside it. Clicking "Change" clears the item's brand (and the line-picker selection state) and re-expands the brand/line grids. Count, expiration, and condition fields render below the summary row, only in this state.

## Testing

Manual browser verification: confirm the grids are hidden and fields are hidden before any selection; select a single-line brand (e.g. True Metrix) and confirm it immediately collapses to the summary row with fields revealed; select a multi-line brand + line card (e.g. Dexcom → G7 15 Day Sensors) and confirm the same collapse behavior; click "Change" and confirm the grids re-expand and the fields hide again, with the previous selection cleared.

## Out of Scope

- Per-field step-by-step accordion (count asked, then expiration, then condition, one at a time) — these three fields still reveal together, not individually gated
- Any price display or price-trend chart
- Any change to `/buyer`, `/admin`, or the state selector
