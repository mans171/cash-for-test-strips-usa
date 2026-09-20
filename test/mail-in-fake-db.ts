// An in-memory stand-in for the service-role client, shared by the stage-2
// mail-in route tests. Same idea as the one inside stage 1's flow.test.ts:
// just enough of the PostgREST builder to drive a route end to end with NO
// database. It proves route wiring, not Postgres behavior.
//
// The one piece of Postgres behavior it DOES model, because the label race
// tests depend on it: an UPDATE's filters and its write happen in one
// synchronous step (`run`), so a conditional update is atomic exactly as a
// single UPDATE ... WHERE ... RETURNING is. Filters follow SQL's rules for
// NULL: `eq`, `lt`, `like` and `in` never match a null column; only `is` does.
// test/__tests__/mail-in-fake-db.test.ts checks the fake itself.
//
// `touched` counts every call to `.from()`, so a test can assert a route
// answered WITHOUT reaching for the database at all.

export type Row = Record<string, unknown>

export function createFakeDb() {
  const tables: Record<string, Row[]> = { mail_in_orders: [], mail_in_events: [] }
  let nextId = 1
  const state = {
    touched: 0,
    /** Every statement that ran, in order, as `mode:table` — lets a race test
     *  prove both requests READ before either one wrote. */
    ops: [] as string[],
    /** Make the next update on mail_in_orders fail, to test "bought but not saved". */
    failNextOrderUpdate: false,
    /** Make every mail_in_orders update whose payload this accepts fail. */
    failOrderUpdateWhen: null as ((payload: Row) => boolean) | null,
    /** Make the next insert into mail_in_events fail. */
    failNextEventInsert: false,
    /** Runs just before an update is applied, with the update's payload. */
    beforeUpdate: null as ((payload: Row) => void) | null,
  }
  const uuid = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`

  function builder(table: string) {
    const filters: Array<(row: Row) => boolean> = []
    let mode: 'select' | 'insert' | 'update' = 'select'
    let payload: Row | Row[] | null = null

    const run = (): { data: Row[]; error: { message: string; code?: string } | null } => {
      state.ops.push(`${mode}:${table}`)
      if (mode === 'insert') {
        if (table === 'mail_in_events' && state.failNextEventInsert) {
          state.failNextEventInsert = false
          return { data: [], error: { message: 'simulated insert failure' } }
        }
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
        if (table === 'mail_in_orders' && state.failOrderUpdateWhen?.(payload as Row)) {
          return { data: [], error: { message: 'simulated database failure' } }
        }
        state.beforeUpdate?.(payload as Row)
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
        filters.push((row) => row[column] != null && row[column] === value)
        return api
      },
      /** PostgREST `is`: null (and booleans). `.is(col, null)` is IS NULL. */
      is: (column: string, value: null | boolean) => {
        filters.push((row) => (value === null ? row[column] == null : row[column] === value))
        return api
      },
      in: (column: string, values: unknown[]) => {
        filters.push((row) => row[column] != null && values.includes(row[column]))
        return api
      },
      /** SQL LIKE: `%` any run, `_` one character, case-sensitive, whole value. */
      like: (column: string, pattern: string) => {
        const source = pattern
          .split('')
          .map((ch) => (ch === '%' ? '[\\s\\S]*' : ch === '_' ? '[\\s\\S]' : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
          .join('')
        const regex = new RegExp(`^${source}$`)
        filters.push((row) => typeof row[column] === 'string' && regex.test(row[column] as string))
        return api
      },
      /** Less-than. Timestamps compare as instants, as timestamptz does. */
      lt: (column: string, value: string | number) => {
        filters.push((row) => {
          const cell = row[column]
          if (cell == null) return false
          if (typeof cell === 'number' && typeof value === 'number') return cell < value
          const a = Date.parse(String(cell))
          const b = Date.parse(String(value))
          return Number.isFinite(a) && Number.isFinite(b) ? a < b : String(cell) < String(value)
        })
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
      state.ops.length = 0
      state.failNextOrderUpdate = false
      state.failOrderUpdateWhen = null
      state.failNextEventInsert = false
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
