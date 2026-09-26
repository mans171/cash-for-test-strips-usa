/**
 * When this site is allowed to load Tag Manager and send the Conversions API.
 * Pure functions, safe on both sides: the browser loader and the server
 * routes read the SAME rules, so the pixel and the server half can never
 * disagree about a visitor who opted out.
 *
 * Tracking is OFF when any of these holds:
 *
 * - The visitor opted out on /privacy ("Do Not Sell or Share My Personal
 *   Information"). That sets the `c4ts_ad_optout` cookie for a year.
 * - The browser sends Global Privacy Control (`navigator.globalPrivacyControl`
 *   in the page, the `Sec-GPC: 1` header on requests). California treats GPC
 *   as a valid opt-out of sale/sharing, so it is honored without a click.
 * - The page is private. /admin is the back office and must never report
 *   internal browsing. /kit/<token> and the password-reset pages carry a
 *   secret in the URL, and a page view would hand that URL to Google and Meta.
 */

export const OPT_OUT_COOKIE = 'c4ts_ad_optout'
/** One year, in seconds. */
export const OPT_OUT_MAX_AGE = 60 * 60 * 24 * 365

const PRIVATE_PREFIXES = ['/admin', '/kit/', '/reset-password'] as const

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) =>
    prefix.endsWith('/') ? pathname.startsWith(prefix) : pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function readCookie(jar: string | null | undefined, name: string): string | null {
  if (!jar) return null
  for (const part of jar.split(';')) {
    const trimmed = part.trim()
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    if (trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1)
  }
  return null
}

export function hasOptedOut(cookieJar: string | null | undefined): boolean {
  return readCookie(cookieJar, OPT_OUT_COOKIE) === '1'
}

/** Browser side: may Tag Manager load on this page for this visitor? */
export function browserTrackingAllowed(input: { pathname: string; cookie: string; gpc: boolean }): boolean {
  if (input.gpc) return false
  if (hasOptedOut(input.cookie)) return false
  return !isPrivatePath(input.pathname)
}

/** Server side: may this request's lead be sent to the Conversions API? */
export function serverTrackingAllowed(headers: Headers): boolean {
  if (headers.get('sec-gpc')?.trim() === '1') return false
  return !hasOptedOut(headers.get('cookie'))
}
