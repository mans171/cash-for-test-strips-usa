import { createHash, randomUUID } from 'crypto'
import { readTrackingConfig } from '@/lib/tracking-config'
import { readCookie, serverTrackingAllowed } from '@/lib/tracking-consent'
import type { LeadType } from '@/lib/data-layer'

/**
 * Meta Conversions API, server side. SERVER ONLY: this module reads the token
 * through tracking-config, and no client component may import it.
 *
 * Each money event (a /sell quote request, a bulk inquiry, a mail-in kit) is
 * reported twice: once here, once by the browser pixel inside Tag Manager.
 * Both carry the same `event_id`, generated HERE and returned to the browser
 * in the API response, and Meta collapses the pair into one Lead. The server
 * half is the one ad blockers and iOS cannot eat; the browser half adds the
 * pixel's own cookies and page context.
 *
 * ⚠️ `event_id` is the WEB dedup key. Offline events dedup on
 *    `custom_data.order_id` and ignore it. Nothing here is offline.
 * ⚠️ No `value`, no product, no brand is ever sent. Meta restricts
 *    health-related data, and the site's no-prices rule covers analytics
 *    payloads too. `custom_data` carries one neutral word: the lead type.
 * ⚠️ A 200 from Meta does NOT prove the events are usable. Verify in Events
 *    Manager → Test Events (docs/tracking-setup.md), never from the response.
 *
 * Never throws and never blocks a lead: every failure is one log line with no
 * PII, and the request is abandoned after SEND_TIMEOUT_MS.
 */

// Same Graph version the sister electronics site verified end to end on 9/8.
const GRAPH_VERSION = 'v22.0'
export const SEND_TIMEOUT_MS = 3000
const SITE_ORIGIN = 'https://cash4teststripsusa.com'

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

/**
 * US phone → 11 digits with the country code. Meta matches digits only, and a
 * bare 10-digit number matches nobody. Anything that is not a clean US/CA
 * shape is dropped rather than sent wrong. Same rule as cftsalbany's meta-capi.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  let digits = raw.replace(/\D+/g, '')
  if (digits.startsWith('011')) digits = digits.slice(3)
  if (digits.length === 10) digits = `1${digits}`
  if (digits.length !== 11 || !digits.startsWith('1')) return null
  return digits
}

export function hashPhone(raw: string | null | undefined): string | null {
  const digits = normalizePhone(raw)
  return digits === null ? null : sha256(digits)
}

/**
 * Trimmed and lowercased, then hashed. Returns null for anything that is not
 * plausibly an address: a hash of "" is a real-looking hash that matches
 * nobody, and sending it would look like coverage while matching zero people.
 */
export function hashEmail(raw: string | null | undefined): string | null {
  if (!raw) return null
  const normalized = raw.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null
  return sha256(normalized)
}

export function newEventId(): string {
  return randomUUID()
}

export type CapiContext = {
  ip: string | null
  userAgent: string | null
  fbp: string | null
  fbc: string | null
  sourceUrl: string
  allowed: boolean
}

/** Keeps origin + path. The query string and fragment never go to Meta. */
function cleanSourceUrl(referer: string | null, fallbackPath: string): string {
  if (referer) {
    try {
      const url = new URL(referer)
      if (url.origin === SITE_ORIGIN || url.hostname === 'localhost' || url.hostname.endsWith('.vercel.app')) {
        return `${url.origin}${url.pathname}`
      }
    } catch {
      // Not a URL: fall through to the known page.
    }
  }
  return `${SITE_ORIGIN}${fallbackPath}`
}

/**
 * Meta's `fbc` format is `fb.1.<ms>.<fbclid>`. The pixel writes the `_fbc`
 * cookie on the landing page; deriving it from the page URL covers a visitor
 * who submits on the page they landed on before the pixel ran.
 */
function deriveFbc(referer: string | null, now: number): string | null {
  if (!referer) return null
  try {
    const fbclid = new URL(referer).searchParams.get('fbclid')
    return fbclid ? `fb.1.${now}.${fbclid}` : null
  } catch {
    return null
  }
}

/**
 * Everything the Conversions API needs from the request itself. The `_fbp` and
 * `_fbc` cookies are first-party, so the browser sends them with the form's
 * fetch and the client does not have to collect them. The page URL is the
 * fetch's Referer.
 */
export function capiContextFromRequest(request: Request, fallbackPath: string, now: number = Date.now()): CapiContext {
  const headers = request.headers
  const cookie = headers.get('cookie')
  const referer = headers.get('referer')
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return {
    ip: forwarded || headers.get('x-real-ip')?.trim() || null,
    userAgent: headers.get('user-agent'),
    fbp: readCookie(cookie, '_fbp'),
    fbc: readCookie(cookie, '_fbc') ?? deriveFbc(referer, now),
    sourceUrl: cleanSourceUrl(referer, fallbackPath),
    allowed: serverTrackingAllowed(headers),
  }
}

export type LeadEventInput = {
  eventId: string
  leadType: LeadType
  email?: string | null
  phone?: string | null
  context: CapiContext
  /** Seconds since the epoch. */
  eventTime?: number
}

/** The Graph API event object. Pure, so the payload shape is testable. */
export function buildLeadEvent(input: LeadEventInput): Record<string, unknown> {
  const { context } = input
  const userData: Record<string, unknown> = {}
  const em = hashEmail(input.email)
  const ph = hashPhone(input.phone)
  if (em) userData.em = [em]
  if (ph) userData.ph = [ph]
  // Country alone matches the whole United States, so it only rides along
  // with a real identifier.
  if (em || ph) userData.country = [sha256('us')]
  if (context.ip) userData.client_ip_address = context.ip
  if (context.userAgent) userData.client_user_agent = context.userAgent
  if (context.fbp) userData.fbp = context.fbp
  if (context.fbc) userData.fbc = context.fbc

  return {
    event_name: 'Lead',
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: 'website',
    event_source_url: context.sourceUrl,
    user_data: userData,
    custom_data: { lead_type: input.leadType },
  }
}

export type SendResult = 'sent' | 'not_configured' | 'opted_out' | 'failed'

export async function sendLeadEvent(event: Record<string, unknown>, allowed: boolean): Promise<SendResult> {
  if (!allowed) return 'opted_out'
  const config = readTrackingConfig()
  if (!config.metaPixelId || !config.metaCapiToken) return 'not_configured'

  const payload: Record<string, unknown> = { data: [event] }
  if (config.metaTestEventCode) payload.test_event_code = config.metaTestEventCode

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(config.metaPixelId)}/events?access_token=${encodeURIComponent(config.metaCapiToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      }
    )
    if (!response.ok) {
      // Status only. Meta's error body can echo the request back.
      console.error(`[meta-capi] Lead not accepted: HTTP ${response.status} (event ${String(event.event_id)})`)
      return 'failed'
    }
    return 'sent'
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown error'
    console.error(`[meta-capi] Lead not sent: ${reason} (event ${String(event.event_id)})`)
    return 'failed'
  }
}

/**
 * The one call a route makes after its row is saved. Always returns a fresh
 * event id, configured or not, so the browser pixel gets an `eventID` either
 * way and the pair stays dedupable the day the token is added.
 */
export async function reportLead(
  request: Request,
  lead: { leadType: LeadType; email?: string | null; phone?: string | null; fallbackPath: string }
): Promise<string> {
  const eventId = newEventId()
  try {
    const context = capiContextFromRequest(request, lead.fallbackPath)
    const event = buildLeadEvent({ eventId, leadType: lead.leadType, email: lead.email, phone: lead.phone, context })
    await sendLeadEvent(event, context.allowed)
  } catch (error) {
    console.error('[meta-capi] could not build the Lead event', error instanceof Error ? error.name : 'unknown error')
  }
  return eventId
}
