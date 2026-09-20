import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { MailInOrder } from '@/lib/mail-in'
import { emailSellerLink, sellerLink, sellerLinkText } from '@/lib/mail-in-server'

// "Resend link". Admin only, session check first. Returns the seller's link
// and the ready-to-send text; with { "email": true } it also emails it. It
// never makes a label and never changes a status.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied

    const { id } = await params
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: 'Invalid kit id' }, { status: 400 })
    }

    const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>

    const existing = await supabaseAdmin.from('mail_in_orders').select('*').eq('id', id).maybeSingle()
    if (existing.error) {
      console.error('[POST link] load failed', existing.error.message)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
    if (!existing.data) return NextResponse.json({ error: 'Kit not found' }, { status: 404 })
    const order = existing.data as MailInOrder

    let emailed = false
    if (body.email === true) {
      if (!order.email) return NextResponse.json({ error: 'This seller has no email address on file.' }, { status: 400 })
      emailed = await emailSellerLink(order)
      const { error: eventError } = await supabaseAdmin
        .from('mail_in_events')
        .insert({ order_id: id, type: 'link_sent', detail: { channel: 'email' }, actor: 'admin' })
      if (eventError) console.error('[POST link] timeline write failed', eventError.message)
    }

    return NextResponse.json({ link: sellerLink(order.token), text: sellerLinkText(order), emailed })
  } catch (error) {
    console.error('[POST link]', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
