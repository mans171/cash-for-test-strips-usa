# Sell Picker Card Grid & Single-Line Auto-Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/sell`'s line-selection `<select>` dropdown with a clickable card grid (image + label + ref code where present), and make single-line brands (True Metrix, Lancets/FreeStyle, Lancets/Microlet) auto-select on brand-tile click instead of requiring an extra step.

**Architecture:** `lib/product-catalog.ts`'s `lines: string[]` becomes `lines: ProductLine[]` (`{ label: string; code?: string }`), splitting Dexcom's hand-embedded REF codes into structured data. `SellFlowClient.tsx`'s `selectBrand` auto-completes the selection when a brand has exactly 1 line; its line-dropdown is replaced with a card grid matching the brand-tile grid's visual style.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest. No new dependencies.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-07-sell-picker-card-grid-design.md`
- `OrderItem.brand` remains a plain string — no backend/API/database changes
- No new ref codes beyond Dexcom's already-verified ones — don't fabricate codes for other brands
- Card grid reuses each brand's single existing image — no new photo sourcing

---

## Task 1: ProductLine data model + Dexcom code split

**Files:**
- Modify: `lib/product-catalog.ts`
- Modify: `lib/__tests__/product-catalog.test.ts`

**Interfaces:**
- Produces: `ProductLine` type (`{ label: string; code?: string }`), `ProductBrand.lines: ProductLine[]`

- [ ] **Step 1: Update the catalog test for the new line shape**

Replace the full contents of `lib/__tests__/product-catalog.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { PRODUCT_BRANDS } from '@/lib/product-catalog'

describe('PRODUCT_BRANDS', () => {
  it('has 15 brands, each with a non-empty label, image, and at least one product line', () => {
    expect(PRODUCT_BRANDS).toHaveLength(15)
    for (const brand of PRODUCT_BRANDS) {
      expect(brand.key.length).toBeGreaterThan(0)
      expect(brand.label.length).toBeGreaterThan(0)
      expect(brand.image.length).toBeGreaterThan(0)
      expect(brand.lines.length).toBeGreaterThan(0)
      expect(['Test Strips', 'CGM', 'Infusion Sets', 'Lancets']).toContain(brand.category)
      for (const line of brand.lines) {
        expect(line.label.length).toBeGreaterThan(0)
        if (line.code !== undefined) {
          expect(line.code.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('has unique key+category pairs', () => {
    const identities = PRODUCT_BRANDS.map((b) => `${b.category}:${b.key}`)
    expect(new Set(identities).size).toBe(identities.length)
  })

  it('Dexcom has exactly 3 verified REF-coded lines out of 6 total', () => {
    const dexcom = PRODUCT_BRANDS.find((b) => b.key === 'dexcom' && b.category === 'CGM')!
    expect(dexcom.lines).toHaveLength(6)
    const coded = dexcom.lines.filter((l) => l.code)
    expect(coded.map((l) => l.label)).toEqual(['G6 Sensors', 'G7 10 Day Sensors', 'G7 15 Day Sensors'])
    expect(coded.map((l) => l.code)).toEqual([
      'STS-OE-001 / STS-OR-001',
      'STP-AT-011 / -012 / -018',
      'STP-FT-010 / -012',
    ])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- product-catalog.test.ts`
Expected: FAIL (current `lines` are plain strings, no `.label`/`.code` shape)

- [ ] **Step 3: Replace the full contents of lib/product-catalog.ts**

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

const line = (label: string, code?: string): ProductLine => (code ? { label, code } : { label })

export const PRODUCT_BRANDS: ProductBrand[] = [
  // Test Strips
  {
    key: 'contour',
    label: 'Contour / Bayer',
    category: 'Test Strips',
    image: '/products/contour-next.jpg',
    lines: [line('Contour 50ct'), line('Contour 100ct'), line('Contour NEXT 50ct'), line('Contour NEXT 100ct')],
  },
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Test Strips',
    image: '/products/accu-chek.jpg',
    lines: [line('Aviva Plus 50ct'), line('Aviva Plus 100ct'), line('Guide 50ct'), line('Guide 100ct'), line('SmartView')],
  },
  {
    key: 'true-metrix',
    label: 'True Metrix',
    category: 'Test Strips',
    image: '/products/true-metrix.jpg',
    lines: [line('True Metrix')],
  },
  {
    key: 'onetouch',
    label: 'OneTouch',
    category: 'Test Strips',
    image: '/products/onetouch.jpg',
    lines: [line('Ultra 50ct'), line('Ultra 100ct'), line('VERIO 50ct'), line('VERIO 100ct')],
  },
  {
    key: 'freestyle',
    label: 'FreeStyle',
    category: 'Test Strips',
    image: '/products/freestyle.jpg',
    lines: [line('Lite 50ct'), line('Lite 100ct'), line('InsuLinx 50ct'), line('InsuLinx 100ct')],
  },
  // CGM
  {
    key: 'dexcom',
    label: 'Dexcom',
    category: 'CGM',
    image: '/products/dexcom.jpg',
    lines: [
      line('G6 Receivers'),
      line('G6 Sensors', 'STS-OE-001 / STS-OR-001'),
      line('G6 Transmitters'),
      line('G7 10 Day Sensors', 'STP-AT-011 / -012 / -018'),
      line('G7 15 Day Sensors', 'STP-FT-010 / -012'),
      line('G7 Receivers'),
    ],
  },
  {
    key: 'freestyle-libre',
    label: 'FreeStyle Libre',
    category: 'CGM',
    image: '/products/freestyle-libre.jpg',
    lines: [
      line('Libre 14 Day Sensor'),
      line('Libre 2 Sensor'),
      line('Libre 2 Plus Sensor'),
      line('Libre 2 Reader'),
      line('Libre 3 Sensor'),
      line('Libre 3 Plus Sensor'),
      line('Libre 3 Reader'),
    ],
  },
  {
    key: 'omnipod',
    label: 'Omnipod',
    category: 'CGM',
    image: '/products/omnipod.jpg',
    lines: [
      line('5 (Purple) G6/G7'),
      line('5 (Purple) G6/L2'),
      line('5 (Purple) L2/L3'),
      line('5 Starter Kit (w/ PDM)'),
      line('DASH (5 Pack Pods)'),
    ],
  },
  {
    key: 'medtronic-guardian',
    label: 'Medtronic Guardian',
    category: 'CGM',
    image: '/products/medtronic.jpg',
    lines: [line('Guardian Sensor 3'), line('Guardian Sensor 4')],
  },
  // Infusion Sets
  {
    key: 'medtronic',
    label: 'Medtronic / MiniMed',
    category: 'Infusion Sets',
    image: '/products/medtronic.jpg',
    lines: [
      line('AutoSoft 90'),
      line('AutoSoft XC'),
      line('Extended Infusion Set (10x)'),
      line('Mio Advance'),
      line('Mio Infusion Set'),
      line('Quick-Set'),
      line('Reservoir'),
    ],
  },
  {
    key: 'tandem',
    label: 'Tandem',
    category: 'Infusion Sets',
    image: '/products/tandem.jpg',
    lines: [line('AutoSoft 90 Infusion Set'), line('AutoSoft XC Infusion Set'), line('TruSteel Infusion Set')],
  },
  // Lancets
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Lancets',
    image: '/products/accu-chek.jpg',
    lines: [line('Fastclix'), line('Softclix')],
  },
  {
    key: 'onetouch',
    label: 'OneTouch',
    category: 'Lancets',
    image: '/products/onetouch.jpg',
    lines: [line('Delica Plus'), line('Ultrasoft 2')],
  },
  {
    key: 'freestyle',
    label: 'FreeStyle',
    category: 'Lancets',
    image: '/products/freestyle.jpg',
    lines: [line('Lancets')],
  },
  {
    key: 'microlet',
    label: 'Microlet',
    category: 'Lancets',
    image: '/products/microlet.jpg',
    lines: [line('Lancets')],
  },
]
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- product-catalog.test.ts`
Expected: all passed (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/product-catalog.ts lib/__tests__/product-catalog.test.ts
git commit -m "feat: split product line data into structured label+code shape"
```

---

## Task 2: Card grid + single-line auto-select in SellFlowClient

**Files:**
- Modify: `app/sell/SellFlowClient.tsx`

**Interfaces:**
- Consumes: `ProductLine`, expanded `ProductBrand.lines: ProductLine[]` from `lib/product-catalog.ts`

- [ ] **Step 1: Update selectBrand to auto-select single-line brands**

Replace the existing `selectBrand` and `selectLine` functions:

```typescript
  function composeBrandString(brand: (typeof PRODUCT_BRANDS)[number], line: (typeof PRODUCT_BRANDS)[number]["lines"][number]) {
    return line.code ? `${brand.label} — ${line.label} (${line.code})` : `${brand.label} — ${line.label}`;
  }

  function selectBrand(index: number, brand: (typeof PRODUCT_BRANDS)[number]) {
    setSelectedBrandIdentities((prev) => prev.map((id, i) => (i === index ? brandIdentity(brand) : id)));
    if (brand.lines.length === 1) {
      const onlyLine = brand.lines[0];
      setSelectedLines((prev) => prev.map((l, i) => (i === index ? onlyLine.label : l)));
      updateItem(index, { brand: composeBrandString(brand, onlyLine) });
    } else {
      setSelectedLines((prev) => prev.map((l, i) => (i === index ? "" : l)));
      updateItem(index, { brand: "" });
    }
  }

  function selectLine(index: number, brand: (typeof PRODUCT_BRANDS)[number], lineLabel: string) {
    const chosenLine = brand.lines.find((l) => l.label === lineLabel);
    setSelectedLines((prev) => prev.map((l, i) => (i === index ? lineLabel : l)));
    updateItem(index, { brand: chosenLine ? composeBrandString(brand, chosenLine) : "" });
  }
```

- [ ] **Step 2: Replace the line `<select>` with a card grid**

Find this block (the current dropdown, rendered right after the category tile loop):

```typescript
            {selectedBrandIdentities[i] && (
              <select
                value={selectedLines[i]}
                onChange={(e) => {
                  const brand = PRODUCT_BRANDS.find((b) => brandIdentity(b) === selectedBrandIdentities[i]);
                  if (brand) selectLine(i, brand, e.target.value);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1"
              >
                <option value="">Select the specific product</option>
                {PRODUCT_BRANDS.find((b) => brandIdentity(b) === selectedBrandIdentities[i])?.lines.map((line) => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
              </select>
            )}
```

Replace it with (only renders for brands with more than 1 line — single-line brands are already fully selected by `selectBrand`, so no grid is needed for them):

```typescript
            {selectedBrandIdentities[i] && (() => {
              const brand = PRODUCT_BRANDS.find((b) => brandIdentity(b) === selectedBrandIdentities[i]);
              if (!brand || brand.lines.length <= 1) return null;
              return (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Which specific product?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {brand.lines.map((productLine) => (
                      <button
                        type="button"
                        key={productLine.label}
                        onClick={() => selectLine(i, brand, productLine.label)}
                        className={`flex flex-col items-center gap-1 border rounded-lg p-2 text-center transition-colors ${
                          selectedLines[i] === productLine.label
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        <Image src={brand.image} alt={brand.label} width={40} height={40} className="object-contain h-10 w-10" />
                        <span className="text-[11px] leading-tight text-gray-700">{productLine.label}</span>
                        {productLine.code && (
                          <span className="text-[9px] leading-tight text-gray-400">{productLine.code}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
```

- [ ] **Step 3: Run the build to confirm no type errors**

Run: `npm run build`
Expected: builds cleanly, no type errors

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: all tests pass, no regressions

- [ ] **Step 5: Manual browser verification**

Run `npm run dev`, go to `/sell`:
1. Click "True Metrix" (Test Strips) — confirm it's immediately fully selected (no card grid appears), and the item's effective brand is set (check by filling in count/expiration and confirming no "fill in brand" validation error on submit)
2. Click "FreeStyle" under Lancets — confirm same immediate auto-select behavior (single line: "Lancets")
3. Click "Microlet" under Lancets — same auto-select check
4. Click "Dexcom" (CGM, 6 lines) — confirm a card grid appears (not a dropdown) with 6 cards, each showing the Dexcom image; confirm 3 of the 6 cards show a small REF-code subheader (G6 Sensors, G7 10 Day Sensors, G7 15 Day Sensors) and 3 don't (G6 Receivers, G6 Transmitters, G7 Receivers)
5. Click a Dexcom card (e.g. "G7 15 Day Sensors") — confirm it highlights, and clicking a different card moves the highlight and doesn't leave both highlighted
6. Fill in count/expiration, submit, confirm the flow proceeds to results as before
7. Check via the Supabase MCP tool that the resulting `leads` row's `items[].brand` field for the Dexcom item reads exactly `"Dexcom — G7 15 Day Sensors (STP-FT-010 / -012)"` (same format as before this change), and for the True Metrix item reads `"True Metrix — True Metrix"`; clean up (delete) the test lead row afterward

- [ ] **Step 6: Commit**

```bash
git add app/sell/SellFlowClient.tsx
git commit -m "feat: replace line dropdown with card grid, auto-select single-line brands"
```

---

## Task 3: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, pristine output

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: builds cleanly, no type errors, `/sell` still prerenders correctly

- [ ] **Step 3: Full manual walkthrough**

Repeat Task 2 Step 5's walkthrough once more end-to-end, additionally confirming a multi-line brand in a different category (e.g. Omnipod, 5 lines, no codes) renders its card grid correctly with no code subheaders shown (since Omnipod has no verified codes).

- [ ] **Step 4: Final commit check**

```bash
git status
```

Confirm nothing from this plan is left uncommitted.
