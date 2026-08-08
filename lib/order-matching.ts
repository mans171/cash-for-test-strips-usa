import { supabase } from './supabase'
import type { Company } from './types'

const COMPANY_FIELDS =
  'id, name, slug, url, email, city, owner_name, states, payment_methods, accepted_brands, rating, description, featured, phone'

export async function matchBuyersForState(stateCode: string): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_FIELDS)
    .eq('active', true)
    .eq('mail_in', false)
    .contains('states', [stateCode.toUpperCase()])
    .order('featured', { ascending: false })
    .order('name')

  if (error) throw new Error(`Match query failed: ${error.message}`)
  return (data ?? []) as Company[]
}

export async function getMailInFallback(): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select(COMPANY_FIELDS)
    .eq('active', true)
    .eq('mail_in', true)
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Mail-in lookup failed: ${error.message}`)
  return data as Company | null
}

export async function getCompanyContact(companyId: string): Promise<{ name: string; email: string | null } | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('name, email')
    .eq('id', companyId)
    .maybeSingle()

  if (error) throw new Error(`Company lookup failed: ${error.message}`)
  return data
}
