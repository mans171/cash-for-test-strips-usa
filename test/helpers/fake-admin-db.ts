/**
 * In-memory stand-in for the service-role client, covering only the two
 * tables admin auth uses. Just enough of the PostgREST builder for
 * lib/admin-auth.ts and lib/admin-credential-version.ts — no database, ever.
 */
type Row = Record<string, unknown>

export const fakeDb = {
  admin_credentials: [] as Row[],
  admin_reset_tokens: [] as Row[],
  /** When true, every read of admin_credentials returns a PostgREST error. */
  failCredentialReads: false,
  credentialReads: 0,
  nextId: 1,
  /** Monotonic clock so two inserts never share an updated_at. */
  tick: Date.parse('2026-09-20T12:00:00.000Z'),
}

export function resetFakeDb() {
  fakeDb.admin_credentials.length = 0
  fakeDb.admin_reset_tokens.length = 0
  fakeDb.failCredentialReads = false
  fakeDb.credentialReads = 0
  fakeDb.nextId = 1
}

function builder(table: 'admin_credentials' | 'admin_reset_tokens') {
  const filters: Array<(row: Row) => boolean> = []
  let mode: 'select' | 'insert' | 'update' = 'select'
  let payload: Row = {}
  let orderBy: { column: string; ascending: boolean } | null = null

  function run(): { data: Row[]; error: { message: string } | null } {
    if (mode === 'insert') {
      fakeDb.tick += 1000
      const row: Row = {
        id: `00000000-0000-4000-8000-${String(fakeDb.nextId++).padStart(12, '0')}`,
        ...(table === 'admin_credentials' ? { updated_at: new Date(fakeDb.tick).toISOString() } : { used_at: null }),
        ...payload,
      }
      fakeDb[table].push(row)
      return { data: [row], error: null }
    }
    if (table === 'admin_credentials' && mode === 'select') {
      fakeDb.credentialReads += 1
      if (fakeDb.failCredentialReads) return { data: [], error: { message: 'connection refused' } }
    }
    let rows = fakeDb[table].filter((row) => filters.every((f) => f(row)))
    if (mode === 'update') rows.forEach((row) => Object.assign(row, payload))
    if (orderBy) {
      const { column, ascending } = orderBy
      rows = [...rows].sort((a, b) => String(a[column]).localeCompare(String(b[column])) * (ascending ? 1 : -1))
    }
    return { data: rows, error: null }
  }

  const api = {
    select: () => api,
    insert: (value: Row) => ((mode = 'insert'), (payload = value), api),
    update: (value: Row) => ((mode = 'update'), (payload = value), api),
    eq: (column: string, value: unknown) => (filters.push((row) => row[column] === value), api),
    is: (column: string, value: unknown) => (filters.push((row) => (row[column] ?? null) === value), api),
    gt: (column: string, value: string) => (filters.push((row) => String(row[column]) > value), api),
    order: (column: string, options?: { ascending?: boolean }) => ((orderBy = { column, ascending: options?.ascending ?? true }), api),
    limit: () => api,
    maybeSingle: async () => {
      const result = run()
      return { data: result.error ? null : (result.data[0] ?? null), error: result.error }
    },
    then: (resolve: (value: { data: Row[] | null; error: { message: string } | null }) => unknown) => resolve(run()),
  }
  return api
}

export const fakeSupabaseAdmin = { from: (table: 'admin_credentials' | 'admin_reset_tokens') => builder(table) }
