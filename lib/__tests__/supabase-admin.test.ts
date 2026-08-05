import { describe, it, expect } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'

describe('supabaseAdmin', () => {
  it('can query companies bypassing RLS active filter', async () => {
    const { data, error } = await supabaseAdmin.from('companies').select('id').limit(1)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })
})
