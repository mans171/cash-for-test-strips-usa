import { describe, it, expect, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchOwnProfileContact } from '@/lib/profile-lookup'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const cleanupUserIds: string[] = []

afterEach(async () => {
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
})

describe('fetchOwnProfileContact', () => {
  it("returns the signed-in user's own name and phone", async () => {
    const email = `profile-lookup-test-${Date.now()}@example.com`
    const password = 'test-password-123'

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'customer',
      name: 'Auto Fill Test',
      phone: '5551239999',
      address_street: '1 Test Ave',
      address_city: 'Troy',
      address_state: 'NY',
      address_zip: '12180',
    })
    expect(profileError).toBeNull()

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    expect(signInError).toBeNull()

    const contact = await fetchOwnProfileContact(client, userId)
    expect(contact).toEqual({ name: 'Auto Fill Test', phone: '5551239999' })

    await client.auth.signOut()
  })

  it('returns null when no profile row exists for the given id', async () => {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `profile-lookup-noprofile-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const contact = await fetchOwnProfileContact(supabaseAdmin, userId)
    expect(contact).toBeNull()
  })
})
