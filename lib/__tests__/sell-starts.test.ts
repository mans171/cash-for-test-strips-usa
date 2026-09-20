import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { VALID_STATE_CODES } from '../states'
import {
  ADMIN_STARTS_CAP,
  ageLabel,
  displayPhone,
  followUpSmsBody,
  followUpSmsHref,
  isTenDigitPhone,
  parseSellStartAdminInput,
  parseSellStartInput,
  phoneDigits,
  selectOpenStarts,
  startSignature,
  summarizeItems,
  type SellStartRow,
} from '../sell-starts'

const item = { brand: 'Accu-Chek — Guide 100ct', count: 3, expiration: '2027-06', condition: 'sealed' }
const valid = { phone: '(518) 555-0100', name: ' Pat ', state: 'NY', items: [item] }

describe('phoneDigits / isTenDigitPhone', () => {
  it('keeps digits only and drops a US leading 1', () => {
    expect(phoneDigits('(518) 555-0100')).toBe('5185550100')
    expect(phoneDigits('+1 518.555.0100')).toBe('5185550100')
    expect(phoneDigits(undefined)).toBe('')
    expect(phoneDigits(5185550100)).toBe('')
  })
  it('requires exactly ten digits on the form', () => {
    expect(isTenDigitPhone('518-555-0100')).toBe(true)
    expect(isTenDigitPhone('1 518-555-0100')).toBe(true)
    expect(isTenDigitPhone('555-0100')).toBe(false)
    expect(isTenDigitPhone('')).toBe(false)
    expect(isTenDigitPhone('44 20 7946 0958 1')).toBe(false)
  })
})

describe('parseSellStartInput (strict whitelist)', () => {
  it('accepts a good body and rebuilds it from known fields only', () => {
    const parsed = parseSellStartInput(
      { ...valid, completed_at: '2026-01-01', dismissed_at: 'x', admin_note: 'mine', id: 'abc', items: [{ ...item, evil: true }] },
      VALID_STATE_CODES
    )
    expect(parsed).toEqual({ ok: true, value: { phone: '5185550100', name: 'Pat', state: 'NY', items: [item] } })
  })
  it('name is optional', () => {
    const parsed = parseSellStartInput({ ...valid, name: undefined }, VALID_STATE_CODES)
    expect(parsed.ok && parsed.value.name).toBe(null)
  })
  it.each([
    ['no phone', { ...valid, phone: '' }],
    ['short phone', { ...valid, phone: '555-0100' }],
    ['16-digit phone', { ...valid, phone: '1234567890123456' }],
    ['phone not a string', { ...valid, phone: 5185550100 }],
    ['junk state', { ...valid, state: 'ZZ' }],
    ['lowercase state', { ...valid, state: 'ny' }],
    ['state not a string', { ...valid, state: ['NY'] }],
    ['no items', { ...valid, items: [] }],
    ['items not an array', { ...valid, items: 'lots' }],
    ['21 items', { ...valid, items: Array.from({ length: 21 }, () => item) }],
    ['oversized brand', { ...valid, items: [{ ...item, brand: 'x'.repeat(161) }] }],
    ['empty brand', { ...valid, items: [{ ...item, brand: '  ' }] }],
    ['zero count', { ...valid, items: [{ ...item, count: 0 }] }],
    ['fractional count', { ...valid, items: [{ ...item, count: 1.5 }] }],
    ['huge count', { ...valid, items: [{ ...item, count: 10000 }] }],
    ['bad condition', { ...valid, items: [{ ...item, condition: 'opened' }] }],
    ['oversized expiration', { ...valid, items: [{ ...item, expiration: 'x'.repeat(41) }] }],
    ['oversized name', { ...valid, name: 'x'.repeat(81) }],
    ['name not a string', { ...valid, name: { first: 'Pat' } }],
    ['array body', [valid]],
    ['null body', null],
  ])('rejects %s', (_label, body) => {
    expect(parseSellStartInput(body, VALID_STATE_CODES).ok).toBe(false)
  })
  it('accepts exactly 20 items', () => {
    expect(parseSellStartInput({ ...valid, items: Array.from({ length: 20 }, () => item) }, VALID_STATE_CODES).ok).toBe(true)
  })
})

describe('parseSellStartAdminInput', () => {
  const now = '2026-09-20T15:00:00.000Z'
  it('maps contacted / dismissed to timestamps and trims the note', () => {
    expect(parseSellStartAdminInput({ contacted: true }, now)).toEqual({ ok: true, value: { contacted_at: now } })
    expect(parseSellStartAdminInput({ contacted: false, dismissed: true, admin_note: ' called ' }, now)).toEqual({
      ok: true,
      value: { contacted_at: null, dismissed_at: now, admin_note: 'called' },
    })
  })
  it.each([
    ['an unknown field', { contacted: true, phone: '5185550199' }],
    ['a completion attempt', { completed_at: now }],
    ['an empty body', {}],
    ['a non-boolean', { dismissed: 'yes' }],
    ['a huge note', { admin_note: 'x'.repeat(1001) }],
    ['a non-object', 'contacted'],
  ])('rejects %s', (_label, body) => {
    expect(parseSellStartAdminInput(body, now).ok).toBe(false)
  })
})

describe('follow-up text', () => {
  it('is exactly the approved wording, with and without a name', () => {
    expect(followUpSmsBody('Pat')).toBe(
      'Hi, Pat, this is Cash For Test Strips USA. You started listing your supplies on our site. Want a quote? Reply here with a photo of the boxes.'
    )
    for (const blank of [null, undefined, '', '   ']) {
      expect(followUpSmsBody(blank)).toBe(
        'Hi, this is Cash For Test Strips USA. You started listing your supplies on our site. Want a quote? Reply here with a photo of the boxes.'
      )
    }
  })
  it('builds a correctly URL-encoded sms: link', () => {
    const href = followUpSmsHref('(518) 555-0100', "D'Arcy & Co?")
    expect(href.startsWith('sms:5185550100?body=')).toBe(true)
    const encoded = href.slice('sms:5185550100?body='.length)
    // Nothing that would end or split the body survives unencoded.
    expect(encoded).not.toMatch(/[ &?#,]/)
    expect(encoded).toContain('%20')
    expect(encoded).toContain('%26')
    expect(encoded).toContain('%3F')
    expect(decodeURIComponent(encoded)).toBe(followUpSmsBody("D'Arcy & Co?"))
    expect(followUpSmsHref('5185550100', null)).toBe(
      'sms:5185550100?body=Hi%2C%20this%20is%20Cash%20For%20Test%20Strips%20USA.%20You%20started%20listing%20your%20supplies%20on%20our%20site.%20Want%20a%20quote%3F%20Reply%20here%20with%20a%20photo%20of%20the%20boxes.'
    )
  })
})

describe('row display', () => {
  it('summarizes items and tolerates junk', () => {
    expect(summarizeItems([item, { brand: 'Dexcom — G7', count: 2 }])).toBe('3 × Accu-Chek — Guide 100ct, 2 × Dexcom — G7')
    expect(summarizeItems([null, 4, { brand: '' }, { brand: 'Contour', count: 'x' }])).toBe('1 × Contour')
    expect(summarizeItems('nope')).toBe('')
  })
  it('labels age', () => {
    const now = Date.parse('2026-09-20T12:00:00Z')
    expect(ageLabel('2026-09-20T11:59:40Z', now)).toBe('just now')
    expect(ageLabel('2026-09-20T11:55:00Z', now)).toBe('5m ago')
    expect(ageLabel('2026-09-20T10:00:00Z', now)).toBe('2h ago')
    expect(ageLabel('2026-09-17T11:00:00Z', now)).toBe('3d ago')
    expect(ageLabel('garbage', now)).toBe('just now')
  })
  it('formats a phone for display', () => {
    expect(displayPhone('5185550100')).toBe('(518) 555-0100')
    expect(displayPhone('442079460958')).toBe('442079460958')
  })
})

describe('startSignature (duplicate guard)', () => {
  it('is stable across phone formatting and changes with the phone or the items', () => {
    const base = startSignature('(518) 555-0100', [item])
    expect(startSignature('518-555-0100', [item])).toBe(base)
    expect(startSignature('518-555-0199', [item])).not.toBe(base)
    expect(startSignature('518-555-0100', [{ ...item, count: 4 }])).not.toBe(base)
  })
})

describe('selectOpenStarts', () => {
  const now = Date.parse('2026-09-20T12:00:00Z')
  const row = (overrides: Partial<SellStartRow>): SellStartRow => ({
    id: 'id', phone: '5185550100', name: null, state: 'NY', items: [], created_at: '2026-09-20T10:00:00Z',
    completed_at: null, contacted_at: null, dismissed_at: null, admin_note: null, ...overrides,
  })

  it('drops completed, dismissed, recently-converted and long-contacted rows; newest first', () => {
    const out = selectOpenStarts(
      [
        row({ id: 'older', phone: '5185550101', created_at: '2026-09-19T10:00:00Z' }),
        row({ id: 'newer', phone: '5185550102', created_at: '2026-09-20T11:00:00Z' }),
        row({ id: 'completed', phone: '5185550103', completed_at: '2026-09-20T11:00:00Z' }),
        row({ id: 'dismissed', phone: '5185550104', dismissed_at: '2026-09-20T11:00:00Z' }),
        row({ id: 'converted', phone: '5185550105' }),
        row({ id: 'converted-long-ago', phone: '5185550106' }),
        row({ id: 'contacted-recently', phone: '5185550107', contacted_at: '2026-09-14T12:00:01Z', created_at: '2026-09-10T10:00:00Z' }),
        row({ id: 'contacted-8-days-ago', phone: '5185550108', contacted_at: '2026-09-12T12:00:00Z' }),
      ],
      [
        { phone: '(518) 555-0105', created_at: '2026-09-01T00:00:00Z' },
        { phone: '+1 518 555 0106', created_at: '2026-08-01T00:00:00Z' },
        { phone: null, created_at: '2026-09-19T00:00:00Z' },
      ],
      now
    )
    expect(out.map((r) => r.id)).toEqual(['newer', 'converted-long-ago', 'older', 'contacted-recently'])
    // completed_at / dismissed_at are not part of what the page receives.
    expect(Object.keys(out[0]).sort()).toEqual(['admin_note', 'contacted_at', 'created_at', 'id', 'items', 'name', 'phone', 'state'])
  })

  it('caps the list at 200', () => {
    const many = Array.from({ length: 260 }, (_, i) => row({ id: `s${i}`, phone: String(5180000000 + i) }))
    expect(selectOpenStarts(many, [], now)).toHaveLength(ADMIN_STARTS_CAP)
    expect(ADMIN_STARTS_CAP).toBe(200)
  })
})

describe('sell_starts migration', () => {
  const dir = join(process.cwd(), 'supabase', 'migrations')
  const file = readdirSync(dir).find((name) => name.endsWith('_sell_starts.sql'))
  const sql = file ? readFileSync(join(dir, file), 'utf8') : ''
  // Comments explain the rules in words; the assertions are about statements.
  const statements = sql.replace(/--.*$/gm, '').toLowerCase()

  it('sorts after the last mail-in migration', () => {
    expect(file).toBeDefined()
    expect(file! > '20260920130000_mail_in_stage2.sql').toBe(true)
  })
  it('enables RLS, adds NO policy, and revokes anon + authenticated', () => {
    expect(statements).toMatch(/alter table public\.sell_starts enable row level security/)
    expect(statements).not.toMatch(/create\s+policy/)
    expect(statements).toMatch(/revoke all on table public\.sell_starts from anon, authenticated/)
    expect(statements).not.toMatch(/\bgrant\b/)
  })
  it('is purely additive', () => {
    expect(statements).not.toMatch(/\b(drop|alter table (?!public\.sell_starts enable row level security)|truncate|delete from|update )\b/)
    expect(statements).toMatch(/create table if not exists public\.sell_starts/)
    expect(statements).toMatch(/completed_lead_id uuid references public\.leads \(id\) on delete set null/)
    expect(statements).toMatch(/jsonb_typeof\(items\) = 'array'/)
  })
})
