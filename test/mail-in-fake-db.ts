// An in-memory stand-in for the service-role client, shared by the stage-2
// mail-in route tests. Same idea as the one inside stage 1's flow.test.ts:
// just enough of the PostgREST builder to drive a route end to end with NO
// database. It proves route wiring, not Postgres behavior.
//
// `touched` counts every call to `.from()`, so a test can assert a route
// answered WITHOUT reaching for the database at all.

export type Row = Record<string, unknown>

export function createFakeDb() {
  const tables: Record<string, Row[]> = { mail_in_orders: [], mail_in_events: [] }
  let nextId = 1
  const state = {
    touched: 0,
    /** Make the next update on mail_in_orders fail, to test "bought but not saved". */
    failNextOrderUpdate: false,
    /** Runs just before an update is applied. */
    beforeUpdate: null as (() => void) | null,
  }
  const uuid = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`

  function builder(table: string) {
    const filters: Array<(row: Row) => boolean> = []
    let mode: 'select' | 'insert' | 'update' = 'select'
    let payload: Row | Row[] | null = null

    const run = (): { data: Row[]; error: { message: string; code?: string } | null } => {
      if (mode === 'insert') {
        const rows = (Array.isArray(payload) ? payload : [payload as Row]).map((row) => ({
          id: uuid(),
          created_at: new Date().toISOString(),
          ...row,
        }))
        tables[table].push(...rows)
        return { data: rows, error: null }
      }
      if (mode === 'update') {
        if (table === 'mail_in_orders' && state.failNextOrderUpdate) {
          state.failNextOrderUpdate = false
          return { data: [], error: { message: 'simulated database failure' } }
        }
        state.beforeUpdate?.()
      }
      const matched = tables[table].filter((row) => filters.every((f) => f(row)))
      if (mode === 'update') matched.forEach((row) => Object.assign(row, payload))
      return { data: matched, error: null }
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
      maybeSingle: async () => {
        const result = run()
        return { data: result.data[0] ?? null, error: result.error }
      },
      single: async () => {
        const result = run()
        return { data: result.data[0] ?? null, error: result.error }
      },
      then: (resolve: (value: { data: Row[]; error: unknown }) => unknown) => resolve(run()),
    }
    return api
  }

  return {
    tables,
    state,
    client: {
      from: (table: string) => {
        state.touched += 1
        return builder(table)
      },
    },
    reset() {
      tables.mail_in_orders.length = 0
      tables.mail_in_events.length = 0
      state.touched = 0
      state.failNextOrderUpdate = false
      state.beforeUpdate = null
    },
    /** Insert a kit row directly, with sensible defaults. */
    seedOrder(overrides: Row = {}): Row {
      const row: Row = {
        id: uuid(),
        order_number: 'MK-TEST01',
        token: 'a'.repeat(64),
        status: 'quote_agreed',
        problem_reason: null,
        name: 'Pat Seller',
        phone: '5185550100',
        email: null,
        street1: '12 Elm St',
        street2: null,
        city: 'Columbus',
        state: 'OH',
        zip: '43004',
        expected_items: [{ product: 'Contour NEXT 100ct', boxes: 4 }],
        received_items: null,
        payout_method: 'zelle',
        payout_handle: 'pat-secret-handle@example.com',
        quoted_amount: 123.45,
        paid_amount: null,
        paid_at: null,
        internal_notes: 'INTERNAL-NOTE-SENTINEL',
        lead_id: null,
        easypost_shipment_id: null,
        easypost_tracker_id: null,
        easypost_mode: null,
        tracking_code: null,
        carrier: null,
        service: null,
        label_url: null,
        label_pdf_url: null,
        qr_url: null,
        label_created_at: null,
        label_refund_status: null,
        source: 'admin',
        seller_note: null,
        kit_sent_at: null,
        first_scan_at: null,
        delivered_at: null,
        checked_in_at: null,
        created_at: '2026-09-20T12:00:00.000Z',
        updated_at: '2026-09-20T12:00:00.000Z',
        ...overrides,
      }
      tables.mail_in_orders.push(row)
      return row
    },
  }
}

/** One shared instance per test file: the vi.mock factory and the test body
 *  import this same module, so they see the same tables. */
export const fakeDb = createFakeDb()
