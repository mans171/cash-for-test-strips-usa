import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  LABEL_CLAIMED_ERROR,
  LABEL_CLAIM_PREFIX,
  LABEL_STATUSES,
  checkLabelPreconditions,
  isLabelClaim,
  labelClaimStaleBefore,
  parcelForBoxes,
  parseQuotedAmount,
  stripToken,
  totalBoxes,
  validNextStatuses,
  type MailInOrder,
} from '@/lib/mail-in'
import { EasyPostError, type BoughtLabel, buyShipment, createReturnShipment, getEasyPostConfig, pickRate, verifyAddress } from '@/lib/easypost'
import { emailSellerLink, sellerLink, sellerLinkText } from '@/lib/mail-in-server'

// "Quote agreed — send label". ADMIN ONLY: the seller can never reach this.
// The session check is the first thing that happens — before the body is
// read, before the database, before EasyPost.
//
// ONE PURCHASE PER KIT, ENFORCED IN THE DATABASE. Reading the row and seeing
// "no label" proves nothing: two presses (double click, two tabs, a retry
// after a slow answer) both read that, and both buy. So the kit is CLAIMED
// with a conditional UPDATE before EasyPost is touched — see lib/mail-in.ts
// "THE LABEL CLAIM". Whoever's UPDATE returns a row owns the purchase;
// everyone else gets 409 and never reaches EasyPost.
//
//   claim    -> easypost_shipment_id = 'claim:<uuid>', label_created_at = now
//   no buy   -> release (back to null), only if the token is still ours
//   bought   -> the real shipment id is written over OUR token; NEVER released

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Context = { params: Promise<{ id: string }> }

/** Try to claim the kit. Returns the claimed row, or null when someone else
 *  holds it (or it already has a label, or it left the label statuses).
 *
 *  Two plain conditional UPDATEs rather than one `.or(...)` string: each is
 *  atomic on its own, at most one caller can win either, and no hand-built
 *  filter string (quoting of `:` and `.` inside `or=(...)`) can be got wrong.
 *  Nothing user-supplied goes into either filter except the validated UUID. */
async function claimKit(id: string, claimToken: string, now: Date) {
  const claim = { easypost_shipment_id: claimToken, label_created_at: now.toISOString() }

  // 1. Nobody has claimed or labeled the kit.
  const fresh = await supabaseAdmin
    .from('mail_in_orders')
    .update(claim)
    .eq('id', id)
    .is('easypost_shipment_id', null)
    .in('status', [...LABEL_STATUSES])
    .select('*')
    .maybeSingle()
  if (fresh.error || fresh.data) return fresh

  // 2. An ABANDONED claim (its function died mid-flight). Only a `claim:`
  // placeholder can match — never a real shipment id — and only one older
  // than the cutoff. The winner's new label_created_at makes it fresh again,
  // so a second taker's UPDATE matches nothing.
  return supabaseAdmin
    .from('mail_in_orders')
    .update(claim)
    .eq('id', id)
    .like('easypost_shipment_id', `${LABEL_CLAIM_PREFIX}%`)
    .lt('label_created_at', labelClaimStaleBefore(now))
    .in('status', [...LABEL_STATUSES])
    .select('*')
    .maybeSingle()
}

/** Give the kit back — only if the token on the row is still OURS. */
async function releaseClaim(id: string, claimToken: string) {
  try {
    const released = await supabaseAdmin
      .from('mail_in_orders')
      .update({ easypost_shipment_id: null, label_created_at: null })
      .eq('id', id)
      .eq('easypost_shipment_id', claimToken)
      .select('id')
      .maybeSingle()
    if (released.error) console.error('[POST label] claim release failed (it will expire on its own)', released.error.message)
  } catch (error) {
    console.error('[POST label] claim release threw (it will expire on its own)', error instanceof Error ? error.message : 'unknown error')
  }
}

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

    // A label voided BEFORE the claim existed still carries its old shipment id
    // (voids used to keep it on the row), which would make the kit unclaimable.
    // Archive the id to the timeline FIRST, then clear it — conditionally, and
    // only ever for a row that is marked voided.
    if (order.easypost_shipment_id && !isLabelClaim(order.easypost_shipment_id) && order.label_refund_status) {
      const archived = await supabaseAdmin.from('mail_in_events').insert({
        order_id: id,
        type: 'voided_shipment_archived',
        detail: { easypost_shipment_id: order.easypost_shipment_id, tracking_code: order.tracking_code, refund_status: order.label_refund_status, mode: order.easypost_mode },
        actor: 'system',
      })
      if (archived.error) {
        console.error('[POST label] could not archive the voided shipment id', archived.error.message)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }
      const cleared = await supabaseAdmin
        .from('mail_in_orders')
        .update({ easypost_shipment_id: null })
        .eq('id', id)
        .eq('easypost_shipment_id', order.easypost_shipment_id)
        .eq('label_refund_status', order.label_refund_status)
        .select('id')
        .maybeSingle()
      if (cleared.error) {
        console.error('[POST label] could not clear the voided shipment id', cleared.error.message)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }
    }

    // THE CLAIM. After this line at most one request per kit is still running.
    const claimToken = `${LABEL_CLAIM_PREFIX}${randomUUID()}`
    const claimed = await claimKit(id, claimToken, new Date())
    if (claimed.error) {
      console.error('[POST label] claim failed', claimed.error.message)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
    if (!claimed.data) return NextResponse.json({ error: LABEL_CLAIMED_ERROR }, { status: 409 })

    // (a) the address, (b)+(c) the shipment, (d) the rate, (e) the buy.
    // `keepClaim` decides what `finally` does: the claim is released on every
    // exit — early return, EasyPost error, thrown exception — UNLESS a label
    // was bought or may have been.
    let bought: BoughtLabel | null = null
    let keepClaim = false
    let shipmentId: string | null = null
    try {
      const address = await verifyAddress(config, ready.shipFrom)
      if (!address.ok) return NextResponse.json({ error: address.message }, { status: 422 })

      const shipment = await createReturnShipment(config, ready.shipFrom, parcelForBoxes(totalBoxes(order.expected_items)), order.order_number)
      shipmentId = shipment.id
      const rate = pickRate(shipment.rates)
      if (!rate) {
        return NextResponse.json({ error: 'EasyPost offered no USPS rate for this kit. No label was bought.' }, { status: 502 })
      }
      // From here the outcome is only KNOWN once EasyPost answers.
      keepClaim = true
      bought = await buyShipment(config, shipment.id, rate)
    } catch (error) {
      if (error instanceof EasyPostError) {
        console.error('[POST label] EasyPost error', error.httpStatus, error.code, error.message)
        if (keepClaim && error.httpStatus === 0) {
          // The buy request went out and no answer came back (timeout / dropped
          // connection). EasyPost may have charged us. Hold the claim so an
          // instant retry cannot buy a second label; it expires on its own.
          console.error(`[POST label] BUY OUTCOME UNKNOWN — kit ${order.order_number} (${id}), EasyPost shipment ${shipmentId}, mode ${config.mode}`)
          return NextResponse.json(
            {
              error:
                `EasyPost did not answer the purchase, so a label MAY have been bought. Check shipment ${shipmentId} in the EasyPost dashboard ` +
                'before trying again. This kit is locked for a few minutes.',
              easypost_shipment_id: shipmentId,
            },
            { status: 502 }
          )
        }
        // EasyPost answered with an error: nothing was bought.
        keepClaim = false
        return NextResponse.json({ error: `EasyPost: ${error.message}` }, { status: 502 })
      }
      // Anything else thrown before the buy began releases the claim; thrown
      // DURING the buy, the outcome is unknown and the claim is held.
      throw error
    } finally {
      if (!keepClaim) await releaseClaim(id, claimToken)
    }

    // (f) Save it. From here on a label EXISTS, so every failure path must
    // hand the shipment id back rather than lose it — and the claim is NEVER
    // released, so a retry is a 409 and not a second purchase.
    const label = bought
    const nowIso = new Date().toISOString()
    // Captured before the write, so the timeline describes the kit as it was.
    const fromStatus = (claimed.data as MailInOrder).status
    const amountChanged = quotedAmount !== order.quoted_amount
    const labelColumns: Record<string, unknown> = {
      easypost_shipment_id: label.shipmentId,
      easypost_tracker_id: label.trackerId,
      easypost_mode: config.mode,
      tracking_code: label.trackingCode,
      carrier: label.carrier,
      service: label.service,
      label_url: label.labelUrl,
      label_pdf_url: label.labelPdfUrl,
      label_created_at: nowIso,
      label_refund_status: null,
      updated_at: nowIso,
    }
    const update: Record<string, unknown> = { ...labelColumns, quoted_amount: quotedAmount, status: 'label_made' }
    if (!order.kit_sent_at) update.kit_sent_at = nowIso

    const lost = (reason: string) => {
      console.error(
        `[POST label] LABEL BOUGHT BUT NOT SAVED — kit ${order.order_number} (${id}), EasyPost shipment ${label.shipmentId}, mode ${config.mode}: ${reason}`
      )
      return NextResponse.json(
        {
          error:
            `The label was bought but could not be saved to this kit. Do NOT press the button again. ` +
            `EasyPost shipment id: ${label.shipmentId}. Find it in the EasyPost dashboard, or void it there.`,
          easypost_shipment_id: label.shipmentId,
          tracking_code: label.trackingCode,
          label_url: label.labelPdfUrl ?? label.labelUrl,
        },
        { status: 500 }
      )
    }

    // Written over OUR claim token only. The status condition stays too: a
    // person who moved the kit while the label was being bought keeps their move.
    const save = async () => {
      try {
        return await supabaseAdmin
          .from('mail_in_orders')
          .update(update)
          .eq('id', id)
          .eq('easypost_shipment_id', claimToken)
          .eq('status', fromStatus)
          .select('*')
          .maybeSingle()
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : 'database write threw' } }
      }
    }
    let saved = await save()
    // One retry: the money is spent, a hiccup should not strand the label.
    if (saved.error) saved = await save()
    if (saved.error) return lost(saved.error.message)
    if (!saved.data) {
      // The kit moved (or an abandoned-claim takeover took the token). Pin the
      // real shipment on the row WITHOUT touching the status, so the purchase is
      // on record and — unlike a claim — can never expire into a second buy.
      try {
        const pinned = await supabaseAdmin
          .from('mail_in_orders')
          .update(labelColumns)
          .eq('id', id)
          .eq('easypost_shipment_id', claimToken)
          .select('id')
          .maybeSingle()
        if (pinned.error || !pinned.data) console.error('[POST label] could not pin the shipment id on the kit', pinned.error?.message ?? 'claim no longer ours')
      } catch (error) {
        console.error('[POST label] could not pin the shipment id on the kit', error instanceof Error ? error.message : 'unknown error')
      }
      return lost('the kit changed status while the label was being bought')
    }
    const updated = saved.data as MailInOrder

    const events = [
      ...(amountChanged
        ? [{ type: 'fields_updated', detail: { fields: ['quoted_amount'], values: { quoted_amount: quotedAmount } } }]
        : []),
      {
        type: 'label_created',
        detail: { carrier: label.carrier, service: label.service, tracking_code: label.trackingCode, mode: config.mode, easypost_shipment_id: label.shipmentId },
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
