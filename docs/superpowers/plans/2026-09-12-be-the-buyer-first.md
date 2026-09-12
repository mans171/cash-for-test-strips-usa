# Be the Buyer First — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn cash4teststripsusa.com from a gated directory into a buyer site: public buyer contacts, a homepage that says "we buy", a $10 mention/form bonus where the house honors it, bulk leads routed to the state's buyer, one page per state, and the house-network profiles out of Google's index.

**Architecture:** Remove the anonymous-contact stripping layer (`stripCompanyContact` / `UnlockContact` / `isAuthenticated` props) and render contact buttons unconditionally. The homepage becomes a CFTS buyer landing page whose structured data carries the phone. A pure `honorsBonus(company)` rule decides where bonus copy appears. Each hand-written state post body is rendered inside the state page and the old `/blog/...` post URL redirects there permanently. House-network company profiles get `robots: noindex` and leave the sitemap.

**Tech Stack:** Next.js 15 App Router (TypeScript), Supabase (`companies`, `leads`), Tailwind, vitest (`npx vitest run` needs `.env.test` — see Global Constraints), `npx tsc --noEmit` is the merge bar.

**Spec:** `~/Downloads/Dev Donna/seo/2026-09-12-cftsusa-visibility-strategy.md` (strategy) and memory `project-cfts-usa-degate-and-bonus.md` (decisions: BUYER pays the bonus, so bonus copy shows only where the contact routes to the house; `sell@cash4teststripsusa.com` on buyer records — done separately via data write; routing ships now with the Feldon fallback).

## Global Constraints

- **NO dollar figures for supplies anywhere** on the site (no payout ranges, no "up to $X a box"). The flat "$10 bonus" is the one permitted dollar figure.
- **No "Medicare"/"Medicaid"** wording in copy; say "a government-covered program" / "how the supplies were paid for" instead. Existing occurrences you touch get rewritten; do not introduce new ones.
- **No first-person testimonials, no personal-name bylines, no review links.**
- **Phone is `OWNER_PHONE` from `lib/owner.ts` (518-278-6008)** — import it, never type the number. Exception: the Albany buyer row carries 518-779-9751 in the database; that is data, leave it.
- **Never delete a `companies` row; never write to the database from code in this plan.**
- **Do not run `npx vitest run` without `.env.test` present.** The guard `test/setup-guard.ts` refuses prod. For pure-function tests create `.env.test` with `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=test` (both files are gitignored). Run single files: `npx vitest run lib/__tests__/<file>.test.ts`.
- **`npx tsc --noEmit` must pass after every task.** `npx eslint` on touched files too.
- **Do not run git commands other than `git add <explicit paths>` and `git commit`. Never `git add -A`.** The worktree is `/private/tmp/cftsusa-buyer-first`, branch `feat/be-the-buyer-first`.
- Every existing test file that asserts gated behaviour is updated in the task that removes the gate — a red suite is not acceptable.

---

### Task 1: Remove the contact gate — buyer contacts are public

**Files:**
- Modify: `lib/company-contact.ts` (delete `stripCompanyContact`; keep `hasAnyContact` without `hasContact`)
- Modify: `lib/types.ts:22-26` (delete the `hasContact` field)
- Rewrite: `app/components/UnlockContact.tsx` → rename to `app/components/ContactButtons.tsx`
- Delete: `app/components/AccountModal.tsx` (only `UnlockContact` imported it — confirm with grep first)
- Modify: `app/components/BuyerCard.tsx` (drop `isAuthenticated` prop, render `ContactButtons`)
- Modify: `app/page.tsx`, `app/directory/page.tsx`, `app/sell-test-strips/[state]/page.tsx`, `app/sell-test-strips/[state]/[city]/page.tsx`, `app/company/[slug]/page.tsx`, `app/api/sell/match/route.ts` — remove `getUser`/`isAuthenticated`/`stripCompanyContact` and pass nothing about auth to cards
- Modify: `app/api/leads/route.ts` (remove the 401 block; keep every validation)
- Modify: `app/api/leads/__tests__/route.test.ts` (the `returns 401 when there is no session` case becomes "creates a lead without a session")
- Modify: `app/sell/SellFlowClient.tsx` (remove the `LoginForm` step and `handleLoginSuccess`; the flow goes straight from match → contact form)
- Test: `lib/__tests__/company-contact.test.ts` (new)

**Interfaces:**
- Produces: `hasAnyContact(company: Pick<Company,'url'|'phone'|'email'>): boolean`; `<ContactButtons company={c} size?: "card"|"page" />` renders a `tel:` button when `phone`, a tracked "Visit site →" link when `url` (href `/api/track?company=<id>&url=<encoded>`), a `mailto:` link when only `email`; renders `null` when none. `BuyerCard` props become `{ company: Company & { miles?: number|null } }`.

- [ ] **Step 1: Write the failing test** `lib/__tests__/company-contact.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { hasAnyContact } from '@/lib/company-contact'

const base = { url: null, phone: null, email: null }
describe('hasAnyContact', () => {
  it('is true for any single contact method', () => {
    expect(hasAnyContact({ ...base, phone: '518-278-6008' })).toBe(true)
    expect(hasAnyContact({ ...base, url: 'https://x.com' })).toBe(true)
    expect(hasAnyContact({ ...base, email: 'a@b.c' })).toBe(true)
  })
  it('is false with none', () => {
    expect(hasAnyContact(base)).toBe(false)
  })
})
```

- [ ] **Step 2: Run it** — `npx vitest run lib/__tests__/company-contact.test.ts` → FAIL (email is not considered / type error).

- [ ] **Step 3: Rewrite `lib/company-contact.ts`**

```ts
import type { Company } from './types'

/** Contacts are public since 2026-09-12 (the account gate was removed — nobody
 *  was creating accounts, and gated contact detail is content Google cannot
 *  see). This is the one place that decides "has a way to reach them". */
export function hasAnyContact(company: Pick<Company, 'url' | 'phone' | 'email'>): boolean {
  return !!(company.url || company.phone || company.email)
}
```

Delete `hasContact` from `lib/types.ts`.

- [ ] **Step 4: Create `app/components/ContactButtons.tsx`** (server component — no `"use client"`):

```tsx
import { btnPrimary, btnSecondary } from "./ui"
import { hasAnyContact } from "@/lib/company-contact"
import type { Company } from "@/lib/types"

export function ContactButtons({ company, size = "card" }: { company: Company; size?: "card" | "page" }) {
  if (!hasAnyContact(company)) return null
  const sizing = size === "page" ? "px-6 py-3 text-sm w-auto" : "px-3 py-2 text-xs w-full"
  const wrap = size === "page" ? "inline-flex flex-wrap gap-2" : "flex flex-col gap-2 w-full"
  return (
    <div className={wrap}>
      {company.phone && (
        <a href={`tel:${company.phone.replace(/[^0-9+]/g, "")}`} className={`${btnPrimary} ${sizing}`}>
          Call or text {company.phone}
        </a>
      )}
      {company.url && (
        <a
          href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
          target="_blank" rel="noopener noreferrer"
          className={`${company.phone ? btnSecondary : btnPrimary} ${sizing}`}
        >
          Visit site →
        </a>
      )}
      {!company.phone && !company.url && company.email && (
        <a href={`mailto:${company.email}`} className={`${btnPrimary} ${sizing}`}>Email buyer</a>
      )}
    </div>
  )
}
```

Delete `app/components/UnlockContact.tsx` and `app/components/AccountModal.tsx` (after `grep -rn AccountModal app lib` shows no other importer).

- [ ] **Step 5: Update every call site.** In each page listed above: delete the `createServerSupabaseClient`/`getUser`/`isAuthenticated` lines and the `stripCompanyContact` mapping; use the raw rows directly; remove `isAuthenticated` from every `<BuyerCard>`, `TierSection`, `MailInFallback`, `UnlockContact` usage (replace `UnlockContact` with `ContactButtons`). In `app/api/sell/match/route.ts` return buyers unstripped. In `app/api/leads/route.ts` delete the `if (!user) return 401` block and the now-unused supabase/getUser lines. In `app/sell/SellFlowClient.tsx` remove the login step: find where the flow renders `<LoginForm …>` (line ~609) and the state that gates on authentication; the user proceeds directly to the contact/quote step. Keep the `/buyer` portal and `/login` route untouched — buyer accounts still use them.

- [ ] **Step 6: Fix the leads route test.** Replace the 401 case:

```ts
it('creates a lead without any session', async () => {
  mockGetUser.mockResolvedValueOnce({ data: { user: null } })
  const response = await POST(makeRequest(validBody()))
  expect(response.status).toBe(200)
})
```
If `mockGetUser` is no longer referenced by the route, delete the mock and this case entirely — do not leave a dead mock.

- [ ] **Step 7: Verify** — `npx tsc --noEmit` clean; `npx vitest run lib/__tests__/company-contact.test.ts app/api/leads/__tests__/route.test.ts` green; `grep -rn "stripCompanyContact\|isAuthenticated\|UnlockContact\|hasContact" app lib` returns nothing.

- [ ] **Step 8: Commit** — `git add` the explicit paths; message `feat: make buyer contacts public — remove the account gate`.

---

### Task 2: Homepage becomes the buyer page; auth pages noindex; `/buyer` out of the sitemap

**Files:**
- Modify: `app/page.tsx` (hero, trust bar, how-it-works, FAQs, metadata)
- Modify: `lib/schema.ts:119-129` (`buildServiceSchema` → a `LocalBusiness`-style Organization block with `telephone`)
- Create: `app/(auth)/layout.tsx`
- Modify: `app/sitemap.ts` (remove the `/buyer` entry)
- Modify: `lib/__tests__/schema.test.ts` (add a case for telephone)

**Interfaces:**
- Consumes: `OWNER_PHONE` from `lib/owner.ts`; `BuyerCard` from Task 1.
- Produces: `buildServiceSchema(): Record<string, unknown>` now includes `telephone: OWNER_PHONE`, `name: 'Cash For Test Strips USA'`, `@type: 'Organization'`, `areaServed: 'United States'`, `url`.

- [ ] **Step 1: Test** — in `lib/__tests__/schema.test.ts` add:

```ts
it('service schema carries the business phone', () => {
  const s = buildServiceSchema() as Record<string, unknown>
  expect(s.telephone).toBe('518-278-6008')
  expect(s['@type']).toBe('Organization')
})
```
Run → FAIL.

- [ ] **Step 2: Rewrite `buildServiceSchema`**

```ts
import { OWNER_PHONE } from './owner'
export function buildServiceSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cash For Test Strips USA',
    url: 'https://cash4teststripsusa.com',
    telephone: OWNER_PHONE,
    email: 'sell@cash4teststripsusa.com',
    areaServed: 'United States',
    description: 'Buys sealed, unexpired diabetic test strips, CGM sensors and pump supplies by mail from any US state, and in person through local buyers.',
  }
}
```
Run test → PASS.

- [ ] **Step 3: Rewrite the homepage** (`app/page.tsx`). Keep the existing imports, the featured-buyer query, the Browse-by-State section and the FAQ/CTA scaffolding; change the content as follows.

Metadata:
```ts
export const metadata: Metadata = {
  title: "We Buy Diabetic Test Strips — Mail-In or Same-Day Local | Cash For Test Strips USA",
  description: "Cash For Test Strips USA buys sealed, unexpired diabetic test strips, Dexcom and Libre sensors and Omnipod supplies. Mail in from any state or meet a local buyer. Call or text 518-278-6008.",
  alternates: { canonical: 'https://cash4teststripsusa.com' },
};
```
(Type the number in `description` only because metadata is a static object; everywhere in JSX use `OWNER_PHONE`.)

Hero (replaces the current hero block; keep the ZIP form beneath):
- eyebrow: `Cash For Test Strips USA · buying since 2019` → use `est_year` only if you can source it; otherwise `Nationwide mail-in · Same-day local`.
- H1: `We buy diabetic test strips.` with a second line `Mail them in from any state, or sell same‑day to a local buyer.`
- Sub: `Sealed, unexpired boxes only. Text a photo of what you have and get a quote back fast.`
- Primary CTA: `<a href={`tel:${OWNER_PHONE.replace(/-/g,'')}`}>Call or text {OWNER_PHONE}</a>`; secondary: `Sell by mail →` linking `/sell`; then the ZIP form with label "Or find a local buyer".
- Stat row: `{localBuyerCount} local buyers` · `50 states by mail` · `Quote by text`.

Trust bar: `✓ Sealed & unexpired only` · `✓ Free shipping label for mail-in` · `✓ PayPal · Zelle · Check · Cash` · `✓ Dexcom · Libre · Omnipod · OneTouch · Contour · Accu-Chek` · `✓ Local pickup in {localBuyerCount}+ cities`.

New section **What we buy** (H2) — a 3-column list, no prices: *Test strips* (OneTouch Verio/Ultra, FreeStyle Lite, Accu-Chek Guide/Aviva, Contour Next, True Metrix); *CGM sensors* (Dexcom G6, Dexcom G7, FreeStyle Libre 2, Libre 3); *Pump & pen supplies* (Omnipod 5, Omnipod DASH, Medtronic and Tandem infusion sets). Close with one line: `Not sure? Text a photo of the box to {OWNER_PHONE}.`

How it works (replace the three steps): 1 `Text a photo` — "Send a picture of the boxes and their expiration dates." 2 `Get a quote` — "We reply with a firm number, usually within the hour." 3 `Get paid` — "Meet a local buyer the same day, or use our free shipping label and get paid when it arrives."

FAQs: keep the six questions but rewrite: remove "Medicare or Medicaid" (→ "supplies purchased through a government-covered program cannot be resold; out-of-pocket or private-insurance purchases are yours to sell"); replace `518-779-9751` with `{OWNER_PHONE}`; the "How does the process work?" answer becomes the mail-in flow ("text a photo, get a quote, we email a prepaid label, you get paid the day it arrives"); the bulk answer drops "higher per-box rate on lots of 10 or more" (a pricing claim) → "we buy from a single box to full estate or pharmacy lots; large lots get a per-lot quote".

Featured buyers: keep, heading `Local buyers who pay same day`.

Final CTA: H2 `Have supplies to sell?`; body `Text a photo for a quote, or find a buyer near you.`; two buttons: tel link + `/directory`.

Remove the `up to $100+ a box` link and every dollar figure. `grep -n '\$[0-9]' app/page.tsx` must return nothing.

- [ ] **Step 4: `app/(auth)/layout.tsx`**

```tsx
import type { Metadata } from "next"
// Account pages exist for buyers managing a listing. They carry no content for
// search and were being indexed under the site's default title.
export const metadata: Metadata = { robots: { index: false, follow: false } }
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Step 5: Remove `/buyer` from `app/sitemap.ts`** (delete that one entry; Google rejected it on 9/1 as a login-gated utility page).

- [ ] **Step 6: Verify** — `npx tsc --noEmit`; `npx vitest run lib/__tests__/schema.test.ts`; `npx next build` in the worktree (needs `.env.local`; delete `.next` before committing) and `curl -s localhost` is NOT required — build passing is the bar. Grep checks: no `$` figures, no `Medicare`, no `779-9751` in `app/page.tsx`.

- [ ] **Step 7: Commit** — `feat: homepage is the buyer page; auth pages noindex; /buyer out of sitemap`.

---

### Task 3: The $10 bonus — shown only where the house honors it

**Files:**
- Modify: `lib/owner.ts` (add `HOUSE_PHONES`)
- Create: `lib/bonus.ts`
- Create: `lib/__tests__/bonus.test.ts`
- Modify: `app/components/BuyerCard.tsx`, `app/company/[slug]/page.tsx` (bonus line near the contact buttons), `app/sell/SellFlowClient.tsx` (form-completion bonus line on the contact step when the matched buyer honors it), `app/sell-test-strips-in-bulk/page.tsx` (one line under the form intro)

**Interfaces:**
- Produces: `honorsBonus(company: Pick<Company,'phone'|'mail_in'|'slug'>): boolean` — true when `mail_in` is true, or the digits of `phone` equal the digits of any entry in `HOUSE_PHONES`. `BONUS_MENTION_COPY = 'Mention Cash For Test Strips USA when you call or text for a $10 bonus on your order.'`; `BONUS_FORM_COPY = 'Complete this form and get a $10 bonus on your order.'`

Why this rule: Feldon decided 9/12 that the **buyer** pays the bonus. No third-party buyer has agreed yet, so the bonus is only advertised where the call reaches the house line (the listing is CFTS's own network, or mail-in). Do not advertise it on a listing with its own phone number.

- [ ] **Step 1: Test** `lib/__tests__/bonus.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { honorsBonus } from '@/lib/bonus'
describe('honorsBonus', () => {
  it('house line, any formatting', () => {
    expect(honorsBonus({ phone: '518-278-6008', mail_in: false, slug: 'x' })).toBe(true)
    expect(honorsBonus({ phone: '5182786008', mail_in: false, slug: 'x' })).toBe(true)
    expect(honorsBonus({ phone: '518-779-9751', mail_in: false, slug: 'x' })).toBe(true)
  })
  it('mail-in', () => { expect(honorsBonus({ phone: null, mail_in: true, slug: 'cfts-mail-in' })).toBe(true) })
  it('third party with its own number does not', () => {
    expect(honorsBonus({ phone: '689-250-2042', mail_in: false, slug: 'liliana-orlando-fl' })).toBe(false)
    expect(honorsBonus({ phone: null, mail_in: false, slug: '864medex-greenville-sc' })).toBe(false)
  })
})
```

- [ ] **Step 2: Implement.** `lib/owner.ts`:
```ts
/** Numbers that ring the business itself. A listing carrying one of these is
 *  answered by the house, which is why the $10 bonus can be promised on it. */
export const HOUSE_PHONES = [OWNER_PHONE, '518-779-9751'] as const
```
`lib/bonus.ts`:
```ts
import type { Company } from './types'
import { HOUSE_PHONES } from './owner'
const digits = (s: string) => s.replace(/\D/g, '')
export const BONUS_MENTION_COPY = 'Mention Cash For Test Strips USA when you call or text for a $10 bonus on your order.'
export const BONUS_FORM_COPY = 'Complete this form and get a $10 bonus on your order.'
export function honorsBonus(c: Pick<Company, 'phone' | 'mail_in' | 'slug'>): boolean {
  if (c.mail_in) return true
  if (!c.phone) return false
  const d = digits(c.phone)
  return HOUSE_PHONES.some((h) => digits(h) === d)
}
```
Run test → PASS.

- [ ] **Step 3: Render it.** `BuyerCard`: under `ContactButtons`, `{honorsBonus(company) && <p className="text-[11px] text-emerald-700 font-semibold">💵 {BONUS_MENTION_COPY}</p>}`. Company profile page: same line beside the page-size contact buttons. `SellFlowClient`: on the contact/quote step, when the matched buyer object satisfies `honorsBonus`, show `BONUS_FORM_COPY` above the submit button. Bulk page: **no bonus line.** Bulk lots are quoted per lot and may route to a third-party buyer (Task 4), so a bonus promise there cannot be kept uniformly. Do not touch `app/sell-test-strips-in-bulk/`.

- [ ] **Step 4: Verify & commit** — `npx tsc --noEmit`; the bonus test; `feat: $10 mention/form bonus, shown only where the house honors it`.

---

### Task 4: Route bulk leads to the state's buyer, fallback to the house

**Files:**
- Create: `lib/bulk-routing.ts`, `lib/__tests__/bulk-routing.test.ts`
- Modify: `app/sell-test-strips-in-bulk/BulkEnquiryForm.tsx` (add a required `state` select of the 50 codes from `STATE_LABELS`; keep `location` as the city text)
- Modify: `app/api/bulk-leads/route.ts` (read `state`, resolve recipient, email buyer with cc house; else house)

**Interfaces:**
- Produces: `pickBulkRecipient(stateCode: string, companies: Array<Pick<Company,'states'|'email'|'active'|'mail_in'|'name'|'slug'>>): { to: string; cc: string | null; buyerName: string | null }` — first active, non-mail-in company whose `states` includes the code AND has a non-empty `email` that is NOT a house address → `{ to: email, cc: OWNER_EMAIL, buyerName: name }`; otherwise `{ to: OWNER_EMAIL, cc: null, buyerName: null }`. House addresses: add `export const HOUSE_EMAILS = [OWNER_EMAIL, 'sell@cash4teststripsusa.com'] as const` to `lib/owner.ts` and export `isHouseEmail(email: string): boolean` (case-insensitive) from `lib/bulk-routing.ts`. Why: on 2026-09-12 every buyer record with no email of its own was set to `sell@cash4teststripsusa.com` (forwards to the owner's Gmail), so without this rule every state would 'route to a buyer' and cc the same inbox twice. Also `hasDedicatedBulkBuyer(stateCode, companies): boolean` (same predicate).

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from 'vitest'
import { pickBulkRecipient, hasDedicatedBulkBuyer } from '@/lib/bulk-routing'
import { OWNER_EMAIL } from '@/lib/owner'
const co = (o: Partial<{states:string[];email:string|null;active:boolean;mail_in:boolean;name:string;slug:string}>) =>
  ({ states: ['NY'], email: null, active: true, mail_in: false, name: 'N', slug: 's', ...o })
describe('bulk routing', () => {
  it('routes to the state buyer with an email, cc house', () => {
    const r = pickBulkRecipient('NY', [co({ email: 'buyer@x.com', name: 'Albany' })])
    expect(r).toEqual({ to: 'buyer@x.com', cc: OWNER_EMAIL, buyerName: 'Albany' })
  })
  it('falls back to the house when no buyer has an email', () => {
    expect(pickBulkRecipient('NY', [co()])).toEqual({ to: OWNER_EMAIL, cc: null, buyerName: null })
    expect(hasDedicatedBulkBuyer('NY', [co()])).toBe(false)
  })
  it('treats the sell@ house address as no dedicated buyer', () => {
    expect(pickBulkRecipient('NY', [co({ email: 'Sell@cash4teststripsusa.com' })])).toEqual({ to: OWNER_EMAIL, cc: null, buyerName: null })
    expect(hasDedicatedBulkBuyer('NY', [co({ email: 'sell@cash4teststripsusa.com' })])).toBe(false)
  })
  it('ignores inactive and mail-in rows', () => {
    expect(pickBulkRecipient('NY', [co({ email: 'a@b.c', active: false }), co({ email: 'm@b.c', mail_in: true })]).to).toBe(OWNER_EMAIL)
  })
  it('is case-insensitive on the code', () => {
    expect(pickBulkRecipient('ny', [co({ email: 'a@b.c' })]).to).toBe('a@b.c')
  })
})
```

- [ ] **Step 2: Implement `lib/bulk-routing.ts`** exactly to the interface (pure; `OWNER_EMAIL` from `lib/owner.ts`).

- [ ] **Step 3: Route.** In `app/api/bulk-leads/route.ts`: read `state = field('state').toUpperCase()`; require it to be in `VALID_STATE_CODES` (from `lib/states.ts`) → 400 `'Please choose your state'`. Query `supabase.from('companies').select('states,email,active,mail_in,name,slug').eq('active', true).eq('mail_in', false).contains('states', [state])` (anon client — RLS already lets it read active rows). `const r = pickBulkRecipient(state, rows ?? [])`. Save `'State: ' + state` into `notes` and `'Routed to: ' + (r.buyerName ?? 'house')`. `sendEmail({ to: r.to, cc: r.cc ?? undefined, ... })` — check `sendEmail`'s signature in `lib/email.ts` supports `cc` (the leads route already passes `cc`, so it does).

- [ ] **Step 4: Form.** Add before "Where you are":
```tsx
<label className={LABEL} htmlFor="bulk-state">State</label>
<select id="bulk-state" name="state" required className={INPUT} defaultValue="">
  <option value="" disabled>Choose your state</option>
  {Object.entries(STATE_LABELS).filter(([c]) => c !== 'CANADA').map(([code, label]) => <option key={code} value={code}>{label}</option>)}
</select>
```
and include `state` in the JSON the form posts.

- [ ] **Step 5: Verify & commit** — `npx tsc --noEmit`; the routing test; `feat: route bulk leads to the state's buyer, fall back to the house`.

---

### Task 5: One page per state — the hand-written post moves into the state page

**Files:**
- Modify: `app/sell-test-strips/[state]/page.tsx` (render the written body; metadata from it)
- Modify: `app/blog/[slug]/page.tsx` (state posts no longer render — `getPostBySlug` branch → `notFound()`; delete the state-post render path and its now-unused imports)
- Modify: `app/blog/page.tsx` (state list links to `/sell-test-strips/<code>` under a heading "State guides", or remove the list — keep the registry posts and the Albany post)
- Modify: `app/sitemap.ts` (drop `blogRoutes` for state posts; keep the Albany post; give state routes `lastModified: post.datePublished`)
- Modify: `next.config.ts` (50 permanent redirects `/blog/<post.slug>` → `/sell-test-strips/<code lower>`)
- Create: `lib/state-post-redirects.ts` + `lib/__tests__/state-post-redirects.test.ts`
- Modify: `lib/__tests__/blog-posts.test.ts` / `post-registry.test.ts` if they assert the blog route renders state posts (read them first; keep the data-shape tests, drop route-rendering assertions)

**Interfaces:**
- Consumes: `bodyFor(stateCode)` from `lib/blog-bodies` (returns `PostBody | undefined`), `STATE_BLOG_POSTS` from `lib/blog-posts.ts`, `postLead/angleSection/postFaqs` from `lib/blog-post-content.ts` as the fallback when no written body exists.
- Produces: `stateRedirects(): { source: string; destination: string; permanent: true }[]` (50 entries, built from `STATE_BLOG_POSTS`).

Design: the state page keeps its commercial top (H1, intro, buyer cards / mail-in / nearby, cities) and then renders the guide: `written.lead` paragraphs, `written.sections` (H2 + paragraphs), then the FAQ block uses `written.faqs` (fallback: the derived state FAQs). Title = `written.title ?? existing title`; description = `written.metaDescription ?? existing`. Drop the generated "What We Buy / requirements / What It Pays / tier tables" sections entirely — they were the duplicated skeleton and the tier tables sit next to the no-price rule. The written `heading` is NOT used (the state page keeps its H1); render `written.heading` as the H2 that opens the guide section.

- [ ] **Step 1: Test** `lib/__tests__/state-post-redirects.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { stateRedirects } from '@/lib/state-post-redirects'
describe('stateRedirects', () => {
  it('maps every state post to its state page, permanently', () => {
    const r = stateRedirects()
    expect(r).toHaveLength(50)
    expect(r.find((x) => x.source === '/blog/sell-diabetic-test-strips-texas')).toEqual({
      source: '/blog/sell-diabetic-test-strips-texas', destination: '/sell-test-strips/tx', permanent: true,
    })
    expect(new Set(r.map((x) => x.destination)).size).toBe(50)
  })
})
```
- [ ] **Step 2: Implement** `lib/state-post-redirects.ts` from `STATE_BLOG_POSTS` (`destination: '/sell-test-strips/' + post.stateCode.toLowerCase()`). In `next.config.ts` add `...stateRedirects()` to the returned array (`import { stateRedirects } from './lib/state-post-redirects'` — relative path; confirm `next build` compiles it. If the config import fails at build, inline the 50 entries generated by a one-off `node -e` and note the source file in a comment).
- [ ] **Step 3: State page.** After the cities block and before the FAQ block insert:
```tsx
{guide && (
  <section className="mt-12 pt-8 border-t border-gray-100 max-w-3xl">
    <h2 className="text-2xl font-extrabold text-gray-900 mb-4">{guide.heading}</h2>
    {guide.lead.map((p) => <p key={p} className="text-gray-700 leading-relaxed mb-4">{p}</p>)}
    {guide.sections.map((s) => (
      <div key={s.heading} className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{s.heading}</h3>
        {s.paragraphs.map((p) => <p key={p} className="text-gray-700 leading-relaxed mb-4">{p}</p>)}
      </div>
    ))}
  </section>
)}
```
where `const guide = bodyFor(code)`; FAQ block uses `guide?.faqs ?? faqs`; `generateMetadata` uses `bodyFor(code)?.title` / `.metaDescription` when present. Add `buildArticleSchema` (already exists) with `datePublished` from the matching `STATE_BLOG_POSTS` entry.
- [ ] **Step 4: Blog route + index + sitemap** as listed in Files.
- [ ] **Step 5: Verify** — `npx tsc --noEmit`; `npx vitest run lib/__tests__/state-post-redirects.test.ts lib/__tests__/blog-posts.test.ts lib/__tests__/blog-bodies.test.ts lib/__tests__/post-registry.test.ts`; `npx next build` passes; then `npx next start -p 3123 &` and `curl -sI localhost:3123/blog/sell-diabetic-test-strips-texas | head -3` shows `308` with `location: /sell-test-strips/tx`, `curl -s localhost:3123/sell-test-strips/tx | grep -c '<h3'` > 3; kill the server; delete `.next`.
- [ ] **Step 6: Commit** — `feat: one page per state — state posts fold into the state pages with permanent redirects`.

---

### Task 6: House-network company profiles leave the index

**Files:**
- Create: `lib/company-index.ts` + `lib/__tests__/company-index.test.ts`
- Modify: `app/company/[slug]/page.tsx` (`generateMetadata` adds `robots: { index: false, follow: true }` when `!isIndexableProfile(row)`; select `phone, url, mail_in` in that metadata query)
- Modify: `app/sitemap.ts` (company routes filtered by `isIndexableProfile`; select `slug, phone, url, mail_in`)

**Interfaces:**
- Produces: `isIndexableProfile(c: Pick<Company,'phone'|'url'|'mail_in'>): boolean` — false when `mail_in`; false when the phone is a house number (reuse `honorsBonus`-style digit match against `HOUSE_PHONES`) AND `url` is empty; true otherwise. Rationale: 21 listings are the house network with identical fields and no site of their own — thin near-duplicates; a listing with its own website or its own number is a real third party and stays indexed.

- [ ] **Step 1: Test**
```ts
import { describe, it, expect } from 'vitest'
import { isIndexableProfile } from '@/lib/company-index'
describe('isIndexableProfile', () => {
  it('house number and no site → noindex', () => { expect(isIndexableProfile({ phone: '518-278-6008', url: null, mail_in: false })).toBe(false) })
  it('house number but own site → index', () => { expect(isIndexableProfile({ phone: '518-278-6008', url: 'https://x', mail_in: false })).toBe(true) })
  it('own number → index', () => { expect(isIndexableProfile({ phone: '689-250-2042', url: null, mail_in: false })).toBe(true) })
  it('mail-in → noindex', () => { expect(isIndexableProfile({ phone: null, url: null, mail_in: true })).toBe(false) })
})
```
- [ ] **Step 2: Implement, wire, verify** (`npx tsc --noEmit`, test green, `npx next build`).
- [ ] **Step 3: Commit** — `feat: house-network company profiles are noindex and out of the sitemap`.

---

### Task 7: Legal page — answer first, no program names

**Files:**
- Modify: `app/is-it-legal-to-sell-diabetic-test-strips/page.tsx` (metadata description, intro, sections, FAQs, JSON-LD text)

Rules: the first paragraph under the H1 is a 40–60-word direct answer beginning with "Yes." Every H2 is phrased as the question people type (from Search Console: "is it legal to sell diabetic test strips", "is it illegal to sell diabetic test strips", "can you sell diabetic test strips", "can i sell expired test strips", "can you sell diabetic test strips on ebay", "selling diabetic test strips legal"). Replace every "Medicare"/"Medicaid" with "a government-covered program" / "how the supplies were paid for" — including inside the FAQ answers that feed `buildFaqPageSchema`. Add two FAQs the site has no answer for: expired strips (most have no buyer market; sealed expired Omnipod pods and Dexcom G7 sensors are the exceptions — text a photo to `OWNER_PHONE`) and selling on eBay (eBay restricts medical test strip listings; a direct buyer is the usual route). Keep the "not legal advice" disclaimer. No dollar figures, no personal names, no external links.

- [ ] **Step 1: Rewrite. Step 2: Verify** — `grep -n "Medicare\|Medicaid\|\$[0-9]" app/is-it-legal-to-sell-diabetic-test-strips/page.tsx` returns nothing; `npx tsc --noEmit`. **Step 3: Commit** — `content: legal page answers first and drops program names`.

---

## Order of execution

1 → (2 ∥ 4 ∥ 7) → 3 → 5 → 6. Task 3 waits for Task 4 (bulk bonus line depends on `hasDedicatedBulkBuyer`). Task 5 and 6 both touch `app/sitemap.ts`; run in sequence.

## Not in this plan (done by Donna directly after the PR is open)

- Data write: `sell@cash4teststripsusa.com` onto the buyer records' `email` where `email` is null (PostgREST, rollback staged first).
- Request indexing on `/` and `/sell-test-strips` after deploy.
- Citations and Semrush Position Tracking (need Feldon signed in).
