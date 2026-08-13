import type { LatLng } from "./geo"

/**
 * Population-agnostic geographic centroid for each state, computed once as the
 * mean of that state's ZCTA centroids in the `zip_centroids` table (Census
 * gazetteer, 33,791 rows).
 *
 * Held as a constant rather than queried per request: these are static
 * geographic facts, and averaging 33k rows on every state page render would be
 * pure waste. Regenerate only if `zip_centroids` is ever reseeded:
 *
 *   select state, round(avg(lat)::numeric, 4), round(avg(lng)::numeric, 4)
 *   from zip_centroids where state is not null group by state order by state;
 */
export const STATE_CENTROIDS: Record<string, LatLng> = {
  AK: { lat: 61.6188, lng: -153.2221 },
  AL: { lat: 32.8777, lng: -86.8255 },
  AR: { lat: 35.1222, lng: -92.3722 },
  AZ: { lat: 33.6874, lng: -111.5746 },
  CA: { lat: 36.4143, lng: -119.917 },
  CO: { lat: 39.2339, lng: -105.3351 },
  CT: { lat: 41.5815, lng: -72.7567 },
  DC: { lat: 38.902, lng: -77.0265 },
  DE: { lat: 39.2053, lng: -75.516 },
  FL: { lat: 28.1852, lng: -82.0313 },
  GA: { lat: 32.9719, lng: -83.6458 },
  HI: { lat: 20.5867, lng: -157.4018 },
  IA: { lat: 42.0401, lng: -93.3627 },
  ID: { lat: 44.5966, lng: -114.7164 },
  IL: { lat: 40.3758, lng: -89.0076 },
  IN: { lat: 39.9615, lng: -86.2664 },
  KS: { lat: 38.5007, lng: -97.2417 },
  KY: { lat: 37.5681, lng: -84.7989 },
  LA: { lat: 30.9639, lng: -91.8291 },
  MA: { lat: 42.2347, lng: -71.5337 },
  MD: { lat: 39.0411, lng: -76.7469 },
  ME: { lat: 44.5999, lng: -69.3853 },
  MI: { lat: 43.5189, lng: -84.7948 },
  MN: { lat: 45.5644, lng: -94.1779 },
  MO: { lat: 38.3923, lng: -92.4922 },
  MS: { lat: 32.8861, lng: -89.6769 },
  MT: { lat: 46.9856, lng: -110.2673 },
  NC: { lat: 35.5663, lng: -79.4292 },
  ND: { lat: 47.525, lng: -99.6713 },
  NE: { lat: 41.1947, lng: -98.2047 },
  NH: { lat: 43.411, lng: -71.5756 },
  NJ: { lat: 40.3729, lng: -74.5176 },
  NM: { lat: 34.7169, lng: -106.1863 },
  NV: { lat: 38.0845, lng: -116.7238 },
  NY: { lat: 42.2783, lng: -75.1606 },
  OH: { lat: 40.3828, lng: -82.7323 },
  OK: { lat: 35.4933, lng: -97.05 },
  OR: { lat: 44.4719, lng: -121.9953 },
  PA: { lat: 40.642, lng: -77.6725 },
  RI: { lat: 41.7115, lng: -71.5114 },
  SC: { lat: 33.954, lng: -81.0336 },
  SD: { lat: 44.3107, lng: -99.1592 },
  TN: { lat: 35.816, lng: -86.3168 },
  TX: { lat: 31.2681, lng: -97.7616 },
  UT: { lat: 39.808, lng: -111.8179 },
  VA: { lat: 37.6517, lng: -78.3575 },
  VT: { lat: 44.0226, lng: -72.6499 },
  WA: { lat: 47.3439, lng: -121.1302 },
  WI: { lat: 44.1693, lng: -89.5914 },
  WV: { lat: 38.4835, lng: -80.9009 },
  WY: { lat: 42.9045, lng: -107.3583 },
}

/**
 * Land-border adjacency. Used to build per-state internal links so that every
 * state page links to a different set of siblings — previously all 50 pages
 * hardcoded the same 12 links, leaving 38 states with no internal links at all.
 *
 * Non-contiguous states (AK, HI) have no land neighbours; callers fall back to
 * nearest-by-distance for those.
 */
export const STATE_NEIGHBORS: Record<string, string[]> = {
  AK: [],
  AL: ["FL", "GA", "MS", "TN"],
  AR: ["LA", "MO", "MS", "OK", "TN", "TX"],
  AZ: ["CA", "CO", "NM", "NV", "UT"],
  CA: ["AZ", "NV", "OR"],
  CO: ["AZ", "KS", "NE", "NM", "OK", "UT", "WY"],
  CT: ["MA", "NY", "RI"],
  DE: ["MD", "NJ", "PA"],
  FL: ["AL", "GA"],
  GA: ["AL", "FL", "NC", "SC", "TN"],
  HI: [],
  IA: ["IL", "MN", "MO", "NE", "SD", "WI"],
  ID: ["MT", "NV", "OR", "UT", "WA", "WY"],
  IL: ["IA", "IN", "KY", "MO", "WI"],
  IN: ["IL", "KY", "MI", "OH"],
  KS: ["CO", "MO", "NE", "OK"],
  KY: ["IL", "IN", "MO", "OH", "TN", "VA", "WV"],
  LA: ["AR", "MS", "TX"],
  MA: ["CT", "NH", "NY", "RI", "VT"],
  MD: ["DE", "PA", "VA", "WV"],
  ME: ["NH"],
  MI: ["IN", "OH", "WI"],
  MN: ["IA", "ND", "SD", "WI"],
  MO: ["AR", "IA", "IL", "KS", "KY", "NE", "OK", "TN"],
  MS: ["AL", "AR", "LA", "TN"],
  MT: ["ID", "ND", "SD", "WY"],
  NC: ["GA", "SC", "TN", "VA"],
  ND: ["MN", "MT", "SD"],
  NE: ["CO", "IA", "KS", "MO", "SD", "WY"],
  NH: ["MA", "ME", "VT"],
  NJ: ["DE", "NY", "PA"],
  NM: ["AZ", "CO", "OK", "TX", "UT"],
  NV: ["AZ", "CA", "ID", "OR", "UT"],
  NY: ["CT", "MA", "NJ", "PA", "VT"],
  OH: ["IN", "KY", "MI", "PA", "WV"],
  OK: ["AR", "CO", "KS", "MO", "NM", "TX"],
  OR: ["CA", "ID", "NV", "WA"],
  PA: ["DE", "MD", "NJ", "NY", "OH", "WV"],
  RI: ["CT", "MA"],
  SC: ["GA", "NC"],
  SD: ["IA", "MN", "MT", "ND", "NE", "WY"],
  TN: ["AL", "AR", "GA", "KY", "MO", "MS", "NC", "VA"],
  TX: ["AR", "LA", "NM", "OK"],
  UT: ["AZ", "CO", "ID", "NM", "NV", "WY"],
  VA: ["KY", "MD", "NC", "TN", "WV"],
  VT: ["MA", "NH", "NY"],
  WA: ["ID", "OR"],
  WI: ["IA", "IL", "MI", "MN"],
  WV: ["KY", "MD", "OH", "PA", "VA"],
  WY: ["CO", "ID", "MT", "NE", "SD", "UT"],
}
