import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company')
  const destination = searchParams.get('url')

  if (!companyId || !destination) {
    return NextResponse.json({ error: 'Missing company or url param' }, { status: 400 })
  }

  // Validate destination is a real URL
  let destUrl: URL
  try {
    destUrl = new URL(destination)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  // Log the click — fire and forget, don't block redirect
  supabase
    .from('clicks')
    .insert({ company_id: companyId, referrer: request.headers.get('referer') ?? null })
    .then(undefined, (err) => console.error('click insert error', err))

  return NextResponse.redirect(destUrl.toString())
}
