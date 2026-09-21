import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { CONVERTED_LOOKBACK_DAYS, selectOpenStarts, type SellStartForAdmin, type SellStartRow } from '@/lib/sell-starts'

// How many unfinished starts to pull before the rules in selectOpenStarts trim
// the list to 200. Wider than the cap because converted phones and week-old
// contacted rows are removed AFTER the query.
const SELL_STARTS_FETCH = 600

/**
 * "Started, didn't finish" rows for the leads tab. Kept apart from the main
 * Promise.all on purpose: until the sell_starts migration is applied this
 * query errors, and that must cost the owner one section, not the dashboard.
 */
async function loadSellStarts(nowMs: number): Promise<{ sellStarts: SellStartForAdmin[]; sellStartsError: boolean }> {
  try {
    const leadCutoffIso = new Date(nowMs - CONVERTED_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const [starts, recentLeads] = await Promise.all([
      supabaseAdmin
        .from('sell_starts')
        .select('id, phone, name, state, items, created_at, completed_at, contacted_at, dismissed_at, admin_note')
        .is('completed_at', null)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(SELL_STARTS_FETCH),
      supabaseAdmin
        .from('leads')
        .select('phone, created_at')
        .gte('created_at', leadCutoffIso)
        .order('created_at', { ascending: false })
        .limit(1000),
    ])
    if (starts.error || recentLeads.error) {
      console.error('[GET /api/admin/data] sell starts', (starts.error ?? recentLeads.error)?.message)
      return { sellStarts: [], sellStartsError: true }
    }
    return {
      sellStarts: selectOpenStarts((starts.data ?? []) as SellStartRow[], recentLeads.data ?? [], nowMs),
      sellStartsError: false,
    }
  } catch (error) {
    console.error('[GET /api/admin/data] sell starts', error instanceof Error ? error.message : 'unknown error')
    return { sellStarts: [], sellStartsError: true }
  }
}

export async function GET(request: Request) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied

    const nowMs = Date.now()
    const sellStartsPromise = loadSellStarts(nowMs)

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

    const { sellStarts, sellStartsError } = await sellStartsPromise

    return NextResponse.json({
      submissions: submissionsWithDiff,
      sellStarts,
      sellStartsError,
      // The page works out "2h ago" from this rather than its own clock.
      serverNow: new Date(nowMs).toISOString(),
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
