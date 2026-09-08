/**
 * Which URLs to tell search engines about, and the call that does it.
 *
 * Why this exists: scripts/indexnow-ping.ts is a MANUAL command. It was run by
 * hand once, on 2026-09-07, for 53 URLs. Nothing ran it before that and
 * nothing would have run it again, so every page published after that date
 * would have gone back to waiting to be crawled — which is the exact problem
 * IndexNow was added to solve. This module is the automatic half.
 *
 * Design note: there is deliberately NO stored "already submitted" table.
 * Instead, changed-ness is derived from content the site already holds —
 * a post's dateModified, a buyer's created_at — and the cron asks for a short
 * window. A URL therefore gets submitted a small number of times in the days
 * after it changes, and never again. That is well within what IndexNow expects
 * and it costs no schema, no migration and no secret state that can drift out
 * of sync with reality.
 *
 * The alternative — resubmitting the whole sitemap on a schedule — is
 * explicitly discouraged by the protocol and is what gets a host ignored.
 */

export const INDEXNOW_HOST = 'cash4teststripsusa.com'
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
const BASE_URL = `https://${INDEXNOW_HOST}`

/** How far back to look. The cron runs daily, so a 2-day window means each
 *  changed URL is submitted about twice and then stops. Widening this does not
 *  find more pages, it just repeats the same ones. */
export const CHANGED_WITHIN_DAYS = 2

export type ChangedInput = {
  /** now, injected so this is testable without a clock */
  nowMs: number
  /** registry + state blog posts: slug and the date the content last changed */
  posts: Array<{ slug: string; changedAt: string | null }>
  /** buyers: their profile page, plus the state/city pages they unlock */
  companies: Array<{ slug: string; states: string[]; createdAt: string | null }>
  /** city targets currently publishable, so a new buyer's city page is included */
  cities: Array<{ state: string; slug: string }>
  /** URLs that should always go when anything else changed (hubs that list it) */
  alwaysWithChanges?: string[]
}

function withinWindow(iso: string | null, nowMs: number, days: number): boolean {
  if (!iso) return false
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return false
  const ageMs = nowMs - t
  // Future-dated content (the blog cadence schedules posts ahead) counts as
  // changed: it is new, and it is already being served.
  return ageMs <= days * 86_400_000
}

/**
 * The URLs worth telling search engines about right now. Pure: no I/O, no
 * clock, no network. Returns absolute URLs, deduplicated, in a stable order.
 */
export function changedUrls(input: ChangedInput, days = CHANGED_WITHIN_DAYS): string[] {
  const out = new Set<string>()

  for (const p of input.posts) {
    if (withinWindow(p.changedAt, input.nowMs, days)) out.add(`${BASE_URL}/blog/${p.slug}`)
  }

  const changedStates = new Set<string>()
  for (const c of input.companies) {
    if (!withinWindow(c.createdAt, input.nowMs, days)) continue
    out.add(`${BASE_URL}/company/${c.slug}`)
    for (const st of c.states) {
      if (!/^[A-Z]{2}$/.test(st)) continue
      changedStates.add(st)
      out.add(`${BASE_URL}/sell-test-strips/${st.toLowerCase()}`)
    }
  }

  // A new buyer changes its state's city pages too — that is where the roster
  // and the distances are rendered.
  for (const city of input.cities) {
    if (changedStates.has(city.state)) {
      out.add(`${BASE_URL}/sell-test-strips/${city.state.toLowerCase()}/${city.slug}`)
    }
  }

  // Hubs only go when something below them actually moved; sending them on a
  // quiet day is the resubmit-everything mistake in miniature.
  if (out.size > 0) {
    for (const u of input.alwaysWithChanges ?? []) out.add(u)
  }

  return [...out].sort()
}

export type SubmitResult = { submitted: number; status: number; ok: boolean }

/** One IndexNow call. Returns rather than throws: a failed ping must never
 *  take down the cron or anything calling it. */
export async function submitToIndexNow(urls: string[], key: string): Promise<SubmitResult> {
  if (urls.length === 0) return { submitted: 0, status: 0, ok: true }
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: INDEXNOW_HOST,
      key,
      keyLocation: `${BASE_URL}/${key}.txt`,
      urlList: urls,
    }),
  })
  return { submitted: urls.length, status: res.status, ok: res.ok || res.status === 202 }
}
