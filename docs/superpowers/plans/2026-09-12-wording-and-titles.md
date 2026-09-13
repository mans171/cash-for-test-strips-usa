# Wording Sweep + Page Titles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox syntax.

**Goal:** (1) No "Medicare"/"Medicaid" wording anywhere on cash4teststripsusa.com — 63 files, ~211 mentions in the 50 state guides plus 13 other files. (2) Every page `<title>` at or under 60 characters — the live crawl reports 660 over-long titles.

**Architecture:** Two independent content tasks on branch `feat/wording-and-titles` (worktree `/private/tmp/cftsusa-buyer-first`, off `origin/main` e9d1edf). Task 1 edits only prose files; Task 2 edits only title/metadata code and the root layout template. Each adds a test that enforces its rule so the problem cannot come back.

**Spec:** Feldon 2026-09-12: "Wording sweep and titles?" (go-ahead). Standing rules: the site never names government programs — say "a government-covered program" / "how the supplies were paid for"; no dollar figures except the flat "$10 bonus"; no personal names; phone via `OWNER_PHONE`.

## Global Constraints
- `npx tsc --noEmit` clean; `npx eslint` on touched files; `npx vitest run <file>` for pure tests (`.env.test` exists — never run the suite without a file argument).
- Git: `git add <explicit paths>` only, never `-A`; no push. Trailer: `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` / `Claude-Session: https://claude.ai/code/session_01RTEV3WMQKVvkVrUr4myxcS`.
- The two tasks run concurrently in the same worktree: **Task 1 never touches metadata/title code; Task 2 never touches prose bodies.** Never `git stash`. If `git commit` hits index.lock, wait 10 s and retry.

---

### Task 1: Program-name wording sweep

**Files:** every file matching `grep -rli "medicare\|medicaid" app lib --exclude-dir=__tests__ | grep -v "\.test\."` — 50 × `lib/blog-bodies/<code>.ts`, 7 × `lib/posts/*.ts`, `lib/hub-page-content.ts`, `lib/blog-post-content.ts`, `lib/state-page-content.ts`, `app/about/page.tsx`, `app/blog/sell-test-strips-albany-ny/page.tsx`, `app/sell-test-strips-in-bulk/page.tsx`. Test: `lib/__tests__/no-program-names.test.ts` (new).

**Rules for the rewrite (this is editing, not find-and-replace):**
- The legal substance stays: supplies bought through a government-covered program cannot be resold; out-of-pocket or private-insurance purchases are the seller's to sell. Say it with: "a government-covered program", "government-covered supplies", "how the supplies were paid for", "covered by a government program". Vary the phrasing so 50 pages do not share one sentence.
- Where a passage lists programs by name as examples ("Medicare Part B, Part D, Medicaid"), collapse to the generic phrase — do not invent other program names.
- Never change facts, numbers, headings' meaning, FAQ questions' intent, or `metaDescription` length limits (`lib/__tests__/blog-bodies.test.ts` enforces ≤240 chars; keep every description within it). Keep each state's voice; edit the minimum needed.
- A heading that IS the program name ("The Medicare rule") becomes a plain-language heading ("The one rule about how supplies were paid for").

- [ ] Step 1: write the test first:
```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
const ROOTS = ['lib/blog-bodies', 'lib/posts', 'lib/hub-page-content.ts', 'lib/blog-post-content.ts', 'lib/state-page-content.ts', 'app/about/page.tsx', 'app/blog/sell-test-strips-albany-ny/page.tsx', 'app/sell-test-strips-in-bulk/page.tsx', 'app/page.tsx', 'app/is-it-legal-to-sell-diabetic-test-strips/page.tsx']
function files(p: string): string[] { try { return readdirSync(p).filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).map(f => join(p, f)) } catch { return [p] } }
describe('site copy never names government programs', () => {
  for (const f of ROOTS.flatMap(files)) {
    it(f, () => { expect(readFileSync(f, 'utf8')).not.toMatch(/medicare|medicaid/i) })
  }
})
```
Run → FAIL on 63 files. Step 2: rewrite. Step 3: test green + `npx vitest run lib/__tests__/blog-bodies.test.ts lib/__tests__/post-registry.test.ts` green + tsc. Step 4: commit `content: drop government program names site-wide`.

---

### Task 2: Every page title ≤ 60 characters

**Files:** `app/layout.tsx` (the `title.template`/default), and the `title:` in: `app/company/[slug]/page.tsx`, `app/sell-test-strips/[state]/page.tsx`, `app/sell-test-strips/[state]/[city]/page.tsx`, `app/blog/[slug]/page.tsx` (registry posts), `app/sell-test-strips/page.tsx`, `app/directory/page.tsx`, `app/blog/page.tsx`, `app/about/page.tsx`, `app/sell/page.tsx`, `app/sell-test-strips-in-bulk/page.tsx`, `app/how-much-are-diabetic-test-strips-worth/page.tsx`, `app/blog/sell-test-strips-albany-ny/page.tsx`, `app/page.tsx`, `app/orders/page.tsx`, `app/buyer/page.tsx`. Also `lib/blog-bodies/<code>.ts` `title` fields ONLY IF they exceed the budget after the template change (Task 1 is editing those files' prose — coordinate by editing only the `title:` line, and re-read the file immediately before editing). Test: `lib/__tests__/page-titles.test.ts` (new) + `lib/title.ts` (new).

**Design:**
- `lib/title.ts`: `export const BRAND = 'Cash For Test Strips USA'`, `export const TITLE_MAX = 60`, `export function pageTitle(core: string, opts?: { brand?: boolean }): string` — returns `core` when `core.length > TITLE_MAX - ' | '.length - BRAND.length` (no room for the brand) else `${core} | ${BRAND}`; throws in tests / `console.warn`s at runtime when `core.length > TITLE_MAX`. Root layout: `title: { default: 'Cash For Test Strips USA — Sell Diabetic Test Strips', template: '%s' }` so the template never appends (pages decide, via `pageTitle`).
- Per-page cores (all ≤ 60 on their own; the brand is appended only when it fits):
  - home: `We Buy Diabetic Test Strips | Mail-In or Local` (46)
  - state: `Sell Diabetic Test Strips in {State}` (≤ 47 for "North Carolina"); the hand-written `title` fields in `lib/blog-bodies` currently run ~57 chars with " — 2026 Guide"; replace with this core in `generateMetadata` and ignore `written.title` (record that decision in a comment) — do NOT edit the body files.
  - city: `Sell Test Strips in {City}, {ST}` 
  - company: `{Company name} — Test Strip Buyer` when ≤ 60, else `Test Strip Buyer in {City}, {ST}`; company names like "Cash For Test Strips - Philadelphia, PA" become `Test Strip Buyer in Philadelphia, PA`.
  - registry posts: keep their own `title` if ≤ 60, else use the registry's `shortTitle` — add an optional `shortTitle` to `lib/posts/types.ts` and set it on any post whose title exceeds 60 (edit ONLY the `title`/`shortTitle` lines of those files; Task 1 is editing their bodies — re-read right before editing).
  - static pages: hub `Sell Diabetic Test Strips: All 50 States`; directory `Test Strip Buyer Directory`; blog `Selling Diabetic Supplies: Guides`; about `About Cash For Test Strips USA`; sell `Get a Quote for Your Test Strips`; bulk `Sell Test Strips in Bulk`; worth page `What Are Diabetic Test Strips Worth?`; Albany post keep if ≤ 60; orders `My Orders`; buyer `Manage Your Listing`.
- Test: `pageTitle` unit cases (fits with brand; brand dropped when no room; warns/throws over max) AND a data-driven case: for every `STATE_LABELS` state, every `CITY_TARGETS` city, and a sample of the longest live company names (hardcode the 5 longest from the roster: "Cash for Diabetic Test Strips & CGM Supplies Albany NY" and similar — read them from the DB is not possible in tests; use literals), the generated title is ≤ 60.
- [ ] Step 1 test → FAIL. Step 2 implement. Step 3 `npx next build`, then `npm run check:crawl -- --base=http://localhost:3123` against `npx next start -p 3123` — expect `title-long` warnings = 0 (kill the server, `rm -rf .next`). Step 4 commit `seo: every page title fits 60 characters`.
