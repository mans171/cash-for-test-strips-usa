import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail, escapeHtml } from '@/lib/email'
import { OWNER_EMAIL } from '@/lib/owner'
import { STATE_LABELS, VALID_STATE_CODES } from '@/lib/states'
import { isHoneypotTripped } from '@/lib/honeypot'
import { checkRateLimit, clientIp, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'
import { checkSameOrigin } from '@/lib/admin-auth'
import {
  PAYOUT_METHOD_LABELS,
  generateOrderNumber,
  generateToken,
  parseSellerInput,
  sellerLinkPath,
  totalBoxes,
} from '@/lib/mail-in'

// PUBLIC ON PURPOSE. A seller fills in what they have, where they are and how
// they want to be paid, and is then told to text us for a quote. Nothing here
// makes a label: that is an admin button, pressed after a price is agreed.
//
// mail_in_orders has RLS on and no policies, so the insert uses the service
// role. What makes that safe is parseSellerInput — a strict whitelist that
// cannot set a status, an amount, a note of ours or a lead link — and the fact
// that this route only ever INSERTS. The guards are the honeypot, then the
// per-IP rate limit, both before any database access.

const UNIQUE_VIOLATION = '23505'
const CREATE_ATTEMPTS = 4

export async function POST(request: Request) {
  try {
    // The form posts from this site. A browser POST from any other origin is
    // refused; a request with no Origin header (curl, server-to-server) passes
    // and still meets the honeypot and the rate limit below.
    const forbidden = checkSameOrigin(request)
    if (forbidden) return forbidden

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Bot check first: nothing inserted, nothing emailed, and an ordinary
    // success shape so the bot learns nothing.
    if (isHoneypotTripped(body)) {
      console.warn('[honeypot] dropped', '/api/mail-in')
      return NextResponse.json({ ok: true })
    }

    // Per-IP limit second — after the honeypot, before validation and insert.
    const limit = checkRateLimit(clientIp(request.headers))
    if (!limit.allowed) {
      return NextResponse.json(
        { error: RATE_LIMIT_MESSAGE },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }

    const parsed = parseSellerInput(body, VALID_STATE_CODES)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    const input = parsed.value

    for (let attempt = 0; attempt < CREATE_ATTEMPTS; attempt++) {
      const orderNumber = generateOrderNumber()
      const token = generateToken()
      const { data, error } = await supabaseAdmin
        .from('mail_in_orders')
        .insert({ ...input, order_number: orderNumber, token, status: 'awaiting_quote', source: 'site' })
        .select('id')
        .single()

      if (error?.code === UNIQUE_VIOLATION) continue
      if (error || !data) {
        console.error('[POST /api/mail-in] insert failed', error?.message)
        return NextResponse.json({ error: 'Could not save your kit. Please call or text us instead.' }, { status: 500 })
      }

      const { error: eventError } = await supabaseAdmin.from('mail_in_events').insert({
        order_id: data.id,
        type: 'created',
        actor: 'seller',
        detail: { source: 'site', expected_lines: input.expected_items.length },
      })
      if (eventError) console.error('[POST /api/mail-in] timeline write failed', eventError.message)

      // The kit is saved; a mail failure must not fail the request. sendEmail
      // swallows its own errors, and the try/catch is for the day it does not.
      // The payout handle stays out of the email.
      try {
        await sendEmail({
          to: OWNER_EMAIL,
          subject: 'Mail-in kit ' + orderNumber + ' - waiting for quote (' + input.state + ')',
          html: [
            '<h2>New mail-in kit: ' + escapeHtml(orderNumber) + '</h2>',
            '<p><strong>' + escapeHtml(input.name) + '</strong><br>Phone: ' + escapeHtml(input.phone) +
              (input.email ? '<br>Email: ' + escapeHtml(input.email) : '') + '</p>',
            '<p>Ships from: ' + escapeHtml(input.city) + ', ' + escapeHtml(STATE_LABELS[input.state] ?? input.state) + '</p>',
            '<p>Wants to be paid by: ' + escapeHtml(PAYOUT_METHOD_LABELS[input.payout_method]) + '</p>',
            '<ul>' + input.expected_items.map((i) => '<li>' + escapeHtml(i.product) + ' x ' + i.boxes + '</li>').join('') + '</ul>',
            '<p>Total boxes: ' + totalBoxes(input.expected_items) + '</p>',
            input.seller_note && '<p>Their note:<br>' + escapeHtml(input.seller_note).replace(/\n/g, '<br>') + '</p>',
            '<p style="color:#666">They have been told to text us for a quote. Open the Mail-in tab in /admin, agree a price by text, then press "Quote agreed - send label".</p>',
          ]
            .filter(Boolean)
            .join('\n'),
        })
      } catch (mailError) {
        console.error('[POST /api/mail-in] owner alert failed', mailError instanceof Error ? mailError.message : 'unknown error')
      }

      return NextResponse.json({ ok: true, order_number: orderNumber, status_path: sellerLinkPath(token) }, { status: 201 })
    }

    console.error('[POST /api/mail-in] could not generate a unique order number')
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  } catch (error) {
    console.error('[POST /api/mail-in]', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
