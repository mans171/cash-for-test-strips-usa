/**
 * Every tracking identifier this site uses, read in one place. SERVER ONLY.
 *
 * This module reads the Conversions API token. No client component may import
 * it, directly or through another module; `lib/__tests__/tracking-isolation`
 * walks the import graph of every "use client" file and fails if one does.
 * Next.js blanks non-public env vars in client bundles, so an import would not
 * actually leak the token, but a server credential one import away from the
 * browser is not a boundary worth keeping. Client code pushes events through
 * `lib/data-layer.ts`, which reads no configuration at all.
 *
 * Three rules hold this together, all enforced by that same test:
 *
 * 1. Each value is a LITERAL `process.env.NAME` access. A dynamic lookup table
 *    would be invisible to the source scanners and would silently disable the
 *    guard. Env var names are case-sensitive and fail silently: a sister
 *    project lost days to `Meta_Capi_Access_Token`.
 * 2. No identifier belonging to another business may appear here as a value
 *    or anywhere else in the source. This site shares an owner with the
 *    Albany diabetic-supplies business (DTS) and the Albany phones business
 *    (CFPA). They must never share a pixel, dataset or container: one wrong
 *    number poisons a year of both businesses' data.
 * 3. No tracking id is hardcoded. They arrive as env vars in Vercel.
 *
 * The values are read on every call rather than frozen at import, so a test
 * can stub the environment without juggling module caches.
 */

/**
 * Other businesses' ids. Never this site's. Listed here so the isolation test
 * and the runtime guard below can refuse them; this file and the test are the
 * only places allowed to name them.
 */
export const FORBIDDEN_IDS = Object.freeze([
  // DTS-Albany (diabetic supplies, Albany)
  '2161226681280301', // old DTS pixel (not a consolidated container)
  '1041298111860592', // DTS Albany Offline dataset
  '880082295178750', // DTS Facebook page
  '1439154024601256', // DTS ad account
  '1197107605465258', // Albanyteststripsbuyer dataset
  '25592244823764586', // ABTSB dataset
  'GTM-573J9THJ', // albanyteststripsbuyer.com Tag Manager container
  // CFPA / Cash For Electronics Albany (phones)
  '1099240922629305', // CFPA Albany Offline dataset
  '1528883671975586', // CFPA ad account
  'GTM-NVFBPF4L', // cashforelectronicsalbanyny.com Tag Manager container
  'G-4K4NJBGTQ4', // cashforelectronicsalbanyny.com GA4 property
] as const)

function optional(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * A configured id that belongs to another business is treated as UNSET, and
 * says so in the log. Tests do not run on Vercel, so this is the guard that
 * actually stands between a mis-pasted env var and live data.
 */
function refuseForeign(name: string, value: string | null): string | null {
  if (value === null) return null
  const hit = FORBIDDEN_IDS.find((bad) => value.includes(bad))
  if (hit) {
    console.error(`[tracking] ${name} is set to another business's id; ignoring it. Fix the env var in Vercel.`)
    return null
  }
  return value
}

export type TrackingConfig = {
  /** Tag Manager container for THIS site. GA4 and the browser pixel live inside it. */
  gtmId: string | null
  /** The Cash For Test Strips USA Meta dataset (pixel) id. Server side, for the Conversions API. */
  metaPixelId: string | null
  /** Conversions API access token. A secret. */
  metaCapiToken: string | null
  /** Events Manager → Test Events code. Set only while verifying; remove after. */
  metaTestEventCode: string | null
}

/**
 * A container id is interpolated into an inline script, so anything that is
 * not the plain `GTM-XXXXXXX` shape is refused rather than rendered.
 */
function gtmShaped(value: string | null): string | null {
  if (value === null) return null
  if (!/^GTM-[A-Z0-9]{4,12}$/.test(value)) {
    console.error('[tracking] NEXT_PUBLIC_GTM_ID is not a GTM-XXXXXXX container id; ignoring it.')
    return null
  }
  return value
}

/** A dataset id is all digits; anything else is a paste error. */
function digitsOnly(value: string | null): string | null {
  if (value === null) return null
  if (!/^\d{10,20}$/.test(value)) {
    console.error('[tracking] META_PIXEL_ID is not a numeric dataset id; ignoring it.')
    return null
  }
  return value
}

export function readTrackingConfig(): TrackingConfig {
  return {
    gtmId: gtmShaped(refuseForeign('NEXT_PUBLIC_GTM_ID', optional(process.env.NEXT_PUBLIC_GTM_ID))),
    metaPixelId: digitsOnly(refuseForeign('META_PIXEL_ID', optional(process.env.META_PIXEL_ID))),
    metaCapiToken: optional(process.env.META_CAPI_ACCESS_TOKEN),
    metaTestEventCode: optional(process.env.META_CAPI_TEST_EVENT_CODE),
  }
}
