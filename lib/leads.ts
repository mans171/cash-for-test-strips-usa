import { supabase } from './supabase'
import type { OrderItem } from './types'

export type CreateLeadInput = {
  items: OrderItem[]
  matchedCompanyId: string | null
  channel: 'sms' | 'email'
  sourcePage: string | null
  name: string
  email?: string
  phone?: string
}

export type Lead = {
  id: string
  items: OrderItem[]
  matched_company_id: string | null
  channel: string
  source_page: string | null
  name: string | null
  email: string | null
  phone: string | null
  created_at: string
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  // Generate the id client-side and insert it explicitly rather than relying on
  // `.select()`/RETURNING: anon has no SELECT policy on leads (write-only, by
  // design), so `.insert().select()` fails outright even though the bare insert
  // succeeds — Postgres RLS governs RETURNING through SELECT policies.
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const { error } = await supabase.from('leads').insert({
    id,
    items: input.items,
    matched_company_id: input.matchedCompanyId,
    channel: input.channel,
    source_page: input.sourcePage,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
  })

  if (error) throw new Error(`Failed to create lead: ${error.message}`)

  return {
    id,
    items: input.items,
    matched_company_id: input.matchedCompanyId,
    channel: input.channel,
    source_page: input.sourcePage,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    created_at: createdAt,
  }
}
