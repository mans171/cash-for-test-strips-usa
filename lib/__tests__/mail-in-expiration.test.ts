import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { getExpirationMonthOptions, monthsFromNowToYYYYMM } from '../expiration'
import {
  EXPIRATION_BUCKET_VALUES,
  expirationChoices,
  expirationText,
  parseCreateInput,
  parseExpiration,
  parseItems,
  parsePatchInput,
  parseSellerInput,
  planOrderPatch,
  toSellerView,
  totalBoxes,
  type MailInOrder,
} from '../mail-in'
import { VALID_STATE_CODES } from '../states'

const NOW = new Date(2026, 8, 20, 11, 0, 0) // 20 Sep 2026, local time

const seller = (expected_items: unknown) => ({
  name: 'Pat Seller',
  phone: '(518) 555-0100',
  street1: '12 Elm St',
  city: 'Columbus',
  state: 'OH',
  zip: '43004',
  expected_items,
  payout_method: 'check',
})

describe('expirationChoices — the same options /sell offers, stored the way /sell stores them', () => {
  const choices = expirationChoices(NOW)
  const sellOptions = getExpirationMonthOptions(NOW)

  it('keeps every /sell label, unchanged and in order', () => {
    expect(choices.map((c) => c.label)).toEqual(sellOptions.map((o) => o.label))
  })

  it('stores YYYY-MM for a calendar month and the label itself for the two buckets', () => {
    // Mirrors SellFlowClient.selectMonths: 0 and 25 keep their label.
    expect(choices[0].value).toBe(sellOptions[0].label)
    expect(choices[choices.length - 1].value).toBe(sellOptions[sellOptions.length - 1].label)
    expect(choices[1].value).toBe('2026-10')
    expect(choices[4].value).toBe(monthsFromNowToYYYYMM(4, NOW))
    expect(choices[24].value).toBe('2028-09')
    expect(EXPIRATION_BUCKET_VALUES).toEqual([choices[0].value, choices[choices.length - 1].value])
  })

  it('every choice passes the parser', () => {
    for (const choice of choices) expect(parseExpiration(choice.value, 'x')).toEqual({ ok: true, value: choice.value })
  })
})

describe('parseExpiration / parseItems', () => {
  it.each([undefined, null, '', '   '])('treats %j as not given', (raw) => {
    expect(parseExpiration(raw, 'x')).toEqual({ ok: true, value: undefined })
  })

  it.each(['2027-13', '2027-00', '27-01', '2027-1', '2027-01-15', 'soon', '<script>', 'Already expired', 202701, {}, ['2027-01'], true])(
    'rejects %j',
    (raw) => {
      expect(parseExpiration(raw, 'x').ok).toBe(false)
    }
  )

  it('rejects an over-long value before looking at it', () => {
    expect(parseExpiration('2027-01' + ' '.repeat(100), 'x').ok).toBe(false)
    expect(parseExpiration('9'.repeat(5000), 'x').ok).toBe(false)
  })

  it('an item without the field round-trips with no expiration key', () => {
    const parsed = parseItems([{ product: 'Contour NEXT 100ct', boxes: 4 }, { product: 'B', boxes: 1, expiration: '' }], 'Items')
    expect(parsed).toEqual({ ok: true, value: [{ product: 'Contour NEXT 100ct', boxes: 4 }, { product: 'B', boxes: 1 }] })
    expect(parsed.ok && parsed.value.every((item) => !('expiration' in item))).toBe(true)
  })

  it('keeps a valid month and drops unknown item keys', () => {
    const parsed = parseItems([{ product: 'A', boxes: 2, expiration: ' 2027-01 ', price: 99 }], 'Items')
    expect(parsed).toEqual({ ok: true, value: [{ product: 'A', boxes: 2, expiration: '2027-01' }] })
  })

  it('fails the whole list on one junk month', () => {
    expect(parseItems([{ product: 'A', boxes: 2, expiration: 'junk' }], 'Items')).toEqual({ ok: false, error: 'Items: expiration month is not valid' })
  })
})

describe('parseSellerInput — only what the select can produce', () => {
  it('accepts blank, a month on the list, and both buckets', () => {
    const items = [
      { product: 'A', boxes: 1 },
      { product: 'B', boxes: 1, expiration: '' },
      { product: 'C', boxes: 3, expiration: '2027-01' },
      { product: 'D', boxes: 1, expiration: EXPIRATION_BUCKET_VALUES[0] },
      { product: 'E', boxes: 1, expiration: EXPIRATION_BUCKET_VALUES[1] },
    ]
    const parsed = parseSellerInput(seller(items), VALID_STATE_CODES, NOW)
    expect(parsed.ok && parsed.value.expected_items).toEqual([
      { product: 'A', boxes: 1 },
      { product: 'B', boxes: 1 },
      { product: 'C', boxes: 3, expiration: '2027-01' },
      { product: 'D', boxes: 1, expiration: EXPIRATION_BUCKET_VALUES[0] },
      { product: 'E', boxes: 1, expiration: EXPIRATION_BUCKET_VALUES[1] },
    ])
  })

  it('accepts every option the form renders today', () => {
    const items = expirationChoices(NOW).map((c, i) => ({ product: `P${i}`, boxes: 1, expiration: c.value }))
    expect(parseSellerInput(seller(items), VALID_STATE_CODES, NOW).ok).toBe(true)
  })

  it.each(['1999-01', '2035-06', 'junk', '2027-01; drop table', 'x'.repeat(41)])('refuses %j with a 400-worthy error', (expiration) => {
    const parsed = parseSellerInput(seller([{ product: 'A', boxes: 1, expiration }]), VALID_STATE_CODES, NOW)
    expect(parsed).toEqual({ ok: false, error: 'Expected items: expiration month is not valid' })
  })

  it('never blocks a submission that leaves every month blank', () => {
    expect(parseSellerInput(seller([{ product: 'A', boxes: 1 }]), VALID_STATE_CODES, NOW).ok).toBe(true)
  })
})

describe('admin create + check-in', () => {
  it('a new kit may carry the month; a month from an older kit is still accepted', () => {
    const parsed = parseCreateInput({ phone: '5185550100', expected_items: [{ product: 'A', boxes: 2, expiration: '2027-01' }, { product: 'B', boxes: 1, expiration: '2025-03' }, { product: 'C', boxes: 1 }] })
    expect(parsed.ok && parsed.value.expected_items).toEqual([{ product: 'A', boxes: 2, expiration: '2027-01' }, { product: 'B', boxes: 1, expiration: '2025-03' }, { product: 'C', boxes: 1 }])
    expect(parseCreateInput({ phone: '5185550100', expected_items: [{ product: 'A', boxes: 2, expiration: 'junk' }] }).ok).toBe(false)
  })

  it('received items may carry it at check-in', () => {
    const patch = parsePatchInput({ status: 'checked_in', received_items: [{ product: 'A', boxes: 2, expiration: '2027-01' }] })
    expect(patch.ok).toBe(true)
    if (!patch.ok) return
    const plan = planOrderPatch(
      { status: 'delivered', phone: '5185550100', email: null, payout_method: null, paid_amount: null, problem_reason: null, received_items: null },
      patch.value,
      new Date('2026-09-20T15:00:00.000Z')
    )
    expect(plan.ok && plan.value.update.received_items).toEqual([{ product: 'A', boxes: 2, expiration: '2027-01' }])
    expect(parsePatchInput({ received_items: [{ product: 'A', boxes: 2, expiration: 'junk' }] }).ok).toBe(false)
  })

  it('totalBoxes is unaffected', () => {
    expect(totalBoxes([{ product: 'A', boxes: 2, expiration: '2027-01' }, { product: 'B', boxes: 3 }])).toBe(5)
  })
})

describe('display + seller view', () => {
  it('says "exp <value>" or nothing', () => {
    expect(expirationText({ expiration: '2027-01' })).toBe('exp 2027-01')
    expect(expirationText({})).toBe('')
    expect(expirationText({ expiration: '' })).toBe('')
    expect(expirationText({ expiration: '<b>x</b>' })).toBe('')
  })

  it('the seller view carries expiration inside an item and nothing else new', () => {
    const row = {
      order_number: 'MK-7G2K9Q', name: 'Pat', status: 'awaiting_quote', created_at: '2026-09-20T12:00:00.000Z',
      expected_items: [
        { product: 'A', boxes: 2, expiration: '2027-01', price: 'PRICE-SENTINEL', note: 'NOTE-SENTINEL' },
        { product: 'B', boxes: 1 },
        { product: 'C', boxes: 1, expiration: 'JUNK-SENTINEL' },
      ],
    } as unknown as MailInOrder
    const view = toSellerView(row)
    expect(view.expected_items).toEqual([{ product: 'A', boxes: 2, expiration: '2027-01' }, { product: 'B', boxes: 1 }, { product: 'C', boxes: 1 }])
    const json = JSON.stringify(view)
    for (const secret of ['PRICE-SENTINEL', 'NOTE-SENTINEL', 'JUNK-SENTINEL']) expect(json).not.toContain(secret)
  })
})

describe('wording — the form only asks', () => {
  // Every mail-in surface touched by this field. Comments are stripped so the
  // rule is about what a person can read on screen or in the alert email.
  const FILES = ['app/mail-in-kit/MailInKitForm.tsx', 'app/kit/[token]/page.tsx', 'app/api/mail-in/route.ts', 'app/admin/MailInTab.tsx']
  const BANNED = [/unexpired/i, /\bin date\b/i, /expired/i, /years? past/i, /short[- ]dated/i, /must not be/i, /insulin/i, /prescription/i, /\bRx\b/, /medicare/i, /medicaid/i]

  it.each(FILES)('%s says nothing about date condition', (file) => {
    const code = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    for (const pattern of BANNED) expect(code, `${file}: ${pattern}`).not.toMatch(pattern)
  })

  it('the form labels the select exactly, with a blank first option and no default', () => {
    const form = readFileSync('app/mail-in-kit/MailInKitForm.tsx', 'utf8')
    expect(form).toContain('>Expiration month (optional)</label>')
    expect(form).toContain('<option value="">Not sure</option>')
    expect(form).not.toContain('DEFAULT_EXPIRATION_MONTHS')
  })
})
