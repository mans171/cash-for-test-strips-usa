import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { VALID_STATE_CODES } from '@/lib/states'
import { isHoneypotTripped } from '@/lib/honeypot'
import { checkRateLimit, clientIp, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'
import { checkSameOrigin } from '@/lib/admin-auth'
import { parseSellStartInput } from '@/lib/sell-starts'

// PUBLIC ON PURPOSE. /sell calls this once, when a seller moves from "what do
// you have" to the buyers list, so a seller who leaves before sending is not
// lost. It saves a row and does nothing else: no email, no text, no lookup.
// Any follow-up is the owner texting by hand from /admin.
//
// sell_starts has RLS on and no policies, so the insert uses the service role.
// What makes that safe is parseSellStartInput — a strict whitelist that can set
// a phone, a name, a state and the listed items, and cannot set a completion,
// a contacted/dismissed stamp or a note of ours — and the fact that this route
// only ever INSERTS. Same guard order as /api/mail-in: same-origin, honeypot,
// per-IP rate limit, all before any database access.
//
// The client treats every failure here as silent: a seller is never blocked
// because this route is down.

export async function POST(request: Request) {
  try {
    const forbidden = checkSameOrigin(request)
    if (forbidden) return forbidden

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Bot check first: nothing inserted, and an ordinary success shape so the
    // bot learns nothing.
    if (isHoneypotTripped(body)) {
      console.warn('[honeypot] dropped', '/api/sell-starts')
      return NextResponse.json({ ok: true })
    }

    // Per-IP limit second. Its OWN bucket ("sell-start:" prefix): /api/leads
    // counts against the bare IP, and a seller who went back and changed their
    // order a few times must never find the real send rate-limited by these.
    const limit = checkRateLimit(`sell-start:${clientIp(request.headers)}`)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: RATE_LIMIT_MESSAGE },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const parsed = parseSellStartInput(body, VALID_STATE_CODES)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('sell_starts')
      .insert({ ...parsed.value, source_page: '/sell' })
      .select('id')
      .single()

    if (error || !data) {
      console.error('[POST /api/sell-starts] insert failed', error?.message)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data.id }, { status: 201 })
  } catch (error) {
    // Message only — never the body, which carries a phone number.
    console.error('[POST /api/sell-starts]', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
