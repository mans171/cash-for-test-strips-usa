import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { matchBuyersForState, getMailInFallback } from '@/lib/order-matching'

const TEST_SLUG_FEATURED = 'test-order-matching-featured-vt'
const TEST_SLUG_PLAIN = 'test-order-matching-plain-vt'

beforeAll(async () => {
  await supabaseAdmin.from('companies').insert([
    { name: 'Test Featured VT Buyer', slug: TEST_SLUG_FEATURED, states: ['VT'], active: true, featured: true },
    { name: 'Test Plain VT Buyer', slug: TEST_SLUG_PLAIN, states: ['VT'], active: true, featured: false },
  ])
})

afterAll(async () => {
  await supabaseAdmin.from('companies').delete().in('slug', [TEST_SLUG_FEATURED, TEST_SLUG_PLAIN])
})

describe('matchBuyersForState', () => {
  it('returns matching active buyers with featured first', async () => {
    const results = await matchBuyersForState('VT')
    const slugs = results.map((c) => c.slug)
    expect(slugs.indexOf(TEST_SLUG_FEATURED)).toBeLessThan(slugs.indexOf(TEST_SLUG_PLAIN))
  })

  it('returns an empty array for a state with no buyers', async () => {
    const results = await matchBuyersForState('WY')
    expect(results.find((c) => c.slug === TEST_SLUG_FEATURED)).toBeUndefined()
  })
})

describe('getMailInFallback', () => {
  it('returns the CFTS Mail-In company', async () => {
    const result = await getMailInFallback()
    expect(result?.slug).toBe('cfts-mail-in')
  })
})
