# Catalog Expansion & Expiration Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the `/sell` brand picker's product catalog to per-SKU granularity (verified against twomomsbuyteststrips.com's live catalog), add a 4th "Lancets" category, and replace the free-text expiration input with a "months from now" dropdown that warns on a rolling 25th-of-month expiration cutoff.

**Architecture:** All catalog data lives in `lib/product-catalog.ts` (expanded, plus a new `category` value). A new `lib/expiration.ts` holds pure, independently-testable date-math helpers for the months-remaining dropdown and cutoff warning. `SellFlowClient.tsx` is updated to render the 4th category, use a composite `category:key` identity for tile selection (since brand keys now repeat across categories), and swap the free-text expiration input for the new dropdown + warning UI.

**Tech Stack:** Next.js 16 App Router (client component), TypeScript, Vitest. Nano Banana/Arcads image generation for 2 new product photos (already-established pipeline from the earlier picker work).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-06-catalog-expansion-and-expiration-picker-design.md`
- No prices shown anywhere (unchanged app-wide rule)
- `OrderItem.brand` and `OrderItem.expiration` remain plain strings — no backend/API/database changes in this plan
- Items twomoms marks "OVERSTOCK / CURRENTLY NOT ACCEPTED" are included without any such label
- Warning-only on expired selections — never block submission

---

## Task 1: Generate the 2 new product images

**Files:**
- Create: `public/products/freestyle.jpg`
- Create: `public/products/microlet.jpg`
- Create (asset library copies): `~/Ai Meta Ads/references/products/freestyle-lite-box.png`, `~/Ai Meta Ads/references/products/microlet-lancets-box.png`

- [ ] **Step 1: Set up the SSL workaround and generate the FreeStyle image**

```bash
export SSL_CERT_FILE=$(python3 -c "import certifi; print(certifi.where())")
cd "/Users/feldonrichards/Ai Meta Ads/skills/nano-banana-image-ad/scripts"
python3 generate_image.py \
  --prompt "Product photo of a FreeStyle Lite blood glucose test strips box, clean white background, studio product photography, no hands, no people, sharp focus on box branding and text" \
  --mode image --aspect-ratio 1:1 --n 1 \
  --image-ref "/Users/feldonrichards/code/cash-for-test-strips-usa/public/products/onetouch.jpg" \
  --out "/Users/feldonrichards/Ai Meta Ads/references/products"
```

Expected: one PNG written to the asset library `references/products/` directory, roughly 2048x2048, showing a clean FreeStyle Lite test strip box on white background.

- [ ] **Step 2: Generate the Microlet image**

```bash
python3 generate_image.py \
  --prompt "Product photo of a Microlet lancets box for diabetic blood glucose testing, clean white background, studio product photography, no hands, no people, sharp focus on box branding and text" \
  --mode image --aspect-ratio 1:1 --n 1 \
  --image-ref "/Users/feldonrichards/code/cash-for-test-strips-usa/public/products/onetouch.jpg" \
  --out "/Users/feldonrichards/Ai Meta Ads/references/products"
```

Expected: one PNG written to the asset library, showing a clean Microlet lancets box on white background.

- [ ] **Step 3: Rename the generated files to descriptive names in the asset library**

Find the two newly-generated PNGs (most recent files in the output directory) and rename them to `freestyle-lite-box.png` and `microlet-lancets-box.png` respectively, so the asset library stays organized like its existing entries.

- [ ] **Step 4: Resize and convert both into the app's public/products/ directory**

```bash
sips -Z 800 -s format jpeg -s formatOptions 82 \
  "/Users/feldonrichards/Ai Meta Ads/references/products/freestyle-lite-box.png" \
  --out "/Users/feldonrichards/code/cash-for-test-strips-usa/public/products/freestyle.jpg"

sips -Z 800 -s format jpeg -s formatOptions 82 \
  "/Users/feldonrichards/Ai Meta Ads/references/products/microlet-lancets-box.png" \
  --out "/Users/feldonrichards/code/cash-for-test-strips-usa/public/products/microlet.jpg"
```

Expected: two JPEGs in `public/products/`, roughly 50-150KB each (matching the size range of the first 4 generated images from the earlier picker work).

- [ ] **Step 5: Visually confirm both images**

Open both new JPEGs and confirm: clean white background, no visible text artifacts/garbling, no people/hands, box branding legible. If either image has garbled text or an off-brand look, regenerate that one image only (repeat the relevant step above) before continuing — don't proceed with a bad image.

- [ ] **Step 6: Commit**

```bash
git add public/products/freestyle.jpg public/products/microlet.jpg
git commit -m "feat: add FreeStyle and Microlet product images"
```

(The asset-library PNGs live outside this repo and don't get committed here.)

---

## Task 2: Expiration math helper

**Files:**
- Create: `lib/expiration.ts`
- Create: `lib/__tests__/expiration.test.ts`

**Interfaces:**
- Produces: `EXPIRATION_MONTH_OPTIONS: { value: number; label: string }[]`, `isEffectivelyExpired(selectedMonths: number, today: Date): boolean`, `monthsFromNowToYYYYMM(months: number, today: Date): string`

- [ ] **Step 1: Write the failing tests**

```typescript
// lib/__tests__/expiration.test.ts
import { describe, it, expect } from 'vitest'
import { EXPIRATION_MONTH_OPTIONS, isEffectivelyExpired, monthsFromNowToYYYYMM } from '@/lib/expiration'

describe('EXPIRATION_MONTH_OPTIONS', () => {
  it('has 26 options from 0 to 24 months plus a 24+ catch-all', () => {
    expect(EXPIRATION_MONTH_OPTIONS).toHaveLength(26)
    expect(EXPIRATION_MONTH_OPTIONS[0]).toEqual({ value: 0, label: 'Already expired / less than 1 month' })
    expect(EXPIRATION_MONTH_OPTIONS[1]).toEqual({ value: 1, label: '1 month' })
    expect(EXPIRATION_MONTH_OPTIONS[24]).toEqual({ value: 24, label: '24 months' })
    expect(EXPIRATION_MONTH_OPTIONS[25]).toEqual({ value: 25, label: '24+ months' })
  })
})

describe('isEffectivelyExpired', () => {
  it('is expired when today is past the 25th and only 1 month was selected', () => {
    const aug27 = new Date(2026, 7, 27) // August 27, 2026
    expect(isEffectivelyExpired(1, aug27)).toBe(true)
  })

  it('is not expired when today is past the 25th but 2+ months were selected', () => {
    const aug27 = new Date(2026, 7, 27)
    expect(isEffectivelyExpired(2, aug27)).toBe(false)
  })

  it('is not expired when today is on/before the 25th and 1 month was selected', () => {
    const aug25 = new Date(2026, 7, 25)
    expect(isEffectivelyExpired(1, aug25)).toBe(false)
  })

  it('0 months selected is always expired regardless of the day', () => {
    const aug10 = new Date(2026, 7, 10)
    expect(isEffectivelyExpired(0, aug10)).toBe(true)
  })
})

describe('monthsFromNowToYYYYMM', () => {
  it('computes the target YYYY-MM by adding calendar months to today', () => {
    const aug27 = new Date(2026, 7, 27)
    expect(monthsFromNowToYYYYMM(1, aug27)).toBe('2026-09')
    expect(monthsFromNowToYYYYMM(0, aug27)).toBe('2026-08')
  })

  it('rolls over into the next year correctly', () => {
    const nov15 = new Date(2026, 10, 15)
    expect(monthsFromNowToYYYYMM(3, nov15)).toBe('2027-02')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- expiration.test.ts`
Expected: FAIL with "Cannot find module '@/lib/expiration'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/expiration.ts
export const EXPIRATION_MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Already expired / less than 1 month' },
  ...Array.from({ length: 24 }, (_, i) => ({ value: i + 1, label: `${i + 1} month${i === 0 ? '' : 's'}` })),
  { value: 25, label: '24+ months' },
]

export function isEffectivelyExpired(selectedMonths: number, today: Date): boolean {
  const cutoffAdjust = today.getDate() > 25 ? 1 : 0
  const effectiveMonthsRemaining = selectedMonths - cutoffAdjust
  return effectiveMonthsRemaining <= 0
}

export function monthsFromNowToYYYYMM(months: number, today: Date): string {
  const d = new Date(today.getFullYear(), today.getMonth() + months, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- expiration.test.ts`
Expected: all passed

- [ ] **Step 5: Commit**

```bash
git add lib/expiration.ts lib/__tests__/expiration.test.ts
git commit -m "feat: add expiration month-picker math helpers"
```

---

## Task 3: Expand the product catalog

**Files:**
- Modify: `lib/product-catalog.ts`
- Modify: `lib/__tests__/product-catalog.test.ts`

**Interfaces:**
- Produces: `ProductBrand.category` now includes `'Lancets'`; `PRODUCT_BRANDS` expands from 9 rows to 15 rows (5 Test Strips + 4 CGM + 2 Infusion Sets + 4 Lancets)

- [ ] **Step 1: Update the existing catalog test for composite key+category uniqueness**

Replace the "has unique brand keys" test (the same `key` now legitimately repeats across categories):

```typescript
// lib/__tests__/product-catalog.test.ts — replace the existing 'has unique brand keys' test with:
  it('has unique key+category pairs', () => {
    const identities = PRODUCT_BRANDS.map((b) => `${b.category}:${b.key}`)
    expect(new Set(identities).size).toBe(identities.length)
  })
```

Also update the brand-count assertion in the first test from `toHaveLength(9)` to `toHaveLength(15)`, and extend the allowed-category list:

```typescript
      expect(['Test Strips', 'CGM', 'Infusion Sets', 'Lancets']).toContain(brand.category)
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- product-catalog.test.ts`
Expected: FAIL (still 9 brands, old category type, old key-uniqueness test)

- [ ] **Step 3: Update the ProductBrand type and expand PRODUCT_BRANDS**

Replace the full contents of `lib/product-catalog.ts`:

```typescript
export type ProductBrand = {
  key: string
  label: string
  category: 'Test Strips' | 'CGM' | 'Infusion Sets' | 'Lancets'
  image: string
  lines: string[]
}

export const PRODUCT_BRANDS: ProductBrand[] = [
  // Test Strips
  {
    key: 'contour',
    label: 'Contour / Bayer',
    category: 'Test Strips',
    image: '/products/contour-next.jpg',
    lines: ['Contour 50ct', 'Contour 100ct', 'Contour NEXT 50ct', 'Contour NEXT 100ct'],
  },
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Test Strips',
    image: '/products/accu-chek.jpg',
    lines: ['Aviva Plus 50ct', 'Aviva Plus 100ct', 'Guide 50ct', 'Guide 100ct', 'SmartView'],
  },
  {
    key: 'true-metrix',
    label: 'True Metrix',
    category: 'Test Strips',
    image: '/products/true-metrix.jpg',
    lines: ['True Metrix'],
  },
  {
    key: 'onetouch',
    label: 'OneTouch',
    category: 'Test Strips',
    image: '/products/onetouch.jpg',
    lines: ['Ultra 50ct', 'Ultra 100ct', 'VERIO 50ct', 'VERIO 100ct'],
  },
  {
    key: 'freestyle',
    label: 'FreeStyle',
    category: 'Test Strips',
    image: '/products/freestyle.jpg',
    lines: ['Lite 50ct', 'Lite 100ct', 'InsuLinx 50ct', 'InsuLinx 100ct'],
  },
  // CGM
  {
    key: 'dexcom',
    label: 'Dexcom',
    category: 'CGM',
    image: '/products/dexcom.jpg',
    lines: [
      'G6 Receivers',
      'G6 Sensors (STS-OE-001 / STS-OR-001)',
      'G6 Transmitters',
      'G7 10 Day Sensors (STP-AT-011 / -012 / -018)',
      'G7 15 Day Sensors (STP-FT-010 / -012)',
      'G7 Receivers',
    ],
  },
  {
    key: 'freestyle-libre',
    label: 'FreeStyle Libre',
    category: 'CGM',
    image: '/products/freestyle-libre.jpg',
    lines: ['Libre 14 Day Sensor', 'Libre 2 Sensor', 'Libre 2 Plus Sensor', 'Libre 2 Reader', 'Libre 3 Sensor', 'Libre 3 Plus Sensor', 'Libre 3 Reader'],
  },
  {
    key: 'omnipod',
    label: 'Omnipod',
    category: 'CGM',
    image: '/products/omnipod.jpg',
    lines: ['5 (Purple) G6/G7', '5 (Purple) G6/L2', '5 (Purple) L2/L3', '5 Starter Kit (w/ PDM)', 'DASH (5 Pack Pods)'],
  },
  {
    key: 'medtronic-guardian',
    label: 'Medtronic Guardian',
    category: 'CGM',
    image: '/products/medtronic.jpg',
    lines: ['Guardian Sensor 3', 'Guardian Sensor 4'],
  },
  // Infusion Sets
  {
    key: 'medtronic',
    label: 'Medtronic / MiniMed',
    category: 'Infusion Sets',
    image: '/products/medtronic.jpg',
    lines: ['AutoSoft 90', 'AutoSoft XC', 'Extended Infusion Set (10x)', 'Mio Advance', 'Mio Infusion Set', 'Quick-Set', 'Reservoir'],
  },
  {
    key: 'tandem',
    label: 'Tandem',
    category: 'Infusion Sets',
    image: '/products/tandem.jpg',
    lines: ['AutoSoft 90 Infusion Set', 'AutoSoft XC Infusion Set', 'TruSteel Infusion Set'],
  },
  // Lancets
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Lancets',
    image: '/products/accu-chek.jpg',
    lines: ['Fastclix', 'Softclix'],
  },
  {
    key: 'onetouch',
    label: 'OneTouch',
    category: 'Lancets',
    image: '/products/onetouch.jpg',
    lines: ['Delica Plus', 'Ultrasoft 2'],
  },
  {
    key: 'freestyle',
    label: 'FreeStyle',
    category: 'Lancets',
    image: '/products/freestyle.jpg',
    lines: ['Lancets'],
  },
  {
    key: 'microlet',
    label: 'Microlet',
    category: 'Lancets',
    image: '/products/microlet.jpg',
    lines: ['Lancets'],
  },
]
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- product-catalog.test.ts`
Expected: all passed

- [ ] **Step 5: Commit**

```bash
git add lib/product-catalog.ts lib/__tests__/product-catalog.test.ts
git commit -m "feat: expand product catalog to per-SKU lines, add Lancets category"
```

---

## Task 4: Update SellFlowClient — Lancets category, composite tile identity, expiration dropdown

**Files:**
- Modify: `app/sell/SellFlowClient.tsx`

**Interfaces:**
- Consumes: `EXPIRATION_MONTH_OPTIONS`, `isEffectivelyExpired`, `monthsFromNowToYYYYMM` from `lib/expiration.ts`; expanded `PRODUCT_BRANDS` from `lib/product-catalog.ts`

- [ ] **Step 1: Add the expiration import**

```typescript
import { EXPIRATION_MONTH_OPTIONS, isEffectivelyExpired, monthsFromNowToYYYYMM } from "@/lib/expiration";
```

- [ ] **Step 2: Replace selectedBrandKeys with a composite category:key identity**

Replace the `selectedBrandKeys` state, `selectBrand`, and the two `PRODUCT_BRANDS.find(...)` lookups that key on `b.key === selectedBrandKeys[i]`:

```typescript
  const [selectedBrandIdentities, setSelectedBrandIdentities] = useState<(string | null)[]>([null]);
  const [selectedLines, setSelectedLines] = useState<string[]>([""]);
  const [selectedMonths, setSelectedMonths] = useState<(number | null)[]>([null]);

  function brandIdentity(brand: (typeof PRODUCT_BRANDS)[number]) {
    return `${brand.category}:${brand.key}`;
  }
```

Update `addItem` to also push a `null` onto `selectedMonths`:

```typescript
  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
    setSelectedBrandIdentities((prev) => [...prev, null]);
    setSelectedLines((prev) => [...prev, ""]);
    setSelectedMonths((prev) => [...prev, null]);
  }
```

Update `selectBrand` to take the full brand object and store its composite identity:

```typescript
  function selectBrand(index: number, brand: (typeof PRODUCT_BRANDS)[number]) {
    setSelectedBrandIdentities((prev) => prev.map((id, i) => (i === index ? brandIdentity(brand) : id)));
    setSelectedLines((prev) => prev.map((l, i) => (i === index ? "" : l)));
    updateItem(index, { brand: "" });
  }
```

`selectLine` is unchanged.

- [ ] **Step 3: Add the months-selection handler**

```typescript
  function selectMonths(index: number, months: number) {
    setSelectedMonths((prev) => prev.map((m, i) => (i === index ? months : m)));
    updateItem(index, { expiration: monthsFromNowToYYYYMM(months, new Date()) });
  }
```

- [ ] **Step 4: Update the category loop to include Lancets and use composite identity**

Find the category array and both tile-related `PRODUCT_BRANDS.find`/comparison call sites (the button's `onClick`/`className`, and the line-dropdown's two lookups), and update all of them:

```typescript
            {(["Test Strips", "CGM", "Infusion Sets", "Lancets"] as const).map((category) => (
              <div key={category}>
                <p className="text-xs text-gray-400 mb-1">{category}</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRODUCT_BRANDS.filter((b) => b.category === category).map((brand) => (
                    <button
                      type="button"
                      key={brandIdentity(brand)}
                      onClick={() => selectBrand(i, brand)}
                      className={`flex flex-col items-center gap-1 border rounded-lg p-2 text-center transition-colors ${
                        selectedBrandIdentities[i] === brandIdentity(brand)
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <Image src={brand.image} alt={brand.label} width={64} height={64} className="object-contain h-16 w-16" />
                      <span className="text-[11px] leading-tight text-gray-700">{brand.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
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

- [ ] **Step 5: Replace the free-text expiration input with the months dropdown**

Find the existing expiration `<input>`:

```typescript
          <input
            placeholder="Expiration (e.g. 2027-01)"
            value={item.expiration}
            onChange={(e) => updateItem(i, { expiration: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1"
          />
```

Replace it with:

```typescript
          <div className="flex flex-col gap-1">
            <select
              value={selectedMonths[i] ?? ""}
              onChange={(e) => selectMonths(i, Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1"
            >
              <option value="">Months until expiration</option>
              {EXPIRATION_MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {selectedMonths[i] !== null && isEffectivelyExpired(selectedMonths[i]!, new Date()) && (
              <p className="text-xs text-amber-600">
                This may already be considered expired by most buyers — you can still submit, but let the buyer know when you message them.
              </p>
            )}
          </div>
```

- [ ] **Step 6: Run the build to confirm no type errors**

Run: `npm run build`
Expected: builds cleanly, no type errors

- [ ] **Step 7: Manual browser verification**

Run `npm run dev`, go to `/sell`:
1. Confirm 4 category headers now render: Test Strips, CGM, Infusion Sets, Lancets
2. Click the Lancets "Accu-Chek" tile, then separately click the Test Strips "Accu-Chek" tile in the same item row — confirm only the most-recently-clicked tile shows the highlighted state (no dual-highlight bug)
3. Pick "Contour NEXT 50ct" under Contour/Bayer, confirm it appears correctly
4. Pick a Lancets item (e.g. Microlet), confirm its image renders and the line dropdown shows "Lancets"
5. Pick "1 month" from the expiration dropdown on a day past the 25th (or verify via a code read if testing on an earlier day) — confirm the amber warning appears; pick "6 months" and confirm the warning does NOT appear
6. Fill in count/condition, submit, confirm the flow proceeds to results as before
7. Check via the Supabase MCP tool that the resulting `leads` row's `items[].expiration` field contains a real `YYYY-MM` string (not raw month-count), and clean up (delete) any test lead row created during this verification

- [ ] **Step 8: Commit**

```bash
git add app/sell/SellFlowClient.tsx
git commit -m "feat: add Lancets category, composite tile identity, expiration month picker"
```

---

## Task 5: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests pass, pristine output

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: builds cleanly, no type errors, `/sell` still prerenders correctly

- [ ] **Step 3: Full manual walkthrough**

Repeat Task 4 Step 7's walkthrough once more end-to-end, additionally confirming: a brand that appears in two categories (Accu-Chek, OneTouch, FreeStyle) can be independently selected in each category across two different item rows without state bleeding between rows.

- [ ] **Step 4: Final commit check**

```bash
git status
```

Confirm nothing from this plan is left uncommitted.
