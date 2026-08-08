import { NextResponse } from 'next/server'
import { createLead } from '@/lib/leads'
import { buildQuoteMessage } from '@/lib/message-template'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { OrderItem } from '@/lib/types'

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
    if (channel !== 'sms' && channel !== 'email') {
      return NextResponse.json({ error: 'channel must be sms or email' }, { status: 400 })
    }
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    }

    const lead = await createLead({
      items: items as OrderItem[],
      matchedCompanyId: matchedCompanyId ?? null,
      channel,
      sourcePage: sourcePage ?? null,
      name: name.trim(),
      email: typeof email === 'string' && email.trim() ? email.trim() : undefined,
      phone: typeof phone === 'string' && phone.trim() ? phone.trim() : undefined,
    })
    const message = buildQuoteMessage(items as OrderItem[], name.trim())

    return NextResponse.json({ leadId: lead.id, message })
  } catch (error) {
    console.error('[POST /api/leads]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
