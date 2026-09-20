import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parsePatchInput, planOrderPatch, stripToken, validNextStatuses, type MailInOrder } from '@/lib/mail-in'

// Admin-only, same rule as ../route.ts: the session check is the FIRST thing
// each handler does, before the id is even looked at.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Context = { params: Promise<{ id: string }> }

async function loadDetail(id: string) {
  const [order, events] = await Promise.all([
    supabaseAdmin.from('mail_in_orders').select('*').eq('id', id).maybeSingle(),
    supabaseAdmin.from('mail_in_events').select('*').eq('order_id', id).order('created_at', { ascending: false }).limit(500),
  ])
  return { order, events }
}

export async function GET(request: Request, { params }: Context) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied

    const { id } = await params
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: 'Invalid kit id' }, { status: 400 })
    }

    const { order, events } = await loadDetail(id)
    if (order.error || events.error) {
      console.error('[GET /api/admin/mail-in/[id]]', order.error ?? events.error)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
    if (!order.data) {
      return NextResponse.json({ error: 'Kit not found' }, { status: 404 })
    }

    return NextResponse.json({
      order: stripToken(order.data),
      events: events.data ?? [],
      nextStatuses: validNextStatuses((order.data as MailInOrder).status),
    })
  } catch (error) {
    console.error('[GET /api/admin/mail-in/[id]]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied

    const { id } = await params
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: 'Invalid kit id' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const parsed = parsePatchInput(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const existing = await supabaseAdmin.from('mail_in_orders').select('*').eq('id', id).maybeSingle()
    if (existing.error) {
      console.error('[PATCH /api/admin/mail-in/[id]]', existing.error)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
    if (!existing.data) {
      return NextResponse.json({ error: 'Kit not found' }, { status: 404 })
    }

    const current = existing.data as MailInOrder
    const plan = planOrderPatch(current, parsed.value, new Date())
    if (!plan.ok) {
      return NextResponse.json({ error: plan.error }, { status: 400 })
    }

    // Conditional on the status we planned against: if another tab (or, from
    // stage 3, the tracking webhook) moved the kit in between, this matches
    // no row and the admin is asked to reload rather than overwrite the move.
    const updated = await supabaseAdmin
      .from('mail_in_orders')
      .update(plan.value.update)
      .eq('id', id)
      .eq('status', current.status)
      .select('*')
      .maybeSingle()

    if (updated.error) {
      console.error('[PATCH /api/admin/mail-in/[id]]', updated.error)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
    if (!updated.data) {
      return NextResponse.json({ error: 'This kit changed while you were editing. Reload and try again.' }, { status: 409 })
    }

    if (plan.value.events.length > 0) {
      const { error: eventError } = await supabaseAdmin.from('mail_in_events').insert(
        plan.value.events.map((event) => ({ order_id: id, type: event.type, detail: event.detail, actor: 'admin' }))
      )
      // Message only — event detail can carry amounts, which stay out of logs.
      if (eventError) console.error('[PATCH /api/admin/mail-in/[id]] timeline write failed', eventError.message)
    }

    const { events } = await loadDetail(id)
    return NextResponse.json({
      order: stripToken(updated.data),
      events: events.data ?? [],
      nextStatuses: validNextStatuses((updated.data as MailInOrder).status),
    })
  } catch (error) {
    console.error('[PATCH /api/admin/mail-in/[id]]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
