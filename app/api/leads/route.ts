import { NextResponse } from 'next/server'
import { createLead } from '@/lib/leads'
import { buildQuoteMessage } from '@/lib/message-template'
import type { OrderItem } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, matchedCompanyId, channel, sourcePage } = body ?? {}

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }
    if (channel !== 'sms' && channel !== 'email') {
      return NextResponse.json({ error: 'channel must be sms or email' }, { status: 400 })
    }

    const lead = await createLead({
      items: items as OrderItem[],
      matchedCompanyId: matchedCompanyId ?? null,
      channel,
      sourcePage: sourcePage ?? null,
    })
    const message = buildQuoteMessage(items as OrderItem[])

    return NextResponse.json({ leadId: lead.id, message })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
