import type { SupabaseClient } from '@supabase/supabase-js'
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
  // Set when the submitting seller happens to be signed in. Signing in is
  // never required, so this is null for most submissions.
  userId?: string | null
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
  user_id: string | null
  created_at: string
}

/**
 * `client` defaults to the module-level ANON client, which carries no session.
 * When `input.userId` is set the caller MUST pass the session-bound server
 * client instead: the leads_insert_public policy checks
 * `user_id is null or user_id = auth.uid()`, and through the anon client
 * `auth.uid()` is null, so a row naming a real user would be refused.
 */
export async function createLead(
  input: CreateLeadInput,
  client: SupabaseClient = supabase
): Promise<Lead> {
  // Generate the id client-side and insert it explicitly rather than relying on
  // `.select()`/RETURNING: anon has no SELECT policy on leads (write-only, by
  // design), so `.insert().select()` fails outright even though the bare insert
  // succeeds — Postgres RLS governs RETURNING through SELECT policies.
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const { error } = await client.from('leads').insert({
    id,
    items: input.items,
    matched_company_id: input.matchedCompanyId,
    channel: input.channel,
    source_page: input.sourcePage,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
    user_id: input.userId ?? null,
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
    user_id: input.userId ?? null,
    created_at: createdAt,
  }
}
