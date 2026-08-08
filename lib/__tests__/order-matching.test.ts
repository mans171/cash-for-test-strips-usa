import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { matchBuyersForState, getMailInFallback, getCompanyContact } from '@/lib/order-matching'

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

describe('getCompanyContact', () => {
  const TEST_SLUG_CONTACT = 'test-order-matching-contact-lookup'
  let testCompanyId: string

  beforeAll(async () => {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert({
        name: 'Test Contact Lookup Co',
        slug: TEST_SLUG_CONTACT,
        email: 'contact-lookup-test@example.com',
        states: ['VT'],
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    testCompanyId = data!.id
  })

  afterAll(async () => {
    await supabaseAdmin.from('companies').delete().eq('slug', TEST_SLUG_CONTACT)
  })

  it('returns the name and email for an existing company', async () => {
    const result = await getCompanyContact(testCompanyId)
    expect(result).toEqual({ name: 'Test Contact Lookup Co', email: 'contact-lookup-test@example.com' })
  })

  it('returns null for a company id that does not exist', async () => {
    const result = await getCompanyContact('00000000-0000-0000-0000-000000000000')
    expect(result).toBeNull()
  })

  it('returns null for a deactivated company', async () => {
    const TEST_SLUG_INACTIVE = 'test-order-matching-contact-lookup-inactive'
    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert({
        name: 'Test Inactive Contact Lookup Co',
        slug: TEST_SLUG_INACTIVE,
        email: 'inactive-contact-lookup-test@example.com',
        states: ['VT'],
        active: false,
      })
      .select('id')
      .single()
    expect(error).toBeNull()
    const inactiveCompanyId = data!.id

    try {
      const result = await getCompanyContact(inactiveCompanyId)
      expect(result).toBeNull()
    } finally {
      await supabaseAdmin.from('companies').delete().eq('slug', TEST_SLUG_INACTIVE)
    }
  })
})
