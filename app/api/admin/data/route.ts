import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [submissions, leads, clicks, missingPhones] = await Promise.all([
      supabaseAdmin.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('clicks').select('*').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('companies').select('id, name, city, states').or('phone.is.null,phone.eq.'),
    ])

    const firstError = [submissions, leads, clicks, missingPhones].find((r) => r.error)?.error
    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 })
    }

    return NextResponse.json({
      submissions: submissions.data ?? [],
      leads: leads.data ?? [],
      clicks: clicks.data ?? [],
      missingPhones: missingPhones.data ?? [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
