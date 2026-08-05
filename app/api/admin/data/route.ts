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
      console.error('[GET /api/admin/data]', firstError)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    // For each pending edit submission, attach the target company's CURRENT
    // values so the reviewer can see a current -> proposed diff instead of
    // just the proposed values in isolation (a malicious edit that keeps the
    // name identical would otherwise look completely routine).
    const targetIds = Array.from(
      new Set(
        (submissions.data ?? [])
          .map((s) => s.target_company_id)
          .filter((id): id is string => Boolean(id))
      )
    )

    let currentCompaniesById = new Map<string, Record<string, unknown>>()
    if (targetIds.length > 0) {
      const { data: currentCompanies, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select('id, name, phone, email, city, states, owner_name')
        .in('id', targetIds)

      if (companiesError) {
        console.error('[GET /api/admin/data]', companiesError)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }
      currentCompaniesById = new Map((currentCompanies ?? []).map((c) => [c.id, c]))
    }

    const submissionsWithDiff = (submissions.data ?? []).map((s) => ({
      ...s,
      currentCompany: s.target_company_id ? (currentCompaniesById.get(s.target_company_id) ?? null) : null,
    }))

    return NextResponse.json({
      submissions: submissionsWithDiff,
      leads: leads.data ?? [],
      clicks: clicks.data ?? [],
      missingPhones: missingPhones.data ?? [],
    })
  } catch (error) {
    console.error('[GET /api/admin/data]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
