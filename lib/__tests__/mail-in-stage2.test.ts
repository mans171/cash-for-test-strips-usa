import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  SELLER_STEPS,
  checkLabelPreconditions,
  hasActiveLabel,
  labelReadyText,
  normalizeEasyPostMode,
  parcelForBoxes,
  parseSellerInput,
  planTrackerUpdate,
  sellerStepIndex,
  toSellerView,
  type MailInOrder,
  type MailInStatus,
} from '../mail-in'
import { VALID_STATE_CODES } from '../states'

const NOW = new Date('2026-09-20T15:00:00.000Z')

function order(overrides: Partial<MailInOrder> = {}): MailInOrder {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    order_number: 'MK-7G2K9Q',
    token: 'f'.repeat(64),
    status: 'quote_agreed',
    problem_reason: null,
    name: 'Pat Seller',
    phone: '5185550100',
    email: 'pat-private@example.com',
    street1: '12 Elm St',
    street2: null,
    city: 'Columbus',
    state: 'OH',
    zip: '43004',
    expected_items: [{ product: 'Contour NEXT 100ct', boxes: 4 }],
    received_items: null,
    payout_method: 'zelle',
    payout_handle: 'HANDLE-SENTINEL',
    quoted_amount: 123.45,
    paid_amount: null,
    paid_at: null,
    internal_notes: 'NOTES-SENTINEL',
    lead_id: '22222222-2222-4222-8222-222222222222',
    easypost_shipment_id: null,
    tracking_code: null,
    carrier: null,
    service: null,
    label_url: null,
    label_pdf_url: null,
    qr_url: null,
    label_created_at: null,
    source: 'site',
    easypost_mode: null,
    easypost_tracker_id: null,
    label_refund_status: null,
    seller_note: null,
    kit_sent_at: null,
    first_scan_at: null,
    delivered_at: null,
    checked_in_at: null,
    created_at: '2026-09-20T12:00:00.000Z',
    updated_at: '2026-09-20T12:00:00.000Z',
    ...overrides,
  }
}

const validSeller = {
  name: 'Pat Seller',
  phone: '(518) 555-0100',
  email: '',
  street1: '12 Elm St',
  street2: '',
  city: 'Columbus',
  state: 'oh',
  zip: '43004',
  expected_items: [{ product: 'Contour NEXT 100ct', boxes: 4 }],
  payout_method: 'zelle',
  payout_handle: 'pat@example.com',
  note: '  two boxes are dented  ',
}

describe('the stage-2 migration', () => {
  const sql = readFileSync('supabase/migrations/20260920130000_mail_in_stage2.sql', 'utf8')

  it('re-adds the status CHECK with the full list, awaiting_quote first', () => {
    expect(sql).toMatch(/'awaiting_quote', 'quote_agreed', 'kit_sent', 'label_made', 'in_transit',\s+'delivered', 'checked_in', 'paid', 'problem', 'closed'/)
  })

  it('is additive: no drop table/column, no policy, no grant, no RLS change', () => {
    const code = sql.replace(/--.*$/gm, '')
    expect(code).not.toMatch(/drop\s+(table|column)/i)
    expect(code).not.toMatch(/create\s+policy/i)
    expect(code).not.toMatch(/\bgrant\b/i)
    expect(code).not.toMatch(/row level security/i)
  })

  it('adds the five new columns', () => {
    for (const column of ['source', 'easypost_mode', 'easypost_tracker_id', 'label_refund_status', 'seller_note']) {
      expect(sql).toMatch(new RegExp(`add column if not exists ${column} `))
    }
  })
})

describe('parseSellerInput (the public form)', () => {
  it('accepts a complete submission and normalizes it', () => {
    const parsed = parseSellerInput(validSeller, VALID_STATE_CODES)
    expect(parsed).toEqual({
      ok: true,
      value: {
        name: 'Pat Seller', phone: '5185550100', email: null,
        street1: '12 Elm St', street2: null, city: 'Columbus', state: 'OH', zip: '43004',
        expected_items: [{ product: 'Contour NEXT 100ct', boxes: 4 }],
        payout_method: 'zelle', payout_handle: 'pat@example.com',
        seller_note: 'two boxes are dented',
      },
    })
  })

  it('cannot set anything the seller has no business setting', () => {
    const parsed = parseSellerInput(
      { ...validSeller, status: 'paid', quoted_amount: 999, paid_amount: 999, internal_notes: 'x', lead_id: '22222222-2222-4222-8222-222222222222', token: 'x', source: 'admin', easypost_mode: 'live' },
      VALID_STATE_CODES
    )
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    for (const key of ['status', 'quoted_amount', 'paid_amount', 'internal_notes', 'lead_id', 'token', 'source', 'easypost_mode']) {
      expect(key in parsed.value, key).toBe(false)
    }
  })

  it.each([
    ['no phone', { phone: '' }, /phone/i],
    ['no name', { name: ' ' }, /name/i],
    ['no items', { expected_items: [] }, /at least one product/i],
    ['zero boxes', { expected_items: [{ product: 'X', boxes: 0 }] }, /boxes/i],
    ['no street', { street1: '' }, /street/i],
    ['no city', { city: '' }, /city/i],
    ['unknown state', { state: 'ZZ' }, /state/i],
    ['Canada', { state: 'CANADA' }, /state/i],
    ['bad zip', { zip: '1234' }, /ZIP/],
    ['no payout method', { payout_method: '' }, /how you want to be paid/i],
    ['unknown payout method', { payout_method: 'paypal' }, /Payout method/],
    ['zelle without a handle', { payout_handle: '' }, /Zelle/],
  ])('rejects %s', (_label, patch, message) => {
    const parsed = parseSellerInput({ ...validSeller, ...patch }, VALID_STATE_CODES)
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toMatch(message)
  })

  it.each(['account_number', 'routing_number', 'bank_account', 'Routing_Number', 'iban', 'account'])(
    'refuses a body carrying a %s field',
    (key) => {
      const parsed = parseSellerInput({ ...validSeller, [key]: '021000021' }, VALID_STATE_CODES)
      expect(parsed).toEqual({ ok: false, error: expect.stringMatching(/do not send bank details/i) })
    }
  )

  it.each(['ach', 'wire'])('for %s, discards whatever was typed in the handle field', (method) => {
    const parsed = parseSellerInput({ ...validSeller, payout_method: method, payout_handle: '021000021 / 1234567890' }, VALID_STATE_CODES)
    expect(parsed.ok && parsed.value.payout_handle).toBeNull()
    expect(JSON.stringify(parsed)).not.toContain('021000021')
  })

  it('lets a check go without a payee name', () => {
    const parsed = parseSellerInput({ ...validSeller, payout_method: 'check', payout_handle: '' }, VALID_STATE_CODES)
    expect(parsed.ok && parsed.value.payout_handle).toBeNull()
  })
})

describe('toSellerView — what may reach the seller', () => {
  const ALLOWED = [
    'order_number', 'first_name', 'status', 'status_label', 'expected_items', 'carrier', 'service',
    'tracking_code', 'tracking_url', 'label_pdf_url', 'label_is_test', 'needs_contact', 'paid',
    'created_at', 'label_created_at', 'first_scan_at', 'delivered_at', 'checked_in_at', 'paid_at',
  ]

  it('has exactly the allowed keys, whatever the row holds', () => {
    const view = toSellerView({ ...order(), some_future_column: 'FUTURE-SENTINEL' } as MailInOrder)
    expect(Object.keys(view).sort()).toEqual([...ALLOWED].sort())
  })

  it('an expected item is product + boxes, plus expiration when the seller gave one — nothing else', () => {
    const items = [
      { product: 'A', boxes: 1, expiration: '2027-01', quoted: 'ITEM-SENTINEL' },
      { product: 'B', boxes: 2, internal: 'ITEM-SENTINEL' },
    ] as unknown as MailInOrder['expected_items']
    const view = toSellerView(order({ expected_items: items }))
    expect(view.expected_items.map((item) => Object.keys(item).sort())).toEqual([['boxes', 'expiration', 'product'], ['boxes', 'product']])
    expect(JSON.stringify(view)).not.toContain('ITEM-SENTINEL')
  })

  it('leaks nothing sensitive at any status', () => {
    const statuses: MailInStatus[] = ['awaiting_quote', 'quote_agreed', 'kit_sent', 'label_made', 'in_transit', 'delivered', 'checked_in', 'paid', 'problem', 'closed']
    for (const status of statuses) {
      const json = JSON.stringify(
        toSellerView(order({
          status,
          problem_reason: 'REASON-SENTINEL count mismatch',
          paid_amount: 118.27,
          paid_at: '2026-09-25T12:00:00.000Z',
          easypost_shipment_id: 'shp_SENTINEL',
          easypost_tracker_id: 'trk_SENTINEL',
          tracking_code: '9400100000000000000000',
          label_pdf_url: 'https://example.com/label.pdf',
          seller_note: 'my own note',
        }))
      )
      for (const secret of ['123.45', '118.27', 'HANDLE-SENTINEL', 'NOTES-SENTINEL', 'REASON-SENTINEL', 'zelle', 'f'.repeat(64), '22222222-2222', '11111111-1111', 'pat-private@example.com', '5185550100', '12 Elm St', 'shp_SENTINEL', 'trk_SENTINEL', 'Seller']) {
        expect(json, `${status}: ${secret}`).not.toContain(secret)
      }
    }
  })

  it('says Paid without the amount', () => {
    const view = toSellerView(order({ status: 'paid', paid_amount: 118.27, paid_at: '2026-09-25T12:00:00.000Z' }))
    expect(view).toMatchObject({ paid: true, status_label: 'Paid', paid_at: '2026-09-25T12:00:00.000Z' })
  })

  it('shows a neutral message for a problem, never the reason', () => {
    const view = toSellerView(order({ status: 'problem', problem_reason: 'short two boxes' }))
    expect(view).toMatchObject({ needs_contact: true, status_label: 'We need to talk' })
  })

  it('offers the label only while it is live and the kit is at Label made', () => {
    const label = { easypost_shipment_id: 'shp_1', label_pdf_url: 'https://example.com/l.pdf', tracking_code: '9400', carrier: 'USPS', service: 'GroundAdvantage', easypost_mode: 'test' as const }
    expect(toSellerView(order({ ...label, status: 'label_made' }))).toMatchObject({ label_pdf_url: 'https://example.com/l.pdf', label_is_test: true, tracking_code: '9400' })
    expect(toSellerView(order({ ...label, status: 'in_transit' })).label_pdf_url).toBeNull()
    // Voided: history stays on the row, none of it reaches the seller.
    expect(toSellerView(order({ ...label, status: 'quote_agreed', label_refund_status: 'submitted' }))).toMatchObject({
      label_pdf_url: null, tracking_code: null, tracking_url: null, carrier: null, label_is_test: false,
    })
  })

  it('falls back to label_url when EasyPost returned the PDF there', () => {
    const view = toSellerView(order({ status: 'label_made', easypost_shipment_id: 'shp_1', label_url: 'https://example.com/only.pdf' }))
    expect(view.label_pdf_url).toBe('https://example.com/only.pdf')
  })

  it('maps every status onto the seller steps', () => {
    expect(SELLER_STEPS.map((s) => s.label)).toEqual(['Waiting for quote', 'Quote agreed', 'Label ready', 'On its way', 'Arrived', 'Checked in', 'Paid'])
    expect(sellerStepIndex('awaiting_quote')).toBe(0)
    expect(sellerStepIndex('kit_sent')).toBe(2)
    expect(sellerStepIndex('label_made')).toBe(2)
    expect(sellerStepIndex('paid')).toBe(6)
    expect(sellerStepIndex('problem')).toBe(-1)
  })

  it('the ready-to-send text carries the link and no amount', () => {
    expect(labelReadyText('https://x/kit/abc')).toBe('Your prepaid label is ready: https://x/kit/abc')
  })
})

describe('labels', () => {
  it('estimates the parcel in three tiers', () => {
    expect(parcelForBoxes(0)).toEqual({ weight: 16, length: 10, width: 8, height: 4 })
    expect(parcelForBoxes(6)).toEqual({ weight: 16, length: 10, width: 8, height: 4 })
    expect(parcelForBoxes(7)).toEqual({ weight: 48, length: 12, width: 10, height: 6 })
    expect(parcelForBoxes(20)).toEqual({ weight: 48, length: 12, width: 10, height: 6 })
    expect(parcelForBoxes(21)).toEqual({ weight: 96, length: 14, width: 12, height: 8 })
  })

  it('knows a voided label is not an active one', () => {
    expect(hasActiveLabel({ easypost_shipment_id: null, label_refund_status: null })).toBe(false)
    expect(hasActiveLabel({ easypost_shipment_id: 'shp_1', label_refund_status: null })).toBe(true)
    expect(hasActiveLabel({ easypost_shipment_id: 'shp_1', label_refund_status: 'submitted' })).toBe(false)
  })

  it('passes a ready kit and hands back the ship-from address', () => {
    const result = checkLabelPreconditions(order({ status: 'awaiting_quote' }), 90)
    expect(result).toMatchObject({ ok: true, shipFrom: { name: 'Pat Seller', street1: '12 Elm St', city: 'Columbus', state: 'OH', zip: '43004' } })
  })

  it.each([
    ['an active label', order({ easypost_shipment_id: 'shp_1' }), 90, 409, /already has a label/],
    ['a late status', order({ status: 'in_transit' }), 90, 409, /only be made while/],
    ['a closed kit', order({ status: 'closed' }), 90, 409, /only be made while/],
    ['no quoted amount', order(), null, 400, /quoted amount/],
    ['a zero quote', order(), 0, 400, /quoted amount/],
    ['no street', order({ street1: null }), 90, 400, /street address/],
    ['no zip', order({ zip: null }), 90, 400, /ZIP code/],
  ] as const)('refuses %s', (_label, row, amount, status, message) => {
    const result = checkLabelPreconditions(row, amount)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(status)
      expect(result.error).toMatch(message)
    }
  })
})

describe('planTrackerUpdate (the webhook rules)', () => {
  const at = (status: MailInStatus, extra: Partial<MailInOrder> = {}) => ({ status, first_scan_at: null, delivered_at: null, ...extra })

  it.each(['in_transit', 'out_for_delivery'])('%s moves a labeled kit to In transit and stamps the first scan once', (tracker) => {
    const plan = planTrackerUpdate(at('label_made'), tracker, NOW)
    expect(plan?.update).toMatchObject({ status: 'in_transit', first_scan_at: NOW.toISOString() })
    expect(plan?.events).toEqual([{ type: 'status_changed', detail: { from: 'label_made', to: 'in_transit', tracker_status: tracker } }])
  })

  it.each(['delivered', 'available_for_pickup'])('%s moves to Delivered and stamps delivered_at', (tracker) => {
    const plan = planTrackerUpdate(at('in_transit', { first_scan_at: '2026-09-18T00:00:00.000Z' }), tracker, NOW)
    expect(plan?.update).toMatchObject({ status: 'delivered', delivered_at: NOW.toISOString() })
    expect(plan?.update.first_scan_at).toBeUndefined()
  })

  it.each(['return_to_sender', 'failure', 'error'])('%s sends the kit to Problem with a reason', (tracker) => {
    const plan = planTrackerUpdate(at('in_transit'), tracker, NOW)
    expect(plan?.update.status).toBe('problem')
    expect(String(plan?.update.problem_reason)).toMatch(/Carrier reports/)
  })

  it('is idempotent: a repeat of the current status changes nothing', () => {
    expect(planTrackerUpdate(at('in_transit'), 'in_transit', NOW)).toBeNull()
    expect(planTrackerUpdate(at('delivered'), 'delivered', NOW)).toBeNull()
  })

  it('never moves a kit backward', () => {
    expect(planTrackerUpdate(at('delivered'), 'in_transit', NOW)).toBeNull()
    expect(planTrackerUpdate(at('delivered'), 'out_for_delivery', NOW)).toBeNull()
  })

  it.each(['checked_in', 'paid', 'closed', 'problem'] as const)('never touches a kit at %s', (status) => {
    for (const tracker of ['in_transit', 'delivered', 'return_to_sender', 'failure']) {
      expect(planTrackerUpdate(at(status), tracker, NOW), tracker).toBeNull()
    }
  })

  it('ignores statuses it does not act on', () => {
    for (const tracker of ['pre_transit', 'unknown', 'cancelled', '']) expect(planTrackerUpdate(at('label_made'), tracker, NOW)).toBeNull()
  })

  it('calls EasyPost production "live"', () => {
    expect(normalizeEasyPostMode('production')).toBe('live')
    expect(normalizeEasyPostMode('test')).toBe('test')
    expect(normalizeEasyPostMode(undefined)).toBeNull()
  })
})
