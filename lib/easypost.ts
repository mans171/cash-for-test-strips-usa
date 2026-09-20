/** EasyPost, by hand — SERVER ONLY.
 *
 *  No SDK: four JSON calls with Basic auth and one HMAC check do not justify a
 *  dependency. This file imports Node's `crypto`, so pulling it into a client
 *  component fails the build, which is the intent.
 *
 *  THE RETURN-LABEL ARRANGEMENT (verified 2026-09-20 with a real test label):
 *  the shipment is created with `is_return: true`, **to_address = the SELLER
 *  and from_address = US**. EasyPost swaps the two when it prints, so the label
 *  reads seller -> Latham. Passing them the "natural" way round prints a label
 *  that ships our warehouse's box to the seller. Do not "fix" the order.
 *
 *  Env vars are read as LITERAL process.env.NAME so a credential scan can see
 *  every one of them. */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { OWNER_PHONE } from '@/lib/owner'
import type { Parcel, ShipFrom } from '@/lib/mail-in'

const API = 'https://api.easypost.com/v2'
const TIMEOUT_MS = 20_000

export type EasyPostMode = 'test' | 'live'
export type EasyPostConfig = { mode: EasyPostMode; key: string }

/** `test` unless EASYPOST_MODE is explicitly `live`. Null when the key for the
 *  chosen mode is missing — the caller answers 503. A live request never falls
 *  back to the test key, or the other way round. */
export function getEasyPostConfig(forMode?: EasyPostMode): EasyPostConfig | null {
  // `forMode` is for voiding: a label is refunded with the key that bought it,
  // whatever EASYPOST_MODE says today.
  const mode: EasyPostMode = forMode ?? (process.env.EASYPOST_MODE === 'live' ? 'live' : 'test')
  const key = mode === 'live' ? process.env.EASYPOST_API_KEY : process.env.EASYPOST_TEST_API_KEY
  if (!key || key.trim() === '') return null
  return { mode, key: key.trim() }
}

/** Where every kit is going. */
export const WAREHOUSE_ADDRESS = {
  company: 'Cash For Test Strips USA',
  street1: '6 Northway Ln',
  city: 'Latham',
  state: 'NY',
  zip: '12110',
  country: 'US',
  phone: OWNER_PHONE.replace(/\D/g, ''),
} as const

export class EasyPostError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
    readonly code: string | null
  ) {
    super(message)
    this.name = 'EasyPostError'
  }
}

type Json = Record<string, unknown>

async function call(config: EasyPostConfig, method: 'GET' | 'POST', path: string, body?: Json): Promise<Json> {
  let response: Response
  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: {
        // Basic auth, key as the username, empty password.
        Authorization: `Basic ${Buffer.from(`${config.key}:`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    // Never rethrow the raw error: it can carry the request, headers included.
    throw new EasyPostError('Could not reach EasyPost', 0, null)
  }

  const parsed = (await response.json().catch(() => null)) as Json | null
  if (!response.ok) {
    const error = (parsed?.error ?? {}) as { code?: unknown; message?: unknown }
    throw new EasyPostError(
      typeof error.message === 'string' ? error.message : `EasyPost answered ${response.status}`,
      response.status,
      typeof error.code === 'string' ? error.code : null
    )
  }
  return parsed ?? {}
}

// ---------------------------------------------------------------------------
// 1. Address verification
// ---------------------------------------------------------------------------

function sellerAddress(shipFrom: ShipFrom): Json {
  const address: Json = {
    name: shipFrom.name,
    street1: shipFrom.street1,
    city: shipFrom.city,
    state: shipFrom.state,
    zip: shipFrom.zip,
    country: 'US',
  }
  if (shipFrom.street2) address.street2 = shipFrom.street2
  if (shipFrom.phone) address.phone = shipFrom.phone
  if (shipFrom.email) address.email = shipFrom.email
  return address
}

export function verifyAddressBody(shipFrom: ShipFrom): Json {
  return { address: sellerAddress(shipFrom), verify: true }
}

export type AddressCheck = { ok: true } | { ok: false; message: string }

/** `verify: true` rather than `verify_strict`: strict turns an undeliverable
 *  address into an HTTP error with a less readable body. With `verify` the
 *  address comes back 200 and says why in `verifications.delivery`. */
export async function verifyAddress(config: EasyPostConfig, shipFrom: ShipFrom): Promise<AddressCheck> {
  const result = await call(config, 'POST', '/addresses', verifyAddressBody(shipFrom))
  const delivery = ((result.verifications ?? {}) as Json).delivery as { success?: unknown; errors?: unknown } | undefined
  if (delivery?.success === true) return { ok: true }
  const reasons = Array.isArray(delivery?.errors)
    ? (delivery.errors as Array<{ message?: unknown }>).map((e) => (typeof e.message === 'string' ? e.message : '')).filter(Boolean)
    : []
  return {
    ok: false,
    message:
      `USPS could not confirm this ship-from address${reasons.length ? ` (${reasons.join('; ')})` : ''}. ` +
      'Check the street, apartment number and ZIP with the seller, fix it under Edit details, and try again.',
  }
}

// ---------------------------------------------------------------------------
// 2. Shipment, rate, buy, refund
// ---------------------------------------------------------------------------

export function createShipmentBody(shipFrom: ShipFrom, parcel: Parcel, reference: string): Json {
  return {
    shipment: {
      // SWAPPED ON PURPOSE — see the header. to = seller, from = us.
      to_address: sellerAddress(shipFrom),
      from_address: { ...WAREHOUSE_ADDRESS },
      parcel: { weight: parcel.weight, length: parcel.length, width: parcel.width, height: parcel.height },
      is_return: true,
      // label_format is a SHIPMENT option; it has to be set before the buy.
      options: { label_format: 'PDF' },
      reference,
    },
  }
}

export type Rate = { id: string; carrier: string; service: string; rate: string }

const USPS_SERVICES = ['GroundAdvantage', 'Priority']

function cheapest(rates: Rate[]): Rate | null {
  return rates.reduce<Rate | null>((best, rate) => (best === null || Number(rate.rate) < Number(best.rate) ? rate : best), null)
}

/** USPSReturns (billed only when scanned) when the account offers it;
 *  otherwise the cheapest USPS GroundAdvantage / Priority. Nothing else is ever
 *  chosen — a UPS, FedEx or DHL rate is ignored even when it is the cheapest. */
export function pickRate(rates: Rate[]): Rate | null {
  const usable = rates.filter((r) => r && typeof r.id === 'string' && Number.isFinite(Number(r.rate)))
  const returns = cheapest(usable.filter((r) => r.carrier === 'USPSReturns'))
  if (returns) return returns
  return cheapest(usable.filter((r) => r.carrier === 'USPS' && USPS_SERVICES.includes(r.service)))
}

export type CreatedShipment = { id: string; rates: Rate[] }

export async function createReturnShipment(config: EasyPostConfig, shipFrom: ShipFrom, parcel: Parcel, reference: string): Promise<CreatedShipment> {
  const result = await call(config, 'POST', '/shipments', createShipmentBody(shipFrom, parcel, reference))
  if (typeof result.id !== 'string') throw new EasyPostError('EasyPost returned no shipment id', 502, null)
  return { id: result.id, rates: Array.isArray(result.rates) ? (result.rates as Rate[]) : [] }
}

export function buyBody(rateId: string): Json {
  return { rate: { id: rateId } }
}

export type BoughtLabel = {
  shipmentId: string
  trackerId: string | null
  trackingCode: string | null
  carrier: string | null
  service: string | null
  labelUrl: string | null
  labelPdfUrl: string | null
}

export async function buyShipment(config: EasyPostConfig, shipmentId: string, rate: Rate): Promise<BoughtLabel> {
  const result = await call(config, 'POST', `/shipments/${encodeURIComponent(shipmentId)}/buy`, buyBody(rate.id))
  const label = (result.postage_label ?? {}) as { label_url?: unknown; label_pdf_url?: unknown }
  const tracker = (result.tracker ?? {}) as { id?: unknown }
  const selected = (result.selected_rate ?? {}) as { carrier?: unknown; service?: unknown }
  const labelUrl = typeof label.label_url === 'string' ? label.label_url : null
  // With label_format PDF the PDF arrives in label_url and label_pdf_url is
  // often null, so fall back to label_url when it is itself a PDF.
  const labelPdfUrl =
    typeof label.label_pdf_url === 'string' ? label.label_pdf_url : labelUrl && /\.pdf(\?|$)/i.test(labelUrl) ? labelUrl : null
  return {
    shipmentId,
    trackerId: typeof tracker.id === 'string' ? tracker.id : null,
    trackingCode: typeof result.tracking_code === 'string' ? result.tracking_code : null,
    carrier: typeof selected.carrier === 'string' ? selected.carrier : rate.carrier,
    service: typeof selected.service === 'string' ? selected.service : rate.service,
    labelUrl,
    labelPdfUrl,
  }
}

/** POST /shipments/:id/refund takes no body. Returns EasyPost's refund_status
 *  (submitted / refunded / rejected / not_applicable). */
export async function refundShipment(config: EasyPostConfig, shipmentId: string): Promise<string> {
  const result = await call(config, 'POST', `/shipments/${encodeURIComponent(shipmentId)}/refund`)
  return typeof result.refund_status === 'string' ? result.refund_status : 'submitted'
}

// ---------------------------------------------------------------------------
// 3. Webhook signature
// ---------------------------------------------------------------------------

const SIGNATURE_PREFIX = 'hmac-sha256-hex='

/** X-Hmac-Signature = "hmac-sha256-hex=" + HMAC-SHA256(NFKD(secret), raw body)
 *  as lowercase hex — the same thing EasyPost's own validate_webhook does.
 *  Compared in constant time. False for a missing secret, a missing header, a
 *  wrong prefix or a wrong length; never throws. */
export function verifyWebhookSignature(rawBody: string, header: string | null, secret: string | undefined): boolean {
  if (!secret || !header || !header.startsWith(SIGNATURE_PREFIX)) return false
  const expected = createHmac('sha256', secret.normalize('NFKD')).update(rawBody, 'utf8').digest('hex')
  const given = Buffer.from(header.slice(SIGNATURE_PREFIX.length).trim().toLowerCase(), 'utf8')
  const wanted = Buffer.from(expected, 'utf8')
  if (given.length !== wanted.length) return false
  return timingSafeEqual(given, wanted)
}
