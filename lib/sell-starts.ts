// "Started, didn't finish" capture for /sell.
//
// A seller gives a mobile number on the FIRST screen. When they move on to the
// buyers list we save one sell_starts row: the number, what they listed, their
// state. If they finish, /api/leads stamps the row completed. If they don't,
// the owner sees it in /admin and can text them BY HAND from his own phone.
// Nothing in this file, or anywhere on the site, sends a message by itself.
//
// Everything here is pure (no database, no clock unless passed in) so the
// routes stay thin and the rules are testable without Supabase.

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const MAX_START_ITEMS = 20
const MAX_BRAND_LENGTH = 160
const MAX_EXPIRATION_LENGTH = 40
const MAX_NAME_LENGTH = 80
const MAX_COUNT = 9999
export const MAX_ADMIN_NOTE_LENGTH = 1000
const VALID_CONDITIONS = new Set(['sealed', 'unsealed'])

export const PHONE_ERROR = 'Enter a 10-digit mobile number'

/** The admin list: how many rows at most, how long a converted phone hides a
 *  start, and how long a contacted row stays visible. */
export const ADMIN_STARTS_CAP = 200
export const CONVERTED_LOOKBACK_DAYS = 30
export const CONTACTED_VISIBLE_DAYS = 7

/** Digits only, with a US leading 1 dropped so "1 (518) 555-0100" and
 *  "518-555-0100" are the same number everywhere we compare them. */
export function phoneDigits(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const digits = raw.replace(/\D/g, '')
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
}

/** What the /sell form requires before it lets a seller continue. */
export function isTenDigitPhone(raw: unknown): boolean {
  return phoneDigits(raw).length === 10
}

export type SellStartItem = { brand: string; count: number; expiration: string; condition: 'sealed' | 'unsealed' }

export type SellStartInput = {
  phone: string
  name: string | null
  state: string
  items: SellStartItem[]
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

function parseItem(raw: unknown): SellStartItem | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const candidate = raw as Record<string, unknown>
  const brand = typeof candidate.brand === 'string' ? candidate.brand.trim() : ''
  if (!brand || brand.length > MAX_BRAND_LENGTH) return null
  const count = candidate.count
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > MAX_COUNT) return null
  const expiration = typeof candidate.expiration === 'string' ? candidate.expiration.trim() : ''
  if (expiration.length > MAX_EXPIRATION_LENGTH) return null
  const condition = candidate.condition
  if (typeof condition !== 'string' || !VALID_CONDITIONS.has(condition)) return null
  // Rebuilt field by field: nothing the client sent survives except these four.
  return { brand, count, expiration, condition: condition as SellStartItem['condition'] }
}

/**
 * Strict whitelist for the PUBLIC route. It can set exactly four things —
 * phone, name, state, items — and nothing else: no completion, no contacted
 * or dismissed stamp, no note of ours, no id.
 */
export function parseSellStartInput(body: unknown, validStates: ReadonlySet<string>): ParseResult<SellStartInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Invalid request' }
  const source = body as Record<string, unknown>

  const phone = phoneDigits(source.phone)
  if (phone.length < 10 || phone.length > 15) return { ok: false, error: PHONE_ERROR }

  let name: string | null = null
  if (source.name !== undefined && source.name !== null) {
    if (typeof source.name !== 'string') return { ok: false, error: 'Invalid name' }
    const trimmed = source.name.trim()
    if (trimmed.length > MAX_NAME_LENGTH) return { ok: false, error: 'Invalid name' }
    name = trimmed || null
  }

  if (typeof source.state !== 'string' || !validStates.has(source.state)) {
    return { ok: false, error: 'Select your state.' }
  }

  if (!Array.isArray(source.items) || source.items.length === 0) {
    return { ok: false, error: 'At least one item is required' }
  }
  if (source.items.length > MAX_START_ITEMS) {
    return { ok: false, error: `No more than ${MAX_START_ITEMS} items are allowed` }
  }
  const items: SellStartItem[] = []
  for (const raw of source.items) {
    const item = parseItem(raw)
    if (!item) return { ok: false, error: 'Each item must include a valid brand, count, expiration, and condition' }
    items.push(item)
  }

  return { ok: true, value: { phone, name, state: source.state, items } }
}

// ---------------------------------------------------------------------------
// Admin: mark contacted / dismissed / note
// ---------------------------------------------------------------------------

export type SellStartPatch = { contacted_at?: string | null; dismissed_at?: string | null; admin_note?: string | null }

const ADMIN_FIELDS = new Set(['contacted', 'dismissed', 'admin_note'])

/** Only `contacted`, `dismissed` and `admin_note` are accepted; any other key
 *  is a 400, so this route can never complete a start or rewrite a phone. */
export function parseSellStartAdminInput(body: unknown, nowIso: string): ParseResult<SellStartPatch> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, error: 'Invalid request' }
  const source = body as Record<string, unknown>
  const keys = Object.keys(source)
  if (keys.length === 0) return { ok: false, error: 'Nothing to update' }
  const unknown = keys.find((key) => !ADMIN_FIELDS.has(key))
  if (unknown) return { ok: false, error: `Unknown field: ${unknown.slice(0, 40)}` }

  const patch: SellStartPatch = {}
  if ('contacted' in source) {
    if (typeof source.contacted !== 'boolean') return { ok: false, error: 'contacted must be true or false' }
    patch.contacted_at = source.contacted ? nowIso : null
  }
  if ('dismissed' in source) {
    if (typeof source.dismissed !== 'boolean') return { ok: false, error: 'dismissed must be true or false' }
    patch.dismissed_at = source.dismissed ? nowIso : null
  }
  if ('admin_note' in source) {
    if (source.admin_note !== null && typeof source.admin_note !== 'string') return { ok: false, error: 'admin_note must be text' }
    const note = typeof source.admin_note === 'string' ? source.admin_note.trim() : ''
    if (note.length > MAX_ADMIN_NOTE_LENGTH) return { ok: false, error: 'That note is too long' }
    patch.admin_note = note || null
  }
  return { ok: true, value: patch }
}

// ---------------------------------------------------------------------------
// Admin: which starts to show
// ---------------------------------------------------------------------------

export type SellStartRow = {
  id: string
  phone: string
  name: string | null
  state: string | null
  items: unknown
  created_at: string
  completed_at: string | null
  contacted_at: string | null
  dismissed_at: string | null
  admin_note: string | null
}

export type SellStartForAdmin = Pick<SellStartRow, 'id' | 'phone' | 'name' | 'state' | 'items' | 'created_at' | 'contacted_at' | 'admin_note'>

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The "Started, didn't finish" list. The query already asks for unfinished,
 * undismissed rows newest first; this applies every rule again anyway, so the
 * list is right even if the query is ever loosened:
 *   - not completed, not dismissed
 *   - the phone is not on a lead from the last 30 days (they DID finish,
 *     maybe from another tab or after changing their order)
 *   - a contacted row drops off 7 days after it was contacted
 *   - newest first, 200 at most
 */
export function selectOpenStarts(
  starts: SellStartRow[],
  recentLeads: Array<{ phone: string | null; created_at: string }>,
  nowMs: number
): SellStartForAdmin[] {
  const leadCutoff = nowMs - CONVERTED_LOOKBACK_DAYS * DAY_MS
  const convertedPhones = new Set(
    recentLeads
      .filter((lead) => Date.parse(lead.created_at) >= leadCutoff)
      .map((lead) => phoneDigits(lead.phone))
      .filter((digits) => digits.length > 0)
  )
  const contactedCutoff = nowMs - CONTACTED_VISIBLE_DAYS * DAY_MS

  return starts
    .filter((row) => !row.completed_at && !row.dismissed_at)
    .filter((row) => !convertedPhones.has(phoneDigits(row.phone)))
    .filter((row) => !row.contacted_at || Date.parse(row.contacted_at) >= contactedCutoff)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, ADMIN_STARTS_CAP)
    .map(({ id, phone, name, state, items, created_at, contacted_at, admin_note }) => ({
      id, phone, name, state, items, created_at, contacted_at, admin_note,
    }))
}

// ---------------------------------------------------------------------------
// Admin: how a row reads
// ---------------------------------------------------------------------------

/** "3 × Accu-Chek — Guide 100ct, 2 × Dexcom — G7". Tolerates junk, because
 *  the column is jsonb and the admin page must never crash on a bad row. */
export function summarizeItems(items: unknown): string {
  if (!Array.isArray(items)) return ''
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const { brand, count } = item as Record<string, unknown>
      if (typeof brand !== 'string' || !brand.trim()) return null
      return `${typeof count === 'number' && count > 0 ? count : 1} × ${brand.trim()}`
    })
    .filter((line): line is string => line !== null)
    .join(', ')
}

/** "just now", "5m ago", "2h ago", "3d ago". */
export function ageLabel(createdAtIso: string, nowMs: number): string {
  const elapsed = nowMs - Date.parse(createdAtIso)
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return 'just now'
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** The text the owner sends BY HAND from his own messages app. */
export function followUpSmsBody(name: string | null | undefined): string {
  const trimmed = typeof name === 'string' ? name.trim() : ''
  return `Hi${trimmed ? ', ' + trimmed : ''}, this is Cash For Test Strips USA. You started listing your supplies on our site. Want a quote? Reply here with a photo of the boxes.`
}

/** `sms:` link that opens the owner's messages app with the text filled in.
 *  Same shape the /sell flow already uses for its "Text Now" button. */
export function followUpSmsHref(phone: string, name: string | null | undefined): string {
  return `sms:${phoneDigits(phone)}?body=${encodeURIComponent(followUpSmsBody(name))}`
}

/** "(518) 555-0100" for a 10-digit number; anything else is shown as stored. */
export function displayPhone(phone: string): string {
  const digits = phoneDigits(phone)
  return digits.length === 10 ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}` : phone
}

/** Client-side duplicate guard: a second POST happens only when the number or
 *  the listed items changed since the start we already saved. */
export function startSignature(phone: string, items: unknown): string {
  return `${phoneDigits(phone)}|${JSON.stringify(items)}`
}
