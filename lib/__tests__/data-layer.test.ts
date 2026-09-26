import { describe, it, expect, afterEach, vi } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import {
  META_EVENTS,
  productCategoryCode,
  pushEvent,
  stripPii,
  type TrackingEvent,
} from '@/lib/data-layer'

/**
 * One example of every event, exactly as the site pushes it. A new event
 * added to the TrackingEvent union without a line here fails the type check
 * (`satisfies Record<…>`), so the PII and health-term checks below always
 * cover the whole list.
 */
const EXAMPLES = {
  sell_start: { event: 'sell_start' },
  sell_product_selected: { event: 'sell_product_selected', product_category: 'test_strips', item_number: 1 },
  sell_phone_captured: { event: 'sell_phone_captured' },
  sell_buyers_shown: { event: 'sell_buyers_shown', buyer_count: 3, mail_in_offered: false, state: 'OH' },
  lead_submit: { event: 'lead_submit', event_id: 'a3f1c2d4-0000-4000-8000-000000000001', lead_type: 'sell', channel: 'sms', item_count: 2 },
  mail_kit_start: { event: 'mail_kit_start' },
  mail_kit_step: { event: 'mail_kit_step', step: 2 },
  mail_kit_request: { event: 'mail_kit_request', event_id: 'b3f1c2d4-0000-4000-8000-000000000002', lead_type: 'mail_kit', item_count: 1 },
  bulk_form_start: { event: 'bulk_form_start' },
  bulk_lead_submit: { event: 'bulk_lead_submit', event_id: 'c3f1c2d4-0000-4000-8000-000000000003', lead_type: 'bulk' },
  contact_click: { event: 'contact_click', method: 'call', target: 'house' },
  sign_up: { event: 'sign_up', role: 'buyer' },
} as const satisfies { [K in TrackingEvent['event']]: Extract<TrackingEvent, { event: K }> }

const PII_KEYS = /phone|email|name|address|street|city|zip|handle|payout|message|note|details|user_data/i
// Words Meta treats as health data. None may appear in an event name, and none
// in any parameter of an event a Meta tag fires on.
const HEALTH_TERMS = /diabet|insulin|glucose|strip|cgm|dexcom|libre|omnipod|lancet|infusion|pump|sensor|prescri|medic|health|a1c|meter/i

type Pushed = Record<string, unknown>
function withDataLayer(fn: (layer: Pushed[]) => void) {
  const layer: Pushed[] = []
  vi.stubGlobal('window', { dataLayer: layer })
  fn(layer)
}

describe('dataLayer events', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses stable snake_case names', () => {
    for (const name of Object.keys(EXAMPLES)) expect(name).toMatch(/^[a-z]+(_[a-z]+)*$/)
  })

  it('carries no PII-shaped key in any event', () => {
    for (const e of Object.values(EXAMPLES)) {
      for (const key of Object.keys(e)) expect(key, `${e.event}.${key}`).not.toMatch(PII_KEYS)
    }
  })

  it('puts no health term in any event name', () => {
    for (const name of Object.keys(EXAMPLES)) expect(name).not.toMatch(HEALTH_TERMS)
  })

  it('gives the Meta-bound events an event_id and nothing product-related', () => {
    for (const name of META_EVENTS) {
      const e = EXAMPLES[name] as Record<string, unknown>
      expect(typeof e.event_id).toBe('string')
      expect(Object.keys(e)).not.toContain('product_category')
      for (const [key, value] of Object.entries(e)) {
        if (key === 'event_id') continue
        expect(`${key}=${String(value)}`).not.toMatch(HEALTH_TERMS)
      }
    }
  })

  it('pushes the event exactly as typed, event_id intact', () => {
    withDataLayer((layer) => {
      pushEvent(EXAMPLES.lead_submit)
      expect(layer).toEqual([EXAMPLES.lead_submit])
    })
  })

  it('pushes every example unchanged: the PII filter never eats a legitimate param', () => {
    withDataLayer((layer) => {
      for (const e of Object.values(EXAMPLES)) pushEvent(e)
      expect(layer).toEqual(Object.values(EXAMPLES))
    })
  })

  it('does nothing when Tag Manager is not loaded', () => {
    vi.stubGlobal('window', {})
    expect(() => pushEvent(EXAMPLES.sell_start)).not.toThrow()
  })

  it('does nothing on the server', () => {
    expect(typeof window).toBe('undefined')
    expect(() => pushEvent(EXAMPLES.sell_start)).not.toThrow()
  })
})

describe('stripPii', () => {
  it('drops contact-data keys, phone- and email-shaped values, and nested objects', () => {
    expect(
      stripPii({
        phone: '5185550100',
        customer_email: 'x@example.com',
        first_name: 'Jane',
        note: 'hi',
        user_data: { phone_number: '+15185550100' },
        label: 'call me at 518-555-0100',
        other: 'pat@example.com',
        state: 'OH',
        buyer_count: 2,
        event_id: 'a3f1c2d4-0000-4000-8000-000000000001',
      })
    ).toEqual({ state: 'OH', buyer_count: 2, event_id: 'a3f1c2d4-0000-4000-8000-000000000001' })
  })
})

describe('productCategoryCode', () => {
  it('maps the catalog categories to neutral codes', () => {
    expect(productCategoryCode('Test Strips')).toBe('test_strips')
    expect(productCategoryCode('CGM')).toBe('cgm')
    expect(productCategoryCode('Infusion Sets')).toBe('infusion_sets')
    expect(productCategoryCode('Lancets')).toBe('lancets')
    expect(productCategoryCode('Something new')).toBe('other')
    expect(productCategoryCode(undefined)).toBe('other')
  })
})

describe('client code pushes only through pushEvent', () => {
  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        if (entry !== '__tests__') walk(full, out)
      } else if (/\.tsx?$/.test(entry)) out.push(full)
    }
    return out
  }

  it('never writes to window.dataLayer directly outside the two tracking modules', () => {
    const offenders = [...walk('app'), ...walk('lib')].filter(
      (f) =>
        !f.endsWith('lib/data-layer.ts') &&
        !f.endsWith('GtmLoader.tsx') &&
        /dataLayer\s*\.\s*push|dataLayer\s*=/.test(readFileSync(f, 'utf8'))
    )
    expect(offenders).toEqual([])
  })
})
