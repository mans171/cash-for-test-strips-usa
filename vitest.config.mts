import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))

// Load test env into process.env.
//
// Prefer `.env.test`. Fall back to `.env.local` ONLY if `.env.test` is absent —
// `.env.local` is the development app's env and points at PRODUCTION, which is how
// the suite came to be writing live data (see test/setup-guard.ts). The guard in
// setupFiles is what actually blocks that; this ordering just makes the correct
// file win when it exists.
//
// Deliberately NOT wrapped in a silent catch: if no env file can be read, the suite
// must fail loudly rather than fall through to whatever ambient environment exists.
function loadEnv(file: string): boolean {
  try {
    const envContent = readFileSync(`${__dir}/${file}`, 'utf8')
    envContent.split('\n').forEach((line) => {
      const [key, ...value] = line.split('=')
      if (key && !key.startsWith('#')) {
        process.env[key.trim()] = value.join('=').trim()
      }
    })
    return true
  } catch {
    return false
  }
}

if (!loadEnv('.env.test') && !loadEnv('.env.local')) {
  throw new Error(
    'Could not read .env.test or .env.local. Refusing to run tests against an ' +
      'ambient environment — create .env.test pointing at a non-production database.'
  )
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // Runs per test file before any import — fires before lib/supabase-admin.ts
    // can construct a service-role client. See test/setup-guard.ts.
    setupFiles: ['./test/setup-guard.ts'],
    exclude: ['**/node_modules/**', '**/.worktrees/**', '**/worktrees/**'],
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@': __dir,
    },
  },
})
