"use client"

import { useEffect } from "react"

// Persists the last searched ZIP client-side so profile pages and return
// visits can show distances. Not sensitive: user-entered, never logged.
export function ZipCookieSync({ zip }: { zip: string }) {
  useEffect(() => {
    document.cookie = `c4ts_zip=${encodeURIComponent(zip)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`
  }, [zip])
  return null
}
