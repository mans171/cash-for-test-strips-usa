import { describe, it, expect } from 'vitest'
import { haversineMiles, isValidZip, withDistance, NEAR_MI, DRIVE_MI } from '@/lib/geo'

const NYC = { lat: 40.7128, lng: -74.006 }
const LA = { lat: 34.0522, lng: -118.2437 }
const ALBANY = { lat: 42.6526, lng: -73.7562 }

describe('haversineMiles', () => {
  it('NYC to LA is ~2445 miles', () => {
    expect(haversineMiles(NYC, LA)).toBeGreaterThan(2420)
    expect(haversineMiles(NYC, LA)).toBeLessThan(2470)
  })
  it('Albany to NYC is ~135 miles', () => {
    expect(haversineMiles(ALBANY, NYC)).toBeGreaterThan(125)
    expect(haversineMiles(ALBANY, NYC)).toBeLessThan(145)
  })
  it('zero distance for identical points', () => {
    expect(haversineMiles(NYC, NYC)).toBe(0)
  })
})

describe('isValidZip', () => {
  it('accepts 5 digits', () => expect(isValidZip('12208')).toBe(true))
  it('rejects short, long, letters, zip+4', () => {
    for (const bad of ['1220', '122081', '12a08', '12208-1234', '', ' 12208']) {
      expect(isValidZip(bad)).toBe(false)
    }
  })
})

describe('withDistance', () => {
  const items = [
    { name: 'far', lat: LA.lat, lng: LA.lng },
    { name: 'nocoords', lat: null, lng: null },
    { name: 'close', lat: ALBANY.lat, lng: ALBANY.lng },
  ]
  it('sorts by miles asc with null-coord items last', () => {
    const out = withDistance(items, NYC)
    expect(out.map((i) => i.name)).toEqual(['close', 'far', 'nocoords'])
    expect(out[0].miles).toBeGreaterThan(0)
    expect(out[2].miles).toBeNull()
  })
  it('tier constants are 25 and 100', () => {
    expect(NEAR_MI).toBe(25)
    expect(DRIVE_MI).toBe(100)
  })
})
