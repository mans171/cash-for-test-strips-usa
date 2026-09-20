import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  MAIL_IN_STATUSES,
  emptyStatusCounts,
  generateOrderNumber,
  generateToken,
  isMailInStatus,
  monthStartIso,
  parseCreateInput,
  sanitizeSearch,
  stripToken,
  summarize,
} from '@/lib/mail-in'

// Admin-only. mail_in_orders has RLS on and NO policies, so the service-role
// client is the only way in — which is why the session check below comes
// first in every handler, before anything touches the database.

// The board shows every open kit. A cap keeps one response bounded (and under
// PostgREST's silent 1000-row limit); `truncated` tells the UI when it bit.
// The summary strip never depends on this list — it uses exact counts.
const LIST_LIMIT = 500
const UNIQUE_VIOLATION = '23505'
const CREATE_ATTEMPTS = 4

export async function GET(request: Request) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied

    const params = new URL(request.url).searchParams
    const statusParam = params.get('status')
    if (statusParam && statusParam !== 'all' && !isMailInStatus(statusParam)) {
      return NextResponse.json({ error: `status must be "all" or one of: ${MAIL_IN_STATUSES.join(', ')}` }, { status: 400 })
    }
    const search = sanitizeSearch(params.get('q') ?? '')

    let listQuery = supabaseAdmin
      .from('mail_in_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(LIST_LIMIT + 1)

    if (statusParam && statusParam !== 'all') listQuery = listQuery.eq('status', statusParam)
    // Default board: everything still open. Closed kits are reached with
    // ?status=closed or ?status=all.
    else if (!statusParam) listQuery = listQuery.neq('status', 'closed')

    if (search) {
      const clauses = [`name.ilike.%${search}%`, `order_number.ilike.%${search}%`]
      const digits = search.replace(/\D/g, '')
      if (digits.length >= 3) clauses.push(`phone.ilike.%${digits}%`)
      listQuery = listQuery.or(clauses.join(','))
    }

    // Exact head-counts, one per status, so the strip stays right however
    // many kits exist and whatever filter the list is using.
    const countQueries = MAIL_IN_STATUSES.map((status) =>
      supabaseAdmin.from('mail_in_orders').select('id', { count: 'exact', head: true }).eq('status', status)
    )
    const paidThisMonthQuery = supabaseAdmin
      .from('mail_in_orders')
      .select('id', { count: 'exact', head: true })
      .gte('paid_at', monthStartIso(new Date()))

    const [list, paidThisMonth, ...counts] = await Promise.all([listQuery, paidThisMonthQuery, ...countQueries])

    const firstError = [list, paidThisMonth, ...counts].find((r) => r.error)?.error
    if (firstError) {
      console.error('[GET /api/admin/mail-in]', firstError)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    const statusCounts = emptyStatusCounts()
    MAIL_IN_STATUSES.forEach((status, i) => {
      statusCounts[status] = counts[i].count ?? 0
    })

    const rows = list.data ?? []
    return NextResponse.json({
      orders: rows.slice(0, LIST_LIMIT).map(stripToken),
      truncated: rows.length > LIST_LIMIT,
      statusCounts,
      summary: summarize(statusCounts, paidThisMonth.count ?? 0),
    })
  } catch (error) {
    console.error('[GET /api/admin/mail-in]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied

    const body = await request.json().catch(() => null)
    const parsed = parseCreateInput(body)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    // order_number and token are unique in the database. A collision is a
    // one-in-a-billion event, but retrying is cheaper than explaining a 500.
    for (let attempt = 0; attempt < CREATE_ATTEMPTS; attempt++) {
      const { data, error } = await supabaseAdmin
        .from('mail_in_orders')
        .insert({
          ...parsed.value,
          order_number: generateOrderNumber(),
          token: generateToken(),
          status: 'quote_agreed',
        })
        .select('*')
        .single()

      if (error?.code === UNIQUE_VIOLATION) continue
      if (error || !data) {
        console.error('[POST /api/admin/mail-in]', error)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }

      const { error: eventError } = await supabaseAdmin.from('mail_in_events').insert({
        order_id: data.id,
        type: 'created',
        actor: 'admin',
        detail: { source: 'manual', expected_lines: parsed.value.expected_items.length },
      })
      // The kit exists either way; a missing timeline row must not make the
      // admin create it a second time.
      if (eventError) console.error('[POST /api/admin/mail-in] timeline write failed', eventError.message)

      return NextResponse.json({ order: stripToken(data) }, { status: 201 })
    }

    console.error('[POST /api/admin/mail-in] could not generate a unique order number')
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  } catch (error) {
    console.error('[POST /api/admin/mail-in]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
