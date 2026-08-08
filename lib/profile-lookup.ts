import type { SupabaseClient } from '@supabase/supabase-js'

export type OwnProfileContact = {
  name: string
  phone: string
}

export async function fetchOwnProfileContact(
  client: SupabaseClient,
  userId: string
): Promise<OwnProfileContact | null> {
  const { data, error } = await client
    .from('profiles')
    .select('name, phone')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return { name: data.name, phone: data.phone }
}
