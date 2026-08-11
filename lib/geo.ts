export type LatLng = { lat: number; lng: number }

export const NEAR_MI = 25
export const DRIVE_MI = 100

const EARTH_RADIUS_MI = 3958.8

export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h))
}

export function isValidZip(s: string): boolean {
  return /^\d{5}$/.test(s)
}

export function withDistance<T extends { lat: number | null; lng: number | null }>(
  items: T[],
  origin: LatLng
): (T & { miles: number | null })[] {
  return items
    .map((item) => ({
      ...item,
      miles:
        item.lat != null && item.lng != null
          ? haversineMiles(origin, { lat: item.lat, lng: item.lng })
          : null,
    }))
    .sort((a, b) => {
      if (a.miles == null && b.miles == null) return 0
      if (a.miles == null) return 1
      if (b.miles == null) return -1
      return a.miles - b.miles
    })
}
