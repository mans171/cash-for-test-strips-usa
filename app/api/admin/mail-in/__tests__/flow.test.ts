import { describe, it, expect, vi, beforeEach } from 'vitest'

// A tiny in-memory stand-in for the service-role client: just enough of the
// PostgREST builder (eq / select / insert / update / maybeSingle / single /
// order / limit) to drive the routes end to end with NO database. It proves the
// route wiring — what gets written, what comes back, that the token never
// leaves — not Postgres behavior (constraints, RLS), which needs the real
// migration applied.
type Row = Record<string, unknown>
const db: { mail_in_orders: Row[]; mail_in_events: Row[] } = { mail_in_orders: [], mail_in_events: [] }
let nextId = 1
// Set by a test to change a row in the gap between the route's read and its write.
let beforeUpdate: (() => void) | null = null
const uuid = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`

function builder(table: keyof typeof db) {
  const filters: Array<(row: Row) => boolean> = []
  let mode: 'select' | 'insert' | 'update' = 'select'
  let payload: Row | Row[] | null = null

  const run = () => {
    if (mode === 'insert') {
      const rows = (Array.isArray(payload) ? payload : [payload as Row]).map((row) => ({
        id: uuid(),
        created_at: new Date().toISOString(),
        ...row,
      }))
      db[table].push(...rows)
      return rows
    }
    if (mode === 'update') beforeUpdate?.()
    const matched = db[table].filter((row) => filters.every((f) => f(row)))
    if (mode === 'update') matched.forEach((row) => Object.assign(row, payload))
    return matched
  }

  const api = {
    select: () => api,
    order: () => api,
    limit: () => api,
    eq: (column: string, value: unknown) => {
      filters.push((row) => row[column] === value)
      return api
    },
    insert: (rows: Row | Row[]) => {
      mode = 'insert'
      payload = rows
      return api
    },
    update: (values: Row) => {
      mode = 'update'
      payload = values
      return api
    },
    maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
    single: async () => ({ data: run()[0] ?? null, error: null }),
    then: (resolve: (value: { data: Row[]; error: null }) => unknown) => resolve({ data: run(), error: null }),
  }
  return api
}

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: { from: (table: keyof typeof db) => builder(table) },
}))

import { ADMIN_SESSION_COOKIE_NAME, signSession } from '@/lib/admin-auth'
import { POST } from '../route'
import { GET, PATCH } from '../[id]/route'

function request(method: string, path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', cookie: `${ADMIN_SESSION_COOKIE_NAME}=${signSession()}` },
  })
}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  db.mail_in_orders.length = 0
  db.mail_in_events.length = 0
  beforeUpdate = null
})

async function createKit() {
  const res = await POST(
    request('POST', '/api/admin/mail-in', {
      name: 'Pat Seller',
      phone: '(518) 555-0100',
      expected_items: [{ product: 'Contour NEXT 100ct', boxes: 4 }],
      quoted_amount: '120',
      status: 'paid', // must be ignored
    })
  )
  return { res, body: await res.json() }
}

describe('mail-in routes, end to end against an in-memory client', () => {
  it('creates a kit: server-generated number and token, created event, token never returned', async () => {
    const { res, body } = await createKit()
    expect(res.status).toBe(201)
    expect(body.order.order_number).toMatch(/^MK-[0-9A-Z]{6}$/)
    expect(body.order.status).toBe('quote_agreed')
    expect(body.order.phone).toBe('5185550100')
    expect('token' in body.order).toBe(false)

    expect(db.mail_in_orders[0].token).toMatch(/^[0-9a-f]{64}$/)
    expect(db.mail_in_events).toHaveLength(1)
    expect(db.mail_in_events[0]).toMatchObject({ order_id: body.order.id, type: 'created', actor: 'admin' })
  })

  it('moves a kit, writes the timeline, and returns the next valid moves without the token', async () => {
    const { body: created } = await createKit()
    const id = created.order.id

    const res = await PATCH(request('PATCH', `/api/admin/mail-in/${id}`, { status: 'kit_sent' }), ctx(id))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.order.status).toBe('kit_sent')
    expect(body.order.kit_sent_at).toBeTruthy()
    expect('token' in body.order).toBe(false)
    expect(body.nextStatuses).toEqual(['label_made', 'in_transit', 'delivered', 'checked_in', 'paid', 'problem', 'closed'])
    expect(db.mail_in_events.map((e) => e.type)).toEqual(['created', 'status_changed'])
  })

  it('refuses an illegal move with 400 and writes nothing', async () => {
    const { body: created } = await createKit()
    const id = created.order.id
    await PATCH(request('PATCH', `/api/admin/mail-in/${id}`, { status: 'delivered' }), ctx(id))

    const res = await PATCH(request('PATCH', `/api/admin/mail-in/${id}`, { status: 'kit_sent' }), ctx(id))
    expect(res.status).toBe(400)
    expect(db.mail_in_orders[0].status).toBe('delivered')
    expect(db.mail_in_events).toHaveLength(2)
  })

  it('requires amount + method to mark paid, then stamps paid_at', async () => {
    const { body: created } = await createKit()
    const id = created.order.id

    const missing = await PATCH(request('PATCH', `/api/admin/mail-in/${id}`, { status: 'paid', paid_amount: 118 }), ctx(id))
    expect(missing.status).toBe(400)

    const paid = await PATCH(
      request('PATCH', `/api/admin/mail-in/${id}`, { status: 'paid', paid_amount: 118, payout_method: 'zelle', payout_handle: 'pat@example.com' }),
      ctx(id)
    )
    const body = await paid.json()
    expect(paid.status).toBe(200)
    expect(body.order).toMatchObject({ status: 'paid', paid_amount: 118, payout_method: 'zelle' })
    expect(body.order.paid_at).toBeTruthy()
    // The handle is on the row, never in the timeline.
    expect(JSON.stringify(db.mail_in_events)).not.toContain('pat@example.com')
  })

  it('404s a kit that does not exist', async () => {
    const id = '99999999-9999-4999-8999-999999999999'
    expect((await GET(request('GET', `/api/admin/mail-in/${id}`), ctx(id))).status).toBe(404)
    expect((await PATCH(request('PATCH', `/api/admin/mail-in/${id}`, { status: 'kit_sent' }), ctx(id))).status).toBe(404)
  })

  it('returns 409 when the kit moved between the read and the write', async () => {
    const { body: created } = await createKit()
    const id = created.order.id
    const row = db.mail_in_orders[0]

    // Another tab (or, from stage 3, the tracking webhook) moves the kit after
    // this request has read it but before it writes.
    beforeUpdate = () => { row.status = 'in_transit' }

    const res = await PATCH(request('PATCH', `/api/admin/mail-in/${id}`, { name: 'Pat S.' }), ctx(id))
    expect(res.status).toBe(409)
    expect(row.name).toBe('Pat Seller')
  })
})
