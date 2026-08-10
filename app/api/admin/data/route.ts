import { NextResponse } from 'next/server'
import { isValidSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? ''
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))
  return match?.slice(name.length + 1)
}

export async function GET(request: Request) {
  try {
    const session = getCookie(request, ADMIN_SESSION_COOKIE_NAME)
    if (!isValidSession(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [submissions, leads, clicks, missingPhones, claims] = await Promise.all([
      supabaseAdmin.from('submissions').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('clicks').select('*').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('companies').select('id, name, city, states').or('phone.is.null,phone.eq.'),
      supabaseAdmin.from('claims').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(50),
    ])

    const firstError = [submissions, leads, clicks, missingPhones, claims].find((r) => r.error)?.error
    if (firstError) {
      console.error('[GET /api/admin/data]', firstError)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    // For each pending edit submission AND each pending claim, attach the target
    // company's CURRENT values so the reviewer can see a current -> proposed diff.
    const submissionTargetIds = (submissions.data ?? []).map((s) => s.target_company_id).filter((id): id is string => Boolean(id))
    const claimCompanyIds = (claims.data ?? []).map((c) => c.company_id)
    const allCompanyIds = Array.from(new Set([...submissionTargetIds, ...claimCompanyIds]))

    let currentCompaniesById = new Map<string, Record<string, unknown>>()
    if (allCompanyIds.length > 0) {
      const { data: currentCompanies, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select('id, name, phone, email, city, states, owner_name')
        .in('id', allCompanyIds)

      if (companiesError) {
        console.error('[GET /api/admin/data]', companiesError)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }
      currentCompaniesById = new Map((currentCompanies ?? []).map((c) => [c.id, c]))
    }

    // Buyer identity for each pending claim: name from profiles, email from
    // auth.users (profiles doesn't store email). supabaseAdmin bypasses RLS.
    const claimUserIds = Array.from(new Set((claims.data ?? []).map((c) => c.user_id)))
    const buyersById = new Map<string, { name: string | null; email: string | null }>()
    if (claimUserIds.length > 0) {
      const [profilesResult, ...userResults] = await Promise.all([
        supabaseAdmin.from('profiles').select('id, name').in('id', claimUserIds),
        ...claimUserIds.map((id) => supabaseAdmin.auth.admin.getUserById(id)),
      ])
      const namesById = new Map((profilesResult.data ?? []).map((p) => [p.id, p.name]))
      claimUserIds.forEach((id, i) => {
        buyersById.set(id, { name: namesById.get(id) ?? null, email: userResults[i]?.data?.user?.email ?? null })
      })
    }

    const submissionsWithDiff = (submissions.data ?? []).map((s) => ({
      ...s,
      currentCompany: s.target_company_id ? (currentCompaniesById.get(s.target_company_id) ?? null) : null,
    }))

    const claimsWithDetails = (claims.data ?? []).map((c) => ({
      ...c,
      company: currentCompaniesById.get(c.company_id) ?? null,
      buyer: buyersById.get(c.user_id) ?? null,
    }))

    return NextResponse.json({
      submissions: submissionsWithDiff,
      leads: leads.data ?? [],
      clicks: clicks.data ?? [],
      missingPhones: missingPhones.data ?? [],
      claims: claimsWithDetails,
    })
  } catch (error) {
    console.error('[GET /api/admin/data]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
