import { NextResponse } from 'next/server'
import { createLead } from '@/lib/leads'
import { buildBuyerEmail, buildQuoteMessage } from '@/lib/message-template'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendEmailOrThrow } from '@/lib/email'
import { getCompanyContact } from '@/lib/order-matching'
import type { OrderItem } from '@/lib/types'

const VALID_CONDITIONS = new Set(['sealed', 'unsealed'])
const MAX_ITEMS = 50
const OWNER_EMAIL = 'feldon.richards@gmail.com'

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
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to contact a buyer' }, { status: 401 })
    }

    const body = await request.json()
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

    const lead = await createLead({
      items: items as OrderItem[],
      matchedCompanyId,
      channel,
      sourcePage: sourcePage ?? null,
      name: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
    })

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
