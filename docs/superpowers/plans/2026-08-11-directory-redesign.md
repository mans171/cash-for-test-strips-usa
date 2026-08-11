# Directory Redesign ("Cash Energy" + ZIP Proximity) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild cash4teststripsusa.com's public pages in the approved "Cash Energy" visual identity and add real ZIP proximity search (distance tiers + mail-in fallback), per `docs/superpowers/specs/2026-08-11-directory-redesign-design.md`.

**Architecture:** New Supabase `zip_centroids` table (Census ZCTA gazetteer) + `lat`/`lng` on `companies` power a pure-TS Haversine/tier module consumed by server components. A shared `BuyerCard` + `UnlockContact` (wraps the existing-but-unused `AccountModal`) replaces the three duplicated card implementations and the red-error gate. All pages re-skinned with `@theme` tokens; zero new npm dependencies.

**Tech Stack:** Next.js 16 (App Router, Server Components), React 19, Tailwind 4 (`@theme` in `globals.css`), Supabase (`@supabase/ssr`), Vitest (node env — pure-logic tests only, no jsdom).

## Global Constraints

- **No new npm dependencies.** Haversine is hand-rolled; ZIP data is a DB table; icons are inline SVG.
- **Brand display name is "Cash For Test Strips USA" (spelled out) everywhere.** Never "Cash4TestStripsUSA" in copy/logo (standing decision). "USA" may be tinted electric green.
- **Price hook copy is exactly "up to $100 a box"** and must link to `/how-much-are-diabetic-test-strips-worth`.
- **Server-side contact gating is sacred:** every `companies` fetch rendered to anon visitors goes through `stripCompanyContact()` (`lib/company-contact.ts`). No task may weaken this; the final audit greps for leaks.
- **Preserve all AEO:** every existing `JsonLd` call, FAQ text (verbatim — it's inside FAQPage schema), metadata, canonicals, and URL structure stay intact.
- **Visual tokens:** ink `#071b10`, ink-deep `#052e16`, cash `#16a34a`, cash-hover `#15803d`, electric `#4ade80`, ground `#f7f9f7`. Featured badge keeps amber (`text-amber-700 bg-amber-50`).
- **Ratings render only when `rating` is non-null** — never invent stars.
- Tests run with `npm test` (vitest, node env). Build with `npm run build`. Lint with `npm run lint`.
- Migrations are pushed with `supabase db push` (project ref `whgwneuarnrsktolmqdj`); plan approval = push consent (standing convention). **Check `supabase migration list` before pushing** (cross-workspace convention).
- Commit after every task; end every commit message with the standard Claude trailer used in this repo.

---

### Task 1: Design tokens + monogram lib + shared UI primitives

**Files:**
- Modify: `app/globals.css`
- Create: `lib/monogram.ts`
- Create: `lib/__tests__/monogram.test.ts`
- Create: `app/components/ui.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `monogramFromName(name: string): { initials: string; tintClass: string }` (lib/monogram.ts)
  - From `app/components/ui.tsx`: `Chip({children})`, `VerifiedBadge()`, `FeaturedBadge()`, `MonogramAvatar({name})`, `LockIcon({className?})`, `PinIcon({className?})`, and exported class-string constants `btnPrimary`, `btnSecondary`, `btnOnDark`.

- [ ] **Step 1: Write the failing monogram test**

```ts
// lib/__tests__/monogram.test.ts
import { describe, it, expect } from 'vitest'
import { monogramFromName } from '@/lib/monogram'

describe('monogramFromName', () => {
  it('takes first letters of first two words', () => {
    expect(monogramFromName('Cash For Test Strips Indiana').initials).toBe('CF')
  })
  it('single word gives first two letters', () => {
    expect(monogramFromName('Melissa').initials).toBe('ME')
  })
  it('is deterministic: same name, same tint', () => {
    expect(monogramFromName('864 Medex - Greenville, SC').tintClass)
      .toBe(monogramFromName('864 Medex - Greenville, SC').tintClass)
  })
  it('tintClass is one of the known tints', () => {
    const known = ['bg-emerald-100 text-emerald-800','bg-sky-100 text-sky-800','bg-amber-100 text-amber-800','bg-violet-100 text-violet-800','bg-rose-100 text-rose-800']
    expect(known).toContain(monogramFromName('Jerome Jones').tintClass)
  })
})
```

- [ ] **Step 2: Run it — expect FAIL** (`npm test -- monogram`) with "Cannot find module '@/lib/monogram'".

- [ ] **Step 3: Implement `lib/monogram.ts`**

```ts
const TINTS = [
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-amber-100 text-amber-800',
  'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800',
]

export function monogramFromName(name: string): { initials: string; tintClass: string } {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const initials = (
    words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? '??').slice(0, 2)
  ).toUpperCase()
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return { initials, tintClass: TINTS[Math.abs(hash) % TINTS.length] }
}
```

- [ ] **Step 4: Run tests — expect PASS.**

- [ ] **Step 5: Update `app/globals.css`** — replace the whole file with:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-ink: #071b10;
  --color-ink-deep: #052e16;
  --color-cash: #16a34a;
  --color-cash-hover: #15803d;
  --color-electric: #4ade80;
  --color-ground: #f7f9f7;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

Notes: the old `@media (prefers-color-scheme: dark)` root-swap and the `font-family: Arial` body override are deliberately removed (site is light-scheme; Geist comes from the `font-sans` class in `app/layout.tsx`). After this, classes like `bg-ink`, `text-electric`, `bg-cash`, `bg-ground` work everywhere.

- [ ] **Step 6: Create `app/components/ui.tsx`**

```tsx
import { monogramFromName } from "@/lib/monogram"

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 bg-cash text-white font-bold text-sm px-5 py-3 rounded-lg hover:bg-cash-hover transition-colors"
export const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 font-semibold text-sm px-5 py-3 rounded-lg hover:border-ink hover:text-ink transition-colors"
export const btnOnDark =
  "inline-flex items-center justify-center gap-1.5 bg-electric text-ink-deep font-extrabold text-sm px-5 py-3 rounded-lg hover:bg-white transition-colors"

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-md">
      {children}
    </span>
  )
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-green-800 bg-green-100 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
      ✓ Verified
    </span>
  )
}

export function FeaturedBadge() {
  return (
    <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
      Featured
    </span>
  )
}

export function MonogramAvatar({ name }: { name: string }) {
  const { initials, tintClass } = monogramFromName(name)
  return (
    <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-sm font-extrabold ${tintClass}`}>
      {initials}
    </div>
  )
}

export function LockIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function PinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
```

- [ ] **Step 7: Verify** — `npm test` (all green incl. existing suite), `npm run build` (clean).

- [ ] **Step 8: Commit** — `git add lib/monogram.ts lib/__tests__/monogram.test.ts app/components/ui.tsx app/globals.css && git commit -m "feat: Cash Energy design tokens + shared UI primitives"`

---

### Task 2: Pure geo module (TDD)

**Files:**
- Create: `lib/geo.ts`
- Create: `lib/__tests__/geo.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (exact — later tasks import these):
  - `type LatLng = { lat: number; lng: number }`
  - `NEAR_MI = 25`, `DRIVE_MI = 100` (exported consts)
  - `haversineMiles(a: LatLng, b: LatLng): number`
  - `isValidZip(s: string): boolean` (exactly 5 digits)
  - `withDistance<T extends { lat: number | null; lng: number | null }>(items: T[], origin: LatLng): (T & { miles: number | null })[]` — miles null when item lacks coords; sorted miles asc, nulls last.

- [ ] **Step 1: Write failing tests**

```ts
// lib/__tests__/geo.test.ts
import { describe, it, expect } from 'vitest'
import { haversineMiles, isValidZip, withDistance, NEAR_MI, DRIVE_MI } from '@/lib/geo'

const NYC = { lat: 40.7128, lng: -74.006 }
const LA = { lat: 34.0522, lng: -118.2437 }
const ALBANY = { lat: 42.6526, lng: -73.7562 }

describe('haversineMiles', () => {
  it('NYC to LA is ~2445 miles', () => {
    expect(haversineMiles(NYC, LA)).toBeGreaterThan(2420)
    expect(haversineMiles(NYC, LA)).toBeLessThan(2470)
  })
  it('Albany to NYC is ~135 miles', () => {
    expect(haversineMiles(ALBANY, NYC)).toBeGreaterThan(125)
    expect(haversineMiles(ALBANY, NYC)).toBeLessThan(145)
  })
  it('zero distance for identical points', () => {
    expect(haversineMiles(NYC, NYC)).toBe(0)
  })
})

describe('isValidZip', () => {
  it('accepts 5 digits', () => expect(isValidZip('12208')).toBe(true))
  it('rejects short, long, letters, zip+4', () => {
    for (const bad of ['1220', '122081', '12a08', '12208-1234', '', ' 12208']) {
      expect(isValidZip(bad)).toBe(false)
    }
  })
})

describe('withDistance', () => {
  const items = [
    { name: 'far', lat: LA.lat, lng: LA.lng },
    { name: 'nocoords', lat: null, lng: null },
    { name: 'close', lat: ALBANY.lat, lng: ALBANY.lng },
  ]
  it('sorts by miles asc with null-coord items last', () => {
    const out = withDistance(items, NYC)
    expect(out.map((i) => i.name)).toEqual(['close', 'far', 'nocoords'])
    expect(out[0].miles).toBeGreaterThan(0)
    expect(out[2].miles).toBeNull()
  })
  it('tier constants are 25 and 100', () => {
    expect(NEAR_MI).toBe(25)
    expect(DRIVE_MI).toBe(100)
  })
})
```

- [ ] **Step 2: Run — expect FAIL** ("Cannot find module '@/lib/geo'"): `npm test -- geo`

- [ ] **Step 3: Implement `lib/geo.ts`**

```ts
export type LatLng = { lat: number; lng: number }

export const NEAR_MI = 25
export const DRIVE_MI = 100

const EARTH_RADIUS_MI = 3958.8

export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h))
}

export function isValidZip(s: string): boolean {
  return /^\d{5}$/.test(s)
}

export function withDistance<T extends { lat: number | null; lng: number | null }>(
  items: T[],
  origin: LatLng
): (T & { miles: number | null })[] {
  return items
    .map((item) => ({
      ...item,
      miles:
        item.lat != null && item.lng != null
          ? haversineMiles(origin, { lat: item.lat, lng: item.lng })
          : null,
    }))
    .sort((a, b) => {
      if (a.miles == null && b.miles == null) return 0
      if (a.miles == null) return 1
      if (b.miles == null) return -1
      return a.miles - b.miles
    })
}
```

- [ ] **Step 4: Run — expect PASS**: `npm test -- geo`
- [ ] **Step 5: Commit** — `git add lib/geo.ts lib/__tests__/geo.test.ts && git commit -m "feat: haversine + zip validation geo module"`

---

### Task 3: `zip_centroids` table + Census ZCTA seed

**Files:**
- Create: `scripts/generate-zip-centroids.mjs`
- Create: `supabase/migrations/20260811000000_create_zip_centroids.sql`
- Create (generated): `supabase/migrations/20260811000001_seed_zip_centroids.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: DB table `zip_centroids(zip text pk, lat double precision, lng double precision, state text)` with ~33k rows, anon-readable. Task 5 queries it via `.from('zip_centroids')`.

- [ ] **Step 1: Write the schema migration** `supabase/migrations/20260811000000_create_zip_centroids.sql`:

```sql
-- US ZIP (ZCTA) centroids for proximity search. Source: US Census Bureau
-- ZCTA Gazetteer (public domain). State derived from ZIP prefix ranges.
create table public.zip_centroids (
  zip   text primary key,
  lat   double precision not null,
  lng   double precision not null,
  state text
);

alter table public.zip_centroids enable row level security;

create policy "zip_centroids_public_read"
  on public.zip_centroids for select
  to anon, authenticated
  using (true);
```

- [ ] **Step 2: Download the gazetteer** (scratch dir, not committed):

```bash
cd /tmp && curl -sLO https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip && unzip -o 2024_Gaz_zcta_national.zip && wc -l 2024_Gaz_zcta_national.txt
```

Expected: ~33,700 lines. Tab-delimited; header row `GEOID	ALAND	AWATER	ALAND_SQMI	AWATER_SQMI	INTPTLAT	INTPTLONG`. If the 2024 URL 404s, try 2023: same path with `2023_Gazetteer/2023_Gaz_zcta_national.zip`.

- [ ] **Step 3: Write `scripts/generate-zip-centroids.mjs`**

```js
// Generates supabase/migrations/20260811000001_seed_zip_centroids.sql from the
// Census ZCTA gazetteer. Usage: node scripts/generate-zip-centroids.mjs /tmp/2024_Gaz_zcta_national.txt
import { readFileSync, writeFileSync } from 'node:fs'

// ZIP prefix (first 3 digits) → state. Coarse USPS ranges + known anomalies.
const RANGES = [
  ['005','005','NY'],['010','027','MA'],['028','029','RI'],['030','038','NH'],
  ['039','049','ME'],['050','059','VT'],['060','069','CT'],['070','089','NJ'],
  ['100','149','NY'],['150','196','PA'],['197','199','DE'],['200','200','DC'],
  ['201','201','VA'],['202','205','DC'],['206','219','MD'],['220','246','VA'],
  ['247','268','WV'],['270','289','NC'],['290','299','SC'],['300','319','GA'],
  ['320','349','FL'],['350','369','AL'],['370','385','TN'],['386','397','MS'],
  ['398','399','GA'],['400','427','KY'],['430','459','OH'],['460','479','IN'],
  ['480','499','MI'],['500','528','IA'],['530','549','WI'],['550','567','MN'],
  ['570','577','SD'],['580','588','ND'],['590','599','MT'],['600','629','IL'],
  ['630','658','MO'],['660','679','KS'],['680','693','NE'],['700','714','LA'],
  ['716','729','AR'],['730','749','OK'],['750','799','TX'],['800','816','CO'],
  ['820','831','WY'],['832','838','ID'],['840','847','UT'],['850','865','AZ'],
  ['870','884','NM'],['885','885','TX'],['889','898','NV'],['900','961','CA'],
  ['967','968','HI'],['970','979','OR'],['980','994','WA'],['995','999','AK'],
]
const OVERRIDES = { '733': 'TX' } // Austin anomaly inside OK range

function stateForZip(zip) {
  const p = zip.slice(0, 3)
  if (OVERRIDES[p]) return OVERRIDES[p]
  for (const [lo, hi, st] of RANGES) if (p >= lo && p <= hi) return st
  return null // PR/VI/military prefixes — kept with null state
}

const src = process.argv[2]
if (!src) throw new Error('usage: node scripts/generate-zip-centroids.mjs <gazetteer.txt>')
const lines = readFileSync(src, 'utf8').split('\n').slice(1).filter(Boolean)

const rows = lines.map((line) => {
  const cols = line.split('\t').map((c) => c.trim())
  const zip = cols[0]
  const lat = Number(cols[cols.length - 2])
  const lng = Number(cols[cols.length - 1])
  if (!/^\d{5}$/.test(zip) || Number.isNaN(lat) || Number.isNaN(lng)) return null
  const st = stateForZip(zip)
  return `('${zip}',${lat},${lng},${st ? `'${st}'` : 'null'})`
}).filter(Boolean)

let sql = '-- Generated by scripts/generate-zip-centroids.mjs — do not hand-edit.\n'
for (let i = 0; i < rows.length; i += 1000) {
  sql += `insert into public.zip_centroids (zip, lat, lng, state) values\n${rows.slice(i, i + 1000).join(',\n')}\non conflict (zip) do nothing;\n\n`
}
writeFileSync('supabase/migrations/20260811000001_seed_zip_centroids.sql', sql)
console.log(`wrote ${rows.length} zip rows`)
```

- [ ] **Step 4: Generate + sanity check**

```bash
cd ~/code/cash-for-test-strips-usa && node scripts/generate-zip-centroids.mjs /tmp/2024_Gaz_zcta_national.txt
grep -c "^('" supabase/migrations/20260811000001_seed_zip_centroids.sql
grep "'12208'" supabase/migrations/20260811000001_seed_zip_centroids.sql
```

Expected: ~33,000+ rows written; `12208` present with lat ≈ 42.65, lng ≈ −73.78, state `'NY'`.

- [ ] **Step 5: Check remote migration state, then push**

```bash
supabase migration list --project-ref whgwneuarnrsktolmqdj   # confirm no unexpected remote-only migrations first
supabase db push --project-ref whgwneuarnrsktolmqdj
```

Note: the two untracked June migration files sitting in the working tree (`20260618_add_vancouver_tim.sql`, `20260618_update_orlando_url.sql`) predate this work — if `migration list` shows them as already applied remotely, leave them exactly as they are; do not delete or re-push them.

- [ ] **Step 6: Verify via SQL** (Supabase MCP `execute_sql`): `select count(*), count(*) filter (where state is null) from zip_centroids;` → count ≈ 33k, null-state count small (PR/military prefixes only). Then `select * from zip_centroids where zip = '12208';` → NY row.

- [ ] **Step 7: Commit** — `git add scripts/generate-zip-centroids.mjs supabase/migrations/20260811000000_create_zip_centroids.sql supabase/migrations/20260811000001_seed_zip_centroids.sql && git commit -m "feat: zip_centroids table seeded from Census ZCTA gazetteer"`

---

### Task 4: `companies` geo/trust columns + coordinate backfill

**Files:**
- Create: `supabase/migrations/20260811000002_companies_geo_and_trust.sql`
- Create: `supabase/migrations/20260811000003_backfill_company_coords.sql`
- Modify: `lib/types.ts`

**Interfaces:**
- Consumes: Task 3's applied schema.
- Produces: `companies.lat/lng/verified/transaction_modes/response_time/est_year`; `Company` type gains `lat: number | null`, `lng: number | null`, `verified: boolean`, `transaction_modes: string[]`, `response_time: string | null`, `est_year: number | null`. Every later task selects these columns.

- [ ] **Step 1: Write the columns migration** `20260811000002_companies_geo_and_trust.sql`:

```sql
alter table public.companies add column if not exists lat double precision;
alter table public.companies add column if not exists lng double precision;
alter table public.companies add column if not exists verified boolean not null default false;
alter table public.companies add column if not exists transaction_modes text[] not null default '{meetup}';
alter table public.companies add column if not exists response_time text;
alter table public.companies add column if not exists est_year int;
```

- [ ] **Step 2: Write the backfill migration** `20260811000003_backfill_company_coords.sql` — city-centroid coordinates per active listing (Ottawa and CFTS Mail-In intentionally left NULL):

```sql
-- City-centroid coords (approximate by design; distances display as "~X mi").
update public.companies set lat = 34.8526,  lng = -82.3940  where slug = '864medex-greenville-sc';
update public.companies set lat = 42.6526,  lng = -73.7562  where slug = 'cash-for-diabetic-test-strips-albany-ny';
update public.companies set lat = 30.4515,  lng = -91.1871  where slug = 'leonard-fields-baton-rouge-la';
update public.companies set lat = 42.3601,  lng = -71.0589  where slug = 'jerome-jones-boston-ma';
update public.companies set lat = 39.7392,  lng = -104.9903 where slug = 'sean-murphy-colorado';           -- statewide: Denver
update public.companies set lat = 32.7767,  lng = -96.7970  where slug = 'ricky-dallas-tx';
update public.companies set lat = 39.7904,  lng = -77.7278  where slug = 'alex-quintana-greencastle-pa';
update public.companies set lat = 40.9584,  lng = -75.9746  where slug = 'alberto-hazleton-pa';
update public.companies set lat = 39.1141,  lng = -94.6275  where slug = 'chris-utter-kansas-city-ks';
update public.companies set lat = 40.4326,  lng = -74.1996  where slug = 'nichole-keyport-nj';
update public.companies set lat = 36.1699,  lng = -115.1398 where slug = 'rj-las-vegas-nv';
update public.companies set lat = 25.7617,  lng = -80.1918  where slug = 'melissa-miami-fl';
update public.companies set lat = 40.7128,  lng = -74.0060  where slug = 'kevin-silver-new-york-ny';
update public.companies set lat = 28.5384,  lng = -81.3789  where slug = 'liliana-orlando-fl';
update public.companies set lat = 39.9526,  lng = -75.1652  where slug = 'busie-philadelphia-pa';
update public.companies set lat = 35.7796,  lng = -78.6382  where slug = 'curtis-raleigh-durham-nc';       -- Raleigh
update public.companies set lat = 36.0726,  lng = -79.7920  where slug = 'nirav-raleigh-greensboro-nc';    -- Greensboro
update public.companies set lat = 38.5816,  lng = -121.4944 where slug = 'chuck-oru-sacramento-ca';
update public.companies set lat = 29.4241,  lng = -98.4936  where slug = 'chris-dia-san-antonio-tx';
update public.companies set lat = 32.7157,  lng = -117.1611 where slug = 'rene-ramirez-san-diego-ca';
update public.companies set lat = 38.9907,  lng = -77.0261  where slug = 'abdul-silver-spring-md';
update public.companies set lat = 41.6528,  lng = -83.5379  where slug = 'favier-toledo-oh-detroit-mi';    -- Toledo
update public.companies set lat = 38.3498,  lng = -81.6326  where slug = 'michele-wilson-west-virginia';   -- statewide: Charleston
update public.companies set lat = 41.5822,  lng = -85.8344  where slug = 'cash-for-test-strips-indiana';   -- Goshen
update public.companies set lat = 38.8339,  lng = -104.8214 where slug = 'hawks-sport-electronics-colorado-springs-co';
update public.companies set lat = 35.2271,  lng = -80.8431  where slug = 'jaime-cardoso-charlotte-nc';
update public.companies set lat = 40.4406,  lng = -79.9959  where slug = 'pgh-phone-buyer-pittsburgh-pa';
update public.companies set lat = 45.6387,  lng = -122.6615 where slug = 'tim-vancouver-wa';
-- alex-asselin-ottawa-canada: no coords (excluded from US distance tiers by design)
-- cfts-mail-in: no coords (fallback card only)
```

- [ ] **Step 3: Push** (`supabase db push --project-ref whgwneuarnrsktolmqdj`).

- [ ] **Step 4: Sanity-check coords via SQL** (Supabase MCP `execute_sql`) — every geocoded buyer must sit near SOME same-state ZIP centroid:

```sql
select c.slug from companies c
where c.lat is not null
  and not exists (
    select 1 from zip_centroids z
    where z.state = c.states[1]
      and abs(z.lat - c.lat) < 1.5 and abs(z.lng - c.lng) < 2
  );
```

Expected: **0 rows.** Any row returned = a typo'd/swapped coordinate; fix the backfill values and re-push before proceeding.

- [ ] **Step 5: Update `lib/types.ts`** — inside `export type Company`, after `phone: string | null`, add:

```ts
  lat: number | null
  lng: number | null
  verified: boolean
  transaction_modes: string[]
  response_time: string | null
  est_year: number | null
```

Keep the existing `hasContact?: boolean` comment block last.

- [ ] **Step 6: Run `npm test` and `npm run build`.** Type additions may surface fetch sites that don't select the new columns — Company consumers cast from `select(...)` strings, so expect green; fix any type errors by adding the new fields to the relevant `select` lists (the page tasks below update each page's select list explicitly anyway).

- [ ] **Step 7: Commit** — `git add supabase/migrations/20260811000002_companies_geo_and_trust.sql supabase/migrations/20260811000003_backfill_company_coords.sql lib/types.ts && git commit -m "feat: company geo + trust columns, coordinate backfill"`

---

### Task 5: ZIP lookup + tier bucketing (TDD)

**Files:**
- Create: `lib/zip-lookup.ts`
- Create: `lib/__tests__/zip-lookup.test.ts`

**Interfaces:**
- Consumes: `withDistance`, `NEAR_MI`, `DRIVE_MI`, `LatLng` from `lib/geo` (Task 2); `Company` from `lib/types` (Task 4).
- Produces (exact):
  - `type ZipCentroid = { lat: number; lng: number; state: string | null }`
  - `type CompanyWithMiles = Company & { miles: number | null }`
  - `type Tiered = { near: CompanyWithMiles[]; driving: CompanyWithMiles[]; inState: CompanyWithMiles[]; rest: CompanyWithMiles[] }`
  - `getZipCentroid(supabase: SupabaseLike, zip: string): Promise<ZipCentroid | null>` where `SupabaseLike = { from: (t: string) => any }` (accepts any supabase client)
  - `tierCompanies(companies: Company[], centroid: ZipCentroid): Tiered`

- [ ] **Step 1: Write failing tests**

```ts
// lib/__tests__/zip-lookup.test.ts
import { describe, it, expect } from 'vitest'
import { tierCompanies, getZipCentroid } from '@/lib/zip-lookup'
import type { Company } from '@/lib/types'

const base: Omit<Company, 'id' | 'name' | 'slug' | 'lat' | 'lng' | 'states'> = {
  url: null, email: null, city: null, owner_name: null,
  payment_methods: [], accepted_brands: [], rating: null, description: null,
  featured: false, phone: null, verified: false, transaction_modes: ['meetup'],
  response_time: null, est_year: null,
}
const co = (id: string, lat: number | null, lng: number | null, states: string[], featured = false): Company =>
  ({ ...base, id, name: id, slug: id, lat, lng, states, featured } as Company)

// Albany centroid
const ALBANY = { lat: 42.6526, lng: -73.7562, state: 'NY' }

describe('tierCompanies', () => {
  it('buckets near (<=25mi), driving (<=100mi), inState, rest', () => {
    const companies = [
      co('albany', 42.6526, -73.7562, ['NY']),        // 0 mi → near
      co('schenectady', 42.8142, -73.9396, ['NY']),   // ~15 mi → near
      co('nyc', 40.7128, -74.006, ['NY']),            // ~135 mi → NOT driving, but NY → inState
      co('boston', 42.3601, -71.0589, ['MA']),        // ~140 mi, MA → rest
      co('hudson-ny', 42.2529, -73.7912, ['NY']),     // ~28 mi → driving
      co('nocoords-ny', null, null, ['NY']),          // → inState
    ]
    const t = tierCompanies(companies, ALBANY)
    expect(t.near.map((c) => c.id)).toEqual(['albany', 'schenectady'])
    expect(t.driving.map((c) => c.id)).toEqual(['hudson-ny'])
    expect(t.inState.map((c) => c.id).sort()).toEqual(['nocoords-ny', 'nyc'])
    expect(t.rest.map((c) => c.id)).toEqual(['boston'])
  })

  it('near/driving sorted by miles; ties broken featured-first then name', () => {
    const companies = [
      co('b-same-city', 42.6526, -73.7562, ['NY']),
      co('a-same-city-featured', 42.6526, -73.7562, ['NY'], true),
    ]
    const t = tierCompanies(companies, ALBANY)
    expect(t.near.map((c) => c.id)).toEqual(['a-same-city-featured', 'b-same-city'])
  })

  it('null centroid state puts nothing in inState', () => {
    const t = tierCompanies([co('nocoords-ny', null, null, ['NY'])], { ...ALBANY, state: null })
    expect(t.inState).toEqual([])
    expect(t.rest.map((c) => c.id)).toEqual(['nocoords-ny'])
  })
})

describe('getZipCentroid', () => {
  it('returns row data when found', async () => {
    const fake = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { lat: 1, lng: 2, state: 'NY' }, error: null }),
          }),
        }),
      }),
    }
    expect(await getZipCentroid(fake, '12208')).toEqual({ lat: 1, lng: 2, state: 'NY' })
  })
  it('returns null when missing', async () => {
    const fake = {
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      }),
    }
    expect(await getZipCentroid(fake, '00000')).toBeNull()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**: `npm test -- zip-lookup`

- [ ] **Step 3: Implement `lib/zip-lookup.ts`**

```ts
import { withDistance, NEAR_MI, DRIVE_MI, type LatLng } from './geo'
import type { Company } from './types'

export type ZipCentroid = LatLng & { state: string | null }
export type CompanyWithMiles = Company & { miles: number | null }
export type Tiered = {
  near: CompanyWithMiles[]
  driving: CompanyWithMiles[]
  inState: CompanyWithMiles[]
  rest: CompanyWithMiles[]
}

// Minimal structural type so both the anon and server supabase clients (and
// test fakes) are accepted without importing client internals.
type SupabaseLike = { from: (table: string) => any }

export async function getZipCentroid(
  supabase: SupabaseLike,
  zip: string
): Promise<ZipCentroid | null> {
  const { data } = await supabase
    .from('zip_centroids')
    .select('lat, lng, state')
    .eq('zip', zip)
    .maybeSingle()
  if (!data) return null
  return { lat: data.lat, lng: data.lng, state: data.state ?? null }
}

const byFeaturedThenName = (a: CompanyWithMiles, b: CompanyWithMiles) => {
  if ((a.miles ?? Infinity) !== (b.miles ?? Infinity)) return 0 // only used within same-distance ties
  if (a.featured !== b.featured) return a.featured ? -1 : 1
  return a.name.localeCompare(b.name)
}

export function tierCompanies(companies: Company[], centroid: ZipCentroid): Tiered {
  const annotated = withDistance(companies, centroid)
  // Stable secondary ordering for exact-distance ties (same city):
  const sorted = [...annotated].sort((a, b) => {
    const am = a.miles ?? Infinity
    const bm = b.miles ?? Infinity
    if (am !== bm) return am - bm
    return byFeaturedThenName(a, b)
  })

  const near: CompanyWithMiles[] = []
  const driving: CompanyWithMiles[] = []
  const inState: CompanyWithMiles[] = []
  const rest: CompanyWithMiles[] = []

  for (const c of sorted) {
    if (c.miles != null && c.miles <= NEAR_MI) near.push(c)
    else if (c.miles != null && c.miles <= DRIVE_MI) driving.push(c)
    else if (centroid.state && c.states.includes(centroid.state)) inState.push(c)
    else rest.push(c)
  }
  return { near, driving, inState, rest }
}
```

- [ ] **Step 4: Run — expect PASS** (`npm test -- zip-lookup`), then full `npm test`.
- [ ] **Step 5: Commit** — `git add lib/zip-lookup.ts lib/__tests__/zip-lookup.test.ts && git commit -m "feat: zip centroid lookup + distance tier bucketing"`

---

### Task 6: `UnlockContact` gate component (wires up the unused AccountModal)

**Files:**
- Create: `app/components/UnlockContact.tsx`
- Reference (no changes expected): `app/components/AccountModal.tsx`, `app/components/SignupForm.tsx`, `app/components/LoginForm.tsx`

**Interfaces:**
- Consumes: `AccountModal({ onClose, onSuccess })` (existing, currently unmounted anywhere); `btnPrimary`, `LockIcon` from `app/components/ui` (Task 1).
- Produces: `UnlockContact({ company, isAuthenticated, size? }: { company: Company & { hasContact?: boolean }; isAuthenticated: boolean; size?: 'card' | 'page' })` — client component. Authed: renders tracked "Visit site →" link (via `/api/track?company=…&url=…`) when `url` present, else `tel:` "Contact" when `phone` present, else nothing. Anon (when `url`/`phone`/`hasContact` truthy): lock button → AccountModal → on success `router.refresh()`.

- [ ] **Step 1: Read `SignupForm.tsx` and `LoginForm.tsx`** to confirm `onSuccess` fires only after the Supabase session is established (it's the same contract the sell flow was built for). If `onSuccess` fires before session cookies land, add a `router.refresh()` inside a `setTimeout(…, 0)` — but only if live verification (Step 3) shows stale auth.

- [ ] **Step 2: Implement `app/components/UnlockContact.tsx`**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AccountModal } from "./AccountModal"
import { btnPrimary, LockIcon } from "./ui"
import type { Company } from "@/lib/types"

export function UnlockContact({
  company,
  isAuthenticated,
  size = "card",
}: {
  company: Company
  isAuthenticated: boolean
  size?: "card" | "page"
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const hasAnyContact = !!(company.url || company.phone || company.hasContact)
  if (!hasAnyContact) return null

  const sizing =
    size === "page" ? "px-6 py-3 text-sm w-auto" : "px-3 py-2 text-xs w-full"

  if (isAuthenticated) {
    if (company.url) {
      return (
        <a
          href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnPrimary} ${sizing}`}
        >
          Visit site →
        </a>
      )
    }
    if (company.phone) {
      return (
        <a href={`tel:${company.phone}`} className={`${btnPrimary} ${sizing}`}>
          Contact
        </a>
      )
    }
    return null
  }

  return (
    <div className={size === "page" ? "inline-flex flex-col items-center gap-1" : "flex flex-col gap-1 w-full"}>
      <button type="button" onClick={() => setOpen(true)} className={`${btnPrimary} ${sizing}`}>
        <LockIcon />
        Unlock contact
      </button>
      <p className="text-[11px] text-gray-500 text-center">Free account · takes 10 seconds</p>
      {open && (
        <AccountModal
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
```

Design notes: anon never receives real `url`/`phone` (server stripped them; `hasContact` drives visibility) — so the anon branch renders no contact data by construction. The button is full-opacity: the gate reads as a feature, not an error. No red text anywhere.

- [ ] **Step 3: Verify in dev** — `npm run dev`; on `/directory` (still old cards this step — modal wiring is exercised in Task 8's checks; for now just confirm the module compiles) run `npm run build`. Expected: clean build.

- [ ] **Step 4: Commit** — `git add app/components/UnlockContact.tsx && git commit -m "feat: UnlockContact gate — in-place AccountModal signup, premium lock styling"`

---

### Task 7: Shared `BuyerCard`

**Files:**
- Create: `app/components/BuyerCard.tsx`

**Interfaces:**
- Consumes: `Chip`, `VerifiedBadge`, `FeaturedBadge`, `MonogramAvatar`, `PinIcon`, `btnSecondary` (Task 1); `UnlockContact` (Task 6); `STATE_LABELS` from `@/lib/states`; `CompanyWithMiles` shape (`miles` optional) from Task 5.
- Produces: `BuyerCard({ company, isAuthenticated }: { company: Company & { miles?: number | null }; isAuthenticated: boolean })` — used by directory (Task 8), homepage (Task 9), company-page "nearby" (Task 10), state pages (Task 12).

- [ ] **Step 1: Implement `app/components/BuyerCard.tsx`**

```tsx
import Link from "next/link"
import type { Company } from "@/lib/types"
import { STATE_LABELS } from "@/lib/states"
import { Chip, VerifiedBadge, FeaturedBadge, MonogramAvatar, PinIcon, btnSecondary } from "./ui"
import { UnlockContact } from "./UnlockContact"

export function BuyerCard({
  company,
  isAuthenticated,
}: {
  company: Company & { miles?: number | null }
  isAuthenticated: boolean
}) {
  const stateLabels = company.states
    .slice(0, 2)
    .map((s) => STATE_LABELS[s] ?? s)
    .join(", ")
  const moreStates = company.states.length > 2 ? ` +${company.states.length - 2}` : ""
  const brands = company.accepted_brands ?? []

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all">
      <div className="flex items-start gap-3">
        <MonogramAvatar name={company.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-extrabold text-gray-900 text-sm leading-snug">{company.name}</h3>
            {company.verified && <VerifiedBadge />}
            {company.featured && <FeaturedBadge />}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            {company.miles != null && (
              <span className="inline-flex items-center gap-0.5 font-bold text-ink-deep bg-electric/20 px-1.5 py-0.5 rounded-md">
                <PinIcon className="w-3 h-3" />~{company.miles < 10 ? company.miles.toFixed(1) : Math.round(company.miles)} mi
              </span>
            )}
            <span className="truncate">
              {company.city ? `${company.city} · ` : ""}
              {stateLabels}
              {moreStates}
            </span>
          </p>
        </div>
        {company.rating != null && (
          <span className="shrink-0 text-xs font-bold text-green-800 bg-green-50 px-2 py-0.5 rounded-md">
            ★ {company.rating}
          </span>
        )}
      </div>

      {company.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{company.description}</p>
      )}

      {brands.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {brands.slice(0, 3).map((b) => (
            <Chip key={b}>{b}</Chip>
          ))}
          {brands.length > 3 && <span className="text-xs text-gray-400 py-0.5">+{brands.length - 3}</span>}
        </div>
      )}

      {company.payment_methods?.length > 0 && (
        <p className="text-xs text-gray-600">
          💵 {company.payment_methods.join(" · ")}
          {company.response_time ? (
            <span className="font-semibold text-gray-800"> · Responds in {company.response_time}</span>
          ) : null}
        </p>
      )}

      <div className="flex gap-2 mt-auto pt-1 items-stretch">
        <Link href={`/company/${company.slug}`} className={`${btnSecondary} flex-1 !px-3 !py-2 !text-xs`}>
          View profile
        </Link>
        <div className="flex-1">
          <UnlockContact company={company} isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </div>
  )
}
```

Note: when neither url/phone/hasContact exists, `UnlockContact` renders null and "View profile" simply takes the row alone — no fake fallback phone number (the old cards' hardcoded `tel:5187799751` fallback is intentionally dropped; the profile page is the canonical destination).

- [ ] **Step 2: Build check** — `npm run build`. Expected: clean (component not yet consumed).
- [ ] **Step 3: Commit** — `git add app/components/BuyerCard.tsx && git commit -m "feat: shared BuyerCard with distance, badges, brand chips"`

---

### Task 8: Directory page rebuild (ZIP search + tiers + fallback)

**Files:**
- Modify: `app/directory/filters.tsx` (full rewrite)
- Modify: `app/directory/page.tsx` (full rewrite)
- Create: `app/components/ZipCookieSync.tsx`

**Interfaces:**
- Consumes: `getZipCentroid`, `tierCompanies`, types (Task 5); `isValidZip` (Task 2); `BuyerCard` (Task 7); `stripCompanyContact`, `createServerSupabaseClient`, `supabase` (anon client), `buildItemListSchema`, `JsonLd`, `STATE_LABELS` (existing).
- Produces: `/directory?zip=NNNNN` tiered results; `c4ts_zip` cookie (client-set, 30-day, path=/); `DirectorySearch({ currentState, currentZip, stateLabels })` client component (also used by homepage hero form target — homepage posts to the same URL shape).

- [ ] **Step 1: Create `app/components/ZipCookieSync.tsx`**

```tsx
"use client"

import { useEffect } from "react"

// Persists the last searched ZIP client-side so profile pages and return
// visits can show distances. Not sensitive: user-entered, never logged.
export function ZipCookieSync({ zip }: { zip: string }) {
  useEffect(() => {
    document.cookie = `c4ts_zip=${encodeURIComponent(zip)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
  }, [zip])
  return null
}
```

- [ ] **Step 2: Rewrite `app/directory/filters.tsx`** as `DirectorySearch`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DirectorySearch({
  currentState,
  currentZip,
  stateLabels,
}: {
  currentState?: string;
  currentZip?: string;
  stateLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [zip, setZip] = useState(currentZip ?? "");

  function submitZip(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = zip.trim();
    if (/^\d{5}$/.test(cleaned)) router.push(`/directory?zip=${cleaned}`);
  }

  function handleStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    router.push(val ? `/directory?state=${val.toLowerCase()}` : "/directory");
  }

  const sortedStates = Object.entries(stateLabels).sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <form onSubmit={submitZip} className="flex items-stretch bg-white border-2 border-ink rounded-lg overflow-hidden">
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
          inputMode="numeric"
          placeholder="Enter ZIP code"
          aria-label="ZIP code"
          className="px-3 py-2 text-sm w-36 focus:outline-none"
        />
        <button type="submit" className="bg-ink text-electric font-extrabold text-sm px-4 hover:bg-ink-deep transition-colors">
          Find buyers
        </button>
      </form>

      <select
        value={currentState?.toUpperCase() ?? ""}
        onChange={handleStateChange}
        aria-label="Filter by state"
        className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cash"
      >
        <option value="">All states</option>
        {sortedStates.map(([code, label]) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>

      {(currentState || currentZip) && (
        <button onClick={() => router.push("/directory")} className="text-sm text-gray-500 hover:text-ink underline">
          Clear
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite `app/directory/page.tsx`**

```tsx
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { DirectorySearch } from "./filters";
import { STATE_LABELS } from "@/lib/states";
import type { Company } from "@/lib/types";
import { stripCompanyContact } from "@/lib/company-contact";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildItemListSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import { BuyerCard } from "@/app/components/BuyerCard";
import { ZipCookieSync } from "@/app/components/ZipCookieSync";
import { isValidZip } from "@/lib/geo";
import { getZipCentroid, tierCompanies, type CompanyWithMiles } from "@/lib/zip-lookup";

const COMPANY_COLUMNS =
  "id, name, slug, url, phone, email, city, owner_name, states, payment_methods, accepted_brands, rating, description, featured, lat, lng, verified, transaction_modes, response_time, est_year";

export const metadata: Metadata = {
  title: "Directory — Find Test Strip Buyers Near You",
  description:
    "Browse our full directory of cash buyers for diabetic test strips. Search by ZIP code to find buyers near you.",
  // All ?state=/?zip= filtered views canonicalize to the unfiltered directory —
  // same content with a subset applied, not distinct pages.
  alternates: { canonical: "https://cash4teststripsusa.com/directory" },
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; zip?: string }>;
}) {
  const { state, zip } = await searchParams;

  let query = supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("mail_in", false)
    .order("featured", { ascending: false })
    .order("name");

  if (state) query = query.contains("states", [state.toUpperCase()]);

  const { data } = await query;
  const rawCompanies = (data ?? []) as Company[];

  const supabaseServer = await createServerSupabaseClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const isAuthenticated = !!user;
  const companies = isAuthenticated ? rawCompanies : rawCompanies.map(stripCompanyContact);

  // ZIP proximity mode
  const zipValid = !!zip && isValidZip(zip);
  const centroid = zipValid ? await getZipCentroid(supabase, zip) : null;
  const tiers = centroid ? tierCompanies(companies, centroid) : null;

  // Mail-in fallback card data (Feldon's own operation) — only in ZIP mode
  let mailIn: Company | null = null;
  if (tiers) {
    const { data: mailInRow } = await supabase
      .from("companies")
      .select(COMPANY_COLUMNS)
      .eq("mail_in", true)
      .limit(1)
      .maybeSingle();
    if (mailInRow) {
      const row = mailInRow as Company;
      mailIn = isAuthenticated ? row : stripCompanyContact(row);
    }
  }

  const itemListSchema = buildItemListSchema(
    companies.map((c) => ({ name: c.name, url: `https://cash4teststripsusa.com/company/${c.slug}` }))
  );

  const stateCode = state?.toUpperCase();
  const stateLabel = stateCode ? (STATE_LABELS[stateCode] ?? stateCode) : null;
  const zipStateLabel = centroid?.state ? (STATE_LABELS[centroid.state] ?? centroid.state) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <JsonLd data={itemListSchema} />
      {zipValid && centroid && <ZipCookieSync zip={zip!} />}

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
          {centroid
            ? `Buyers near ${zip}`
            : stateLabel
              ? `Test Strip Buyers in ${stateLabel}`
              : "Find a Test Strip Buyer"}
        </h1>
        <p className="text-gray-500">
          {centroid
            ? "Sorted by distance from your ZIP — contact info unlocks with a free account."
            : `${companies.length} buyer${companies.length !== 1 ? "s" : ""} found${stateLabel ? ` in ${stateLabel}` : ""}`}
        </p>
        {zip && !zipValid && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3 inline-block">
            "{zip}" isn't a valid 5-digit ZIP — showing all buyers instead.
          </p>
        )}
        {zip && zipValid && !centroid && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3 inline-block">
            We couldn't locate ZIP {zip} — showing all buyers instead.
          </p>
        )}
      </div>

      <DirectorySearch currentState={state} currentZip={zipValid ? zip : undefined} stateLabels={STATE_LABELS} />

      {tiers ? (
        <div className="space-y-10">
          <TierSection title="Near you" subtitle="Within 25 miles" companies={tiers.near} isAuthenticated={isAuthenticated} />
          <TierSection title="Within driving distance" subtitle="25–100 miles" companies={tiers.driving} isAuthenticated={isAuthenticated} />
          <TierSection
            title={zipStateLabel ? `Serving ${zipStateLabel}` : "Serving your state"}
            subtitle="Statewide buyers"
            companies={tiers.inState}
            isAuthenticated={isAuthenticated}
          />
          {tiers.near.length === 0 && tiers.driving.length === 0 && tiers.inState.length === 0 && (
            <p className="text-gray-500">
              No local buyers near {zip} yet — but you're covered:
            </p>
          )}
          {mailIn && <MailInFallback company={mailIn} isAuthenticated={isAuthenticated} />}
          <p className="text-sm text-gray-400">
            Not what you're looking for? <Link href="/directory" className="underline hover:text-ink">Browse all buyers</Link>
          </p>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">No buyers found</p>
          <p className="text-sm">
            Try clearing the state filter or{" "}
            <a href="mailto:feldon.richards@gmail.com" className="text-cash hover:underline">contact us</a> to add your area.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <BuyerCard key={c.id} company={c} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      )}
    </div>
  );
}

function TierSection({
  title,
  subtitle,
  companies,
  isAuthenticated,
}: {
  title: string;
  subtitle: string;
  companies: CompanyWithMiles[];
  isAuthenticated: boolean;
}) {
  if (companies.length === 0) return null;
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{subtitle}</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => (
          <BuyerCard key={c.id} company={c} isAuthenticated={isAuthenticated} />
        ))}
      </div>
    </section>
  );
}

function MailInFallback({ company, isAuthenticated }: { company: Company; isAuthenticated: boolean }) {
  return (
    <section className="bg-ink rounded-2xl p-6 sm:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-[11px] font-extrabold text-electric uppercase tracking-wider mb-1">
            Mail-in — serves all 50 states
          </p>
          <h2 className="text-xl font-black mb-1">No local buyer? We buy by mail.</h2>
          <p className="text-sm text-white/70">
            Free prepaid shipping label, payment within 24 hours of verification. Run by Cash For Test Strips USA.
          </p>
        </div>
        <div className="shrink-0">
          <UnlockContact company={company} isAuthenticated={isAuthenticated} size="page" />
        </div>
      </div>
    </section>
  );
}
```

…and add `import { UnlockContact } from "@/app/components/UnlockContact";` to the page's imports (server components may render client islands directly).

**Search-input cookie prefill:** the spec wants the directory ZIP input pre-filled from `?zip=` *or* the cookie. In the page component, read the cookie (`import { cookies } from "next/headers"`; `const cookieZip = (await cookies()).get("c4ts_zip")?.value`) and pass `currentZip={zipValid ? zip : cookieZip && isValidZip(cookieZip) ? cookieZip : undefined}` to `DirectorySearch`. The cookie only pre-fills the input — it must NOT auto-run a proximity search (tiers render only when `?zip=` is present).

- [ ] **Step 4: Dev-server verification** (`npm run dev`, logged OUT):
  - `http://localhost:3000/directory` → browse-all grid of new BuyerCards, no red text anywhere.
  - `http://localhost:3000/directory?zip=12208` → "Near you" contains the Albany buyer with a `~0–5 mi` pill; "Serving New York" contains the NYC buyer; dark mail-in fallback section at bottom; clicking "Unlock contact" opens the signup modal in place.
  - `http://localhost:3000/directory?zip=59718` (Bozeman MT — no buyers) → no dead end: fallback section renders with the "No local buyers near…" line.
  - `http://localhost:3000/directory?zip=abc12` → amber invalid-ZIP notice + full grid.
- [ ] **Step 5: Anon leak check** — `curl -s "http://localhost:3000/directory?zip=12208" | grep -c "api/track"` → expect `0`.
- [ ] **Step 6: Run `npm test` + `npm run build`** — all green.
- [ ] **Step 7: Commit** — `git add app/directory/ app/components/ZipCookieSync.tsx && git commit -m "feat: ZIP proximity directory — distance tiers, mail-in fallback, premium gate"`

---

### Task 9: Homepage rebuild

**Files:**
- Modify: `app/page.tsx` (full rewrite of JSX; FAQ array + schema calls preserved verbatim)

**Interfaces:**
- Consumes: `BuyerCard` (Task 7), `btnOnDark`/`btnSecondary` (Task 1), `STATE_LABELS` from `@/lib/states` (replaces the page's private copy), existing schema builders + `stripCompanyContact` pattern.
- Produces: homepage with hero ZIP form submitting GET to `/directory` (plain `<form action="/directory" method="get">` with `name="zip"` input — no client JS needed).

- [ ] **Step 1: Rewrite `app/page.tsx`.** Keep EXACTLY as-is: the `homeFaqs` array (verbatim — FAQPage schema), the three `JsonLd` calls, the `metadata` export, the featured-companies fetch + `stripCompanyContact` gating block (lines fetching `featured` + auth check), `POPULAR_STATES`. Replace the local `STATE_LABELS` const with `import { STATE_LABELS } from "@/lib/states"`, delete the local `CompanyCard` (BuyerCard replaces it), update the featured select to the `COMPANY_COLUMNS` list from Task 8 (copy the string; it isn't exported). New JSX structure:

```tsx
      {/* Hero — dark ink, heavy type, ZIP-first */}
      <section className="bg-ink text-white py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="inline-block text-[11px] font-extrabold text-electric uppercase tracking-wider mb-5">
            The national directory of diabetic supply buyers
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-4">
            Turn extra supplies<br />into <span className="text-electric">cash today.</span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8">
            Local buyers pay{" "}
            <Link href="/how-much-are-diabetic-test-strips-worth" className="font-extrabold text-white underline decoration-electric decoration-2 underline-offset-4 hover:text-electric transition-colors">
              up to $100 a box
            </Link>{" "}
            for sealed, unexpired supplies. Cash in hand, same day.
          </p>

          <form action="/directory" method="get" className="flex items-stretch max-w-md mx-auto bg-white rounded-xl p-1.5 shadow-2xl shadow-black/30">
            <input
              name="zip"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              placeholder="Enter your ZIP code"
              aria-label="ZIP code"
              className="flex-1 min-w-0 px-4 text-gray-900 text-sm focus:outline-none rounded-l-lg"
            />
            <button type="submit" className="bg-cash text-white font-extrabold text-sm px-6 py-3.5 rounded-lg hover:bg-cash-hover transition-colors shrink-0">
              Find buyers →
            </button>
          </form>

          <div className="flex justify-center gap-8 mt-10 text-sm">
            <span className="text-white/60"><b className="text-electric font-black text-lg">{localBuyerCount ?? 29}</b> local buyers</span>{/* ?? 29: static fallback if the count query errors */}
            <span className="text-white/60"><b className="text-electric font-black text-lg">24hr</b> payouts</span>
            <span className="text-white/60"><b className="text-electric font-black text-lg">50</b> states</span>
          </div>
        </div>
      </section>
```

`localBuyerCount` comes from a count query added beside the featured fetch:

```tsx
  const { count: localBuyerCount } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("mail_in", false)
    .eq("active", true);
```

Then, in order, all on the light `bg-ground`/white grounds:
- Trust bar (same 5 checkmark items, restyled: `text-gray-600`, `border-y border-gray-100 bg-white`).
- How It Works — same 3 steps/copy; step circles become `bg-ink text-electric font-black`. **Keep `id="how-it-works"` on the section** — the nav's "/#how-it-works" link depends on it.
- Featured Buyers — `<BuyerCard>` grid (same gating), heading row keeps "See all buyers →" link (`text-cash`).
- Browse by State — same links restyled `border-gray-200 hover:border-cash hover:text-cash`.
- FAQ — verbatim copy, headings `font-bold text-gray-900`, on `bg-ground`.
- Final CTA — `bg-ink` section, headline "Ready to turn supplies into cash?", `btnOnDark` button "Find a Buyer →" linking `/directory`.

- [ ] **Step 2: Dev verification (logged out):** hero renders dark with working ZIP form → submits to `/directory?zip=…`; "$100 a box" links to the price guide; featured cards gated (no red text); FAQ text unchanged (diff `homeFaqs` against git HEAD to prove: `git diff HEAD -- app/page.tsx | grep -A2 -B2 "homeFaqs"` shows no content edits).
- [ ] **Step 3: Schema check** — `curl -s http://localhost:3000 | grep -o '"@type":"[A-Za-z]*"' | sort | uniq -c` → still includes `WebSite`, `Service`, `FAQPage`.
- [ ] **Step 4: `npm test` + `npm run build`** green.
- [ ] **Step 5: Commit** — `git add app/page.tsx && git commit -m "feat: Cash Energy homepage — dark hero, ZIP-first search, live stats"`

---

### Task 10: Company profile rebuild (trust dossier + nearby buyers)

**Files:**
- Modify: `app/company/[slug]/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `BuyerCard`, `UnlockContact` (size="page"), ui primitives, `haversineMiles` (Task 2), `getZipCentroid` (Task 5), `cookies()` from `next/headers`, existing `buildLocalBusinessSchema`/`JsonLd`/`stripCompanyContact`.
- Produces: dossier profile; distance line when `c4ts_zip` cookie present; "Other buyers nearby" (top 3 by haversine from this buyer's coords, excluding self and mail-in; falls back to same-state when no coords).

- [ ] **Step 1: Rewrite the page.** Keep: `generateMetadata` (as-is), the company fetch + `notFound()` guard + auth/strip block, `buildLocalBusinessSchema` + `JsonLd`. Update the select to `COMPANY_COLUMNS` (copy the Task 8 string). Add after the strip block:

```tsx
  // Distance from the visitor's last searched ZIP (cookie set by directory search)
  const cookieStore = await cookies();
  const cookieZip = cookieStore.get("c4ts_zip")?.value;
  let milesAway: number | null = null;
  if (cookieZip && isValidZip(cookieZip) && company.lat != null && company.lng != null) {
    const centroid = await getZipCentroid(supabase, cookieZip);
    if (centroid) milesAway = haversineMiles(centroid, { lat: company.lat, lng: company.lng });
  }

  // Nearby buyers: top 3 others, by distance when this buyer has coords
  const { data: othersData } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("mail_in", false)
    .neq("id", rawCompany.id);
  const others = ((othersData ?? []) as Company[]).map((c) =>
    isAuthenticated ? c : stripCompanyContact(c)
  );
  const nearby = (
    company.lat != null && company.lng != null
      ? withDistance(others, { lat: company.lat, lng: company.lng })
      : others
          .filter((c) => c.states.some((s) => company.states.includes(s)))
          .map((c) => ({ ...c, miles: null as number | null }))
  ).slice(0, 3);
```

with imports `import { cookies } from "next/headers"`, `import { isValidZip, haversineMiles, withDistance } from "@/lib/geo"`, `import { getZipCentroid } from "@/lib/zip-lookup"`.

**Important:** the `nearby` cards must NOT show the miles-from-this-buyer as if it were miles-from-the-visitor — pass `company={{ ...c, miles: undefined }}` when rendering nearby BuyerCards unless `milesAway` logic was applied. Concretely: strip `miles` before render: `nearby.map(({ miles: _m, ...c }) => <BuyerCard key={c.id} company={c as Company} isAuthenticated={isAuthenticated} />)`.

JSX structure (all light ground):

```tsx
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={localBusinessSchema} />
      <Link href="/directory" className="text-sm text-gray-500 hover:text-ink mb-6 inline-block">← Back to directory</Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <MonogramAvatar name={company.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {company.verified && <VerifiedBadge />}
              {company.featured && <FeaturedBadge />}
              {company.rating != null && (
                <span className="text-xs font-bold text-green-800 bg-green-50 px-2 py-0.5 rounded-md">★ {company.rating}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">{company.name}</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
              <PinIcon className="w-3.5 h-3.5" />
              {company.city ?? stateNames[0] ?? "United States"}
              {milesAway != null && (
                <span className="font-bold text-ink-deep bg-electric/20 px-1.5 py-0.5 rounded-md">
                  ~{milesAway < 10 ? milesAway.toFixed(1) : Math.round(milesAway)} mi from you
                </span>
              )}
            </p>
          </div>
        </div>

        {company.description && <p className="text-gray-600 leading-relaxed mb-8">{company.description}</p>}

        {/* What they buy */}
        {company.accepted_brands?.length > 0 && (
          <ProfileSection label="What they buy">
            <div className="flex flex-wrap gap-1.5">
              {company.accepted_brands.map((b) => <Chip key={b}>{b}</Chip>)}
            </div>
          </ProfileSection>
        )}

        {/* How this buyer works */}
        <ProfileSection label="How this buyer works">
          <div className="flex flex-wrap gap-1.5">
            {(company.transaction_modes ?? ["meetup"]).map((m) => (
              <Chip key={m}>{{ meetup: "Local meetup", pickup: "Pickup", mail_in: "Mail-in" }[m] ?? m}</Chip>
            ))}
          </div>
        </ProfileSection>

        {/* Payment & speed */}
        <ProfileSection label="Payment & speed">
          <p className="text-sm text-gray-700">
            {company.payment_methods?.length ? company.payment_methods.join(" · ") : "Ask the buyer"}
            {company.response_time && <span className="font-semibold"> · Responds in {company.response_time}</span>}
            {company.est_year && <span className="text-gray-400"> · Buying since {company.est_year}</span>}
          </p>
        </ProfileSection>

        <ProfileSection label="States served">
          <p className="text-sm text-gray-700">{stateNames.length > 0 ? stateNames.join(", ") : "Contact for availability"}</p>
        </ProfileSection>

        {company.owner_name && (
          <ProfileSection label="Contact person">
            <p className="text-sm text-gray-700">{company.owner_name}</p>
          </ProfileSection>
        )}

        {/* CTA */}
        <div className="bg-ink rounded-xl p-6 text-center text-white mt-8">
          <h2 className="font-black text-lg mb-1">Ready to sell to {company.name.split(" ")[0]}?</h2>
          <p className="text-sm text-white/60 mb-4">Contact info unlocks free — takes 10 seconds.</p>
          <UnlockContact company={company} isAuthenticated={isAuthenticated} size="page" />
        </div>
      </div>

      {/* Nearby */}
      {nearby.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Other buyers nearby</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearby.map(({ miles: _m, ...c }) => (
              <BuyerCard key={c.id} company={c as Company} isAuthenticated={isAuthenticated} />
            ))}
          </div>
        </div>
      )}
    </div>
```

Full import list for the rewritten page: `Link` from next/link, `notFound` from next/navigation, `cookies` from next/headers, `supabase` from `@/lib/supabase`, `Metadata` type, `STATE_LABELS` from `@/lib/states`, `Company` from `@/lib/types`, `stripCompanyContact` from `@/lib/company-contact`, `createServerSupabaseClient` from `@/lib/supabase/server`, `buildLocalBusinessSchema` from `@/lib/schema`, `JsonLd` from `@/app/components/JsonLd`, `isValidZip`/`haversineMiles`/`withDistance` from `@/lib/geo`, `getZipCentroid` from `@/lib/zip-lookup`, `BuyerCard` from `@/app/components/BuyerCard`, `UnlockContact` from `@/app/components/UnlockContact`, `MonogramAvatar`/`VerifiedBadge`/`FeaturedBadge`/`PinIcon`/`Chip` from `@/app/components/ui`.

with helper:

```tsx
function ProfileSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Dev verification:** visit `/directory?zip=12208`, click into the Albany buyer → "~X mi from you" renders (cookie flow); a profile visited with no cookie shows no distance; nearby grid shows 3 cards; anon page has zero contact info (`curl -s http://localhost:3000/company/cash-for-test-strips-indiana | grep -c "api/track"` → 0); LocalBusiness schema still present in HTML.
- [ ] **Step 3: `npm test` + `npm run build`** green.
- [ ] **Step 4: Commit** — `git add "app/company/[slug]/page.tsx" && git commit -m "feat: trust-dossier company profiles with distance + nearby buyers"`

---

### Task 11: Dark nav + footer

**Files:**
- Modify: `app/SiteNav.tsx`
- Modify: `app/layout.tsx` (header/footer JSX only — metadata untouched)

**Interfaces:**
- Consumes: existing `useUser`/`signOut`.
- Produces: dark shell used by every page.

- [ ] **Step 1: Update `app/SiteNav.tsx`:**
  - `NAV_LINKS` becomes: `{ href: "/directory", label: "Find a Buyer" }, { href: "/how-much-are-diabetic-test-strips-worth", label: "Price Guide" }, { href: "/blog", label: "Blog" }, { href: "/#how-it-works", label: "How It Works" }`.
  - Brand link: `<Link href="/" className="font-black text-lg tracking-tight text-white">Cash For Test Strips <span className="text-electric">USA</span></Link>` (display name stays spelled out).
  - Container/link colors for dark bg: desktop links `text-white/70 hover:text-white`; user email `text-white/40`; Login link same treatment; "Get Cash Now" → `bg-electric text-ink-deep font-extrabold px-4 py-2 rounded-lg hover:bg-white transition-colors` (both desktop + mobile instances).
  - Mobile menu panel: `bg-ink border-b border-white/10` with `text-white/80` links; hamburger `text-white`.
- [ ] **Step 2: Update `app/layout.tsx`:**
  - Header: `className="bg-ink sticky top-0 z-50"` (drop the light border).
  - Body: `bg-ground` instead of `bg-white`.
  - Footer → dark: `className="bg-ink mt-16 py-12 text-sm text-white/60"`; inner: brand line `font-black text-white` "Cash For Test Strips <span className='text-electric'>USA</span>"; link groups (flex wrap, `hover:text-white`): Directory `/directory`, Price Guide `/how-much-are-diabetic-test-strips-worth`, Is It Legal? `/is-it-legal-to-sell-diabetic-test-strips`, About `/about`, Blog `/blog`, Manage Your Listing `/buyer`, Contact `mailto:feldon.richards@gmail.com`.
- [ ] **Step 3: Dev check all key routes** (`/`, `/directory`, `/blog`, `/sell`, `/login`) — nav legible, mobile menu works at 390px, sticky works, no layout shift. **Note:** pages not yet reskinned (blog, sell, auth) must still look coherent under the dark shell — verify none had a white-on-white dependency on the old header (they didn't; header was self-contained).
- [ ] **Step 4: `npm run build`** green.
- [ ] **Step 5: Commit** — `git add app/SiteNav.tsx app/layout.tsx && git commit -m "feat: dark nav + footer shell, Price Guide promoted to nav"`

---

### Task 12: State pages + /sell reskin

**Files:**
- Modify: `app/sell-test-strips/[state]/page.tsx` (swap `StateCompanyCard` → `BuyerCard`; restyle headings/CTAs; content + schema untouched)
- Modify: `app/sell/page.tsx`, `app/sell/SellFlowClient.tsx` (class-level reskin only; NO logic changes)

**Interfaces:**
- Consumes: `BuyerCard` (Task 7), tokens (Task 1).
- Produces: consistent Cash Energy styling on the SEO state pages and the sell wizard.

- [ ] **Step 1: State pages** — in `app/sell-test-strips/[state]/page.tsx`:
  - Update the companies `select(...)` to the Task 8 `COMPANY_COLUMNS` string.
  - Delete the whole local `StateCompanyCard` component; render `<BuyerCard company={c} isAuthenticated={isAuthenticated} />` in its place (imports at top). The page's `stripCompanyContact` gating block stays byte-identical.
  - Restyle ONLY: h1 → `text-3xl sm:text-4xl font-black tracking-tight`; primary CTAs on the page → `btnPrimary`; section headings → `font-extrabold`. Body copy, FAQ text, and every `JsonLd` call remain byte-identical.
- [ ] **Step 2: Sell wizard reskin** — in `SellFlowClient.tsx` + `app/sell/page.tsx`, apply class swaps only (use search-replace; touch no handlers/state/JSX structure):

| Old (emerald starter) | New (Cash Energy) |
|---|---|
| `bg-emerald-600` | `bg-cash` |
| `hover:bg-emerald-700` | `hover:bg-cash-hover` |
| `text-emerald-600` / `text-emerald-700` | `text-cash` |
| `bg-emerald-50` | `bg-electric/10` |
| `border-emerald-500` / `ring-emerald-500` | `border-cash` / `ring-cash` |
| `rounded-full` on buttons | `rounded-lg` |
| step-circle `bg-emerald-600 text-white` | `bg-ink text-electric font-black` |
| page h1 `font-bold` | `font-black tracking-tight` |

  Also: product tiles get `border-gray-200 hover:border-cash` and selected state `border-cash ring-2 ring-cash/30`. If a class in the table doesn't appear, skip it — do not invent new structural changes.
- [ ] **Step 3: State prefill from ZIP cookie** — in `SellFlowClient.tsx`, where the state `<select>`'s value/state hook initializes empty, add a mount effect (client file already `"use client"`):

```tsx
useEffect(() => {
  if (stateValue) return
  const m = document.cookie.match(/(?:^|; )c4ts_zip=(\d{5})/)
  if (!m) return
  fetch(`/api/zip-state?zip=${m[1]}`).then((r) => (r.ok ? r.json() : null)).then((d) => {
    if (d?.state) setStateValue(d.state)
  }).catch(() => {})
}, [])
```

  (Adapt `stateValue`/`setStateValue` to the actual state-select hook names found in the file — locate the `<select>` bound near the `"Select a state"` placeholder and use its exact `useState` pair. **Guard:** if the state select's binding is not a single obvious useState pair, SKIP this prefill entirely rather than restructuring the wizard — the prefill is a nice-to-have, the no-logic-changes rule is not.) Add the tiny route `app/api/zip-state/route.ts`:

```ts
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { isValidZip } from "@/lib/geo"
import { getZipCentroid } from "@/lib/zip-lookup"

export async function GET(request: Request) {
  const zip = new URL(request.url).searchParams.get("zip") ?? ""
  if (!isValidZip(zip)) return NextResponse.json({ state: null }, { status: 400 })
  const centroid = await getZipCentroid(supabase, zip)
  return NextResponse.json({ state: centroid?.state ?? null })
}
```

- [ ] **Step 4: Dev verification:** `/sell-test-strips/ny` shows BuyerCards gated for anon (curl: 0 `api/track`); `/sell` wizard walks all 3 steps with new styling, no behavior change; after a `/directory?zip=12208` search, `/sell` pre-selects NY.
- [ ] **Step 5: `npm test` + `npm run build`** green.
- [ ] **Step 6: Commit** — `git add app/sell-test-strips/ app/sell/ app/api/zip-state/ && git commit -m "feat: reskin state pages + sell wizard, ZIP-aware state prefill"`

---

### Task 13: Full audit — tests, leak grep, mobile, build

**Files:**
- No new files (fixes only, if the audit finds anything).

- [ ] **Step 1: Full suite** — `npm test`. Expected: every existing test + the new geo/zip-lookup/monogram tests pass.
- [ ] **Step 2: Anon leak audit against dev server** (logged out):

```bash
for p in "/" "/directory" "/directory?zip=12208" "/directory?zip=59718" "/company/cash-for-test-strips-indiana" "/sell-test-strips/ny"; do
  echo "== $p =="
  curl -s "http://localhost:3000$p" | grep -c "api/track" || true
done
```

Expected: `0` on every line. Also `grep -o "tel:[0-9]*" ` each page → no buyer phone numbers for anon (the old hardcoded fallback `tel:5187799751` is gone from cards by design).
- [ ] **Step 3: Signed-in spot check** — log in with a test account in the browser; `/directory?zip=12208` now shows working "Visit site →"/"Contact" buttons; signup modal flow from a fresh incognito window converts and reveals contact in place.
- [ ] **Step 4: Mobile pass** — 390px viewport (real innerWidth per repo convention): `/`, `/directory?zip=12208`, one company page, `/sell`. No horizontal scroll, tap targets sane, dark hero readable.
- [ ] **Step 5: Lint + build** — `npm run lint && npm run build` clean.
- [ ] **Step 6: Commit any audit fixes** — `git add -A && git commit -m "fix: audit pass fixes"` (skip if nothing changed).

---

### Task 14: Ship — push, deploy-verify, live checks

- [ ] **Step 1: Confirm with Feldon before pushing** (deploy = push on this repo; bypass-mode rule requires explicit confirm for deploys).
- [ ] **Step 2:** `git push` → Vercel auto-deploys. Verify via `vercel list --yes` (MCP deploy tools 403 on this project) or dashboard — status READY on the new commit.
- [ ] **Step 3: Live verification:**

```bash
curl -s https://cash4teststripsusa.com | grep -c "up to \$100 a box"        # ≥1
curl -s "https://cash4teststripsusa.com/directory?zip=12208" | grep -c "Near you"   # ≥1
curl -s "https://cash4teststripsusa.com/directory?zip=12208" | grep -c "api/track"  # 0 (anon)
curl -s https://cash4teststripsusa.com | grep -o '"@type":"FAQPage"' | head -1      # present
```

Plus a real-browser pass (anon + signed-in, mobile + desktop) of /, /directory?zip=12208, a company page, /sell.
- [ ] **Step 4: Post-ship notes** — update `~/SecondBrain/business/wiki/dev-donna-status.md` (redesign live) and the Dev Donna memory file for this project; remind Feldon of his curation list: flip `verified` per buyer he vouches for, optionally fill `response_time`/`est_year`/`transaction_modes`, decide Ottawa.
