import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { BUYER_COMPANY_FIELDS } from '@/lib/buyer-lookup'
import type { Company } from '@/lib/types'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user || user.profile?.role !== 'buyer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: claims, error } = await supabaseAdmin
      .from('claims')
      .select('id, company_id, status, submitted_phone, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/buyer/claims]', error)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    const companyIds = Array.from(new Set((claims ?? []).map((c) => c.company_id)))
    let companiesById = new Map<string, Company>()
    if (companyIds.length > 0) {
      const { data: companies, error: companiesError } = await supabaseAdmin
        .from('companies')
        .select(BUYER_COMPANY_FIELDS)
        .in('id', companyIds)

      if (companiesError) {
        console.error('[GET /api/buyer/claims]', companiesError)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }
      companiesById = new Map((companies ?? []).map((c) => [c.id, c as unknown as Company]))
    }

    const claimsWithCompany = (claims ?? []).map((c) => ({
      ...c,
      company: companiesById.get(c.company_id) ?? null,
    }))

    return NextResponse.json({ claims: claimsWithCompany })
  } catch (error) {
    console.error('[GET /api/buyer/claims]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
