import { NextResponse } from 'next/server'
import { matchBuyersForState, getMailInFallback } from '@/lib/order-matching'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const state = body?.state

    if (!state || typeof state !== 'string') {
      return NextResponse.json({ error: 'state is required' }, { status: 400 })
    }

    const buyers = await matchBuyersForState(state)
    if (buyers.length > 0) {
      return NextResponse.json({ buyers, mailIn: null })
    }

    const mailIn = await getMailInFallback()
    return NextResponse.json({ buyers: [], mailIn })
  } catch (error) {
    console.error('[POST /api/sell/match]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
