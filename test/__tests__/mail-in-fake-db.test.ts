import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../mail-in-fake-db'

// The label race tests are only worth something if the fake's conditional
// updates behave the way Postgres does. This checks the fake itself.

const CUTOFF = '2026-09-20T12:00:00.000Z'

describe('the mail-in fake database', () => {
  it('eq / in / like / lt never match NULL; only is(null) does', async () => {
    const db = createFakeDb()
    const row = db.seedOrder({ easypost_shipment_id: null, label_created_at: null })
    const orders = () => db.client.from('mail_in_orders').select().eq('id', row.id)
    expect((await orders().is('easypost_shipment_id', null).maybeSingle()).data).toBe(row)
    expect((await orders().eq('easypost_shipment_id', null).maybeSingle()).data).toBeNull()
    expect((await orders().in('easypost_shipment_id', [null, 'x']).maybeSingle()).data).toBeNull()
    expect((await orders().like('easypost_shipment_id', '%').maybeSingle()).data).toBeNull()
    expect((await orders().lt('label_created_at', CUTOFF).maybeSingle()).data).toBeNull()
  })

  it('like is anchored, case-sensitive, and treats regex characters literally', async () => {
    const db = createFakeDb()
    const find = async (value: string, pattern: string) => {
      db.reset()
      db.seedOrder({ easypost_shipment_id: value })
      return (await db.client.from('mail_in_orders').select().like('easypost_shipment_id', pattern).maybeSingle()).data !== null
    }
    expect(await find('claim:abc', 'claim:%')).toBe(true)
    expect(await find('shp_123', 'claim:%')).toBe(false)
    expect(await find('xclaim:abc', 'claim:%')).toBe(false)
    expect(await find('CLAIM:abc', 'claim:%')).toBe(false)
    expect(await find('claim', 'claim:%')).toBe(false)
    expect(await find('a.c', 'a.c')).toBe(true)
    expect(await find('abc', 'a.c')).toBe(false)
    expect(await find('abc', 'a_c')).toBe(true)
  })

  it('lt compares timestamps as instants, strictly', async () => {
    const db = createFakeDb()
    const row = db.seedOrder({ label_created_at: '2026-09-20T11:59:59.999Z' })
    const q = (cutoff: string) => db.client.from('mail_in_orders').select().lt('label_created_at', cutoff).maybeSingle()
    expect((await q(CUTOFF)).data).toBe(row)
    expect((await q('2026-09-20T11:59:59.999Z')).data).toBeNull()
    // Same instant written with an offset, as Postgres may hand it back.
    row.label_created_at = '2026-09-20T07:59:59.999-04:00'
    expect((await q(CUTOFF)).data).toBe(row)
  })

  it('a conditional update is atomic: of two racing claims exactly one gets the row back', async () => {
    const db = createFakeDb()
    const row = db.seedOrder()
    const claim = (token: string) =>
      db.client.from('mail_in_orders').update({ easypost_shipment_id: token }).eq('id', row.id).is('easypost_shipment_id', null).in('status', ['awaiting_quote', 'quote_agreed']).select().maybeSingle()
    const [a, b] = await Promise.all([claim('claim:a'), claim('claim:b')])
    expect([a.data, b.data].filter(Boolean)).toHaveLength(1)
    expect(a.error ?? b.error).toBeNull()
    expect(row.easypost_shipment_id).toBe('claim:a')
  })

  it('an update that matches nothing changes nothing and returns no row', async () => {
    const db = createFakeDb()
    const row = db.seedOrder({ status: 'in_transit' })
    const res = await db.client.from('mail_in_orders').update({ easypost_shipment_id: 'claim:a' }).eq('id', row.id).in('status', ['quote_agreed']).select().maybeSingle()
    expect(res).toEqual({ data: null, error: null })
    expect(row.easypost_shipment_id).toBeNull()
  })
})
