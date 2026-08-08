import { NextResponse } from 'next/server'
import { matchBuyersForState, getMailInFallback } from '@/lib/order-matching'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Company } from '@/lib/types'

function stripContactInfo(company: Company): Company {
  return { ...company, email: null, phone: null }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const state = body?.state

    if (!state || typeof state !== 'string') {
      return NextResponse.json({ error: 'state is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    const isAuthenticated = !!user

    const buyers = await matchBuyersForState(state)
    if (buyers.length > 0) {
      const result = isAuthenticated ? buyers : buyers.map(stripContactInfo)
      return NextResponse.json({ buyers: result, mailIn: null })
    }

    const mailIn = await getMailInFallback()
    const result = mailIn && !isAuthenticated ? stripContactInfo(mailIn) : mailIn
    return NextResponse.json({ buyers: [], mailIn: result })
  } catch (error) {
    console.error('[POST /api/sell/match]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
