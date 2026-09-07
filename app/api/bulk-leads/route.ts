import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail, escapeHtml } from '@/lib/email'
import { OWNER_EMAIL, BULK_MIN_PIECES } from '@/lib/owner'

// PUBLIC ON PURPOSE. app/api/leads/route.ts requires a signed-in user, because
// that flow hands the seller a BUYER's contact details and the account gate is
// what protects them. This flow runs the other way: a reseller gives us their
// details and asks us to call. Making them create an account first would cost
// enquiries and protects nobody. RLS (leads_insert_anon) already permits the
// anonymous insert.

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
    const field = (key: string) => clean((body as Record<string, unknown>)[key])

    const name = field('name')
    const phone = field('phone')
    const email = field('email')
    const location = field('location')
    const quantity = field('quantity')
    const details = field('details')
    const frequency = field('frequency')

    if (!name) return NextResponse.json({ error: 'Your name is required' }, { status: 400 })
    if (!phone) return NextResponse.json({ error: 'A phone number is required' }, { status: 400 })
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    // The reseller's answers go in `notes` as readable text rather than new
    // columns: `leads` is shared with the consumer flow and this is the only
    // caller that has these fields.
    const notes = [
      'BULK SELLER ENQUIRY',
      location && 'Location: ' + location,
      quantity && 'Approx pieces: ' + quantity,
      frequency && 'Frequency: ' + frequency,
      details && 'What they have: ' + details,
    ]
      .filter(Boolean)
      .join('\n')

    const id = crypto.randomUUID()
    const { error } = await supabase.from('leads').insert({
      id,
      name,
      email,
      phone,
      notes,
      source_page: '/sell-test-strips-in-bulk',
    })
    if (error) {
      console.error('bulk lead insert failed', error.message)
      return NextResponse.json({ error: 'Could not save your enquiry' }, { status: 500 })
    }

    // The enquiry is already saved, so a mail failure must NOT fail the
    // request - the seller has done their part and the row is the record.
    // sendEmail (not sendEmailOrThrow) swallows its own errors by design.
    await sendEmail({
      to: OWNER_EMAIL,
      subject: 'Bulk seller enquiry - ' + name + (location ? ' (' + location + ')' : ''),
      html: [
        '<h2>Bulk seller enquiry</h2>',
        '<p><strong>' + escapeHtml(name) + '</strong></p>',
        '<p>Phone: ' + escapeHtml(phone) + '<br>Email: ' + escapeHtml(email) + '</p>',
        location && '<p>Location: ' + escapeHtml(location) + '</p>',
        quantity && '<p>Approx pieces: ' + escapeHtml(quantity) + '</p>',
        frequency && '<p>Frequency: ' + escapeHtml(frequency) + '</p>',
        details && '<p>What they have:<br>' + escapeHtml(details).replace(/\n/g, '<br>') + '</p>',
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
