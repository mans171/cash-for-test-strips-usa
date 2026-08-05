import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { lookupCompaniesByPhone } from '@/lib/buyer-lookup'

const TEST_SLUG = 'test-buyer-lookup-phone'
const TEST_PHONE = '555-010-2000'

beforeAll(async () => {
  await supabaseAdmin
    .from('companies')
    .insert({ name: 'Test Lookup Co', slug: TEST_SLUG, phone: TEST_PHONE, states: [], active: false })
})

afterAll(async () => {
  await supabaseAdmin.from('companies').delete().eq('slug', TEST_SLUG)
})

describe('lookupCompaniesByPhone', () => {
  it('finds a company by phone regardless of formatting, even if inactive', async () => {
    const results = await lookupCompaniesByPhone('5550102000')
    expect(results.some((c) => c.slug === TEST_SLUG)).toBe(true)
  })

  it('returns an empty array when no phone matches', async () => {
    const results = await lookupCompaniesByPhone('0000000000')
    expect(results).toEqual([])
  })
})
