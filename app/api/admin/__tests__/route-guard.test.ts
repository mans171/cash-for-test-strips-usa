import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readdirSync, readFileSync } from 'fs'
import { join, relative, sep } from 'path'
import crypto from 'crypto'

/**
 * Two guarantees about EVERY route under app/api/admin, discovered from disk
 * so a route added next month is covered without anyone remembering this file:
 *
 *   1. its source calls requireAdmin() in every exported handler, and
 *   2. called without a valid session it answers 401 BEFORE touching the database.
 *
 * If you added an admin route and this failed: start each handler with
 *     const denied = await requireAdmin(request)
 *     if (denied) return denied
 */

const touched = vi.fn()
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: new Proxy(
    {},
    {
      get(_target, prop) {
        touched(String(prop))
        throw new Error(`database touched (${String(prop)}) before the admin session was checked`)
      },
    }
  ),
}))

import { ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'

const ADMIN_API_DIR = join(process.cwd(), 'app', 'api', 'admin')

// Unauthenticated by nature. Anything else under app/api/admin must be guarded.
// Adding to this list is a security decision — it should be rare and reviewed.
const PUBLIC_ROUTES = new Set(['login', 'forgot-password', 'reset-password', 'logout'])

const HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']

function findRouteFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : findRouteFiles(full)
    return /^route\.(ts|tsx|js|mjs)$/.test(entry.name) ? [full] : []
  })
}

const routeKey = (file: string) => relative(ADMIN_API_DIR, join(file, '..')).split(sep).join('/')

const allRoutes = findRouteFiles(ADMIN_API_DIR)
const guardedRoutes = allRoutes.filter((file) => !PUBLIC_ROUTES.has(routeKey(file)))

function exportedHandlers(source: string): string[] {
  return HTTP_METHODS.filter((method) =>
    new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b|export\\s+const\\s+${method}\\b`).test(source)
  )
}

beforeEach(() => touched.mockClear())

describe('route discovery', () => {
  it('finds the admin routes (a broken walker must not pass silently)', () => {
    const keys = allRoutes.map(routeKey)
    expect(keys).toEqual(expect.arrayContaining(['login', 'logout', 'data', 'review', 'claims/review', 'mail-in', 'mail-in/[id]']))
    expect(guardedRoutes.length).toBeGreaterThanOrEqual(5)
  })

  it('every public exemption still exists (no stale entries hiding a rename)', () => {
    const keys = new Set(allRoutes.map(routeKey))
    for (const name of PUBLIC_ROUTES) expect(keys.has(name), `exempt route "${name}" not found on disk`).toBe(true)
  })
})

describe.each(guardedRoutes.map((file) => [routeKey(file), file] as const))('/api/admin/%s', (_key, file) => {
  const source = readFileSync(file, 'utf8')
  const handlers = exportedHandlers(source)

  it('imports requireAdmin from @/lib/admin-auth and calls it once per exported handler', () => {
    expect(handlers.length).toBeGreaterThan(0)
    expect(source).toMatch(/import\s*\{[^}]*\brequireAdmin\b[^}]*\}\s*from\s*['"]@\/lib\/admin-auth['"]/)
    const calls = source.match(/await\s+requireAdmin\s*\(/g) ?? []
    expect(calls.length, `${handlers.join(', ')} exported but requireAdmin called ${calls.length}x`).toBeGreaterThanOrEqual(handlers.length)
  })

  it('does not re-implement the check locally', () => {
    expect(source).not.toMatch(/\bisValidSession\b/)
    expect(source).not.toMatch(/function\s+getCookie\b/)
  })

  it('answers 401 without a valid session, before the database is touched', async () => {
    const routeModule = (await import(/* @vite-ignore */ file)) as Record<string, (request: Request, context: unknown) => Promise<Response>>
    const oldConstantCookie = `admin-authenticated.${crypto
      .createHmac('sha256', process.env.ADMIN_SESSION_SECRET!)
      .update('admin-authenticated')
      .digest('hex')}`
    const cookies = [undefined, 'admin-authenticated', oldConstantCookie, `v2.${Date.now()}.${'0'.repeat(32)}.${'0'.repeat(32)}.${'0'.repeat(64)}`]

    for (const method of handlers) {
      for (const cookie of cookies) {
        const request = new Request('http://localhost/api/admin/x', {
          method,
          body: ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify({}),
          headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookie}` } : {}) },
        })
        const context = { params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }) }
        const response = await routeModule[method](request, context)
        expect(response.status, `${method} with cookie ${cookie ?? '(none)'}`).toBe(401)
      }
    }
    expect(touched).not.toHaveBeenCalled()
  })

  it('answers 403 to a cross-site write, before the database is touched', async () => {
    const routeModule = (await import(/* @vite-ignore */ file)) as Record<string, (request: Request, context: unknown) => Promise<Response>>
    for (const method of handlers.filter((m) => !['GET', 'HEAD', 'OPTIONS'].includes(m))) {
      const request = new Request('http://localhost/api/admin/x', {
        method,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json', origin: 'https://evil.example' },
      })
      const response = await routeModule[method](request, { params: Promise.resolve({ id: 'x' }) })
      expect(response.status, method).toBe(403)
    }
    expect(touched).not.toHaveBeenCalled()
  })
})
