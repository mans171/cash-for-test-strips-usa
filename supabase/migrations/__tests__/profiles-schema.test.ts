// supabase/migrations/__tests__/profiles-schema.test.ts
import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'

const cleanupUserIds: string[] = []

afterEach(async () => {
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
})

describe('profiles table', () => {
  it('accepts a full row for a real auth.users id and enforces role check', async () => {
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `profiles-schema-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'customer',
      name: 'Test User',
      phone: '5551234567',
      address_street: '123 Main St',
      address_city: 'Albany',
      address_state: 'NY',
      address_zip: '12203',
    })
    expect(insertError).toBeNull()

    const { data: row } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    expect(row?.role).toBe('customer')

    const { error: badRoleError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'not-a-real-role',
      name: 'x',
      phone: 'x',
      address_street: 'x',
      address_city: 'x',
      address_state: 'x',
      address_zip: 'x',
    })
    expect(badRoleError).not.toBeNull()
  })
})
