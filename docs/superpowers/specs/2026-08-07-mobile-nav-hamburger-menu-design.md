# Mobile Nav Hamburger Menu Design Spec — Cash4TestStripsUSA

**Date:** 2026-08-07
**Status:** Approved

## Overview

The site header (`app/layout.tsx`) currently renders one un-responsive row of 3 nav links (Find a Buyer, Blog, How It Works) plus the "Get Cash Now" CTA button, with no mobile handling — it gets cramped on narrow screens. Add a hamburger menu below the `md` (768px) breakpoint.

## Design

- Extract the interactive nav into a new client component, `app/SiteNav.tsx` — `layout.tsx` must stay a Server Component for its `metadata` export, so the toggle state needs to live in a separate `"use client"` component that `layout.tsx` renders inside `<header>`.
- **≥ md:** unchanged from today — logo, full link row, CTA button, no hamburger, no dropdown.
- **< md:** the 3 links hide; the header shows logo, the always-visible "Get Cash Now" CTA, and a hamburger icon button. Tapping the hamburger expands a dropdown panel directly below the header with the 3 links stacked vertically. Tapping any link, or tapping the hamburger again, closes the panel.
- Icon: plain inline SVG (hamburger ↔ X on toggle) — no new icon-library dependency, matching the rest of the app's zero-extra-dependency approach.
- No changes to the footer or any other page.

## Testing

Manual browser verification: resize below/above 768px, confirm the link row and hamburger swap correctly at the breakpoint; open the mobile panel, click a link, confirm it navigates and the panel closes; confirm the CTA button remains visible and clickable at all widths.

## Out of Scope

- Any change to the footer links
- Any change to desktop (≥ md) behavior
- Any new icon library dependency
