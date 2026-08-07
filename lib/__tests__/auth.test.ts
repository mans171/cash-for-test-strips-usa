import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'

const cleanupUserIds: string[] = []

afterEach(async () => {
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
})

describe('profiles round-trip via supabaseAdmin (getCurrentUser is exercised in browser E2E, not here)', () => {
  it('creates a user + profile and reads it back with the right shape', async () => {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `auth-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'customer',
      name: 'Auth Test User',
      phone: '5559876543',
      address_street: '1 Test Ave',
      address_city: 'Troy',
      address_state: 'NY',
      address_zip: '12180',
    })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, name, phone, address_street, address_city, address_state, address_zip')
      .eq('id', userId)
      .maybeSingle()

    expect(profile).toMatchObject({
      role: 'customer',
      name: 'Auth Test User',
      phone: '5559876543',
      address_street: '1 Test Ave',
      address_city: 'Troy',
      address_state: 'NY',
      address_zip: '12180',
    })
  })
})
