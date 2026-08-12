import { describe, it, expect } from 'vitest'
import { tierCompanies, getZipCentroid } from '@/lib/zip-lookup'
import type { Company } from '@/lib/types'

const base: Omit<Company, 'id' | 'name' | 'slug' | 'lat' | 'lng' | 'states'> = {
  url: null, email: null, city: null, owner_name: null,
  payment_methods: [], accepted_brands: [], rating: null, description: null,
  featured: false, phone: null, verified: false, transaction_modes: ['meetup'],
  response_time: null, est_year: null,
}
const co = (id: string, lat: number | null, lng: number | null, states: string[], featured = false): Company =>
  ({ ...base, id, name: id, slug: id, lat, lng, states, featured } as Company)

// Albany centroid
const ALBANY = { lat: 42.6526, lng: -73.7562, state: 'NY' }

describe('tierCompanies', () => {
  it('buckets near (<=25mi), driving (<=100mi), inState, rest', () => {
    const companies = [
      co('albany', 42.6526, -73.7562, ['NY']),        // 0 mi → near
      co('schenectady', 42.8142, -73.9396, ['NY']),   // ~15 mi → near
      co('nyc', 40.7128, -74.006, ['NY']),            // ~135 mi → NOT driving, but NY → inState
      co('boston', 42.3601, -71.0589, ['MA']),        // ~140 mi, MA → rest
      co('hudson-ny', 42.2529, -73.7912, ['NY']),     // ~28 mi → driving
      co('nocoords-ny', null, null, ['NY']),          // → inState
    ]
    const t = tierCompanies(companies, ALBANY)
    expect(t.near.map((c) => c.id)).toEqual(['albany', 'schenectady'])
    expect(t.driving.map((c) => c.id)).toEqual(['hudson-ny'])
    expect(t.inState.map((c) => c.id).sort()).toEqual(['nocoords-ny', 'nyc'])
    expect(t.rest.map((c) => c.id)).toEqual(['boston'])
  })

  it('near/driving sorted by miles; ties broken featured-first then name', () => {
    const companies = [
      co('b-same-city', 42.6526, -73.7562, ['NY']),
      co('a-same-city-featured', 42.6526, -73.7562, ['NY'], true),
    ]
    const t = tierCompanies(companies, ALBANY)
    expect(t.near.map((c) => c.id)).toEqual(['a-same-city-featured', 'b-same-city'])
  })

  it('null centroid state puts nothing in inState', () => {
    const t = tierCompanies([co('nocoords-ny', null, null, ['NY'])], { ...ALBANY, state: null })
    expect(t.inState).toEqual([])
    expect(t.rest.map((c) => c.id)).toEqual(['nocoords-ny'])
  })
})

describe('getZipCentroid', () => {
  it('returns row data when found', async () => {
    const fake = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { lat: 1, lng: 2, state: 'NY' }, error: null }),
          }),
        }),
      }),
    }
    expect(await getZipCentroid(fake, '12208')).toEqual({ lat: 1, lng: 2, state: 'NY' })
  })
  it('returns null when missing', async () => {
    const fake = {
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
        }),
      }),
    }
    expect(await getZipCentroid(fake, '00000')).toBeNull()
  })
})
