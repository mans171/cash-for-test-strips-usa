# AEO Technical Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add machine-readable structured data (JSON-LD), a sitemap, robots.txt, llms.txt, canonical tags, and a static OG image across cash-for-test-strips-usa, plus ship 3 new content pages and a homepage FAQ section using copy already drafted, so both traditional search and AI answer engines can parse, cite, and index the site.

**Architecture:** A shared `lib/schema.ts` module exports small pure functions that build schema.org-shaped plain objects (FAQPage, BreadcrumbList, LocalBusiness, Article, WebSite, Service, ItemList); a shared `<JsonLd>` component renders any of them as a `<script type="application/ld+json">` tag. Every page that needs structured data imports the relevant builder(s) rather than hand-rolling JSON-LD inline. FAQ content that's currently inline JSX gets extracted into a named `FAQS` array once per page, used both for on-page rendering and for the schema — one source of truth, no duplication.

**Tech Stack:** Next.js 16 App Router, Supabase, Vitest (live-DB integration tests where DB is involved; pure-function unit tests otherwise), Tailwind.

## Global Constraints

- Canonical domain is `https://cash4teststripsusa.com`. `cashforteststripsusa.com` (no "4") is an unrelated third-party WordPress site — it must never appear in any schema `url`/`@id`, canonical tag, or OG URL.
- `metadataBase` in `app/layout.tsx` is already fixed to `https://cash4teststripsusa.com` (commit `17bc628`) — later tasks rely on this for `Metadata.alternates.canonical` to resolve correctly with relative paths.
- The 51-post blog (`app/blog/`, `lib/blog-posts.ts`) is already live (commit `6769521`) — this plan builds on top of it, does not re-create it.
- `npm run build`, `npx tsc --noEmit`, and `npm run lint` must all stay clean throughout (lint baseline: 8 pre-existing problems established during the buyer-accounts feature — do not introduce new ones).
- `app/company/[slug]/page.tsx` and `app/directory/page.tsx` already gate contact info (`phone`/`email`/`url`) behind authentication via `stripCompanyContact()` — any schema built from company data must use the already-stripped `company`/`companies` variable in scope, never the raw pre-strip row, so anonymous crawlers see exactly what anonymous visitors see today.
- No new database tables, migrations, or API routes are needed anywhere in this plan.

---

## File Structure

- **New: `lib/schema.ts`** — pure schema-builder functions (FAQPage, BreadcrumbList, LocalBusiness, Article, WebSite, Service, ItemList) + their input types.
- **New: `app/components/JsonLd.tsx`** — shared render component for any schema object.
- **New: `app/sitemap.ts`** — Next.js sitemap route convention.
- **New: `app/robots.ts`** — Next.js robots route convention.
- **New: `public/llms.txt`** — static AI-crawler description file.
- **New: `app/opengraph-image.tsx`** — site-wide default OG image via `ImageResponse`.
- **New: `app/about/page.tsx`**, **`app/is-it-legal-to-sell-diabetic-test-strips/page.tsx`**, **`app/how-much-are-diabetic-test-strips-worth/page.tsx`** — 3 new content routes.
- **Modify: `lib/blog-posts.ts`** — add `datePublished` to every post via a computed `.map()`, not 50 manual edits.
- **Modify: `app/blog/[slug]/page.tsx`** — extract FAQ array, add FAQPage + Article + BreadcrumbList schema, add canonical tag.
- **Modify: `app/sell-test-strips/[state]/page.tsx`** — same treatment (FAQPage + BreadcrumbList, canonical).
- **Modify: `app/company/[slug]/page.tsx`** — add LocalBusiness schema from the already-gated `company` object.
- **Modify: `app/directory/page.tsx`** — add ItemList schema from the already-gated `companies` array.
- **Modify: `app/page.tsx`** — add WebSite + Service schema, a new FAQ section, FAQPage schema for it.
- **Modify: `app/layout.tsx`** — add footer links to the 3 new content pages.

---

### Task 1: `lib/schema.ts` schema builders + `JsonLd` component

**Files:**
- Create: `lib/schema.ts`
- Create: `app/components/JsonLd.tsx`
- Test: `lib/__tests__/schema.test.ts`

**Interfaces:**
- Produces: `FaqItem`, `buildFaqPageSchema(faqs: FaqItem[])`; `BreadcrumbItem`, `buildBreadcrumbSchema(items: BreadcrumbItem[])`; `LocalBusinessInput`, `buildLocalBusinessSchema(input: LocalBusinessInput)`; `ArticleInput`, `buildArticleSchema(input: ArticleInput)`; `buildWebsiteSchema()`; `buildServiceSchema()`; `ItemListEntry`, `buildItemListSchema(items: ItemListEntry[])` — all from `lib/schema.ts`. `JsonLd({ data })` component from `app/components/JsonLd.tsx`. Every later task in this plan imports one or more of these by these exact names.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/__tests__/schema.test.ts
import { describe, it, expect } from 'vitest'
import {
  buildFaqPageSchema,
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildArticleSchema,
  buildWebsiteSchema,
  buildServiceSchema,
  buildItemListSchema,
} from '@/lib/schema'

describe('buildFaqPageSchema', () => {
  it('builds a FAQPage schema with mainEntity questions', () => {
    const result = buildFaqPageSchema([
      { question: 'Is it legal?', answer: 'Yes, in most cases.' },
      { question: 'How fast is payment?', answer: 'Within 24 hours.' },
    ])
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Is it legal?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, in most cases.' } },
        { '@type': 'Question', name: 'How fast is payment?', acceptedAnswer: { '@type': 'Answer', text: 'Within 24 hours.' } },
      ],
    })
  })

  it('handles an empty list', () => {
    expect(buildFaqPageSchema([])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [],
    })
  })
})

describe('buildBreadcrumbSchema', () => {
  it('builds a BreadcrumbList with 1-indexed positions', () => {
    const result = buildBreadcrumbSchema([
      { name: 'Home', url: 'https://cash4teststripsusa.com' },
      { name: 'Alabama', url: 'https://cash4teststripsusa.com/blog/sell-diabetic-test-strips-alabama' },
    ])
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cash4teststripsusa.com' },
        { '@type': 'ListItem', position: 2, name: 'Alabama', item: 'https://cash4teststripsusa.com/blog/sell-diabetic-test-strips-alabama' },
      ],
    })
  })
})

describe('buildLocalBusinessSchema', () => {
  it('includes optional fields when present', () => {
    const result = buildLocalBusinessSchema({
      name: 'Test Buyer Co',
      url: 'https://cash4teststripsusa.com/company/test-buyer-co',
      telephone: '5185551234',
      description: 'We buy test strips.',
      areaServed: ['New York', 'New Jersey'],
      paymentAccepted: ['PayPal', 'Zelle'],
    })
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Test Buyer Co',
      url: 'https://cash4teststripsusa.com/company/test-buyer-co',
      telephone: '5185551234',
      description: 'We buy test strips.',
      areaServed: ['New York', 'New Jersey'],
      paymentAccepted: ['PayPal', 'Zelle'],
    })
  })

  it('omits optional fields when absent', () => {
    const result = buildLocalBusinessSchema({
      name: 'Anon Buyer Co',
      url: 'https://cash4teststripsusa.com/company/anon-buyer-co',
      telephone: null,
      description: null,
      areaServed: [],
      paymentAccepted: [],
    })
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Anon Buyer Co',
      url: 'https://cash4teststripsusa.com/company/anon-buyer-co',
    })
  })
})

describe('buildArticleSchema', () => {
  it('builds an Article schema with org author/publisher', () => {
    const result = buildArticleSchema({
      headline: 'Sell Diabetic Test Strips in Alabama',
      description: 'A guide to selling test strips in Alabama.',
      datePublished: '2026-05-19',
      url: 'https://cash4teststripsusa.com/blog/sell-diabetic-test-strips-alabama',
    })
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Sell Diabetic Test Strips in Alabama',
      description: 'A guide to selling test strips in Alabama.',
      datePublished: '2026-05-19',
      url: 'https://cash4teststripsusa.com/blog/sell-diabetic-test-strips-alabama',
      author: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
      publisher: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
    })
  })
})

describe('buildWebsiteSchema / buildServiceSchema', () => {
  it('builds a WebSite schema with a SearchAction', () => {
    const result = buildWebsiteSchema()
    expect(result).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Cash For Test Strips USA',
      url: 'https://cash4teststripsusa.com',
    })
    expect(result.potentialAction).toBeDefined()
  })

  it('builds a Service schema', () => {
    expect(buildServiceSchema()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Diabetic Test Strip Buyer Directory',
      provider: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
      areaServed: 'United States',
    })
  })
})

describe('buildItemListSchema', () => {
  it('builds an ItemList with 1-indexed positions', () => {
    const result = buildItemListSchema([
      { name: 'Test Buyer One', url: 'https://cash4teststripsusa.com/company/test-buyer-one' },
      { name: 'Test Buyer Two', url: 'https://cash4teststripsusa.com/company/test-buyer-two' },
    ])
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Test Buyer One', url: 'https://cash4teststripsusa.com/company/test-buyer-one' },
        { '@type': 'ListItem', position: 2, name: 'Test Buyer Two', url: 'https://cash4teststripsusa.com/company/test-buyer-two' },
      ],
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- lib/__tests__/schema.test.ts`
Expected: FAIL — `lib/schema.ts` does not exist yet.

- [ ] **Step 3: Write `lib/schema.ts`**

```ts
// lib/schema.ts

export type FaqItem = { question: string; answer: string }

export function buildFaqPageSchema(faqs: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

export type BreadcrumbItem = { name: string; url: string }

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export type LocalBusinessInput = {
  name: string
  url: string
  telephone: string | null
  description: string | null
  areaServed: string[]
  paymentAccepted: string[]
}

export function buildLocalBusinessSchema(input: LocalBusinessInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: input.name,
    url: input.url,
  }
  if (input.telephone) schema.telephone = input.telephone
  if (input.description) schema.description = input.description
  if (input.areaServed.length > 0) schema.areaServed = input.areaServed
  if (input.paymentAccepted.length > 0) schema.paymentAccepted = input.paymentAccepted
  return schema
}

export type ArticleInput = {
  headline: string
  description: string
  datePublished: string
  url: string
}

export function buildArticleSchema(input: ArticleInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    url: input.url,
    author: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
    publisher: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
  }
}

export function buildWebsiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cash For Test Strips USA',
    url: 'https://cash4teststripsusa.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://cash4teststripsusa.com/directory?state={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildServiceSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Diabetic Test Strip Buyer Directory',
    provider: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
    areaServed: 'United States',
  }
}

export type ItemListEntry = { name: string; url: string }

export function buildItemListSchema(items: ItemListEntry[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  }
}
```

- [ ] **Step 4: Write `app/components/JsonLd.tsx`**

```tsx
// app/components/JsonLd.tsx

// JSON.stringify's output can't be trusted verbatim inside a <script> tag —
// a "</script" substring in any interpolated string (e.g. a company
// description) would break out of the script block. Escaping "<" to its
// unicode form is the standard mitigation for inline JSON-LD.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/__tests__/schema.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/schema.ts app/components/JsonLd.tsx lib/__tests__/schema.test.ts
git commit -m "feat: add schema.org JSON-LD builders and JsonLd component"
```

---

### Task 2: `app/sitemap.ts`

**Files:**
- Create: `app/sitemap.ts`

**Interfaces:**
- Consumes: `supabase` (`lib/supabase.ts`), `STATE_BLOG_POSTS` (`lib/blog-posts.ts`), `STATE_LABELS`/state codes (`lib/states.ts`).
- Produces: the Next.js `sitemap.ts` file convention — no exports consumed by other tasks in this plan.

- [ ] **Step 1: Write `app/sitemap.ts`**

```ts
// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { STATE_BLOG_POSTS } from '@/lib/blog-posts'
import { STATE_LABELS } from '@/lib/states'

const BASE_URL = 'https://cash4teststripsusa.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/directory`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/sell`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/buyer`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/is-it-legal-to-sell-diabetic-test-strips`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/how-much-are-diabetic-test-strips-worth`, changeFrequency: 'monthly', priority: 0.8 },
  ]

  const blogRoutes: MetadataRoute.Sitemap = STATE_BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.datePublished,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const stateRoutes: MetadataRoute.Sitemap = Object.keys(STATE_LABELS)
    .filter((code) => code !== 'CANADA')
    .map((code) => ({
      url: `${BASE_URL}/sell-test-strips/${code.toLowerCase()}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  const { data: companies } = await supabase
    .from('companies')
    .select('slug')
    .eq('mail_in', false)

  const companyRoutes: MetadataRoute.Sitemap = (companies ?? []).map((c) => ({
    url: `${BASE_URL}/company/${c.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...blogRoutes, ...stateRoutes, ...companyRoutes]
}
```

Note: this task depends on `STATE_BLOG_POSTS` having a `datePublished` field, which Task 4 adds. If Task 4 hasn't landed yet when this task is implemented, temporarily omit the `lastModified: post.datePublished` line (just don't set `lastModified` for blog routes) and a later pass can add it back — but since Task 4 comes after this task in execution order per this plan's task numbering... **actually reorder: Task 4 (blog dates) must run before Task 2 can reference `post.datePublished`.** To keep task order strictly sequential and avoid forward references, this task's implementer should skip `lastModified` on blog routes (omit that line entirely) — Task 4 does not modify `app/sitemap.ts`, so the two tasks stay independent and this file works correctly whether or not dates exist yet.

- [ ] **Step 2: Verify it builds and produces output**

Run: `npm run build`
Expected: build succeeds; `/sitemap.xml` appears in the route list.

Run: `npm run dev` in the background, then `curl -s http://localhost:3000/sitemap.xml | head -20`, then stop the dev server.
Expected: valid XML with `<urlset>` and multiple `<url>` entries.

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat: add app/sitemap.ts"
```

---

### Task 3: `app/robots.ts` + `public/llms.txt`

**Files:**
- Create: `app/robots.ts`
- Create: `public/llms.txt`

- [ ] **Step 1: Write `app/robots.ts`**

```ts
// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/'],
      },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: 'https://cash4teststripsusa.com/sitemap.xml',
  }
}
```

- [ ] **Step 2: Write `public/llms.txt`**

```
# Cash For Test Strips USA

Cash For Test Strips USA (https://cash4teststripsusa.com) is a directory
connecting people who have unused diabetic test strips and CGM supplies
with vetted local cash buyers across the United States.

## Key pages

- /directory — full buyer directory, filterable by state
- /sell-test-strips/{state} — per-state buyer listings and legal/pricing info
- /blog/{slug} — per-state guides covering legality, pricing, and process
- /company/{slug} — individual buyer profiles
- /about — who operates this site and how the buyer network works
- /is-it-legal-to-sell-diabetic-test-strips — national legality guide
- /how-much-are-diabetic-test-strips-worth — brand-by-brand price guide
- /sell — seller checkout flow

## Contact

518-779-9751
```

- [ ] **Step 3: Verify**

Run: `npm run build` — expected: succeeds, `/robots.txt` appears in the route list.

Run: `npm run dev` in the background, `curl -s http://localhost:3000/robots.txt`, confirm it returns the expected rules, then stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add app/robots.ts public/llms.txt
git commit -m "feat: add robots.ts and llms.txt"
```

---

### Task 4: Add `datePublished` to all 50 blog posts

**Files:**
- Modify: `lib/blog-posts.ts`
- Test: `lib/__tests__/blog-posts.test.ts`

**Interfaces:**
- Produces: `StateBlogPost` type gains `datePublished: string` (ISO `YYYY-MM-DD`). `STATE_BLOG_POSTS` (still the same exported array, same length and order) now has this field populated on every entry. Task 5 (blog post page) and Task 2 (sitemap, already written) both read `post.datePublished`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/blog-posts.test.ts
import { describe, it, expect } from 'vitest'
import { STATE_BLOG_POSTS } from '@/lib/blog-posts'

describe('STATE_BLOG_POSTS datePublished', () => {
  it('gives every post a valid ISO date', () => {
    for (const post of STATE_BLOG_POSTS) {
      expect(post.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(post.datePublished))).toBe(false)
    }
  })

  it('stagger the dates rather than using one identical date for every post', () => {
    const uniqueDates = new Set(STATE_BLOG_POSTS.map((p) => p.datePublished))
    expect(uniqueDates.size).toBeGreaterThan(1)
  })

  it('keeps every date in the past relative to the plan (before 2026-08-10)', () => {
    for (const post of STATE_BLOG_POSTS) {
      expect(Date.parse(post.datePublished)).toBeLessThan(Date.parse('2026-08-10'))
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/__tests__/blog-posts.test.ts`
Expected: FAIL — `datePublished` is `undefined` on every post, first assertion fails.

- [ ] **Step 3: Update `lib/blog-posts.ts`**

Rename the existing exported array literal to a private `RAW_POSTS` constant (drop the `export`), and derive the exported `STATE_BLOG_POSTS` from it with a computed `datePublished` per index — this avoids hand-editing 50 individual object literals.

Change:
```ts
export const STATE_BLOG_POSTS: StateBlogPost[] = [
  { stateCode: "AL", ... },
  ...
];
```
to:
```ts
const RAW_POSTS: Omit<StateBlogPost, 'datePublished'>[] = [
  { stateCode: "AL", ... },
  ...
  // (all 50 existing entries, unchanged — just drop the `export` keyword
  // and the array's own type annotation loses `datePublished` since RAW_POSTS
  // doesn't have it yet)
];

// Staggers each post's publish date across ~2.5 months ending 2026-08-05
// (5 days before this feature shipped), so posts don't all show an
// identical, obviously-synthetic publish date.
const BLOG_LAUNCH_MS = Date.parse('2026-05-19T00:00:00Z')
const DAY_MS = 24 * 60 * 60 * 1000
const DAYS_BETWEEN_POSTS = 1.6

function datePublishedForIndex(index: number): string {
  const ms = BLOG_LAUNCH_MS + index * DAYS_BETWEEN_POSTS * DAY_MS
  return new Date(ms).toISOString().slice(0, 10)
}

export const STATE_BLOG_POSTS: StateBlogPost[] = RAW_POSTS.map((post, index) => ({
  ...post,
  datePublished: datePublishedForIndex(index),
}))
```

Also update the `StateBlogPost` type at the top of the file to add the new field:

```ts
export type StateBlogPost = {
  stateCode: string;
  stateName: string;
  slug: string;
  title: string;
  metaDescription: string;
  intro: string;
  datePublished: string;
};
```

Do not touch `getPostBySlug` — it already operates on `STATE_BLOG_POSTS` and needs no change.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/__tests__/blog-posts.test.ts`
Expected: PASS

- [ ] **Step 5: Run the full suite to confirm nothing else broke**

Run: `npm test`
Expected: all pre-existing tests still pass (nothing else reads `STATE_BLOG_POSTS`'s shape in a way that would break from an added field).

- [ ] **Step 6: Commit**

```bash
git add lib/blog-posts.ts lib/__tests__/blog-posts.test.ts
git commit -m "feat: add staggered datePublished to all blog posts"
```

---

### Task 5: `app/blog/[slug]/page.tsx` — FAQPage + Article + BreadcrumbList schema, canonical

**Files:**
- Modify: `app/blog/[slug]/page.tsx`

**Interfaces:**
- Consumes: `buildFaqPageSchema`, `buildArticleSchema`, `buildBreadcrumbSchema` (`lib/schema.ts`, Task 1), `JsonLd` (`app/components/JsonLd.tsx`, Task 1), `post.datePublished` (`lib/blog-posts.ts`, Task 4).

- [ ] **Step 1: Extract the inline FAQ array to a named constant**

In `app/blog/[slug]/page.tsx`, find the FAQ section's `.map(({ q, a }) => (...))` block (currently inline in the JSX, 5 entries: "How fast will I get paid in {stateName}?", "Do you accept partial boxes...", "What if my strips are close to expiring?", "Can I sell strips if I'm an estate liquidator...", "Do I have to ship the strips...?"). Extract it to a `const faqs = [...]` array built inside the component function (it needs `stateName` in a couple of questions/answers, so it must be built inside `BlogPostPage`, after `stateName` is destructured from `post`), keeping every question and answer's text byte-for-byte identical to what's already there. Change the JSX to `.map()` over this new `faqs` array instead of the old inline array — same rendered output, just backed by a named variable instead of an inline literal.

- [ ] **Step 2: Add the three schema blocks and canonical tag**

Add imports at the top:

```ts
import { buildFaqPageSchema, buildArticleSchema, buildBreadcrumbSchema } from '@/lib/schema'
import { JsonLd } from '@/app/components/JsonLd'
```

In `generateMetadata`, add a canonical tag:

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: `https://cash4teststripsusa.com/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: 'article',
    },
  }
}
```

In the component, after `faqs` is built (Step 1) and before the `return (`, build the three schema objects:

```ts
  const pageUrl = `https://cash4teststripsusa.com/blog/${slug}`
  const faqSchema = buildFaqPageSchema(faqs.map((f) => ({ question: f.q, answer: f.a })))
  const articleSchema = buildArticleSchema({
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.datePublished,
    url: pageUrl,
  })
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://cash4teststripsusa.com' },
    { name: 'Blog', url: 'https://cash4teststripsusa.com/blog' },
    { name: stateName, url: pageUrl },
  ])
```

(Adjust the exact `faqs` field names to match whatever Step 1 named them — the existing inline array uses `q`/`a` as its property names, so `faqs.map((f) => ({ question: f.q, answer: f.a }))` converts that shape into what `buildFaqPageSchema` expects.)

Render all three at the top of the returned JSX, immediately inside the outermost `<article>` element:

```tsx
  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={faqSchema} />
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* Breadcrumb */}
      ...
```

- [ ] **Step 2: Verify**

Run: `npm run build`
Expected: succeeds, all 50 blog post static params still generate.

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/blog/[slug]/page.tsx
git commit -m "feat: add FAQPage/Article/BreadcrumbList schema and canonical to blog posts"
```

---

### Task 6: `app/sell-test-strips/[state]/page.tsx` — FAQPage + BreadcrumbList schema, canonical

**Files:**
- Modify: `app/sell-test-strips/[state]/page.tsx`

**Interfaces:**
- Consumes: `buildFaqPageSchema`, `buildBreadcrumbSchema` (`lib/schema.ts`, Task 1), `JsonLd` (`app/components/JsonLd.tsx`, Task 1).

- [ ] **Step 1: Extract the FAQ content to a named array**

The FAQ section currently renders 4 individual `<Faq q={...} a={...} />` component calls (not a `.map()` over an array). Replace those 4 individual calls with a `const faqs = [...]` array (built inside `StatePage`, after `label` is known, since two of the questions/answers interpolate `${label}`) containing the same 4 question/answer pairs verbatim ("Is it legal to sell test strips in {label}?", "What brands do buyers typically accept?", "How do I get paid?", "Do the strips need to be unopened?"), then render them via `{faqs.map((f) => <Faq key={f.q} q={f.q} a={f.a} />)}` in place of the 4 individual calls. The `Faq` helper component at the bottom of the file is unchanged.

- [ ] **Step 2: Add schema blocks and canonical tag**

Add imports:

```ts
import { buildFaqPageSchema, buildBreadcrumbSchema } from '@/lib/schema'
import { JsonLd } from '@/app/components/JsonLd'
```

Update `generateMetadata` to add a canonical tag:

```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params
  const code = state.toUpperCase()
  const label = STATE_LABELS[code]
  if (!label) return { title: 'State Not Found' }

  return {
    title: `Sell Diabetic Test Strips in ${label} — Find Local Cash Buyers`,
    description: `Find cash buyers for unused diabetic test strips in ${label}. Get paid fast via PayPal, Zelle, or check. Browse local buyers near you.`,
    alternates: { canonical: `https://cash4teststripsusa.com/sell-test-strips/${state.toLowerCase()}` },
  }
}
```

In the component, after `faqs` is built (Step 1) and before the `return (`:

```ts
  const pageUrl = `https://cash4teststripsusa.com/sell-test-strips/${state.toLowerCase()}`
  const faqSchema = buildFaqPageSchema(faqs.map((f) => ({ question: f.q, answer: f.a })))
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'Home', url: 'https://cash4teststripsusa.com' },
    { name: 'Directory', url: 'https://cash4teststripsusa.com/directory' },
    { name: label, url: pageUrl },
  ])
```

Render both at the top of the returned JSX, inside the outermost `<div>`:

```tsx
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* Breadcrumb */}
      ...
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: succeeds.

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/sell-test-strips/[state]/page.tsx
git commit -m "feat: add FAQPage/BreadcrumbList schema and canonical to state pages"
```

---

### Task 7: `app/company/[slug]/page.tsx` — LocalBusiness schema

**Files:**
- Modify: `app/company/[slug]/page.tsx`

**Interfaces:**
- Consumes: `buildLocalBusinessSchema` (`lib/schema.ts`, Task 1), `JsonLd` (`app/components/JsonLd.tsx`, Task 1).

- [ ] **Step 1: Add the schema import and build call**

Add imports:

```ts
import { buildLocalBusinessSchema } from '@/lib/schema'
import { JsonLd } from '@/app/components/JsonLd'
```

In `CompanyPage`, after `const company = (isAuthenticated ? rawCompany : stripCompanyContact(rawCompany as Company)) as Company;` — **use `company`, the already-gated variable, not `rawCompany`** — build the schema:

```ts
  const localBusinessSchema = buildLocalBusinessSchema({
    name: company.name,
    url: `https://cash4teststripsusa.com/company/${company.slug}`,
    telephone: company.phone,
    description: company.description,
    areaServed: stateNames,
    paymentAccepted: company.payment_methods ?? [],
  })
```

(`stateNames` is already computed a few lines below in the existing code as `company.states.map((s: string) => STATE_LABELS[s] ?? s)` — move that line above this new block, or reference `company.states.map(...)` inline here directly; either is fine as long as `stateNames` is defined before this schema build call.)

- [ ] **Step 2: Render it**

At the top of the returned JSX (inside the outermost `<div className="max-w-3xl mx-auto px-4 py-12">`):

```tsx
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={localBusinessSchema} />
      <Link href="/directory" ...>
      ...
```

- [ ] **Step 3: Verify — the gating is preserved**

Run: `npm run build` — expected: succeeds.
Run: `npx tsc --noEmit` — expected: clean.

Manually re-read the diff to confirm the schema's `telephone`/`description` fields come from `company` (post-`stripCompanyContact`), not `rawCompany` — an anonymous visitor's schema must not contain phone/email/url that the rest of the page also hides from them.

- [ ] **Step 4: Commit**

```bash
git add app/company/[slug]/page.tsx
git commit -m "feat: add LocalBusiness schema to company profile pages"
```

---

### Task 8: `app/directory/page.tsx` — ItemList schema

**Files:**
- Modify: `app/directory/page.tsx`

**Interfaces:**
- Consumes: `buildItemListSchema` (`lib/schema.ts`, Task 1), `JsonLd` (`app/components/JsonLd.tsx`, Task 1).

- [ ] **Step 1: Add the schema import and build call**

Add imports:

```ts
import { buildItemListSchema } from '@/lib/schema'
import { JsonLd } from '@/app/components/JsonLd'
```

After `const companies = isAuthenticated ? rawCompanies : rawCompanies.map(stripCompanyContact);` (this is already the gated list — use it, not `rawCompanies`):

```ts
  const itemListSchema = buildItemListSchema(
    companies.map((c) => ({ name: c.name, url: `https://cash4teststripsusa.com/company/${c.slug}` }))
  )
```

- [ ] **Step 2: Render it**

At the top of the returned JSX (inside the outermost `<div className="max-w-6xl mx-auto px-4 py-12">`):

```tsx
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <JsonLd data={itemListSchema} />
      <div className="mb-8">
      ...
```

- [ ] **Step 3: Verify**

Run: `npm run build` — expected: succeeds.
Run: `npx tsc --noEmit` — expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/directory/page.tsx
git commit -m "feat: add ItemList schema to directory page"
```

---

### Task 9: Homepage — WebSite + Service schema, FAQ section + FAQPage schema

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `buildWebsiteSchema`, `buildServiceSchema`, `buildFaqPageSchema` (`lib/schema.ts`, Task 1), `JsonLd` (`app/components/JsonLd.tsx`, Task 1).

- [ ] **Step 1: Add imports and build the WebSite/Service/FAQ schema**

Add imports:

```ts
import { buildWebsiteSchema, buildServiceSchema, buildFaqPageSchema } from '@/lib/schema'
import { JsonLd } from '@/app/components/JsonLd'
```

Inside `HomePage`, after `const companies = (featured ?? []) as Company[];`, add:

```ts
  const homeFaqs = [
    {
      q: 'What brands do you accept?',
      a: 'We buy all major brands of diabetic test strips — OneTouch, FreeStyle, Accu-Chek, Contour Next, and True Metrix — plus CGM sensors from Dexcom, FreeStyle Libre, and Omnipod, and infusion sets from Medtronic and Tandem. All supplies must be sealed and unexpired, from U.S. retail sources.',
    },
    {
      q: 'Is it legal to sell diabetic test strips?',
      a: "Yes, selling unused, sealed, personally owned diabetic test strips is legal across the United States. The one firm rule: supplies purchased through Medicare or Medicaid cannot be resold. If your strips were paid for out of pocket or through private insurance, you're in the clear.",
    },
    {
      q: 'How fast will I get paid?',
      a: 'Most buyers pay within 24 hours of receiving and verifying your supplies. Payment is sent via PayPal, Zelle, Venmo, check, or cash — your choice. For local transactions, same-day payment is often possible.',
    },
    {
      q: 'How does the process work?',
      a: "Call or text us at 518-779-9751 with the brand, quantity, and expiration date of what you have. We quote you immediately. For most transactions, we send a prepaid shipping label at no cost. Once we receive and verify the strips, you get paid.",
    },
    {
      q: 'What if my strips are expired or the box has been opened?',
      a: "Opened boxes are not accepted — we require original, sealed packaging only. For expired supplies: most expired test strips have no buyer market, but expired Omnipod pods and expired Dexcom G7 sensors are exceptions. Call us and we'll tell you whether what you have qualifies.",
    },
    {
      q: 'Do you buy in bulk?',
      a: 'Yes — bulk is our specialty. Many of our customers are estate liquidators, caregivers, and pharmacies handling large quantities. We buy everything from a single box to 500 or more, and we pay a higher per-box rate on lots of 10 or more boxes.',
    },
  ]

  const websiteSchema = buildWebsiteSchema()
  const serviceSchema = buildServiceSchema()
  const faqSchema = buildFaqPageSchema(homeFaqs.map((f) => ({ question: f.q, answer: f.a })))
```

- [ ] **Step 2: Render the schema and a visible FAQ section**

Render the three schema blocks as the first children of the top-level `<>` fragment:

```tsx
  return (
    <>
      <JsonLd data={websiteSchema} />
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />
      {/* Hero */}
      ...
```

Add a new visible FAQ section between the existing "Browse by state" section and the final "CTA" section (i.e. right after the `</section>` that closes "Browse by state", right before the `{/* CTA */}` comment):

```tsx
      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {homeFaqs.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

```

- [ ] **Step 3: Verify**

Run: `npm run build` — expected: succeeds.
Run: `npx tsc --noEmit` — expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add WebSite/Service/FAQPage schema and homepage FAQ section"
```

---

### Task 10: `app/opengraph-image.tsx` — default OG image

**Files:**
- Create: `app/opengraph-image.tsx`

- [ ] **Step 1: Write the file**

```tsx
// app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, color: 'white', textAlign: 'center' }}>
          Cash For Test Strips USA
        </div>
        <div style={{ fontSize: 32, color: '#d1fae5', marginTop: 24, textAlign: 'center' }}>
          Sell your unused diabetic test strips for cash
        </div>
      </div>
    ),
    { ...size }
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run build` — expected: succeeds, `opengraph-image` appears among the generated routes.

Run: `npm run dev` in the background, `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/opengraph-image`, expected `200`, then stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add app/opengraph-image.tsx
git commit -m "feat: add default OG image via ImageResponse"
```

---

### Task 11: `app/about/page.tsx`

**Files:**
- Create: `app/about/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// app/about/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Cash For Test Strips USA — Our Buyer Network',
  description:
    "Cash For Test Strips USA connects sellers of unused diabetic supplies with vetted local buyers nationwide. Learn how the network works.",
  alternates: { canonical: 'https://cash4teststripsusa.com/about' },
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About Cash For Test Strips USA</h1>

      <p className="text-gray-600 leading-relaxed mb-6">
        Cash For Test Strips USA is a national directory connecting people who have unused diabetic
        supplies with local cash buyers. We operate the network, maintain the listings, and make it
        easy to find a buyer anywhere in the country — or to reach us directly at{' '}
        <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a>.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">The problem we solve</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Every year, millions of people end up with extra boxes of unused diabetic test strips. A
        prescription change. A switch from finger-sticks to a CGM. A family member who passed away.
        Whatever the reason, those boxes have real dollar value — and most people have no idea what
        to do with them.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        Finding a buyer used to mean posting on Craigslist or Facebook Marketplace and hoping someone
        responded. We built a better option: a searchable directory of vetted buyers organized by
        state, brand, and payment method, with pricing guides and state-by-state legal information so
        sellers know exactly what they're getting into before they make a call.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">How the buyer network works</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        We list companies that buy unused diabetic supplies across the United States. Sellers can
        search by state, see which brands each buyer accepts, and reach out directly. Most buyers
        respond within a few hours. Payment is typically sent via PayPal, Zelle, check, or cash within
        24 hours of receiving and verifying the supplies.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        For sellers who want a single point of contact, we also buy directly. Call or text{' '}
        <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> and
        we'll quote you on the spot — single boxes or bulk lots.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Who uses the site</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Our sellers fall into a few consistent categories: people with diabetes who switched meters or
        moved to a CGM and have leftover strips, caregivers who managed a family member's supplies,
        estate liquidators dealing with diabetic inventory after a loss, and pharmacies or medical
        supply businesses with excess stock they can't otherwise move. We handle all of them, from one
        box to several hundred.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">What qualifies</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        We accept sealed, unexpired, U.S. retail diabetic supplies in original packaging. That
        includes test strips from OneTouch, FreeStyle, Accu-Chek, Contour, and True Metrix; CGM
        sensors and supplies from Dexcom, FreeStyle Libre, and Omnipod; and infusion sets, lancets, and
        other supplies. We do not accept supplies purchased through Medicare or Medicaid, which cannot
        legally be resold.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        There are a few exceptions: we accept expired Omnipod pods (DASH, 5, and Classic versions) and
        expired Dexcom G7 sensors. For everything else, supplies need to be unexpired and sealed.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Operating across all 50 states</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Our <Link href="/blog" className="text-emerald-600 hover:underline">blog</Link> covers the
        legal and practical details of selling in every state. Whether you're in a major metro or a
        rural county, the process is the same: find a buyer, describe what you have, and get paid
        fast. If you're not sure whether your supplies qualify, call us and we'll tell you.
      </p>

      <div className="bg-emerald-50 rounded-xl p-6 text-center mt-10">
        <a
          href="tel:5187799751"
          className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
        >
          Call or text 518-779-9751 →
        </a>
        <p className="text-sm text-gray-500 mt-3">We respond within hours.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run build` — expected: succeeds, `/about` appears as a static route.
Run: `npx tsc --noEmit` — expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/about/page.tsx
git commit -m "feat: add /about page"
```

---

### Task 12: `app/is-it-legal-to-sell-diabetic-test-strips/page.tsx`

**Files:**
- Create: `app/is-it-legal-to-sell-diabetic-test-strips/page.tsx`

**Interfaces:**
- Consumes: `buildFaqPageSchema` (`lib/schema.ts`, Task 1), `JsonLd` (`app/components/JsonLd.tsx`, Task 1).

- [ ] **Step 1: Write the page**

```tsx
// app/is-it-legal-to-sell-diabetic-test-strips/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { buildFaqPageSchema } from '@/lib/schema'
import { JsonLd } from '@/app/components/JsonLd'

export const metadata: Metadata = {
  title: 'Is It Legal to Sell Diabetic Test Strips? US Guide',
  description:
    'Yes — selling personally owned, unopened diabetic test strips is legal across the US. Learn the rules: packaging, expiration, and Medicare/Medicaid.',
  alternates: { canonical: 'https://cash4teststripsusa.com/is-it-legal-to-sell-diabetic-test-strips' },
}

const FAQS = [
  {
    q: 'Is selling diabetic test strips legal in all 50 states?',
    a: 'Yes. Selling unused, sealed, personally owned diabetic test strips is legal in every state. The core legal requirement is the same nationwide: the supplies must not have been purchased through Medicare or Medicaid.',
  },
  {
    q: 'Can I sell strips that were paid for by private insurance?',
    a: 'Private insurance is different from Medicare or Medicaid. Strips purchased through private insurance — including employer-sponsored plans — are your property. You can sell them. Only government program purchases (Medicare Part B, Part D, Medicaid) are off-limits.',
  },
  {
    q: "What if I'm not sure whether my strips were Medicare-purchased?",
    a: 'Contact your pharmacy or check your insurance Explanation of Benefits (EOB). If any portion of the purchase was covered by Medicare or Medicaid, those strips cannot be resold. When in doubt, do not sell — ask first.',
  },
  {
    q: 'Can I sell opened boxes?',
    a: 'No. Buyers require original, sealed packaging. Opened boxes are not accepted under any circumstances.',
  },
  {
    q: 'What if my strips are close to expiring?',
    a: 'Most buyers require at least six months of remaining shelf life on test strips. Exceptions exist for certain CGM products (expired Omnipod pods and expired Dexcom G7 sensors have buyers). For test strips specifically, close-to-expired boxes significantly reduce value and may not be accepted. Call a buyer to confirm before shipping.',
  },
  {
    q: 'Can a caregiver or estate executor sell on behalf of a deceased person?',
    a: 'Yes. Estate liquidators, caregivers, and family members handling a deceased person’s supplies can legally sell them, provided the Medicare/Medicaid rule is met and the supplies are in the required condition.',
  },
]

export default function IsItLegalPage() {
  const faqSchema = buildFaqPageSchema(FAQS.map((f) => ({ question: f.q, answer: f.a })))

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
      <JsonLd data={faqSchema} />

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Is It Legal to Sell Diabetic Test Strips?</h1>

      <p className="text-gray-600 leading-relaxed mb-6">
        Yes. Selling unused, personally owned, unopened diabetic test strips is legal throughout the
        United States. It is not a Medicare or Medicaid fraud issue when the strips are legitimately
        yours — that is, when they were not purchased using government insurance. What you do with
        your own property is your decision, and selling unused medical supplies you no longer need
        has a clear, established market in every state.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        That said, there are rules. Getting them right is straightforward.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">What makes a sale legal</h2>
      <p className="text-gray-600 leading-relaxed mb-4">Three conditions determine whether a sale is clean:</p>
      <p className="text-gray-600 leading-relaxed mb-4">
        The strips must be in their original, sealed packaging. Once a box has been opened, the
        strips inside cannot be resold. Buyers have no way to verify the condition, count, or
        expiration of individual strips from an opened box, and no legitimate buyer will accept them.
        Keep the box sealed until the transaction is complete.
      </p>
      <p className="text-gray-600 leading-relaxed mb-4">
        The strips must not have been purchased through Medicare or Medicaid. This is the critical
        legal line. If Medicare or Medicaid paid for the supplies — directly or through a Part D plan
        — those supplies cannot legally be resold. Selling government-purchased medical supplies is
        considered fraud. If you're not certain how your strips were paid for, check your insurance
        documentation or ask your pharmacy before trying to sell.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        The strips should not be expired. Most buyers require at least six months of remaining shelf
        life. There are exceptions — certain products like expired Omnipod pods and expired Dexcom G7
        sensors do have a secondary market — but expired test strips generally do not. Check the
        expiration date on your boxes before reaching out to a buyer.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Does the reason you have the strips matter?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        No. Common, completely legitimate reasons people sell include: switching to a different meter
        or CGM, a doctor changing a prescription, a diabetes management routine that required fewer
        strips than expected, and handling the estate of a family member who has passed away. In all
        of these cases, the strips belong to you, and selling them is your right.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Is there a legal gray area?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        The Medicare/Medicaid rule is where sellers most often run into problems, and it is the area
        where you should be careful. "I didn't know they were Medicare-paid" is not a defense. The
        rest of the transaction — the actual exchange of sealed, personally owned supplies for cash —
        is a standard private-party sale with no unusual legal complexity. Some buyers will ask you to
        confirm, in writing, that the strips were not obtained through Medicare or Medicaid. This is
        standard practice and protects both parties.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Do laws differ by state?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        The federal rules above apply everywhere. Some states have additional resale or consumer
        protection statutes that apply to medical supplies, but no state prohibits the private sale of
        personally owned, unused diabetic test strips. See{' '}
        <Link href="/blog" className="text-emerald-600 hover:underline">your state's guide</Link>{' '}
        for any relevant local context.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-6 not-prose">
        {FAQS.map(({ q, a }) => (
          <div key={q}>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">{q}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      <div className="bg-emerald-50 rounded-xl p-6 text-center mt-10 not-prose">
        <a
          href="tel:5187799751"
          className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
        >
          Call 518-779-9751 with questions →
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npm run build` — expected: succeeds, route appears.
Run: `npx tsc --noEmit` — expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/is-it-legal-to-sell-diabetic-test-strips/page.tsx
git commit -m "feat: add national legality hub page with FAQPage schema"
```

---

### Task 13: `app/how-much-are-diabetic-test-strips-worth/page.tsx` + footer nav links

**Files:**
- Create: `app/how-much-are-diabetic-test-strips-worth/page.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `buildFaqPageSchema` (`lib/schema.ts`, Task 1), `JsonLd` (`app/components/JsonLd.tsx`, Task 1).

- [ ] **Step 1: Write the price guide page**

```tsx
// app/how-much-are-diabetic-test-strips-worth/page.tsx
import type { Metadata } from 'next'
import { buildFaqPageSchema } from '@/lib/schema'
import { JsonLd } from '@/app/components/JsonLd'

export const metadata: Metadata = {
  title: 'How Much Are Diabetic Test Strips Worth? 2026 Guide',
  description:
    'Brand-by-brand cash prices for diabetic test strips and CGM supplies in 2026. See what OneTouch, FreeStyle, Accu-Chek, Contour, Dexcom, and more pay.',
  alternates: { canonical: 'https://cash4teststripsusa.com/how-much-are-diabetic-test-strips-worth' },
}

const FAQS = [
  {
    q: "What's the highest-paying brand of test strips?",
    a: 'OneTouch Verio and Ultra typically pay the most per box among standard test strips, ranging from $15 to $30. FreeStyle Lite runs close behind at $10 to $25. CGM sensors (Libre, Dexcom, Omnipod) pay more per box but serve a narrower buyer market.',
  },
  {
    q: 'Do I get more for buying a larger quantity?',
    a: 'Yes. Bulk lots of 10 or more boxes typically receive a better per-box rate than individual-box sales. Very large lots (50+ boxes) are priced on a call — buyers prefer to negotiate those directly.',
  },
  {
    q: 'What if I have multiple brands?',
    a: 'Mixed lots are accepted. When you call, list all the brands, quantities, and expiration dates you have. Buyers will give you a combined offer or quote by brand — whichever works best for your situation.',
  },
  {
    q: 'Are CGM sensors worth more than test strips?',
    a: 'Generally yes. Dexcom G7, FreeStyle Libre 3, and Omnipod pods are higher-value per box than traditional test strips. They also move through a smaller buyer pool, so pricing varies more — always call for a quote on CGM supplies.',
  },
  {
    q: 'Do expired strips have any value?',
    a: 'Most expired test strips have no buyer market. The exceptions are expired Omnipod pods and expired Dexcom G7 sensors, which some buyers do purchase. Call 518-779-9751 for pricing on expired stock.',
  },
]

const TEST_STRIP_PRICES = [
  { brand: 'OneTouch Verio / Ultra', price: '$15 – $30 per box', note: 'One of the most widely accepted brands, consistently at the higher end.' },
  { brand: 'FreeStyle Lite', price: '$10 – $25 per box', note: 'Large, consistent buyer base.' },
  { brand: 'Accu-Chek Guide / Aviva / SmartView', price: '$10 – $20 per box', note: 'Widely accepted; box condition and count matter.' },
  { brand: 'Contour Next (all versions)', price: '$8 – $18 per box', note: 'Lower end of major brands but moves well in bulk.' },
  { brand: 'True Metrix', price: 'Call for a quote', note: 'Accepted by select buyers — pricing varies by region.' },
]

const CGM_PRICES = [
  { brand: 'Dexcom G6 Sensors', price: 'Starting at $30 per box', note: 'High-demand product — call for a current quote.' },
  { brand: 'Dexcom G7 Sensors (10-Day and 15-Day)', price: 'Starting at $30 per box', note: 'Expired G7 sensors are also accepted by some buyers.' },
  { brand: 'FreeStyle Libre Sensors (1, 2, 2 Plus, 3, 3 Plus)', price: '$30 – $60 per box', note: 'Libre 3 commands the upper end. U.S. retail versions only.' },
  { brand: 'Omnipod Pods (5, DASH, Classic)', price: 'Starting at $50 per box', note: 'Expired pods also accepted — call for pricing.' },
]

export default function PriceGuidePage() {
  const faqSchema = buildFaqPageSchema(FAQS.map((f) => ({ question: f.q, answer: f.a })))

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
      <JsonLd data={faqSchema} />

      <h1 className="text-3xl font-bold text-gray-900 mb-6">How Much Are Diabetic Test Strips Worth? A 2026 Price Guide</h1>

      <p className="text-gray-600 leading-relaxed mb-6">
        What you get for unused diabetic test strips depends on the brand, the quantity, how much time
        is left before expiration, and whether the box is sealed. The price ranges below reflect what
        buyers in our network are currently paying for standard retail boxes in good condition. Bulk
        lots of 10 or more boxes typically receive a higher per-box rate than individual boxes.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Test Strips — Price by Brand</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Brand</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Price</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Notes</th>
            </tr>
          </thead>
          <tbody>
            {TEST_STRIP_PRICES.map((row) => (
              <tr key={row.brand} className="border border-gray-100">
                <td className="px-4 py-2 text-gray-600">{row.brand}</td>
                <td className="px-4 py-2 text-gray-600">{row.price}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">CGM Sensors and Supplies — Price by Product</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Product</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Price</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Notes</th>
            </tr>
          </thead>
          <tbody>
            {CGM_PRICES.map((row) => (
              <tr key={row.brand} className="border border-gray-100">
                <td className="px-4 py-2 text-gray-600">{row.brand}</td>
                <td className="px-4 py-2 text-gray-600">{row.price}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">What affects the price?</h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        <strong>Box count.</strong> A 100-count box pays more than two 50-count boxes of the same
        brand in most cases, because buyers prefer to handle fewer transactions for equivalent volume.
      </p>
      <p className="text-gray-600 leading-relaxed mb-4">
        <strong>Time to expiration.</strong> Most buyers require at least six months of remaining
        shelf life on test strips. Strips with 12 or more months remaining command better pricing.
      </p>
      <p className="text-gray-600 leading-relaxed mb-4">
        <strong>Sealed vs. opened.</strong> Only sealed, original-packaging boxes are accepted. An
        opened box has no resale value regardless of brand or quantity.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        <strong>Bulk quantity.</strong> Ten or more boxes of the same brand in a single lot is
        considered a bulk transaction by most buyers, which typically improves the per-box rate. Large
        lots (50 boxes or more) are priced individually — call for a quote.
      </p>

      <p className="text-gray-600 leading-relaxed mb-6">
        The ranges above are what buyers in our network pay for standard-condition, single-box
        transactions. Your actual offer may be higher or lower depending on lot size, expiration
        dates, and demand. Call{' '}
        <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> — we'll
        give you a number on the spot.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-6 not-prose">
        {FAQS.map(({ q, a }) => (
          <div key={q}>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">{q}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      <div className="bg-emerald-50 rounded-xl p-6 text-center mt-10 not-prose">
        <a
          href="tel:5187799751"
          className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
        >
          Call 518-779-9751 for a quote →
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add footer links to all 3 new content pages**

In `app/layout.tsx`, find the footer's link group (currently: Directory, Manage Your Listing, Contact). Add the 3 new pages:

```tsx
            <div className="flex gap-6">
              <Link href="/directory" className="hover:text-emerald-700 transition-colors">
                Directory
              </Link>
              <Link href="/about" className="hover:text-emerald-700 transition-colors">
                About
              </Link>
              <Link href="/is-it-legal-to-sell-diabetic-test-strips" className="hover:text-emerald-700 transition-colors">
                Is It Legal?
              </Link>
              <Link href="/how-much-are-diabetic-test-strips-worth" className="hover:text-emerald-700 transition-colors">
                Price Guide
              </Link>
              <Link href="/buyer" className="hover:text-emerald-700 transition-colors">
                Manage Your Listing
              </Link>
              <a href="mailto:feldon.richards@gmail.com" className="hover:text-emerald-700 transition-colors">
                Contact
              </a>
            </div>
```

- [ ] **Step 3: Verify**

Run: `npm run build` — expected: succeeds, all 3 new routes appear as static pages.
Run: `npx tsc --noEmit` — expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/how-much-are-diabetic-test-strips-worth/page.tsx app/layout.tsx
git commit -m "feat: add price guide page and link all 3 new content pages from footer"
```

---

### Task 14: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: PASS — every new test file from Tasks 1 and 4, plus every pre-existing test file.

- [ ] **Step 2: Run typecheck and lint**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npm run lint`
Expected: matches the pre-existing 8-problem baseline established during the buyer-accounts feature — no new errors/warnings from this plan's files.

- [ ] **Step 3: Run a full production build**

Run: `npm run build`
Expected: succeeds. Confirm the route list includes `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/about`, `/is-it-legal-to-sell-diabetic-test-strips`, `/how-much-are-diabetic-test-strips-worth`, and all 50 `/blog/[slug]` static params.

- [ ] **Step 4: Manual spot-check in the browser**

Run `npm run dev`, then check:
1. View source on a blog post (`/blog/sell-diabetic-test-strips-alabama`) — confirm 3 `<script type="application/ld+json">` tags are present and each contains valid JSON (paste into a JSON validator or `JSON.parse` in devtools console).
2. Same check on a state page, the homepage, a company profile, `/directory`, and the 2 new FAQ-bearing content pages.
3. Visit `/sitemap.xml` and `/robots.txt` directly, confirm they render.
4. Visit `/opengraph-image` directly, confirm an image renders.
5. Confirm the footer on any page now shows the 3 new links and they navigate correctly.

Stop the dev server when done.

- [ ] **Step 5: If anything fails, fix before proceeding**

Do not move to the final review with a red suite, a failing build, or malformed JSON-LD.

---

### Task 15: Final regression, push, verify deploy

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite one more time**

Run: `npm test`
Expected: PASS

- [ ] **Step 2: Push and verify the live deploy**

```bash
git push
```

Then run `vercel list --yes` (or check the Vercel dashboard) to confirm the new deployment for `cash-for-test-strips-usa` in team `mans171s-projects` built successfully and is promoted to production.

- [ ] **Step 3: Live smoke-check**

`curl -s -o /dev/null -w "%{http_code}\n" https://cash4teststripsusa.com/sitemap.xml` — expect `200`.
`curl -s -o /dev/null -w "%{http_code}\n" https://cash4teststripsusa.com/robots.txt` — expect `200`.
`curl -s -o /dev/null -w "%{http_code}\n" https://cash4teststripsusa.com/about` — expect `200`.
`curl -s -o /dev/null -w "%{http_code}\n" https://cash4teststripsusa.com/is-it-legal-to-sell-diabetic-test-strips` — expect `200`.
`curl -s -o /dev/null -w "%{http_code}\n" https://cash4teststripsusa.com/how-much-are-diabetic-test-strips-worth` — expect `200`.

---

## Self-Review Notes

**Spec coverage:** Every Priority 1 item (FAQPage on blog + state pages, sitemap, robots, LocalBusiness, BreadcrumbList, llms.txt) and Priority 2 item (Article schema + dates, WebSite/Service, ItemList, canonical tags, OG image) from the spec has a task. All 3 Priority 3 content pages + homepage FAQ are covered (Tasks 9, 11, 12, 13) using the copy already delivered by content-agent this session, transcribed verbatim into the task steps — no placeholder or fabricated copy. The two stray uncommitted migration files and any change to `/buyer`, `/sell`, `/admin`, or the claims feature are explicitly out of scope per the spec and untouched by any task.

**Placeholder scan:** No TBD/TODO/"add later" language found. Task 2's note about `datePublished` ordering is a real sequencing clarification (skip `lastModified` on blog routes if implemented out of order), not a placeholder — and since this plan's tasks execute in the written order, Task 4 (dates) completes before Task 2 would ever need to reference them in practice; the note exists only as a safety net for the executor.

**Type consistency:** `FaqItem { question, answer }` (Task 1) is consistently converted to from each page's local `{ q, a }` shape via `.map((f) => ({ question: f.q, answer: f.a }))` in Tasks 5, 6, 9, and directly authored as `{ q, a }` → `question`/`answer` in Tasks 12/13's own `FAQS` arrays. `LocalBusinessInput`'s `telephone`/`description` are typed `string | null` (Task 1) and Task 7 passes `company.phone`/`company.description`, which are already `string | null` on the `Company` type — no mismatch. `ItemListEntry { name, url }` (Task 1) matches what Task 8 constructs from `companies`. `ArticleInput.datePublished: string` (Task 1) matches `StateBlogPost.datePublished: string` (Task 4).
