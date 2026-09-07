/**
 * Refuse to run the test suite against the PRODUCTION Supabase project.
 *
 * Why this exists: on 2026-08-31 the suite was found to be writing directly to
 * production. It had put 43 fixture rows ("Route Test Co" / "Admin Review Test Co")
 * into `submissions`, where they sat as `pending` in the live admin review queue,
 * and 472 rows into `admin_credentials`. Because `checkPassword()` reads whichever
 * credential row has the newest `updated_at`, **every test run silently reset the
 * live admin password**, locking the owner out of /admin. Several test files also
 * create real `auth.users` accounts in the production auth project.
 *
 * The suite already had `afterEach` cleanup and it demonstrably did not work — the
 * time-window deletes compare a local machine clock against Postgres server time,
 * so a small skew makes the delete match nothing and fail silently. Do NOT try to
 * fix this by improving cleanup. Isolation is the fix; once the target database is
 * disposable, cleanup correctness stops mattering.
 *
 * This file runs via `setupFiles`, which executes per test file BEFORE any import,
 * so it fires before `lib/supabase-admin.ts` can construct a service-role client
 * (which bypasses RLS entirely).
 */

const PROD_REFS = ['whgwneuarnrsktolmqdj']

const url = process.env.NEXT_PUBLIC_SUPABASE_URL

if (!url) {
  throw new Error(
    '[TEST GUARD] NEXT_PUBLIC_SUPABASE_URL is not set. Refusing to run tests ' +
      'rather than fall through to an ambient environment.'
  )
}

for (const ref of PROD_REFS) {
  if (url.includes(ref)) {
    throw new Error(
      `[TEST GUARD] Refusing to run: NEXT_PUBLIC_SUPABASE_URL points at PRODUCTION (${ref}).\n` +
        `Tests write to submissions, admin_credentials and auth.users — running them here ` +
        `pollutes live data and resets the live admin password.\n` +
        `Point the suite at a local Supabase stack or a dedicated test project via .env.test.`
    )
  }
}
