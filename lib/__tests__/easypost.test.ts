import { describe, it, expect, afterEach, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  WAREHOUSE_ADDRESS,
  buyBody,
  createShipmentBody,
  getEasyPostConfig,
  pickRate,
  verifyAddressBody,
  verifyWebhookSignature,
  type Rate,
} from '../easypost'
import { OWNER_PHONE } from '../owner'

const seller = { name: 'Pat Seller', street1: '12 Elm St', street2: 'Apt 2', city: 'Columbus', state: 'OH', zip: '43004', phone: '5185550100', email: null }
const rate = (carrier: string, service: string, price: string, id = `rate_${carrier}_${service}`): Rate => ({ id, carrier, service, rate: price })

afterEach(() => vi.unstubAllEnvs())

describe('getEasyPostConfig', () => {
  it('defaults to test mode and the test key', () => {
    vi.stubEnv('EASYPOST_MODE', '')
    vi.stubEnv('EASYPOST_TEST_API_KEY', 'test-key')
    vi.stubEnv('EASYPOST_API_KEY', 'live-key')
    expect(getEasyPostConfig()).toEqual({ mode: 'test', key: 'test-key' })
  })

  it('goes live only when EASYPOST_MODE is exactly "live"', () => {
    vi.stubEnv('EASYPOST_TEST_API_KEY', 'test-key')
    vi.stubEnv('EASYPOST_API_KEY', 'live-key')
    for (const value of ['LIVE', 'production', 'true', '1']) {
      vi.stubEnv('EASYPOST_MODE', value)
      expect(getEasyPostConfig()?.mode, value).toBe('test')
    }
    vi.stubEnv('EASYPOST_MODE', 'live')
    expect(getEasyPostConfig()).toEqual({ mode: 'live', key: 'live-key' })
  })

  it('is null when the key for the mode is missing — never falls back to the other key', () => {
    vi.stubEnv('EASYPOST_MODE', 'live')
    vi.stubEnv('EASYPOST_API_KEY', '')
    vi.stubEnv('EASYPOST_TEST_API_KEY', 'test-key')
    expect(getEasyPostConfig()).toBeNull()
    vi.stubEnv('EASYPOST_MODE', 'test')
    vi.stubEnv('EASYPOST_TEST_API_KEY', '')
    vi.stubEnv('EASYPOST_API_KEY', 'live-key')
    expect(getEasyPostConfig()).toBeNull()
  })
})

describe('request bodies', () => {
  it('verifies the seller address', () => {
    expect(verifyAddressBody(seller)).toEqual({
      address: { name: 'Pat Seller', street1: '12 Elm St', street2: 'Apt 2', city: 'Columbus', state: 'OH', zip: '43004', country: 'US', phone: '5185550100' },
      verify: true,
    })
  })

  it('builds a return shipment with to = SELLER and from = Latham (EasyPost swaps them)', () => {
    const body = createShipmentBody(seller, { weight: 16, length: 10, width: 8, height: 4 }, 'MK-7G2K9Q') as { shipment: Record<string, Record<string, unknown>> & { is_return: boolean; reference: string } }
    expect(body.shipment.is_return).toBe(true)
    expect(body.shipment.to_address).toMatchObject({ name: 'Pat Seller', street1: '12 Elm St', zip: '43004' })
    expect(body.shipment.from_address).toEqual({
      company: 'Cash For Test Strips USA', street1: '6 Northway Ln', city: 'Latham', state: 'NY', zip: '12110', country: 'US',
      phone: OWNER_PHONE.replace(/\D/g, ''),
    })
    expect(body.shipment.from_address).toEqual({ ...WAREHOUSE_ADDRESS })
    expect(body.shipment.parcel).toEqual({ weight: 16, length: 10, width: 8, height: 4 })
    expect(body.shipment.options).toEqual({ label_format: 'PDF' })
    expect(body.shipment.reference).toBe('MK-7G2K9Q')
  })

  it('buys by rate id', () => {
    expect(buyBody('rate_1')).toEqual({ rate: { id: 'rate_1' } })
  })
})

describe('pickRate', () => {
  it('prefers USPSReturns whenever it is offered, even when dearer', () => {
    const picked = pickRate([rate('USPS', 'GroundAdvantage', '5.00'), rate('USPSReturns', 'GroundAdvantageReturn', '9.00'), rate('UPS', 'Ground', '1.00')])
    expect(picked?.carrier).toBe('USPSReturns')
  })

  it('otherwise takes the cheapest of USPS GroundAdvantage / Priority', () => {
    expect(pickRate([rate('USPS', 'Priority', '9.10'), rate('USPS', 'GroundAdvantage', '6.40'), rate('USPS', 'Express', '2.00')])?.service).toBe('GroundAdvantage')
    expect(pickRate([rate('USPS', 'Priority', '5.10'), rate('USPS', 'GroundAdvantage', '6.40')])?.service).toBe('Priority')
  })

  it('never picks UPS, FedEx or DHL — even when they are all there is', () => {
    expect(pickRate([rate('UPS', 'Ground', '1.00'), rate('FedEx', 'FEDEX_GROUND', '1.50'), rate('DHLExpress', 'ExpressWorldwide', '0.50')])).toBeNull()
    expect(pickRate([rate('UPS', 'Ground', '1.00'), rate('USPS', 'Priority', '12.00')])?.carrier).toBe('USPS')
    expect(pickRate([])).toBeNull()
  })
})

describe('verifyWebhookSignature', () => {
  const secret = 'whsec-Ünïcode'
  const body = '{"description":"tracker.updated"}'
  const sign = (b: string, s: string) => 'hmac-sha256-hex=' + createHmac('sha256', s.normalize('NFKD')).update(b, 'utf8').digest('hex')

  it('accepts the documented scheme: hex HMAC-SHA256 of the raw body, NFKD secret, prefixed', () => {
    expect(verifyWebhookSignature(body, sign(body, secret), secret)).toBe(true)
  })

  it('rejects a missing secret, a missing header, a wrong prefix, a wrong body and a wrong secret', () => {
    const good = sign(body, secret)
    expect(verifyWebhookSignature(body, good, undefined)).toBe(false)
    expect(verifyWebhookSignature(body, good, '')).toBe(false)
    expect(verifyWebhookSignature(body, null, secret)).toBe(false)
    expect(verifyWebhookSignature(body, good.replace('hmac-sha256-hex=', ''), secret)).toBe(false)
    expect(verifyWebhookSignature(body + ' ', good, secret)).toBe(false)
    expect(verifyWebhookSignature(body, sign(body, 'other'), secret)).toBe(false)
    expect(verifyWebhookSignature(body, 'hmac-sha256-hex=abc', secret)).toBe(false)
  })
})
