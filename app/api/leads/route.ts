import { NextResponse } from 'next/server'
import { createLead } from '@/lib/leads'
import { buildBuyerEmail, buildQuoteMessage } from '@/lib/message-template'
import { sendEmailOrThrow } from '@/lib/email'
import { getCompanyContact } from '@/lib/order-matching'
import type { OrderItem } from '@/lib/types'
import { OWNER_EMAIL } from '@/lib/owner'
import { isHoneypotTripped } from '@/lib/honeypot'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

const VALID_CONDITIONS = new Set(['sealed', 'unsealed'])
const MAX_ITEMS = 50

function isValidItem(item: unknown): item is OrderItem {
  if (!item || typeof item !== 'object') return false
  const candidate = item as Record<string, unknown>
  return (
    typeof candidate.brand === 'string' &&
    typeof candidate.count === 'number' &&
    typeof candidate.expiration === 'string' &&
    typeof candidate.condition === 'string' &&
    VALID_CONDITIONS.has(candidate.condition)
  )
}

export async function POST(request: Request) {
  try {
    // No session required: the account gate was removed on 2026-09-12 so a
    // seller can reach a buyer without signing up. Every validation below
    // still applies.
    const body = await request.json()

    // Bot check first, before any validation: a filled honeypot means nothing
    // is inserted and nothing is emailed, but the response is the ordinary
    // success shape so the bot learns nothing about why it failed.
    if (isHoneypotTripped(body)) {
      console.warn('[honeypot] dropped', '/api/leads')
      return NextResponse.json({ leadId: 'ok' })
    }

    // If the seller happens to be signed in, stamp the lead with their id so
    // they can see it later under My Orders. Signing in is NOT required and a
    // broken or missing cookie must never block a submission, so any failure
    // here resolves to null rather than throwing into the 500 handler.
    let userId: string | null = null
    // The lead insert has to run through the SESSION-BOUND client when it
    // carries a user_id: leads_insert_public checks `user_id = auth.uid()`, and
    // the module-level anon client has no session, so auth.uid() would be null
    // and Postgres would refuse the row. Stays null for anonymous submissions,
    // which keeps the anon path byte-for-byte what it was.
    let sessionClient: SupabaseClient | null = null
    try {
      const server = await createServerSupabaseClient()
      const { data } = await server.auth.getUser()
      userId = data?.user?.id ?? null
      if (userId) sessionClient = server
    } catch (sessionError) {
      console.warn('[POST /api/leads] session read failed, continuing anonymously', sessionError)
    }

    const { items, matchedCompanyId, channel, sourcePage, name, email, phone } = body ?? {}

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }
    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: `No more than ${MAX_ITEMS} items are allowed` }, { status: 400 })
    }
    if (!items.every(isValidItem)) {
      return NextResponse.json({ error: 'Each item must include a valid brand, count, expiration, and condition' }, { status: 400 })
    }
    if (typeof matchedCompanyId !== 'string' || matchedCompanyId.trim().length === 0) {
      return NextResponse.json({ error: 'A matched buyer is required' }, { status: 400 })
    }
    if (channel !== 'sms' && channel !== 'email') {
      return NextResponse.json({ error: 'channel must be sms or email' }, { status: 400 })
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    }

    const buyer = await getCompanyContact(matchedCompanyId)
    const buyerContactValue = channel === 'sms' ? buyer?.phone : buyer?.email
    if (!buyer || !buyerContactValue) {
      return NextResponse.json({ error: 'This buyer cannot be reached right now. Please try another buyer.' }, { status: 400 })
    }

    const trimmedPhone = typeof phone === 'string' && phone.trim() ? phone.trim() : undefined
    const trimmedEmail = typeof email === 'string' && email.trim() ? email.trim() : undefined

    const lead = await createLead(
      {
        items: items as OrderItem[],
        matchedCompanyId,
        channel,
        sourcePage: sourcePage ?? null,
        name: name.trim(),
        email: trimmedEmail,
        phone: trimmedPhone,
        userId,
      },
      sessionClient ?? undefined
    )

    if (channel === 'sms') {
      const message = buildQuoteMessage(items as OrderItem[], name.trim())
      return NextResponse.json({ leadId: lead.id, message })
    }

    const { subject, html } = buildBuyerEmail(items as OrderItem[], name.trim(), trimmedPhone, trimmedEmail)

    try {
      await sendEmailOrThrow({ to: buyer.email!, cc: OWNER_EMAIL, subject, html })
    } catch (emailError) {
      console.error('[POST /api/leads] failed to email buyer', { leadId: lead.id, buyerId: matchedCompanyId }, emailError)
      return NextResponse.json({ error: "Couldn't send your request. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ leadId: lead.id })
  } catch (error) {
    console.error('[POST /api/leads]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
