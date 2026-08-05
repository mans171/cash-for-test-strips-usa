import { NextResponse } from 'next/server'
import { lookupCompaniesByPhone } from '@/lib/buyer-lookup'

export async function POST(request: Request) {
  const body = await request.json()
  const phone = body?.phone

  if (!phone || typeof phone !== 'string') {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 })
  }

  const companies = await lookupCompaniesByPhone(phone)
  return NextResponse.json({ companies })
}
