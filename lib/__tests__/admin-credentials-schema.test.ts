// lib/__tests__/admin-credentials-schema.test.ts
import { describe, it, expect } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'

describe('admin_credentials / admin_reset_tokens schema', () => {
  it('service-role client can query both new tables', async () => {
    const credentials = await supabaseAdmin.from('admin_credentials').select('id').limit(1)
    expect(credentials.error).toBeNull()

    const tokens = await supabaseAdmin.from('admin_reset_tokens').select('id').limit(1)
    expect(tokens.error).toBeNull()
  })

  it('anon client cannot read admin_credentials (no RLS policy)', async () => {
    const { data } = await supabase.from('admin_credentials').select('id')
    expect(data).toEqual([])
  })

  it('anon client cannot read admin_reset_tokens (no RLS policy)', async () => {
    const { data } = await supabase.from('admin_reset_tokens').select('id')
    expect(data).toEqual([])
  })
})
