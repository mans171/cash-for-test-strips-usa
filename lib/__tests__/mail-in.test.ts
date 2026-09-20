import { describe, it, expect } from 'vitest'
import {
  MAIL_IN_STATUSES,
  ORDER_NUMBER_PATTERN,
  PAYOUT_METHODS,
  PAYOUT_METHOD_LABELS,
  PIPELINE_STATUSES,
  ageInDays,
  canTransition,
  countByStatus,
  generateOrderNumber,
  generateToken,
  monthStartIso,
  parseCreateInput,
  parsePatchInput,
  planOrderPatch,
  sanitizeSearch,
  stripToken,
  summarize,
  totalBoxes,
  validNextStatuses,
  type OrderSnapshot,
  type PatchOrderInput,
} from '../mail-in'

const NOW = new Date('2026-09-20T15:00:00.000Z')

function snapshot(overrides: Partial<OrderSnapshot> = {}): OrderSnapshot {
  return {
    status: 'quote_agreed',
    phone: '5185550100',
    email: null,
    payout_method: null,
    paid_amount: null,
    problem_reason: null,
    received_items: null,
    ...overrides,
  }
}

function patchOf(body: unknown): PatchOrderInput {
  const parsed = parsePatchInput(body)
  if (!parsed.ok) throw new Error(parsed.error)
  return parsed.value
}

describe('status transitions', () => {
  it('lists the statuses in the exact order the migration CHECK uses', () => {
    expect([...MAIL_IN_STATUSES]).toEqual([
      'quote_agreed', 'kit_sent', 'label_made', 'in_transit', 'delivered', 'checked_in', 'paid', 'problem', 'closed',
    ])
  })

  it('allows every forward move, including skips', () => {
    PIPELINE_STATUSES.forEach((from, i) => {
      PIPELINE_STATUSES.forEach((to, j) => {
        expect(canTransition(from, to), `${from} -> ${to}`).toBe(j > i)
      })
    })
  })

  it('lets any status go to problem or closed (except onto itself)', () => {
    for (const from of MAIL_IN_STATUSES) {
      expect(canTransition(from, 'problem'), `${from} -> problem`).toBe(from !== 'problem')
      expect(canTransition(from, 'closed'), `${from} -> closed`).toBe(from !== 'closed')
    }
  })

  it('lets problem return to any pipeline status', () => {
    for (const to of PIPELINE_STATUSES) expect(canTransition('problem', to)).toBe(true)
  })

  it('only reopens a closed kit into problem', () => {
    expect(validNextStatuses('closed')).toEqual(['problem'])
  })

  it('offers next moves in pipeline order, then problem, then closed', () => {
    expect(validNextStatuses('delivered')).toEqual(['checked_in', 'paid', 'problem', 'closed'])
    expect(validNextStatuses('paid')).toEqual(['problem', 'closed'])
  })
})

describe('payout methods', () => {
  it('has a human label for each method', () => {
    expect(PAYOUT_METHODS.map((m) => PAYOUT_METHOD_LABELS[m])).toEqual(['Zelle', 'Cash App', 'Venmo', 'ACH', 'Wire', 'Check'])
  })
})

describe('token and order number', () => {
  it('generates a 64-hex-character token that does not repeat', () => {
    const tokens = new Set(Array.from({ length: 200 }, generateToken))
    expect(tokens.size).toBe(200)
    for (const token of tokens) expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates MK- order numbers without ambiguous letters', () => {
    for (let i = 0; i < 500; i++) {
      const orderNumber = generateOrderNumber()
      expect(orderNumber).toMatch(ORDER_NUMBER_PATTERN)
      expect(orderNumber.slice(3)).not.toMatch(/[ILOU]/)
    }
  })

  it('stripToken removes the token and nothing else', () => {
    expect(stripToken({ id: '1', token: 'secret', name: 'A' })).toEqual({ id: '1', name: 'A' })
  })
})

describe('parseCreateInput', () => {
  it('accepts a minimal kit and normalizes contact details', () => {
    const parsed = parseCreateInput({ name: '  Pat Seller ', phone: '(518) 555-0100', email: ' Pat@Example.COM ' })
    expect(parsed).toEqual({
      ok: true,
      value: { name: 'Pat Seller', phone: '5185550100', email: 'pat@example.com', expected_items: [] },
    })
  })

  it('requires a phone or an email', () => {
    expect(parseCreateInput({ name: 'Pat' })).toEqual({ ok: false, error: 'A phone number or an email is required' })
    expect(parseCreateInput({ name: 'Pat', phone: '', email: '  ' }).ok).toBe(false)
    expect(parseCreateInput({ email: 'pat@example.com' }).ok).toBe(true)
  })

  it.each([
    [null],
    ['text'],
    [[]],
  ])('rejects a non-object body: %j', (body) => {
    expect(parseCreateInput(body)).toEqual({ ok: false, error: 'Invalid request' })
  })

  it.each([
    [{ phone: '555' }, /Phone/],
    [{ email: 'not-an-email' }, /Email/],
    [{ phone: '5185550100', state: 'New York' }, /State/],
    [{ phone: '5185550100', zip: '1234' }, /ZIP/],
    [{ phone: '5185550100', payout_method: 'paypal' }, /Payout method/],
    [{ phone: '5185550100', quoted_amount: -1 }, /negative/],
    [{ phone: '5185550100', quoted_amount: 10.005 }, /two decimal/],
    [{ phone: '5185550100', quoted_amount: 'abc' }, /number/],
    [{ phone: '5185550100', lead_id: 'nope' }, /UUID/],
    [{ phone: '5185550100', name: 'x'.repeat(121) }, /too long/],
    [{ phone: '5185550100', expected_items: 'boxes' }, /list/],
    [{ phone: '5185550100', expected_items: [{ product: '', boxes: 1 }] }, /product/],
    [{ phone: '5185550100', expected_items: [{ product: 'Contour', boxes: 0 }] }, /whole number/],
    [{ phone: '5185550100', expected_items: [{ product: 'Contour', boxes: 1.5 }] }, /whole number/],
    [{ phone: '5185550100', expected_items: [{ product: 'Contour', boxes: '2' }] }, /whole number/],
  ])('rejects %j', (body, message) => {
    const parsed = parseCreateInput(body)
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toMatch(message)
  })

  it('accepts amounts as numbers or numeric strings and keeps two decimals', () => {
    const a = parseCreateInput({ phone: '5185550100', quoted_amount: '125.50' })
    const b = parseCreateInput({ phone: '5185550100', quoted_amount: 80 })
    expect(a.ok && a.value.quoted_amount).toBe(125.5)
    expect(b.ok && b.value.quoted_amount).toBe(80)
  })

  it('ignores fields it does not know, including status and token', () => {
    const parsed = parseCreateInput({ phone: '5185550100', status: 'paid', token: 'x', order_number: 'MK-1', paid_amount: 5 })
    expect(parsed).toEqual({ ok: true, value: { phone: '5185550100', expected_items: [] } })
  })
})

describe('planOrderPatch', () => {
  it('moves forward, stamps the milestone once, and records the move', () => {
    const plan = planOrderPatch(snapshot(), patchOf({ status: 'kit_sent' }), NOW)
    expect(plan).toEqual({
      ok: true,
      value: {
        update: { status: 'kit_sent', kit_sent_at: NOW.toISOString(), updated_at: NOW.toISOString() },
        events: [{ type: 'status_changed', detail: { from: 'quote_agreed', to: 'kit_sent' } }],
      },
    })
  })

  it('does not overwrite a milestone that is already stamped', () => {
    const plan = planOrderPatch(
      snapshot({ status: 'problem', problem_reason: 'x', delivered_at: '2026-09-01T00:00:00.000Z' }),
      patchOf({ status: 'delivered' }),
      NOW
    )
    expect(plan.ok && 'delivered_at' in plan.value.update).toBe(false)
  })

  it('never stamps first_scan_at from a manual move', () => {
    const plan = planOrderPatch(snapshot({ status: 'label_made' }), patchOf({ status: 'in_transit' }), NOW)
    expect(plan.ok && Object.keys(plan.value.update).sort()).toEqual(['status', 'updated_at'])
  })

  it('refuses a backward move', () => {
    const plan = planOrderPatch(snapshot({ status: 'delivered' }), patchOf({ status: 'kit_sent' }), NOW)
    expect(plan).toEqual({ ok: false, error: 'Cannot move a kit from Delivered to Kit sent' })
  })

  it('requires a reason to enter problem, and clears it on the way out', () => {
    expect(planOrderPatch(snapshot(), patchOf({ status: 'problem' }), NOW)).toEqual({ ok: false, error: 'A problem reason is required' })
    expect(planOrderPatch(snapshot(), patchOf({ status: 'problem', problem_reason: '   ' }), NOW).ok).toBe(false)

    const into = planOrderPatch(snapshot({ status: 'delivered' }), patchOf({ status: 'problem', problem_reason: 'Count mismatch' }), NOW)
    expect(into.ok && into.value.update.problem_reason).toBe('Count mismatch')
    expect(into.ok && into.value.events[0].detail).toEqual({ from: 'delivered', to: 'problem', problem_reason: 'Count mismatch' })

    const out = planOrderPatch(snapshot({ status: 'problem', problem_reason: 'Count mismatch' }), patchOf({ status: 'checked_in' }), NOW)
    expect(out.ok && out.value.update.problem_reason).toBeNull()
  })

  it('accepts received items when checking in', () => {
    const plan = planOrderPatch(
      snapshot({ status: 'delivered' }),
      patchOf({ status: 'checked_in', received_items: [{ product: 'Contour NEXT 100ct', boxes: 4 }] }),
      NOW
    )
    expect(plan.ok && plan.value.update).toMatchObject({
      status: 'checked_in',
      checked_in_at: NOW.toISOString(),
      received_items: [{ product: 'Contour NEXT 100ct', boxes: 4 }],
    })
  })

  it('refuses received items on a kit that has not arrived', () => {
    const plan = planOrderPatch(snapshot({ status: 'kit_sent' }), patchOf({ received_items: [{ product: 'Contour', boxes: 1 }] }), NOW)
    expect(plan.ok).toBe(false)
  })

  it('requires an amount and a payout method to mark paid, and stamps paid_at', () => {
    const from = snapshot({ status: 'checked_in' })
    expect(planOrderPatch(from, patchOf({ status: 'paid' }), NOW).ok).toBe(false)
    expect(planOrderPatch(from, patchOf({ status: 'paid', paid_amount: 0, payout_method: 'zelle' }), NOW).ok).toBe(false)
    expect(planOrderPatch(from, patchOf({ status: 'paid', paid_amount: 120 }), NOW)).toEqual({
      ok: false,
      error: 'Payout method is required before a kit can be marked paid',
    })

    const withMethodInPatch = planOrderPatch(from, patchOf({ status: 'paid', paid_amount: '120.00', payout_method: 'zelle' }), NOW)
    expect(withMethodInPatch.ok && withMethodInPatch.value.update).toEqual({
      payout_method: 'zelle',
      paid_amount: 120,
      paid_at: NOW.toISOString(),
      status: 'paid',
      updated_at: NOW.toISOString(),
    })

    const withMethodOnRow = planOrderPatch(snapshot({ status: 'checked_in', payout_method: 'venmo' }), patchOf({ status: 'paid', paid_amount: 45.5 }), NOW)
    expect(withMethodOnRow.ok).toBe(true)
  })

  it('refuses a paid amount that is not part of a move to paid', () => {
    expect(planOrderPatch(snapshot({ status: 'delivered' }), patchOf({ paid_amount: 50 }), NOW).ok).toBe(false)
  })

  it('records which fields changed but never the payout handle or the notes', () => {
    const plan = planOrderPatch(
      snapshot({ name: 'Pat' }),
      patchOf({ name: 'Pat Seller', payout_handle: 'pat@example.com', internal_notes: 'called twice' }),
      NOW
    )
    expect(plan.ok && plan.value.events).toEqual([
      { type: 'fields_updated', detail: { fields: ['name', 'payout_handle', 'internal_notes'], values: { name: 'Pat Seller' } } },
    ])
    expect(JSON.stringify(plan.ok && plan.value.events)).not.toContain('pat@example.com')
  })

  it('ignores values that did not change, and says so when nothing is left', () => {
    expect(planOrderPatch(snapshot(), patchOf({ phone: '518-555-0100' }), NOW)).toEqual({ ok: false, error: 'Nothing to change' })
    expect(planOrderPatch(snapshot(), patchOf({ status: 'quote_agreed' }), NOW)).toEqual({ ok: false, error: 'Nothing to change' })
  })

  it('refuses an edit that would leave no way to reach the seller', () => {
    expect(planOrderPatch(snapshot(), patchOf({ phone: '' }), NOW)).toEqual({ ok: false, error: 'A phone number or an email is required' })
    expect(planOrderPatch(snapshot(), patchOf({ phone: '', email: 'pat@example.com' }), NOW).ok).toBe(true)
  })
})

describe('parsePatchInput', () => {
  it('rejects an unknown status', () => {
    const parsed = parsePatchInput({ status: 'shipped' })
    expect(parsed.ok).toBe(false)
  })
})

describe('summary', () => {
  it('combines kit_sent and label_made into kits out', () => {
    const counts = countByStatus([
      { status: 'kit_sent' }, { status: 'label_made' }, { status: 'label_made' }, { status: 'in_transit' },
      { status: 'delivered' }, { status: 'checked_in' }, { status: 'problem' }, { status: 'paid' }, { status: 'closed' },
    ])
    expect(summarize(counts, 7)).toEqual({
      kitsOut: 3, inTransit: 1, deliveredNotCheckedIn: 1, checkedInNotPaid: 1, problems: 1, paidThisMonth: 7,
    })
  })

  it('starts the month at New York midnight, in daylight and standard time', () => {
    expect(monthStartIso(new Date('2026-09-20T15:00:00Z'))).toBe('2026-09-01T04:00:00.000Z')
    expect(monthStartIso(new Date('2026-12-15T15:00:00Z'))).toBe('2026-12-01T05:00:00.000Z')
    // 01:00 UTC on Oct 1 is still Sept 30 in New York.
    expect(monthStartIso(new Date('2026-10-01T01:00:00Z'))).toBe('2026-09-01T04:00:00.000Z')
  })

  it('totals boxes and ages cards', () => {
    expect(totalBoxes([{ product: 'a', boxes: 2 }, { product: 'b', boxes: 5 }])).toBe(7)
    expect(totalBoxes(null)).toBe(0)
    expect(ageInDays('2026-09-17T16:00:00.000Z', NOW)).toBe(2)
    expect(ageInDays('2026-09-21T00:00:00.000Z', NOW)).toBe(0)
  })
})

describe('sanitizeSearch', () => {
  it('strips everything that has meaning inside a PostgREST or() filter', () => {
    expect(sanitizeSearch('pat),status.eq.paid,(name.ilike.%*')).toBe('pat status.eq.paid name.ilike.')
    expect(sanitizeSearch('  MK-7G2K9Q ')).toBe('MK-7G2K9Q')
    expect(sanitizeSearch('%%%')).toBe('')
  })
})
