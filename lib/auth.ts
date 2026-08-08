import { createServerSupabaseClient } from './supabase/server'

export type Profile = {
  role: 'customer' | 'buyer'
  name: string
  phone: string
  address_street: string
  address_city: string
  address_state: string
  address_zip: string
}

export type CurrentUser = {
  id: string
  email: string
  profile: Profile | null
}

// Returns null only when there's no active session. A returned user may
// still have profile: null if the session exists but the profiles row
// hasn't been created yet (e.g. a partial/failed signup) — callers that
// need a complete profile must check for that explicitly rather than
// treating a truthy return as "fully onboarded". This mirrors useUser()
// (client-side), which reports logged-in based on session alone.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, phone, address_street, address_city, address_state, address_zip')
    .eq('id', user.id)
    .maybeSingle()

  return { id: user.id, email: user.email, profile: profile as Profile | null }
}
