# Visual Brand Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/sell`'s free-text "Brand" input with a visual brand-tile picker (real product box photos, grouped by category) that expands to a simple product-line dropdown, matching the design spec.

**Architecture:** A new static data module (`lib/product-catalog.ts`) defines the 9 brand tiles. `SellFlowClient.tsx` gains a small amount of local UI state (which brand is selected per item row) and renders a category-grouped image grid in place of the old text input. The final `OrderItem.brand` string is still just `"${brand label} — ${line}"` — no API, database, or type changes anywhere else in the app.

**Tech Stack:** Next.js 16 App Router (client component), TypeScript, Vitest. No new dependencies.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-06-visual-brand-picker-design.md`
- 9 images already placed at `public/products/{contour-next,true-metrix,dexcom,freestyle-libre,omnipod,accu-chek,onetouch,medtronic,tandem}.jpg`
- No prices shown anywhere (unchanged app-wide rule)
- `OrderItem.brand` remains a plain string — no backend/API/database changes in this plan

---

## Task 1: Product catalog data

**Files:**
- Create: `lib/product-catalog.ts`
- Create: `lib/__tests__/product-catalog.test.ts`

**Interfaces:**
- Produces: `ProductBrand` type, `PRODUCT_BRANDS: ProductBrand[]`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/__tests__/product-catalog.test.ts
import { describe, it, expect } from 'vitest'
import { PRODUCT_BRANDS } from '@/lib/product-catalog'

describe('PRODUCT_BRANDS', () => {
  it('has 9 brands, each with a non-empty label, image, and at least one product line', () => {
    expect(PRODUCT_BRANDS).toHaveLength(9)
    for (const brand of PRODUCT_BRANDS) {
      expect(brand.key.length).toBeGreaterThan(0)
      expect(brand.label.length).toBeGreaterThan(0)
      expect(brand.image.length).toBeGreaterThan(0)
      expect(brand.lines.length).toBeGreaterThan(0)
      expect(['Test Strips', 'CGM', 'Infusion Sets']).toContain(brand.category)
    }
  })

  it('has unique brand keys', () => {
    const keys = PRODUCT_BRANDS.map((b) => b.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- product-catalog.test.ts`
Expected: FAIL with "Cannot find module '@/lib/product-catalog'"

- [ ] **Step 3: Write the implementation**

```typescript
// lib/product-catalog.ts
export type ProductBrand = {
  key: string
  label: string
  category: 'Test Strips' | 'CGM' | 'Infusion Sets'
  image: string
  lines: string[]
}

export const PRODUCT_BRANDS: ProductBrand[] = [
  {
    key: 'contour-next',
    label: 'Contour Next',
    category: 'Test Strips',
    image: '/products/contour-next.jpg',
    lines: ['Contour Next'],
  },
  {
    key: 'accu-chek',
    label: 'Accu-Chek',
    category: 'Test Strips',
    image: '/products/accu-chek.jpg',
    lines: ['Guide', 'Aviva', 'SmartView'],
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
    lines: ['Verio', 'Ultra', 'Other OneTouch'],
  },
  {
    key: 'dexcom',
    label: 'Dexcom',
    category: 'CGM',
    image: '/products/dexcom.jpg',
    lines: ['G6 Sensors', 'G6 Transmitters', 'G7 Sensors', 'G7 Receivers'],
  },
  {
    key: 'freestyle-libre',
    label: 'FreeStyle Libre',
    category: 'CGM',
    image: '/products/freestyle-libre.jpg',
    lines: ['Libre 1', 'Libre 2', 'Libre 3'],
  },
  {
    key: 'omnipod',
    label: 'Omnipod',
    category: 'CGM',
    image: '/products/omnipod.jpg',
    lines: ['5 Pods (5-box)', 'DASH Pods (5-box)', 'Classic Pods (10-box)'],
  },
  {
    key: 'medtronic',
    label: 'Medtronic / MiniMed',
    category: 'Infusion Sets',
    image: '/products/medtronic.jpg',
    lines: ['AutoSoft 90', 'AutoSoft XC', 'Quick-set', 'Guardian Sensor', 'MiniMed Pumps & Sets'],
  },
  {
    key: 'tandem',
    label: 'Tandem',
    category: 'Infusion Sets',
    image: '/products/tandem.jpg',
    lines: ['t:slim X2'],
  },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- product-catalog.test.ts`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add lib/product-catalog.ts lib/__tests__/product-catalog.test.ts
git commit -m "feat: add product brand catalog data"
```

---

## Task 2: Visual brand picker in SellFlowClient

**Files:**
- Modify: `app/sell/SellFlowClient.tsx`

**Interfaces:**
- Consumes: `PRODUCT_BRANDS`, `ProductBrand` from `lib/product-catalog.ts`

- [ ] **Step 1: Add the import and per-item brand-selection state**

At the top of the file, add:
```typescript
import Image from "next/image";
import { PRODUCT_BRANDS } from "@/lib/product-catalog";
```

Inside `SellFlowClient`, add a new piece of state alongside the existing ones (after the `sending` state declaration):
```typescript
  const [selectedBrandKeys, setSelectedBrandKeys] = useState<(string | null)[]>([null]);
```

- [ ] **Step 2: Keep selectedBrandKeys in sync with items**

Update `addItem` to also push a `null` onto `selectedBrandKeys`:
```typescript
  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
    setSelectedBrandKeys((prev) => [...prev, null]);
  }
```

- [ ] **Step 3: Add a handler for picking a brand and a line**

Add these two functions near `updateItem`/`addItem`:
```typescript
  function selectBrand(index: number, brandKey: string) {
    setSelectedBrandKeys((prev) => prev.map((k, i) => (i === index ? brandKey : k)));
    updateItem(index, { brand: "" });
  }

  function selectLine(index: number, brand: (typeof PRODUCT_BRANDS)[number], line: string) {
    updateItem(index, { brand: `${brand.label} — ${line}` });
  }
```

- [ ] **Step 4: Replace the brand text input with the visual picker**

Find this block in the `items.map(...)` section (the free-text brand input):
```typescript
          <input
            placeholder="Brand (e.g. OneTouch Verio)"
            value={item.brand}
            onChange={(e) => updateItem(i, { brand: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1 col-span-2"
          />
```

Replace it with:
```typescript
          <div className="col-span-2 flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">What are you selling?</label>
            {(["Test Strips", "CGM", "Infusion Sets"] as const).map((category) => (
              <div key={category}>
                <p className="text-xs text-gray-400 mb-1">{category}</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRODUCT_BRANDS.filter((b) => b.category === category).map((brand) => (
                    <button
                      type="button"
                      key={brand.key}
                      onClick={() => selectBrand(i, brand.key)}
                      className={`flex flex-col items-center gap-1 border rounded-lg p-2 text-center transition-colors ${
                        selectedBrandKeys[i] === brand.key
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
            {selectedBrandKeys[i] && (
              <select
                value={item.brand}
                onChange={(e) => {
                  const brand = PRODUCT_BRANDS.find((b) => b.key === selectedBrandKeys[i]);
                  if (brand) selectLine(i, brand, e.target.value);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1"
              >
                <option value="">Select the specific product</option>
                {PRODUCT_BRANDS.find((b) => b.key === selectedBrandKeys[i])?.lines.map((line) => {
                  const brand = PRODUCT_BRANDS.find((b) => b.key === selectedBrandKeys[i])!;
                  const value = `${brand.label} — ${line}`;
                  return (
                    <option key={line} value={value}>
                      {line}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
```

- [ ] **Step 5: Run the build to confirm no type errors**

Run: `npm run build`
Expected: builds cleanly, no type errors

- [ ] **Step 6: Manual browser verification**

Run `npm run dev`, go to `/sell`:
1. Pick a state
2. Confirm the brand grid renders, grouped under "Test Strips" / "CGM" / "Infusion Sets" headers, each tile showing an image and label
3. Click a brand tile (e.g. Accu-Chek) → confirm it highlights and a dropdown appears with its specific lines (Guide, Aviva, SmartView)
4. Pick a line → confirm the item's effective brand value is now set (submitting should no longer show "Fill in brand and count" for that item if count/expiration are also filled)
5. Click "+ Add another item" → confirm the new row has its own independent brand grid (selecting a brand on row 2 doesn't affect row 1)
6. Fill in count/expiration for the item(s), submit → confirm the flow proceeds to results as before (no change to matching/sending logic)
7. Check via the Supabase MCP tool that the resulting `leads` row's `items[].brand` field contains the combined `"Brand — Line"` string correctly

- [ ] **Step 7: Commit**

```bash
git add app/sell/SellFlowClient.tsx
git commit -m "feat: replace free-text brand input with visual brand picker"
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

Repeat Task 2 Step 6's walkthrough once more end-to-end (state → brand tiles → line → count/expiration/condition → find buyer → send), confirming the whole `/sell` flow still works with the new picker in place, and that at least 2 different brands across different categories both work correctly.

- [ ] **Step 4: Final commit check**

```bash
git status
```

Confirm nothing from this plan is left uncommitted.
