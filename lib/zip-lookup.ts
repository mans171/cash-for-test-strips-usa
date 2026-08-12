import { withDistance, NEAR_MI, DRIVE_MI, type LatLng } from './geo'
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
  const { data } = await supabase
    .from('zip_centroids')
    .select('lat, lng, state')
    .eq('zip', zip)
    .maybeSingle()
  if (!data) return null
  return { lat: data.lat, lng: data.lng, state: data.state ?? null }
}

const byFeaturedThenName = (a: CompanyWithMiles, b: CompanyWithMiles) => {
  if ((a.miles ?? Infinity) !== (b.miles ?? Infinity)) return 0 // only used within same-distance ties
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
