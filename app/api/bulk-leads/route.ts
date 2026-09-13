import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail, escapeHtml } from '@/lib/email'
import { BULK_MIN_PIECES } from '@/lib/owner'
import { pickBulkRecipient } from '@/lib/bulk-routing'
import { STATE_LABELS } from '@/lib/states'
import { isHoneypotTripped } from '@/lib/honeypot'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// PUBLIC ON PURPOSE. A reseller gives us their details and asks us to call;
// making them create an account first would cost inquiries and protects
// nobody. RLS (leads_insert_public) permits the insert: an anonymous row
// carries a null user_id, which the policy accepts. A signed-in reseller's row
// carries their own id and must go through the session-bound client below. The
// only bot guard is the honeypot.

const MAX_LEN = 2000

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, MAX_LEN) : ''
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Bot check before validation: nothing is inserted, nothing is emailed,
    // and the response is the ordinary success shape so the bot learns
    // nothing about why it failed.
    if (isHoneypotTripped(body)) {
      console.warn('[honeypot] dropped', '/api/bulk-leads')
      return NextResponse.json({ ok: true })
    }

    // If the reseller happens to be signed in, stamp the lead with their id so
    // they can see it later under My Orders. Signing in is NOT required here
    // either — any failure reading the session resolves to null rather than
    // failing an inquiry that has already been filled in.
    let userId: string | null = null
    // See the leads insert below: a row carrying a user_id only passes
    // leads_insert_public when it is inserted through the client that holds
    // that session, because the policy compares against auth.uid().
    let sessionClient: SupabaseClient | null = null
    try {
      const server = await createServerSupabaseClient()
      const { data } = await server.auth.getUser()
      userId = data?.user?.id ?? null
      if (userId) sessionClient = server
    } catch (sessionError) {
      console.warn('[bulk-leads] session read failed, continuing anonymously', sessionError)
    }

    const field = (key: string) => clean((body as Record<string, unknown>)[key])

    const name = field('name')
    const phone = field('phone')
    const email = field('email')
    const location = field('location')
    const state = field('state').toUpperCase()
    const quantity = field('quantity')
    const details = field('details')
    const frequency = field('frequency')

    if (!name) return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    if (!phone) return NextResponse.json({ error: 'A phone number is required' }, { status: 400 })
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }
    // STATE_LABELS carries a CANADA pseudo-code for the buyer directory. This
    // form routes to a US state's buyer, so only the 50 real codes are valid.
    if (!(state in STATE_LABELS) || state === 'CANADA') {
      return NextResponse.json({ error: 'Please choose your state' }, { status: 400 })
    }

    // Who gets this inquiry: the state's own buyer if it has a real inbox of
    // its own, otherwise the house. Anon client on purpose - RLS already lets
    // it read active rows, and nothing here is written outside `leads`.
    const { data: companyRows, error: companyError } = await supabase
      .from('companies')
      .select('states,email,active,mail_in,name,slug')
      .eq('active', true)
      .eq('mail_in', false)
      .contains('states', [state])
    // A lookup failure silently routes to the house, which is the right
    // behavior for the seller but hides a real outage — so say so in the log.
    if (companyError) {
      console.error('[bulk-leads] buyer lookup failed', companyError.message)
    }
    const recipient = pickBulkRecipient(state, companyRows ?? [])

    // The reseller's answers go in `notes` as readable text rather than new
    // columns: `leads` is shared with the consumer flow and this is the only
    // caller that has these fields.
    const notes = [
      'BULK SELLER INQUIRY',
      'State: ' + state,
      location && 'Location: ' + location,
      quantity && 'Approx pieces: ' + quantity,
      frequency && 'Frequency: ' + frequency,
      details && 'What they have: ' + details,
      'Routed to: ' + (recipient.buyerName ?? 'house'),
    ]
      .filter(Boolean)
      .join('\n')

    const id = crypto.randomUUID()
    // Anonymous inquiry: the anon client, exactly as before. Signed-in
    // inquiry: the session-bound client, or the RLS check refuses the row.
    const leadsClient = sessionClient ?? supabase
    const { error } = await leadsClient.from('leads').insert({
      id,
      name,
      email,
      phone,
      notes,
      source_page: '/sell-test-strips-in-bulk',
      user_id: userId,
    })
    if (error) {
      console.error('bulk lead insert failed', error.message)
      return NextResponse.json({ error: 'Could not save your inquiry' }, { status: 500 })
    }

    // The inquiry is already saved, so a mail failure must NOT fail the
    // request - the seller has done their part and the row is the record.
    // sendEmail (not sendEmailOrThrow) swallows its own errors by design.
    await sendEmail({
      to: recipient.to,
      cc: recipient.cc ?? undefined,
      subject: 'Bulk seller inquiry - ' + name + ' (' + state + ')',
      html: [
        '<h2>Bulk seller inquiry</h2>',
        '<p><strong>' + escapeHtml(name) + '</strong></p>',
        '<p>Phone: ' + escapeHtml(phone) + '<br>Email: ' + escapeHtml(email) + '</p>',
        '<p>State: ' + escapeHtml(STATE_LABELS[state]) + '</p>',
        location && '<p>Location: ' + escapeHtml(location) + '</p>',
        quantity && '<p>Approx pieces: ' + escapeHtml(quantity) + '</p>',
        frequency && '<p>Frequency: ' + escapeHtml(frequency) + '</p>',
        details && '<p>What they have:<br>' + escapeHtml(details).replace(/\n/g, '<br>') + '</p>',
        '<p style="color:#666">Routed to: ' + escapeHtml(recipient.buyerName ?? 'house') + '</p>',
        '<p style="color:#666">Minimum for this form is ' + BULK_MIN_PIECES + ' pieces. Lead id ' + id + '.</p>',
      ]
        .filter(Boolean)
        .join('\n'),
    })

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error('bulk lead route threw', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
