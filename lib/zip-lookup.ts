import { withDistance, haversineMiles, NEAR_MI, DRIVE_MI, type LatLng } from './geo'
import type { Company } from './types'

export type ZipCentroid = LatLng & { state: string | null }
export type CompanyWithMiles = Company & { miles: number | null }
export type Tiered = {
  near: CompanyWithMiles[]
  driving: CompanyWithMiles[]
  inState: CompanyWithMiles[]
  rest: CompanyWithMiles[]
}

// Minimal structural type so both the anon and server supabase clients (and
// test fakes) are accepted without importing client internals.
type SupabaseLike = { from: (table: string) => any }

export async function getZipCentroid(
  supabase: SupabaseLike,
  zip: string
): Promise<ZipCentroid | null> {
  const { data, error } = await supabase
    .from('zip_centroids')
    .select('lat, lng, state')
    .eq('zip', zip)
    .maybeSingle()
  if (error) {
    console.error('zip_centroids lookup failed:', error.message)
    return null
  }
  if (!data) return null
  return { lat: data.lat, lng: data.lng, state: data.state ?? null }
}

// ZIP codes within `radiusMi` of a point, for a city page's "we serve these
// ZIPs" block. Scoped to a single state via the indexed `state` column
// (zip_centroids has no spatial index, so a radius query filters and
// haversine-sorts in JS the same way nearestBuyers() does for buyers —
// state-scoped result sets are small enough that this is fine).
export async function zipsNearPoint(
  supabase: SupabaseLike,
  origin: LatLng,
  state: string,
  radiusMi = 30,
  limit = 20
): Promise<string[]> {
  const { data, error } = await supabase
    .from('zip_centroids')
    .select('zip, lat, lng')
    .eq('state', state)
  if (error) {
    console.error('zip_centroids radius lookup failed:', error.message)
    return []
  }
  return (data ?? [])
    .map((z: { zip: string; lat: number; lng: number }) => ({
      zip: z.zip,
      miles: haversineMiles(origin, { lat: z.lat, lng: z.lng }),
    }))
    .filter((z: { miles: number }) => z.miles <= radiusMi)
    .sort((a: { miles: number }, b: { miles: number }) => a.miles - b.miles)
    .slice(0, limit)
    .map((z: { zip: string }) => z.zip)
}

const byFeaturedThenName = (a: CompanyWithMiles, b: CompanyWithMiles) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1
  return a.name.localeCompare(b.name)
}

export function tierCompanies(companies: Company[], centroid: ZipCentroid): Tiered {
  const annotated = withDistance(companies, centroid)
  // Stable secondary ordering for exact-distance ties (same city):
  const sorted = [...annotated].sort((a, b) => {
    const am = a.miles ?? Infinity
    const bm = b.miles ?? Infinity
    if (am !== bm) return am - bm
    return byFeaturedThenName(a, b)
  })

  const near: CompanyWithMiles[] = []
  const driving: CompanyWithMiles[] = []
  const inState: CompanyWithMiles[] = []
  const rest: CompanyWithMiles[] = []

  for (const c of sorted) {
    if (c.miles != null && c.miles <= NEAR_MI) near.push(c)
    else if (c.miles != null && c.miles <= DRIVE_MI) driving.push(c)
    else if (centroid.state && c.states.includes(centroid.state)) inState.push(c)
    else rest.push(c)
  }
  return { near, driving, inState, rest }
}
