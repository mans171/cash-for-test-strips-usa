import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  checkLabelPreconditions,
  parcelForBoxes,
  parseQuotedAmount,
  stripToken,
  totalBoxes,
  validNextStatuses,
  type MailInOrder,
} from '@/lib/mail-in'
import { EasyPostError, buyShipment, createReturnShipment, getEasyPostConfig, pickRate, verifyAddress } from '@/lib/easypost'
import { emailSellerLink, sellerLink, sellerLinkText } from '@/lib/mail-in-server'

// "Quote agreed — send label". ADMIN ONLY: the seller can never reach this.
// The session check is the first thing that happens — before the body is
// read, before the database, before EasyPost.

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
    const amount = parseQuotedAmount('quoted_amount' in body ? body.quoted_amount : null)
    if (!amount.ok) return NextResponse.json({ error: amount.error }, { status: 400 })

    const config = getEasyPostConfig()
    if (!config) {
      return NextResponse.json({ error: 'EasyPost is not configured' }, { status: 503 })
    }

    const existing = await supabaseAdmin.from('mail_in_orders').select('*').eq('id', id).maybeSingle()
    if (existing.error) {
      console.error('[POST label] load failed', existing.error.message)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
    if (!existing.data) return NextResponse.json({ error: 'Kit not found' }, { status: 404 })
    const order = existing.data as MailInOrder

    const quotedAmount = amount.value ?? order.quoted_amount
    const ready = checkLabelPreconditions(order, quotedAmount)
    if (!ready.ok) return NextResponse.json({ error: ready.error }, { status: ready.status })

    // (a) the address, (b)+(c) the shipment, (d) the rate, (e) the buy.
    let bought
    try {
      const address = await verifyAddress(config, ready.shipFrom)
      if (!address.ok) return NextResponse.json({ error: address.message }, { status: 422 })

      const shipment = await createReturnShipment(config, ready.shipFrom, parcelForBoxes(totalBoxes(order.expected_items)), order.order_number)
      const rate = pickRate(shipment.rates)
      if (!rate) {
        return NextResponse.json({ error: 'EasyPost offered no USPS rate for this kit. No label was bought.' }, { status: 502 })
      }
      bought = await buyShipment(config, shipment.id, rate)
    } catch (error) {
      if (error instanceof EasyPostError) {
        console.error('[POST label] EasyPost error', error.httpStatus, error.code, error.message)
        return NextResponse.json({ error: `EasyPost: ${error.message}` }, { status: 502 })
      }
      throw error
    }

    // (f) Save it. From here on a label EXISTS, so every failure path must
    // hand the shipment id back rather than lose it.
    const nowIso = new Date().toISOString()
    // Captured before the write, so the timeline describes the kit as it was.
    const fromStatus = order.status
    const amountChanged = quotedAmount !== order.quoted_amount
    const update: Record<string, unknown> = {
      easypost_shipment_id: bought.shipmentId,
      easypost_tracker_id: bought.trackerId,
      easypost_mode: config.mode,
      tracking_code: bought.trackingCode,
      carrier: bought.carrier,
      service: bought.service,
      label_url: bought.labelUrl,
      label_pdf_url: bought.labelPdfUrl,
      label_created_at: nowIso,
      label_refund_status: null,
      quoted_amount: quotedAmount,
      status: 'label_made',
      updated_at: nowIso,
    }
    if (!order.kit_sent_at) update.kit_sent_at = nowIso

    const lost = (reason: string) => {
      console.error(
        `[POST label] LABEL BOUGHT BUT NOT SAVED — kit ${order.order_number} (${id}), EasyPost shipment ${bought.shipmentId}, mode ${config.mode}: ${reason}`
      )
      return NextResponse.json(
        {
          error:
            `The label was bought but could not be saved to this kit. Do NOT press the button again. ` +
            `EasyPost shipment id: ${bought.shipmentId}. Find it in the EasyPost dashboard, or void it there.`,
          easypost_shipment_id: bought.shipmentId,
          tracking_code: bought.trackingCode,
          label_url: bought.labelPdfUrl ?? bought.labelUrl,
        },
        { status: 500 }
      )
    }

    let saved
    try {
      saved = await supabaseAdmin
        .from('mail_in_orders')
        .update(update)
        .eq('id', id)
        .eq('status', fromStatus)
        .select('*')
        .maybeSingle()
    } catch (error) {
      return lost(error instanceof Error ? error.message : 'database write threw')
    }
    if (saved.error) return lost(saved.error.message)
    if (!saved.data) return lost('the kit changed status while the label was being bought')
    const updated = saved.data as MailInOrder

    const events = [
      ...(amountChanged
        ? [{ type: 'fields_updated', detail: { fields: ['quoted_amount'], values: { quoted_amount: quotedAmount } } }]
        : []),
      {
        type: 'label_created',
        detail: { carrier: bought.carrier, service: bought.service, tracking_code: bought.trackingCode, mode: config.mode },
      },
      { type: 'status_changed', detail: { from: fromStatus, to: 'label_made' } },
    ]
    const { error: eventError } = await supabaseAdmin
      .from('mail_in_events')
      .insert(events.map((event) => ({ order_id: id, type: event.type, detail: event.detail, actor: 'admin' })))
    if (eventError) console.error('[POST label] timeline write failed', eventError.message)

    const emailed = await emailSellerLink(updated)
    if (emailed) {
      await supabaseAdmin.from('mail_in_events').insert({ order_id: id, type: 'link_sent', detail: { channel: 'email' }, actor: 'system' })
    }

    const timeline = await supabaseAdmin.from('mail_in_events').select('*').eq('order_id', id).order('created_at', { ascending: false }).limit(500)

    return NextResponse.json({
      order: stripToken(updated),
      events: timeline.data ?? [],
      nextStatuses: validNextStatuses(updated.status),
      link: sellerLink(updated.token),
      text: sellerLinkText(updated),
      emailed,
    })
  } catch (error) {
    console.error('[POST label]', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
