import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { STATE_BLOG_POSTS } from '@/lib/blog-posts'
import { POST_REGISTRY } from '@/lib/posts'
import { publishableCityTargets } from '@/lib/city-page-content'
import { changedUrls, submitToIndexNow, CHANGED_WITHIN_DAYS } from '@/lib/indexnow'
import type { Company } from '@/lib/types'

// Vercel Cron calls this daily (see vercel.json) with
// `Authorization: Bearer $CRON_SECRET`. Without CRON_SECRET set the route
// refuses every request rather than defaulting open — an unauthenticated
// endpoint that can fire an external API is a thing other people will find.
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = process.env.INDEXNOW_KEY
  if (!key) {
    // Loud rather than silent: a missing key means this has been quietly doing
    // nothing, which is indistinguishable from working.
    console.error('indexnow cron: INDEXNOW_KEY is not set — nothing submitted')
    return NextResponse.json({ error: 'INDEXNOW_KEY is not set' }, { status: 500 })
  }

  const { data: companyRows, error } = await supabase
    .from('companies')
    .select('slug, states, created_at, lat, lng')
    .eq('mail_in', false)
  if (error) {
    console.error('indexnow cron: company read failed', error.message)
    return NextResponse.json({ error: 'Could not read companies' }, { status: 500 })
  }
  const companies = companyRows ?? []

  const urls = changedUrls({
    nowMs: Date.now(),
    posts: [
      ...POST_REGISTRY.map((p) => ({ slug: p.slug, changedAt: p.dateModified })),
      ...STATE_BLOG_POSTS.map((p) => ({ slug: p.slug, changedAt: p.datePublished })),
    ],
    companies: companies.map((c) => ({
      slug: c.slug as string,
      states: (c.states as string[]) ?? [],
      createdAt: (c.created_at as string) ?? null,
    })),
    cities: publishableCityTargets(companies as unknown as Company[]).map((c) => ({
      state: c.state,
      slug: c.slug,
    })),
    // Only sent when something below them changed.
    alwaysWithChanges: [
      'https://cash4teststripsusa.com/directory',
      'https://cash4teststripsusa.com/sell-test-strips',
    ],
  })

  if (urls.length === 0) {
    return NextResponse.json({ ok: true, submitted: 0, note: 'nothing changed' })
  }

  try {
    const result = await submitToIndexNow(urls, key)
    console.log(
      `indexnow cron: submitted ${result.submitted} url(s), status ${result.status}`,
    )
    return NextResponse.json({ ...result, windowDays: CHANGED_WITHIN_DAYS, urls })
  } catch (err) {
    console.error('indexnow cron: submission threw', err)
    return NextResponse.json({ error: 'Submission failed' }, { status: 502 })
  }
}
