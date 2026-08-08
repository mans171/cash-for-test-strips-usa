// lib/__tests__/profiles-rls.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const cleanupUserIds: string[] = []

afterEach(async () => {
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
})

async function createTestUser(label: string) {
  const email = `profiles-rls-${label}-${Date.now()}@example.com`
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
    name: `RLS Test ${label}`,
    phone: '5551234567',
    address_street: '1 Test Ave',
    address_city: 'Troy',
    address_state: 'NY',
    address_zip: '12180',
  })
  expect(profileError).toBeNull()

  return { userId, email, password }
}

describe('profiles RLS', () => {
  it('anonymous client cannot read any profiles rows', async () => {
    await createTestUser('anon-check')

    const { data } = await supabase.from('profiles').select('id')
    expect(data).toEqual([])
  })

  it("a signed-in user cannot read another user's profile row", async () => {
    const userA = await createTestUser('a')
    const userB = await createTestUser('b')

    // Fresh, isolated client (persistSession: false so it doesn't clobber
    // any session state used elsewhere in the test run) signed in as
    // User A only.
    const clientA = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error: signInError } = await clientA.auth.signInWithPassword({
      email: userA.email,
      password: userA.password,
    })
    expect(signInError).toBeNull()

    // Can read own row.
    const { data: ownRow } = await clientA
      .from('profiles')
      .select('id')
      .eq('id', userA.userId)
    expect(ownRow).toEqual([{ id: userA.userId }])

    // Cannot read User B's row.
    const { data: otherRow } = await clientA
      .from('profiles')
      .select('id')
      .eq('id', userB.userId)
    expect(otherRow).toEqual([])

    // Cannot read User B's row even via an unfiltered select (RLS should
    // scope the whole table to the caller's own row).
    const { data: allRows } = await clientA.from('profiles').select('id')
    expect(allRows).toEqual([{ id: userA.userId }])

    await clientA.auth.signOut()
  })
})
