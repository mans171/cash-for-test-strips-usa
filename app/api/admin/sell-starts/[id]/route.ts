import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parseSellStartAdminInput, UUID_PATTERN } from '@/lib/sell-starts'

// Admin-only: the Contacted and Dismiss buttons under "Started, didn't finish".
// The session check is the FIRST thing the handler does, before the id is even
// looked at. Only `contacted`, `dismissed` and `admin_note` are accepted, so
// this route can never complete a start or change a seller's phone number.

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied

    const { id } = await params
    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const nowIso = new Date().toISOString()
    const parsed = parseSellStartAdminInput(body, nowIso)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('sell_starts')
      .update({ ...parsed.value, updated_at: nowIso })
      .eq('id', id)
      .select('id, contacted_at, dismissed_at, admin_note')
      .maybeSingle()

    if (error) {
      console.error('[POST /api/admin/sell-starts/[id]]', error.message)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, start: data })
  } catch (error) {
    console.error('[POST /api/admin/sell-starts/[id]]', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
