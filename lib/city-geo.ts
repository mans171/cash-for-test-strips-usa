import type { LatLng } from "./geo"

/**
 * Wave 1 city-page targets: US metros with a verified in-person buyer within
 * 50 miles, confirmed against live Supabase `companies` data on 2026-08-15
 * (Atlanta added 2026-09-07 on the same rule: Nova Diabetic Supply in
 * Lawrenceville is 26.5mi from downtown, and 132 Georgia ZIPs sit within 30mi
 * of the centre — both measured live, not estimated)
 * (not the earlier planning-doc estimates in docs/seo/2026-08-12-metro-target-map.md,
 * which explicitly required re-verification before publishing).
 *
 * Unlike `STATE_CENTROIDS` in state-geo.ts, this is a curated allowlist, not
 * an exhaustive one — the number of US cities is unbounded, so only cities
 * that actually get a page belong here. `generateStaticParams` on the city
 * route reads this list directly, so any slug not present here 404s: the
 * publish gate lives in the data, not in a separate check.
 *
 * Washington, DC is deliberately excluded even though its nearest buyer
 * (Silver Spring, MD) is within 50mi — DC has no entry in STATE_LABELS /
 * STATE_CENTROIDS (see lib/states.ts, lib/state-geo.ts), so there is no
 * `/sell-test-strips/dc` parent page for a DC city page to link back to.
 * Adding DC as a full state-page destination is a separate, larger change.
 *
 * lat/lng are downtown/city-center coordinates, not population-weighted
 * metro centroids — consistent with how STATE_CENTROIDS averages ZCTA
 * centroids for a single representative point per place.
 */
export type CityTarget = {
  name: string
  state: string
  slug: string
  lat: number
  lng: number
}

export const CITY_TARGETS: CityTarget[] = [
  { name: "Arlington", state: "TX", slug: "arlington", lat: 32.7357, lng: -97.1081 },
  { name: "Atlanta", state: "GA", slug: "atlanta", lat: 33.749, lng: -84.388 },
  { name: "Aurora", state: "CO", slug: "aurora", lat: 39.7294, lng: -104.8319 },
  { name: "Baltimore", state: "MD", slug: "baltimore", lat: 39.2904, lng: -76.6122 },
  { name: "Baton Rouge", state: "LA", slug: "baton-rouge", lat: 30.4515, lng: -91.1871 },
  { name: "Boise", state: "ID", slug: "boise", lat: 43.6150, lng: -116.2023 },
  { name: "Boston", state: "MA", slug: "boston", lat: 42.3601, lng: -71.0589 },
  { name: "Charleston", state: "WV", slug: "charleston", lat: 38.3498, lng: -81.6326 },
  { name: "Charlotte", state: "NC", slug: "charlotte", lat: 35.2271, lng: -80.8431 },
  { name: "Colorado Springs", state: "CO", slug: "colorado-springs", lat: 38.8339, lng: -104.8214 },
  { name: "Dallas", state: "TX", slug: "dallas", lat: 32.7767, lng: -96.7970 },
  { name: "Denver", state: "CO", slug: "denver", lat: 39.7392, lng: -104.9903 },
  { name: "Durham", state: "NC", slug: "durham", lat: 35.9940, lng: -78.8986 },
  { name: "Fort Worth", state: "TX", slug: "fort-worth", lat: 32.7555, lng: -97.3308 },
  { name: "Greensboro", state: "NC", slug: "greensboro", lat: 36.0726, lng: -79.7920 },
  { name: "Greenville", state: "SC", slug: "greenville", lat: 34.8526, lng: -82.394 },
  { name: "Henderson", state: "NV", slug: "henderson", lat: 36.0395, lng: -114.9817 },
  { name: "Huntington", state: "WV", slug: "huntington", lat: 38.4192, lng: -82.4452 },
  { name: "Kansas City", state: "MO", slug: "kansas-city", lat: 39.0997, lng: -94.5786 },
  { name: "Las Vegas", state: "NV", slug: "las-vegas", lat: 36.1699, lng: -115.1398 },
  { name: "Miami", state: "FL", slug: "miami", lat: 25.7617, lng: -80.1918 },
  { name: "Orlando", state: "FL", slug: "orlando", lat: 28.5384, lng: -81.3789 },
  { name: "Philadelphia", state: "PA", slug: "philadelphia", lat: 39.9526, lng: -75.1652 },
  { name: "Pittsburgh", state: "PA", slug: "pittsburgh", lat: 40.4406, lng: -79.9959 },
  { name: "Portland", state: "OR", slug: "portland", lat: 45.5152, lng: -122.6784 },
  { name: "Raleigh", state: "NC", slug: "raleigh", lat: 35.7796, lng: -78.6382 },
  { name: "Sacramento", state: "CA", slug: "sacramento", lat: 38.5816, lng: -121.4944 },
  { name: "Salt Lake City", state: "UT", slug: "salt-lake-city", lat: 40.7608, lng: -111.8910 },
  { name: "San Antonio", state: "TX", slug: "san-antonio", lat: 29.4241, lng: -98.4936 },
  { name: "San Diego", state: "CA", slug: "san-diego", lat: 32.7157, lng: -117.1611 },
  { name: "Stockton", state: "CA", slug: "stockton", lat: 37.9577, lng: -121.2908 },
  { name: "Toledo", state: "OH", slug: "toledo", lat: 41.6528, lng: -83.5379 },
  { name: "New York City", state: "NY", slug: "new-york-city", lat: 40.7128, lng: -74.0060 },
]

export function cityCenter(target: CityTarget): LatLng {
  return { lat: target.lat, lng: target.lng }
}
