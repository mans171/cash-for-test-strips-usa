import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. It bypasses row-level security, so it must
 * only be reached from server code that has already checked authorisation.
 *
 * Built lazily on first use rather than at module load. `createClient` throws
 * when either argument is missing, and Next evaluates this module while
 * collecting page data at build time — so a build in any environment without
 * SUPABASE_SERVICE_ROLE_KEY failed outright with `supabaseUrl is required`.
 * That is what kept every preview deployment red: Vercel holds this project's
 * variables for Production only.
 *
 * Deferring construction means a build no longer needs the service-role key,
 * which is the point. A preview URL is a far softer target than production,
 * and a key that bypasses RLS does not belong there. Preview gets the public
 * NEXT_PUBLIC_* values so the site renders; admin routes fail at request time
 * instead, which is the correct outcome.
 *
 * The exported shape is unchanged — call sites still write
 * `supabaseAdmin.from(...)`.
 */
let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    // Named explicitly. The old failure surfaced as "supabaseUrl is required"
    // from inside the Supabase library, which said nothing about which
    // environment was short of what.
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean).join(' and ')
    throw new Error(
      `supabaseAdmin is unavailable: ${missing} not set in this environment. ` +
      `Admin routes need the service-role key, which is deliberately absent ` +
      `outside Production.`
    )
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver)
  },
})
