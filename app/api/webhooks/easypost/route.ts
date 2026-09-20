import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyWebhookSignature } from '@/lib/easypost'
import { normalizeEasyPostMode, planTrackerUpdate, type MailInOrder } from '@/lib/mail-in'

// PUBLIC, and the only caller is EasyPost. The signature is checked against
// the RAW body before anything else: a missing secret or a bad signature is a
// 401 with NO database access. After that the route answers 200 to everything
// well-signed, including events it chooses to ignore — a non-2xx makes
// EasyPost retry, and there is nothing to be gained by retrying an ignore.

const ignored = (reason: string) => NextResponse.json({ ok: true, ignored: reason })

export async function POST(request: Request) {
  const rawBody = await request.text()

  if (!verifyWebhookSignature(rawBody, request.headers.get('x-hmac-signature'), process.env.EASYPOST_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let event: Record<string, unknown>
    try {
      event = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
      return ignored('not json')
    }
    if (!event || typeof event !== 'object') return ignored('not an event')
    if (event.description !== 'tracker.updated') return ignored('not tracker.updated')

    const tracker = (event.result ?? {}) as Record<string, unknown>
    const trackerStatus = typeof tracker.status === 'string' ? tracker.status : ''
    const trackingCode = typeof tracker.tracking_code === 'string' ? tracker.tracking_code : ''
    const trackerId = typeof tracker.id === 'string' ? tracker.id : ''
    if (!trackerStatus || (!trackingCode && !trackerId)) return ignored('no tracker')

    let found = trackingCode
      ? await supabaseAdmin.from('mail_in_orders').select('*').eq('tracking_code', trackingCode).order('created_at', { ascending: false }).limit(1).maybeSingle()
      : null
    if ((!found || !found.data) && trackerId) {
      found = await supabaseAdmin.from('mail_in_orders').select('*').eq('easypost_tracker_id', trackerId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    }
    if (found?.error) {
      // A real failure on our side: let EasyPost retry.
      console.error('[easypost webhook] lookup failed', found.error.message)
      return NextResponse.json({ error: 'temporary failure' }, { status: 500 })
    }
    const order = (found?.data ?? null) as MailInOrder | null
    if (!order) return ignored('unknown tracker')

    // A test-mode event must never move a live kit, nor the other way round.
    const eventMode = normalizeEasyPostMode(event.mode ?? tracker.mode)
    if (!eventMode || eventMode !== order.easypost_mode) return ignored('mode mismatch')

    // A voided label's tracker can still fire; it no longer speaks for the kit.
    if (order.label_refund_status) return ignored('label voided')

    const plan = planTrackerUpdate(order, trackerStatus, new Date())
    if (!plan) return ignored('nothing to change')

    // Conditional on the status we planned against, so a move made by a person
    // in the same instant wins and this event becomes a no-op.
    const saved = await supabaseAdmin
      .from('mail_in_orders')
      .update(plan.update)
      .eq('id', order.id)
      .eq('status', order.status)
      .select('id')
      .maybeSingle()
    if (saved.error) {
      console.error('[easypost webhook] update failed', saved.error.message)
      return NextResponse.json({ error: 'temporary failure' }, { status: 500 })
    }
    if (!saved.data) return ignored('kit changed')

    const { error: eventError } = await supabaseAdmin
      .from('mail_in_events')
      .insert(plan.events.map((e) => ({ order_id: order.id, type: e.type, detail: e.detail, actor: 'system' })))
    if (eventError) console.error('[easypost webhook] timeline write failed', eventError.message)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[easypost webhook]', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'temporary failure' }, { status: 500 })
  }
}
