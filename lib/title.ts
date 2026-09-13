/**
 * Page <title> construction, with a hard 60-character budget.
 *
 * Why this exists: the root layout used to carry a metadata template
 * (`"%s | Cash For Test Strips USA"`) that appended 27 characters to every
 * page title on the site. A live crawl on 2026-09-12 found 660 pages over 60
 * characters — company pages reached 119 — which is where Google truncates.
 * The template is now `'%s'`, so each page owns its whole title and builds it
 * here: the brand is appended only when it actually fits.
 *
 * The rule is enforced by lib/__tests__/page-titles.test.ts across every
 * state, every city target and every registry post, plus the longest real
 * buyer names on the roster.
 */

export const BRAND = "Cash For Test Strips USA"
export const TITLE_MAX = 60

const SEPARATOR = " | "

/** The longest a core may be and still leave room for " | <BRAND>". */
export const CORE_MAX_WITH_BRAND = TITLE_MAX - SEPARATOR.length - BRAND.length

/**
 * Build a page title from its core.
 *
 * Returns `"<core> | Cash For Test Strips USA"` when that fits inside
 * TITLE_MAX, and the bare `core` when it does not.
 *
 * A core that is itself over budget is a bug in the calling page, not
 * something to silently truncate: it throws under test so CI catches it, and
 * warns in production so a single long buyer name can never take a page down.
 */
export function pageTitle(core: string, opts?: { brand?: boolean }): string {
  const trimmed = core.trim()

  if (trimmed.length > TITLE_MAX) {
    const message = `pageTitle: core is ${trimmed.length} chars (limit ${TITLE_MAX}): ${trimmed}`
    if (isTestEnv()) throw new Error(message)
    console.warn(message)
    return trimmed
  }

  const wantsBrand = opts?.brand ?? true
  if (!wantsBrand || trimmed.length > CORE_MAX_WITH_BRAND) return trimmed

  return `${trimmed}${SEPARATOR}${BRAND}`
}

/**
 * The core for a buyer profile page.
 *
 * Buyer names are user-supplied and unbounded — many already end in their own
 * city and state ("Cash For Test Strips - Philadelphia, PA"), which is exactly
 * what produced the 119-character titles.
 *
 * The name comes first whenever `"<name> — Test Strip Buyer"` fits inside
 * TITLE_MAX, even when the name already contains "test strip": repeating the
 * keyword costs a few characters, but the location form
 * ("Test Strip Buyer in Philadelphia, PA") is NOT unique — two buyers in one
 * city would produce byte-identical titles, which is a worse SEO problem than
 * a duplicated keyword. The location form is the fallback for names that do
 * not fit, and the bare "Test Strip Buyer" the last resort when there is no
 * location to fall back to either.
 */
export function companyTitle(
  name: string,
  city: string | null | undefined,
  state: string | null | undefined
): string {
  const suffixed = `${name.trim()} — Test Strip Buyer`
  if (suffixed.length <= TITLE_MAX) return suffixed

  const where = [city?.trim(), state?.trim()].filter(Boolean).join(", ")
  const located = where ? `Test Strip Buyer in ${where}` : null
  if (located && located.length <= TITLE_MAX) return located

  return "Test Strip Buyer"
}

/** The core for a state landing page ("…in North Carolina" is the longest). */
export function stateTitle(label: string): string {
  return `Sell Diabetic Test Strips in ${label}`
}

/** The core for a city landing page (the longest real target is 49 chars). */
export function cityTitle(city: string, st: string): string {
  return `Sell Diabetic Test Strips in ${city}, ${st}`
}

function isTestEnv(): boolean {
  return Boolean(process.env.VITEST) || process.env.NODE_ENV === "test"
}
