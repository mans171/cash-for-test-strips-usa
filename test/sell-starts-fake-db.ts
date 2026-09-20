// An in-memory stand-in for the service-role client, for the sell_starts route
// tests. Same idea as test/mail-in-fake-db.ts, but table-agnostic because
// /api/admin/data reads six tables. Just enough of the PostgREST builder to
// drive a route end to end with NO database: it proves route wiring, not
// Postgres behavior. Filters follow SQL's rule for NULL (`eq`/`gte` never match
// a null column; only `is` does), and `order` + `limit` really sort and cut.
//
// `touched` counts every call to `.from()`, so a test can assert a route
// answered WITHOUT reaching for the database at all.

export type Row = Record<string, unknown>

export function createFakeDb() {
  const tables: Record<string, Row[]> = {}
  let nextId = 1
  const state = {
    touched: 0,
    /** Every statement that ran, in order, as `mode:table`. */
    ops: [] as string[],
    /** Tables whose every statement fails — e.g. the migration is not applied. */
    failTables: new Set<string>(),
  }
  const uuid = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`
  const rowsOf = (table: string) => (tables[table] ??= [])

  function builder(table: string) {
    const filters: Array<(row: Row) => boolean> = []
    let mode: 'select' | 'insert' | 'update' = 'select'
    let payload: Row | Row[] | null = null
    let orderBy: { column: string; ascending: boolean } | null = null
    let limitTo: number | null = null

    const run = (): { data: Row[]; error: { message: string } | null } => {
      state.ops.push(`${mode}:${table}`)
      if (state.failTables.has(table)) {
        return { data: [], error: { message: `relation "public.${table}" does not exist` } }
      }
      if (mode === 'insert') {
        const rows = (Array.isArray(payload) ? payload : [payload as Row]).map((row) => ({
          id: uuid(),
          created_at: new Date().toISOString(),
          ...row,
        }))
        rowsOf(table).push(...rows)
        return { data: rows, error: null }
      }
      let matched = rowsOf(table).filter((row) => filters.every((f) => f(row)))
      if (mode === 'update') matched.forEach((row) => Object.assign(row, payload))
      if (orderBy) {
        const { column, ascending } = orderBy
        matched = [...matched].sort((a, b) => String(a[column]).localeCompare(String(b[column])) * (ascending ? 1 : -1))
      }
      if (limitTo !== null) matched = matched.slice(0, limitTo)
      return { data: matched, error: null }
    }

    const api = {
      select: () => api,
      order: (column: string, options?: { ascending?: boolean }) => {
        orderBy = { column, ascending: options?.ascending ?? true }
        return api
      },
      limit: (count: number) => {
        limitTo = count
        return api
      },
      eq: (column: string, value: unknown) => {
        filters.push((row) => row[column] != null && row[column] === value)
        return api
      },
      is: (column: string, value: null | boolean) => {
        filters.push((row) => (value === null ? row[column] == null : row[column] === value))
        return api
      },
      in: (column: string, values: unknown[]) => {
        filters.push((row) => row[column] != null && values.includes(row[column]))
        return api
      },
      gte: (column: string, value: string) => {
        filters.push((row) => row[column] != null && Date.parse(String(row[column])) >= Date.parse(value))
        return api
      },
      /** Only used by the dashboard's "companies with no phone" query. */
      or: () => api,
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
        return { data: result.error ? null : (result.data[0] ?? null), error: result.error }
      },
      single: async () => {
        const result = run()
        return { data: result.error ? null : (result.data[0] ?? null), error: result.error }
      },
      then: (resolve: (value: { data: Row[]; error: { message: string } | null }) => unknown) => resolve(run()),
    }
    return api
  }

  return {
    tables,
    state,
    rowsOf,
    client: {
      from: (table: string) => {
        state.touched += 1
        return builder(table)
      },
    },
    reset() {
      for (const key of Object.keys(tables)) delete tables[key]
      state.touched = 0
      state.ops.length = 0
      state.failTables.clear()
    },
    /** Insert a sell_starts row directly, with sensible defaults. */
    seedStart(overrides: Row = {}): Row {
      const row: Row = {
        id: uuid(),
        phone: '5185550100',
        name: 'Pat',
        state: 'OH',
        items: [{ brand: 'Accu-Chek — Guide 100ct', count: 3, expiration: '2027-06', condition: 'sealed' }],
        source_page: '/sell',
        created_at: '2026-09-20T12:00:00.000Z',
        updated_at: '2026-09-20T12:00:00.000Z',
        completed_lead_id: null,
        completed_at: null,
        contacted_at: null,
        dismissed_at: null,
        admin_note: null,
        ...overrides,
      }
      rowsOf('sell_starts').push(row)
      return row
    },
  }
}

/** One shared instance per test file: the vi.mock factory and the test body
 *  import this same module, so they see the same tables. */
export const fakeDb = createFakeDb()
