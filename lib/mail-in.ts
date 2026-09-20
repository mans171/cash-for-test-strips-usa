/** Mail-in kits — the pure rules.
 *
 *  Everything here is free of the database and of Node-only modules, so the
 *  admin routes (server) and the Mail-in tab (browser) share ONE definition of
 *  which status moves are legal, and the tests need no Supabase project.
 *
 *  Randomness comes from Web Crypto (`globalThis.crypto`), which exists both in
 *  the Node runtime the routes use and in the browser — importing Node's
 *  `crypto` here would break the client bundle that imports the status rules.
 *
 *  Stage 1 is manual: a person moves a kit between statuses. Stages 2–3 (label
 *  purchase, tracking webhook) will move the same statuses automatically and
 *  must go through the same `planOrderPatch` so the timeline stays complete. */

import { getExpirationMonthOptions, monthsFromNowToYYYYMM } from './expiration'

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------

/** The happy path, in order. The order of this array IS the pipeline. */
export const PIPELINE_STATUSES = [
  // Stage 2: a kit the seller starts on /mail-in-kit waits here until a price
  // is agreed by text. A kit an admin types in normally skips it.
  'awaiting_quote',
  'quote_agreed',
  'kit_sent',
  'label_made',
  'in_transit',
  'delivered',
  'checked_in',
  'paid',
] as const

export const MAIL_IN_STATUSES = [...PIPELINE_STATUSES, 'problem', 'closed'] as const

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number]
export type MailInStatus = (typeof MAIL_IN_STATUSES)[number]

export const STATUS_LABELS: Record<MailInStatus, string> = {
  awaiting_quote: 'Waiting for quote',
  quote_agreed: 'Quote agreed',
  kit_sent: 'Kit sent',
  label_made: 'Label made',
  in_transit: 'In transit',
  delivered: 'Delivered',
  checked_in: 'Checked in',
  paid: 'Paid',
  problem: 'Problem',
  closed: 'Closed',
}

export function isMailInStatus(value: unknown): value is MailInStatus {
  return typeof value === 'string' && (MAIL_IN_STATUSES as readonly string[]).includes(value)
}

function pipelineIndex(status: MailInStatus): number {
  return (PIPELINE_STATUSES as readonly string[]).indexOf(status)
}

/** Every status a kit may move to from `from`, in display order.
 *
 *  - A pipeline status may move FORWARD to any later pipeline status. Skipping
 *    is allowed on purpose: a seller who ships with their own postage goes
 *    straight from "Quote agreed" to "In transit". Moving backward is not —
 *    a mistake is corrected through the Problem lane, which leaves a trail.
 *  - Any status may go to `problem` (a reason is required) or `closed`.
 *  - `problem` may return to ANY pipeline status, or be closed.
 *  - `closed` may only be reopened into `problem`, from where it can go
 *    anywhere. That keeps a mistaken close recoverable without letting a
 *    closed kit silently reappear mid-pipeline. */
export function validNextStatuses(from: MailInStatus): MailInStatus[] {
  if (from === 'closed') return ['problem']
  if (from === 'problem') return [...PIPELINE_STATUSES, 'closed']
  const forward = PIPELINE_STATUSES.slice(pipelineIndex(from) + 1)
  return [...forward, 'problem', 'closed']
}

export function canTransition(from: MailInStatus, to: MailInStatus): boolean {
  return validNextStatuses(from).includes(to)
}

// ---------------------------------------------------------------------------
// Payout methods
// ---------------------------------------------------------------------------

export const PAYOUT_METHODS = ['zelle', 'cash_app', 'venmo', 'ach', 'wire', 'check'] as const
export type PayoutMethod = (typeof PAYOUT_METHODS)[number]

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  zelle: 'Zelle',
  cash_app: 'Cash App',
  venmo: 'Venmo',
  ach: 'ACH',
  wire: 'Wire',
  check: 'Check',
}

export function isPayoutMethod(value: unknown): value is PayoutMethod {
  return typeof value === 'string' && (PAYOUT_METHODS as readonly string[]).includes(value)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** `expiration` is optional and stored exactly as the /sell flow stores
 *  `OrderItem.expiration`: a `YYYY-MM` string for a calendar month, or the
 *  option's own label for the two catch-all buckets. The key is ABSENT when
 *  the month was not given — rows written before the field existed and lines
 *  typed without it look the same. */
export type MailInItem = { product: string; boxes: number; expiration?: string }

export type MailInOrder = {
  id: string
  order_number: string
  token: string
  status: MailInStatus
  problem_reason: string | null
  name: string | null
  phone: string | null
  email: string | null
  street1: string | null
  street2: string | null
  city: string | null
  state: string | null
  zip: string | null
  expected_items: MailInItem[]
  received_items: MailInItem[] | null
  payout_method: PayoutMethod | null
  payout_handle: string | null
  quoted_amount: number | null
  paid_amount: number | null
  paid_at: string | null
  internal_notes: string | null
  lead_id: string | null
  easypost_shipment_id: string | null
  tracking_code: string | null
  carrier: string | null
  service: string | null
  label_url: string | null
  label_pdf_url: string | null
  qr_url: string | null
  label_created_at: string | null
  source: 'admin' | 'site' | null
  easypost_mode: 'test' | 'live' | null
  easypost_tracker_id: string | null
  label_refund_status: string | null
  seller_note: string | null
  kit_sent_at: string | null
  first_scan_at: string | null
  delivered_at: string | null
  checked_in_at: string | null
  created_at: string
  updated_at: string
}

export type MailInEvent = {
  id: string
  order_id: string
  type: string
  detail: Record<string, unknown> | null
  actor: 'admin' | 'system' | 'seller'
  created_at: string
}

/** The seller link token is stripped from every list and detail response. The
 *  only admin routes that return the link are the two whose whole job is to
 *  hand it over: "send label" and "resend link". */
export type MailInOrderForAdmin = Omit<MailInOrder, 'token'>

export function stripToken<T extends { token?: unknown }>(row: T): Omit<T, 'token'> {
  const copy = { ...row }
  delete copy.token
  return copy
}

// ---------------------------------------------------------------------------
// Token + order number
// ---------------------------------------------------------------------------

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

/** 32 random bytes as 64 hex characters — the future seller link secret. */
export function generateToken(): string {
  return Array.from(randomBytes(32), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Crockford base32: no I, L, O or U, so an order number read aloud over the
// phone cannot be mistaken for another one.
const ORDER_NUMBER_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ORDER_NUMBER_LENGTH = 6
export const ORDER_NUMBER_PATTERN = /^MK-[0-9A-HJKMNP-TV-Z]{6}$/

/** `MK-` + 6 random base32 characters (about a billion values). Uniqueness is
 *  enforced by the database; the route retries on a collision. 256 divides
 *  evenly by 32, so `byte % 32` carries no modulo bias. */
export function generateOrderNumber(): string {
  const chars = Array.from(randomBytes(ORDER_NUMBER_LENGTH), (b) => ORDER_NUMBER_ALPHABET[b % 32])
  return `MK-${chars.join('')}`
}

// ---------------------------------------------------------------------------
// Input validation (by hand, like the rest of this repo)
// ---------------------------------------------------------------------------

type Ok<T> = { ok: true; value: T }
type Err = { ok: false; error: string }
export type Result<T> = Ok<T> | Err

const err = (error: string): Err => ({ ok: false, error })

const LIMITS = {
  name: 120,
  phone: 15,
  email: 254,
  street: 200,
  city: 100,
  zip: 10,
  product: 200,
  payoutHandle: 200,
  problemReason: 1000,
  notes: 5000,
  items: 50,
  boxes: 9999,
  amount: 99_999_999.99,
} as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Optional free text: undefined when absent, null when blank (clears the
 *  column), trimmed string otherwise. */
function optionalText(body: Record<string, unknown>, key: string, max: number, label: string): Result<string | null | undefined> {
  if (!(key in body)) return { ok: true, value: undefined }
  const raw = body[key]
  if (raw === null) return { ok: true, value: null }
  if (typeof raw !== 'string') return err(`${label} must be text`)
  const trimmed = raw.trim()
  if (trimmed.length > max) return err(`${label} is too long (max ${max} characters)`)
  return { ok: true, value: trimmed === '' ? null : trimmed }
}

function parsePhone(raw: unknown): Result<string | null> {
  if (raw === null) return { ok: true, value: null }
  if (typeof raw !== 'string') return err('Phone must be text')
  const digits = raw.replace(/\D/g, '')
  if (digits === '') return { ok: true, value: null }
  if (digits.length < 10 || digits.length > LIMITS.phone) return err('Phone must have 10 to 15 digits')
  return { ok: true, value: digits }
}

function parseEmail(raw: unknown): Result<string | null> {
  if (raw === null) return { ok: true, value: null }
  if (typeof raw !== 'string') return err('Email must be text')
  const trimmed = raw.trim().toLowerCase()
  if (trimmed === '') return { ok: true, value: null }
  if (trimmed.length > LIMITS.email || !EMAIL_PATTERN.test(trimmed)) return err('Email does not look valid')
  return { ok: true, value: trimmed }
}

/** Dollars with at most two decimals, never negative. Accepts a number or a
 *  numeric string (form inputs post strings). */
function parseAmount(raw: unknown, label: string): Result<number | null> {
  if (raw === null || raw === '') return { ok: true, value: null }
  const value = typeof raw === 'string' && raw.trim() !== '' ? Number(raw.trim()) : raw
  if (typeof value !== 'number' || !Number.isFinite(value)) return err(`${label} must be a number`)
  if (value < 0) return err(`${label} cannot be negative`)
  if (value > LIMITS.amount) return err(`${label} is too large`)
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-6) return err(`${label} can have at most two decimal places`)
  return { ok: true, value: Math.round(value * 100) / 100 }
}

// ---------------------------------------------------------------------------
// Per-item expiration month (optional)
// ---------------------------------------------------------------------------

const EXPIRATION_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/
const EXPIRATION_MAX_LENGTH = 40

function isBucketOption(months: number, all: { value: number }[]): boolean {
  return months === all[0].value || months === all[all.length - 1].value
}

/** The select options for a kit line: the SAME labels /sell shows, each paired
 *  with the value /sell would store for it (see SellFlowClient `selectMonths`):
 *  `YYYY-MM` for a calendar month, the label itself for the first and last
 *  catch-all buckets. */
export function expirationChoices(today: Date = new Date()): Array<{ value: string; label: string }> {
  const options = getExpirationMonthOptions(today)
  return options.map((opt) => ({
    value: isBucketOption(opt.value, options) ? opt.label : monthsFromNowToYYYYMM(opt.value, today),
    label: opt.label,
  }))
}

/** The catch-all bucket values, which do not depend on the date. */
export const EXPIRATION_BUCKET_VALUES: readonly string[] = (() => {
  const options = getExpirationMonthOptions()
  return options.filter((opt) => isBucketOption(opt.value, options)).map((opt) => opt.label)
})()

/** Shape check only: a real `YYYY-MM` or a known bucket. Blank, null and
 *  missing all mean "not given" (undefined). Anything else is refused. */
export function parseExpiration(raw: unknown, label: string): Result<string | undefined> {
  if (raw === undefined || raw === null) return { ok: true, value: undefined }
  if (typeof raw !== 'string') return err(`${label}: expiration month is not valid`)
  if (raw.length > EXPIRATION_MAX_LENGTH) return err(`${label}: expiration month is not valid`)
  const trimmed = raw.trim()
  if (trimmed === '') return { ok: true, value: undefined }
  if (EXPIRATION_MONTH_PATTERN.test(trimmed) || EXPIRATION_BUCKET_VALUES.includes(trimmed)) {
    return { ok: true, value: trimmed }
  }
  return err(`${label}: expiration month is not valid`)
}

/** "exp 2027-01", or '' when the month was not given (or is not a value this
 *  file would have stored). The one display form, used everywhere. */
export function expirationText(item: { expiration?: unknown }): string {
  const parsed = parseExpiration(item.expiration, '')
  return parsed.ok && parsed.value ? `exp ${parsed.value}` : ''
}

export function parseItems(raw: unknown, label: string): Result<MailInItem[]> {
  if (!Array.isArray(raw)) return err(`${label} must be a list`)
  if (raw.length > LIMITS.items) return err(`${label} can have at most ${LIMITS.items} lines`)
  const items: MailInItem[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return err(`${label}: each line needs a product and a box count`)
    const { product, boxes, expiration } = entry as Record<string, unknown>
    if (typeof product !== 'string' || product.trim() === '') return err(`${label}: each line needs a product`)
    if (product.trim().length > LIMITS.product) return err(`${label}: product name is too long`)
    if (typeof boxes !== 'number' || !Number.isInteger(boxes) || boxes < 1 || boxes > LIMITS.boxes) {
      return err(`${label}: boxes must be a whole number from 1 to ${LIMITS.boxes}`)
    }
    const month = parseExpiration(expiration, label)
    if (!month.ok) return month
    items.push(month.value ? { product: product.trim(), boxes, expiration: month.value } : { product: product.trim(), boxes })
  }
  return { ok: true, value: items }
}

/** The editable columns. Status, problem_reason, received_items and
 *  paid_amount are handled separately because they are tied to a move. */
export type MailInFields = {
  name?: string | null
  phone?: string | null
  email?: string | null
  street1?: string | null
  street2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  expected_items?: MailInItem[]
  payout_method?: PayoutMethod | null
  payout_handle?: string | null
  quoted_amount?: number | null
  internal_notes?: string | null
  lead_id?: string | null
}

function parseFields(body: Record<string, unknown>): Result<MailInFields> {
  const fields: MailInFields = {}

  const texts: Array<[keyof MailInFields & string, number, string]> = [
    ['name', LIMITS.name, 'Name'],
    ['street1', LIMITS.street, 'Street address'],
    ['street2', LIMITS.street, 'Address line 2'],
    ['city', LIMITS.city, 'City'],
    ['payout_handle', LIMITS.payoutHandle, 'Payout handle'],
    ['internal_notes', LIMITS.notes, 'Notes'],
  ]
  for (const [key, max, label] of texts) {
    const parsed = optionalText(body, key, max, label)
    if (!parsed.ok) return parsed
    if (parsed.value !== undefined) (fields as Record<string, unknown>)[key] = parsed.value
  }

  if ('phone' in body) {
    const parsed = parsePhone(body.phone)
    if (!parsed.ok) return parsed
    fields.phone = parsed.value
  }
  if ('email' in body) {
    const parsed = parseEmail(body.email)
    if (!parsed.ok) return parsed
    fields.email = parsed.value
  }

  const state = optionalText(body, 'state', 2, 'State')
  if (!state.ok) return state
  if (state.value !== undefined) {
    if (state.value !== null && !/^[A-Za-z]{2}$/.test(state.value)) return err('State must be a two-letter code')
    fields.state = state.value ? state.value.toUpperCase() : null
  }

  const zip = optionalText(body, 'zip', LIMITS.zip, 'ZIP code')
  if (!zip.ok) return zip
  if (zip.value !== undefined) {
    if (zip.value !== null && !/^\d{5}(-\d{4})?$/.test(zip.value)) return err('ZIP code must be 5 digits (or ZIP+4)')
    fields.zip = zip.value
  }

  if ('expected_items' in body) {
    const parsed = parseItems(body.expected_items, 'Expected items')
    if (!parsed.ok) return parsed
    fields.expected_items = parsed.value
  }

  if ('payout_method' in body) {
    const raw = body.payout_method
    if (raw === null || raw === '') fields.payout_method = null
    else if (isPayoutMethod(raw)) fields.payout_method = raw
    else return err(`Payout method must be one of: ${PAYOUT_METHODS.join(', ')}`)
  }

  if ('quoted_amount' in body) {
    const parsed = parseAmount(body.quoted_amount, 'Quoted amount')
    if (!parsed.ok) return parsed
    fields.quoted_amount = parsed.value
  }

  if ('lead_id' in body) {
    const raw = body.lead_id
    if (raw === null || raw === '') fields.lead_id = null
    else if (typeof raw === 'string' && UUID_PATTERN.test(raw)) fields.lead_id = raw
    else return err('lead_id must be a UUID')
  }

  return { ok: true, value: fields }
}

function asObject(body: unknown): Result<Record<string, unknown>> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return err('Invalid request')
  return { ok: true, value: body as Record<string, unknown> }
}

/** An admin may start a kit at either of the first two statuses, nothing later. */
export type CreateStatus = 'awaiting_quote' | 'quote_agreed'
export type CreateOrderInput = MailInFields & { expected_items: MailInItem[]; status: CreateStatus }

export function parseCreateInput(body: unknown): Result<CreateOrderInput> {
  const object = asObject(body)
  if (!object.ok) return object
  const fields = parseFields(object.value)
  if (!fields.ok) return fields
  if (!fields.value.phone && !fields.value.email) return err('A phone number or an email is required')
  // Admin-created kits start at "Quote agreed" unless the admin explicitly
  // picks "Waiting for quote". Any other value (paid, closed…) is ignored.
  const status: CreateStatus = object.value.status === 'awaiting_quote' ? 'awaiting_quote' : 'quote_agreed'
  return { ok: true, value: { ...fields.value, expected_items: fields.value.expected_items ?? [], status } }
}

export type PatchOrderInput = {
  fields: MailInFields
  status?: MailInStatus
  problem_reason?: string | null
  received_items?: MailInItem[]
  paid_amount?: number | null
}

export function parsePatchInput(body: unknown): Result<PatchOrderInput> {
  const object = asObject(body)
  if (!object.ok) return object
  const raw = object.value

  const fields = parseFields(raw)
  if (!fields.ok) return fields
  const patch: PatchOrderInput = { fields: fields.value }

  if ('status' in raw) {
    if (!isMailInStatus(raw.status)) return err(`Status must be one of: ${MAIL_IN_STATUSES.join(', ')}`)
    patch.status = raw.status
  }

  const reason = optionalText(raw, 'problem_reason', LIMITS.problemReason, 'Problem reason')
  if (!reason.ok) return reason
  if (reason.value !== undefined) patch.problem_reason = reason.value

  if ('received_items' in raw) {
    const parsed = parseItems(raw.received_items, 'Received items')
    if (!parsed.ok) return parsed
    patch.received_items = parsed.value
  }

  if ('paid_amount' in raw) {
    const parsed = parseAmount(raw.paid_amount, 'Paid amount')
    if (!parsed.ok) return parsed
    patch.paid_amount = parsed.value
  }

  return { ok: true, value: patch }
}

// ---------------------------------------------------------------------------
// Planning a change
// ---------------------------------------------------------------------------

export type PlannedEvent = { type: string; detail: Record<string, unknown> }
export type OrderPlan = { update: Record<string, unknown>; events: PlannedEvent[] }

/** The slice of an order the planner needs to see. */
export type OrderSnapshot = Pick<
  MailInOrder,
  'status' | 'phone' | 'email' | 'payout_method' | 'paid_amount' | 'problem_reason' | 'received_items'
> &
  Partial<MailInOrder>

// Milestone columns a manual move stamps. `label_created_at` and
// `first_scan_at` are deliberately absent: they record what the carrier did,
// and stage 2–3 fill them from EasyPost. A person pressing "In transit" is not
// a carrier scan, and stamping it as one would corrupt the scan-rate numbers.
const MILESTONE_COLUMN: Partial<Record<MailInStatus, keyof MailInOrder>> = {
  kit_sent: 'kit_sent_at',
  delivered: 'delivered_at',
  checked_in: 'checked_in_at',
  paid: 'paid_at',
}

// Values that must never be copied into the timeline. The timeline records
// THAT the handle or notes changed, not what they say.
const REDACTED_FIELDS = new Set(['payout_handle', 'internal_notes'])

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/** Turn a validated patch into the exact row update and the timeline rows that
 *  describe it — or a 400-worthy message. Pure: `now` is injected. */
export function planOrderPatch(existing: OrderSnapshot, patch: PatchOrderInput, now: Date): Result<OrderPlan> {
  const nowIso = now.toISOString()
  const update: Record<string, unknown> = {}
  const events: PlannedEvent[] = []

  // 1. Plain field edits — only what actually changed.
  const changed: string[] = []
  for (const [key, value] of Object.entries(patch.fields)) {
    if (value === undefined) continue
    if (sameValue((existing as Record<string, unknown>)[key], value)) continue
    update[key] = value
    changed.push(key)
  }

  const merged = { ...existing, ...update } as OrderSnapshot
  if (!merged.phone && !merged.email) return err('A phone number or an email is required')

  const moving = patch.status !== undefined && patch.status !== existing.status
  const target = moving ? (patch.status as MailInStatus) : existing.status

  // 2. Fields that belong to a particular status.
  if (patch.received_items !== undefined) {
    const allowed = target === 'checked_in' || target === 'paid' || target === 'problem' || existing.checked_in_at
    if (!allowed) return err('Received items can only be recorded when the kit is checked in')
    if (!sameValue(existing.received_items, patch.received_items)) {
      update.received_items = patch.received_items
      changed.push('received_items')
    }
  }

  if (patch.paid_amount !== undefined && !(moving && target === 'paid')) {
    if (existing.status !== 'paid') return err('Paid amount is recorded by moving the kit to Paid')
    if (patch.paid_amount === null || patch.paid_amount <= 0) return err('Paid amount must be greater than zero')
    if (!sameValue(existing.paid_amount, patch.paid_amount)) {
      update.paid_amount = patch.paid_amount
      changed.push('paid_amount')
    }
  }

  if (!moving && patch.problem_reason !== undefined) {
    if (existing.status !== 'problem') return err('A problem reason is recorded by moving the kit to Problem')
    if (!patch.problem_reason) return err('A problem reason is required while the kit is in Problem')
    if (patch.problem_reason !== existing.problem_reason) {
      update.problem_reason = patch.problem_reason
      changed.push('problem_reason')
    }
  }

  // 3. The move itself.
  if (moving) {
    if (!canTransition(existing.status, target)) {
      return err(`Cannot move a kit from ${STATUS_LABELS[existing.status]} to ${STATUS_LABELS[target]}`)
    }

    const detail: Record<string, unknown> = { from: existing.status, to: target }

    if (target === 'problem') {
      if (!patch.problem_reason) return err('A problem reason is required')
      update.problem_reason = patch.problem_reason
      detail.problem_reason = patch.problem_reason
    } else if (existing.status === 'problem') {
      // Leaving the Problem lane: the reason stays in the timeline, not on the row.
      update.problem_reason = null
    }

    if (target === 'paid') {
      if (patch.paid_amount === undefined || patch.paid_amount === null || patch.paid_amount <= 0) {
        return err('Paid amount is required and must be greater than zero')
      }
      if (!merged.payout_method) return err('Payout method is required before a kit can be marked paid')
      update.paid_amount = patch.paid_amount
      detail.paid_amount = patch.paid_amount
      detail.payout_method = merged.payout_method
    }

    const milestone = MILESTONE_COLUMN[target]
    // First time only, except paid_at, which always reflects the latest payment.
    if (milestone && (target === 'paid' || !existing[milestone])) update[milestone] = nowIso

    update.status = target
    events.push({ type: 'status_changed', detail })
  }

  if (changed.length > 0) {
    const values: Record<string, unknown> = {}
    for (const key of changed) {
      if (!REDACTED_FIELDS.has(key)) values[key] = update[key]
    }
    events.unshift({ type: 'fields_updated', detail: { fields: changed, values } })
  }

  if (Object.keys(update).length === 0) return err('Nothing to change')

  update.updated_at = nowIso
  return { ok: true, value: { update, events } }
}

// ---------------------------------------------------------------------------
// Summary strip + card helpers
// ---------------------------------------------------------------------------

export type StatusCounts = Record<MailInStatus, number>

export function emptyStatusCounts(): StatusCounts {
  return Object.fromEntries(MAIL_IN_STATUSES.map((s) => [s, 0])) as StatusCounts
}

export function countByStatus(rows: Array<{ status: MailInStatus }>): StatusCounts {
  const counts = emptyStatusCounts()
  for (const row of rows) counts[row.status] += 1
  return counts
}

export type MailInSummary = {
  awaitingQuote: number
  kitsOut: number
  inTransit: number
  deliveredNotCheckedIn: number
  checkedInNotPaid: number
  problems: number
  paidThisMonth: number
}

export function summarize(counts: StatusCounts, paidThisMonth: number): MailInSummary {
  return {
    awaitingQuote: counts.awaiting_quote,
    kitsOut: counts.kit_sent + counts.label_made,
    inTransit: counts.in_transit,
    deliveredNotCheckedIn: counts.delivered,
    checkedInNotPaid: counts.checked_in,
    problems: counts.problem,
    paidThisMonth,
  }
}

const BUSINESS_TIME_ZONE = 'America/New_York'

/** The instant the current month began in New York, as an ISO string — so
 *  "paid this month" rolls over at midnight where the business is, not at
 *  8pm the evening before (UTC). */
export function monthStartIso(now: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)

  // New York is UTC-5 or UTC-4. Try both and keep the one that really is
  // local midnight on the 1st.
  for (const offsetHours of [4, 5]) {
    const candidate = new Date(Date.UTC(year, month - 1, 1, offsetHours))
    const hour = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIME_ZONE,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(candidate)
    if (Number(hour) === 0) return candidate.toISOString()
  }
  return new Date(Date.UTC(year, month - 1, 1, 5)).toISOString()
}

export function totalBoxes(items: MailInItem[] | null | undefined): number {
  return (items ?? []).reduce((sum, item) => sum + (Number.isFinite(item.boxes) ? item.boxes : 0), 0)
}

export function ageInDays(createdAt: string, now: Date): number {
  const ms = now.getTime() - new Date(createdAt).getTime()
  return Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 86_400_000) : 0
}

/** Make a search box value safe to drop into a PostgREST `or=(…)` filter:
 *  commas, parentheses, quotes, backslashes and the ilike wildcards all have
 *  meaning there. Returns '' when nothing searchable is left. */
export function sanitizeSearch(raw: string): string {
  return raw.replace(/[,()"'\\%*_]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

// ---------------------------------------------------------------------------
// Stage 2 — the public /mail-in-kit form
// ---------------------------------------------------------------------------

/** Keys that mean someone is trying to post bank details. The form never
 *  renders them; a body carrying one is refused outright rather than having
 *  the value quietly dropped, so a modified client learns it is not welcome. */
const BANK_DETAIL_KEYS = [
  'account_number',
  'routing_number',
  'bank_account',
  'bank_routing',
  'iban',
  'swift',
  'account',
  'routing',
]

/** Methods where we collect bank details by phone, never on the site. */
const PHONE_COLLECTED_METHODS: readonly PayoutMethod[] = ['ach', 'wire']

export type SellerOrderInput = {
  name: string
  phone: string
  email: string | null
  street1: string
  street2: string | null
  city: string
  state: string
  zip: string
  expected_items: MailInItem[]
  payout_method: PayoutMethod
  payout_handle: string | null
  seller_note: string | null
}

/** Validate a public submission. A strict whitelist: nothing a seller posts
 *  can set a status, an amount, a note of ours, or a lead link. `validStates`
 *  is injected so this file stays free of the states table. */
export function parseSellerInput(body: unknown, validStates: ReadonlySet<string>, now: Date = new Date()): Result<SellerOrderInput> {
  const object = asObject(body)
  if (!object.ok) return object
  const raw = object.value

  for (const key of Object.keys(raw)) {
    if (BANK_DETAIL_KEYS.includes(key.toLowerCase())) {
      return err('Please do not send bank details through this form. We collect them securely by phone.')
    }
  }

  const fields = parseFields({
    name: raw.name ?? null,
    phone: raw.phone ?? null,
    email: raw.email ?? null,
    street1: raw.street1 ?? null,
    street2: raw.street2 ?? null,
    city: raw.city ?? null,
    state: raw.state ?? null,
    zip: raw.zip ?? null,
    expected_items: raw.expected_items ?? [],
    payout_method: raw.payout_method ?? null,
    payout_handle: raw.payout_handle ?? null,
  })
  if (!fields.ok) return fields
  const f = fields.value

  if (!f.expected_items || f.expected_items.length === 0) return err('Tell us at least one product you are sending')
  // Stricter than the admin parser: a seller may only send a value the form's
  // select can produce. One month of slack either side covers a browser whose
  // clock or time zone sits across a month boundary from the server's.
  const producible = new Set<string>(EXPIRATION_BUCKET_VALUES)
  for (let months = 0; months <= 25; months++) producible.add(monthsFromNowToYYYYMM(months, now))
  if (f.expected_items.some((item) => item.expiration !== undefined && !producible.has(item.expiration))) {
    return err('Expected items: expiration month is not valid')
  }
  if (!f.name) return err('Your name is required')
  if (!f.phone) return err('A phone number is required so we can text you a quote')
  if (!f.street1) return err('Your street address is required')
  if (!f.city) return err('Your city is required')
  if (!f.state || f.state === 'CANADA' || !validStates.has(f.state)) return err('Please choose your state')
  if (!f.zip) return err('Your ZIP code is required')
  if (!f.payout_method) return err('Please choose how you want to be paid')

  let handle = f.payout_handle ?? null
  if (PHONE_COLLECTED_METHODS.includes(f.payout_method)) {
    // Whatever was typed is discarded: bank details never rest in this table.
    handle = null
  } else if (f.payout_method !== 'check' && !handle) {
    return err(`Please enter your ${PAYOUT_METHOD_LABELS[f.payout_method]} details`)
  }

  const note = optionalText(raw, 'note', 1000, 'Note')
  if (!note.ok) return note

  return {
    ok: true,
    value: {
      name: f.name,
      phone: f.phone,
      email: f.email ?? null,
      street1: f.street1,
      street2: f.street2 ?? null,
      city: f.city,
      state: f.state,
      zip: f.zip,
      expected_items: f.expected_items,
      payout_method: f.payout_method,
      payout_handle: handle,
      seller_note: note.value ?? null,
    },
  }
}

// ---------------------------------------------------------------------------
// Stage 2 — labels
// ---------------------------------------------------------------------------

/** A kit has an active label when one was bought and has not been voided. The
 *  label columns are kept after a void (history), so `label_refund_status` is
 *  what says the label is dead. */
export function hasActiveLabel(order: Pick<MailInOrder, 'easypost_shipment_id' | 'label_refund_status'>): boolean {
  return Boolean(order.easypost_shipment_id) && !order.label_refund_status
}

export const LABEL_STATUSES: readonly MailInStatus[] = ['awaiting_quote', 'quote_agreed']

export type ShipFrom = { name: string; street1: string; street2: string | null; city: string; state: string; zip: string; phone: string | null; email: string | null }

/** Everything that must be true before a label may be bought. Returns the
 *  ship-from address on success. `status` on the error is the HTTP status. */
export function checkLabelPreconditions(
  order: MailInOrder,
  quotedAmount: number | null
): { ok: true; shipFrom: ShipFrom } | { ok: false; status: 400 | 409; error: string } {
  if (hasActiveLabel(order)) {
    return { ok: false, status: 409, error: 'This kit already has a label. Void it first if a new one is needed.' }
  }
  if (!LABEL_STATUSES.includes(order.status)) {
    return { ok: false, status: 409, error: `A label can only be made while a kit is Waiting for quote or Quote agreed (this one is ${STATUS_LABELS[order.status]}).` }
  }
  if (quotedAmount === null || quotedAmount <= 0) {
    return { ok: false, status: 400, error: 'Enter the quoted amount the seller agreed to before making a label.' }
  }
  const missing = (
    [
      ['street1', 'street address'],
      ['city', 'city'],
      ['state', 'state'],
      ['zip', 'ZIP code'],
    ] as const
  ).filter(([key]) => !order[key])
  if (missing.length > 0) {
    return { ok: false, status: 400, error: `The ship-from address is incomplete (missing ${missing.map(([, label]) => label).join(', ')}). Edit the kit details first.` }
  }
  return {
    ok: true,
    shipFrom: {
      name: order.name ?? 'Seller',
      street1: order.street1 as string,
      street2: order.street2,
      city: order.city as string,
      state: order.state as string,
      zip: order.zip as string,
      phone: order.phone,
      email: order.email,
    },
  }
}

export function parseQuotedAmount(raw: unknown): Result<number | null> {
  return parseAmount(raw ?? null, 'Quoted amount')
}

export type Parcel = { weight: number; length: number; width: number; height: number }

/** Nobody has weighed the box yet, so the label weight is an estimate from the
 *  expected box count, in three tiers. Weight in ounces, sides in inches. */
export function parcelForBoxes(boxes: number): Parcel {
  if (boxes <= 6) return { weight: 16, length: 10, width: 8, height: 4 }
  if (boxes <= 20) return { weight: 48, length: 12, width: 10, height: 6 }
  return { weight: 96, length: 14, width: 12, height: 8 }
}

export function sellerLinkPath(token: string): string {
  return `/kit/${token}`
}

/** Seller-facing, so: no amount, no product prices, nothing but the link. */
export function labelReadyText(link: string): string {
  return `Your prepaid label is ready: ${link}`
}

// ---------------------------------------------------------------------------
// Stage 2 — what the seller is allowed to see
// ---------------------------------------------------------------------------

export type SellerView = {
  order_number: string
  first_name: string | null
  status: MailInStatus
  status_label: string
  expected_items: MailInItem[]
  carrier: string | null
  service: string | null
  tracking_code: string | null
  tracking_url: string | null
  label_pdf_url: string | null
  label_is_test: boolean
  needs_contact: boolean
  paid: boolean
  created_at: string
  label_created_at: string | null
  first_scan_at: string | null
  delivered_at: string | null
  checked_in_at: string | null
  paid_at: string | null
}

/** The ONLY shape that may cross from the server to the seller's browser.
 *  Built field by field — never by spreading the row and deleting — so a new
 *  column added to mail_in_orders later is private by default.
 *
 *  Deliberately absent: token, id, quoted/paid amounts, payout method and
 *  handle, internal notes, problem_reason, lead_id, phone, email, address. */
export function toSellerView(order: MailInOrder): SellerView {
  const labelLive = hasActiveLabel(order) && order.status === 'label_made'
  const labelUrl = order.label_pdf_url ?? order.label_url
  const tracked = hasActiveLabel(order) && Boolean(order.tracking_code)
  return {
    order_number: order.order_number,
    first_name: order.name ? order.name.trim().split(/\s+/)[0] || null : null,
    status: order.status,
    // The seller's own wording ("Label ready", "On its way"), not the board's.
    status_label: order.status === 'problem' ? 'We need to talk' : (SELLER_STEPS[sellerStepIndex(order.status)]?.label ?? STATUS_LABELS[order.status]),
    expected_items: (order.expected_items ?? []).map((item) => {
      const month = parseExpiration(item.expiration, '')
      return month.ok && month.value
        ? { product: item.product, boxes: item.boxes, expiration: month.value }
        : { product: item.product, boxes: item.boxes }
    }),
    carrier: tracked ? order.carrier : null,
    service: tracked ? order.service : null,
    tracking_code: tracked ? order.tracking_code : null,
    tracking_url: tracked
      ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(order.tracking_code as string)}`
      : null,
    label_pdf_url: labelLive && labelUrl ? labelUrl : null,
    label_is_test: hasActiveLabel(order) && order.easypost_mode === 'test',
    needs_contact: order.status === 'problem',
    paid: order.status === 'paid',
    created_at: order.created_at,
    label_created_at: hasActiveLabel(order) ? order.label_created_at : null,
    first_scan_at: order.first_scan_at,
    delivered_at: order.delivered_at,
    checked_in_at: order.checked_in_at,
    paid_at: order.status === 'paid' ? order.paid_at : null,
  }
}

/** The steps the seller status page draws, in order. `kit_sent` is an internal
 *  bookkeeping status and is folded into "Label ready". */
export const SELLER_STEPS: Array<{ label: string; statuses: MailInStatus[] }> = [
  { label: 'Waiting for quote', statuses: ['awaiting_quote'] },
  { label: 'Quote agreed', statuses: ['quote_agreed'] },
  { label: 'Label ready', statuses: ['kit_sent', 'label_made'] },
  { label: 'On its way', statuses: ['in_transit'] },
  { label: 'Arrived', statuses: ['delivered'] },
  { label: 'Checked in', statuses: ['checked_in'] },
  { label: 'Paid', statuses: ['paid'] },
]

/** Index into SELLER_STEPS, or -1 for problem / closed. */
export function sellerStepIndex(status: MailInStatus): number {
  return SELLER_STEPS.findIndex((step) => step.statuses.includes(status))
}

// ---------------------------------------------------------------------------
// Stage 2 — tracking webhook
// ---------------------------------------------------------------------------

const TRACKER_TARGET: Record<string, MailInStatus> = {
  in_transit: 'in_transit',
  out_for_delivery: 'in_transit',
  delivered: 'delivered',
  available_for_pickup: 'delivered',
  return_to_sender: 'problem',
  failure: 'problem',
  error: 'problem',
}

const TRACKER_PROBLEM_REASON: Record<string, string> = {
  return_to_sender: 'Carrier reports the parcel is being returned to sender.',
  failure: 'Carrier reports a delivery failure.',
  error: 'Carrier reports a tracking error.',
}

// A person has taken over from here; the carrier no longer gets a say.
const WEBHOOK_LOCKED: readonly MailInStatus[] = ['checked_in', 'paid', 'closed', 'problem']

/** EasyPost calls its live mode "production"; the row stores 'live'. */
export function normalizeEasyPostMode(mode: unknown): 'test' | 'live' | null {
  if (mode === 'test') return 'test'
  if (mode === 'production' || mode === 'live') return 'live'
  return null
}

/** Turn a carrier status into a row update — or null when there is nothing to
 *  do (unknown status, locked kit, a repeat, or a move that would go backward).
 *  Null is a normal outcome: the webhook answers 200 either way. */
export function planTrackerUpdate(
  existing: Pick<MailInOrder, 'status' | 'first_scan_at' | 'delivered_at'>,
  trackerStatus: string,
  now: Date
): OrderPlan | null {
  const target = TRACKER_TARGET[trackerStatus]
  if (!target) return null
  if (WEBHOOK_LOCKED.includes(existing.status)) return null

  const nowIso = now.toISOString()
  const update: Record<string, unknown> = {}
  const detail: Record<string, unknown> = { from: existing.status, to: target, tracker_status: trackerStatus }

  if (target === 'problem') {
    update.problem_reason = TRACKER_PROBLEM_REASON[trackerStatus]
    detail.problem_reason = update.problem_reason
  } else {
    if (pipelineIndex(target) <= pipelineIndex(existing.status)) return null
    // Any carrier event at all means the label has been scanned.
    if (!existing.first_scan_at) update.first_scan_at = nowIso
    if (target === 'delivered' && !existing.delivered_at) update.delivered_at = nowIso
  }

  update.status = target
  update.updated_at = nowIso
  return { update, events: [{ type: 'status_changed', detail }] }
}
