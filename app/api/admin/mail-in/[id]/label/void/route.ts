import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { LABEL_CLAIMED_ERROR, hasActiveLabel, isLabelClaim, stripToken, validNextStatuses, type MailInOrder } from '@/lib/mail-in'
import { EasyPostError, getEasyPostConfig, refundShipment } from '@/lib/easypost'

// "Void label". Admin only, session check first. The tracking code and label
// URLs stay on the row as history and label_refund_status marks the label dead
// (lib/mail-in hasActiveLabel) — the seller page stops offering it.
//
// `easypost_shipment_id` IS cleared, because the label route claims a kit with
// `WHERE easypost_shipment_id IS NULL` (one purchase per kit, enforced in the
// database) and a voided kit must be claimable again. The voided shipment id
// is not lost: it is written into the label_voided timeline event.
//
// A `claim:` placeholder (a label being bought right now) is not a shipment:
// hasActiveLabel is false for it, so this route answers 409 and never sends
// it to EasyPost's refund endpoint.
//
// This is the one sanctioned BACKWARD move (Label made -> Quote agreed), which
// is why it does not go through planOrderPatch. It leaves its own trail.

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

    const existing = await supabaseAdmin.from('mail_in_orders').select('*').eq('id', id).maybeSingle()
    if (existing.error) {
      console.error('[POST label/void] load failed', existing.error.message)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
    if (!existing.data) return NextResponse.json({ error: 'Kit not found' }, { status: 404 })
    const order = existing.data as MailInOrder

    if (isLabelClaim(order.easypost_shipment_id)) {
      return NextResponse.json({ error: LABEL_CLAIMED_ERROR }, { status: 409 })
    }
    if (order.status !== 'label_made' || !hasActiveLabel(order)) {
      return NextResponse.json({ error: 'A label can only be voided while the kit is at Label made and the label has not been voided already.' }, { status: 409 })
    }

    const config = getEasyPostConfig(order.easypost_mode ?? undefined)
    if (!config) return NextResponse.json({ error: 'EasyPost is not configured' }, { status: 503 })

    const voidedShipmentId = order.easypost_shipment_id as string
    let refundStatus: string
    try {
      refundStatus = await refundShipment(config, voidedShipmentId)
    } catch (error) {
      if (error instanceof EasyPostError) {
        console.error('[POST label/void] EasyPost error', error.httpStatus, error.code, error.message)
        return NextResponse.json({ error: `EasyPost: ${error.message}` }, { status: 502 })
      }
      throw error
    }

    // The timeline row goes in FIRST: it is where the voided shipment id lives
    // from now on. Only once it is safely written is the id cleared from the
    // kit. If it could not be written the id stays on the row (the label route
    // archives it before the next label), so it is never lost either way.
    const { error: voidEventError } = await supabaseAdmin.from('mail_in_events').insert({
      order_id: id,
      type: 'label_voided',
      detail: { refund_status: refundStatus, tracking_code: order.tracking_code, easypost_shipment_id: voidedShipmentId, mode: order.easypost_mode },
      actor: 'admin',
    })
    if (voidEventError) console.error(`[POST label/void] timeline write failed — shipment ${voidedShipmentId} stays on the kit`, voidEventError.message)

    const nowIso = new Date().toISOString()
    const update: Record<string, unknown> = { label_refund_status: refundStatus, status: 'quote_agreed', updated_at: nowIso }
    if (!voidEventError) update.easypost_shipment_id = null
    const saved = await supabaseAdmin
      .from('mail_in_orders')
      .update(update)
      .eq('id', id)
      .eq('status', 'label_made')
      .eq('easypost_shipment_id', voidedShipmentId)
      .select('*')
      .maybeSingle()
    if (saved.error || !saved.data) {
      console.error(`[POST label/void] REFUND REQUESTED BUT NOT SAVED — kit ${order.order_number}, shipment ${voidedShipmentId}, refund ${refundStatus}`)
      return NextResponse.json(
        { error: `EasyPost accepted the void (${refundStatus}) but the kit could not be updated. Reload and check the kit.` },
        { status: saved.error ? 500 : 409 }
      )
    }
    const updated = saved.data as MailInOrder

    const { error: eventError } = await supabaseAdmin
      .from('mail_in_events')
      .insert({ order_id: id, type: 'status_changed', detail: { from: 'label_made', to: 'quote_agreed' }, actor: 'admin' })
    if (eventError) console.error('[POST label/void] timeline write failed', eventError.message)

    const timeline = await supabaseAdmin.from('mail_in_events').select('*').eq('order_id', id).order('created_at', { ascending: false }).limit(500)
    return NextResponse.json({
      order: stripToken(updated),
      events: timeline.data ?? [],
      nextStatuses: validNextStatuses(updated.status),
    })
  } catch (error) {
    console.error('[POST label/void]', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
