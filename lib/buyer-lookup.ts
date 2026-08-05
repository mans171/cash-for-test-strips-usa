import { supabaseAdmin } from './supabase-admin'
import type { Company } from './types'

const COMPANY_FIELDS =
  'id, name, slug, url, email, city, owner_name, states, payment_methods, accepted_brands, rating, description, featured, phone'

export async function lookupCompaniesByPhone(phone: string): Promise<Company[]> {
  const normalized = phone.replace(/[^0-9]/g, '')
  const { data, error } = await supabaseAdmin.from('companies').select(COMPANY_FIELDS)

  if (error) throw new Error(`Lookup failed: ${error.message}`)
  return (data ?? []).filter(
    (c) => c.phone && c.phone.replace(/[^0-9]/g, '') === normalized
  ) as Company[]
}
