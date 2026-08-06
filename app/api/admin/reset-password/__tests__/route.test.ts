import { describe, it, expect, afterEach } from 'vitest'
import { createResetToken } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { POST } from '../route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/admin/reset-password', () => {
  // admin_credentials is a single-row-in-effect table shared with real
  // production login (see Task 3's history — a test that deleted or
  // overwrote it without cleanup previously wiped/changed the real admin
  // password). This test drives a real reset through the actual route, so
  // clean up the row it creates in a tightly time-bounded window rather
  // than leaving it as the new "current" password.
  const cleanupWindows: Array<{ before: string; after: string }> = []

  afterEach(async () => {
    for (const { before, after } of cleanupWindows) {
      await supabaseAdmin.from('admin_credentials').delete().gt('updated_at', before).lte('updated_at', after)
    }
    cleanupWindows.length = 0
  })

  it('returns 400 for a missing token or password', async () => {
    const response = await POST(makeRequest({ token: 'x' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for an invalid token', async () => {
    const response = await POST(makeRequest({ token: 'not-a-real-token', newPassword: 'whatever-Task5' }))
    expect(response.status).toBe(400)
  })

  it('resets the password for a valid token', async () => {
    const before = new Date().toISOString()
    const token = await createResetToken()
    const response = await POST(makeRequest({ token, newPassword: 'reset-via-route-Task5' }))
    const after = new Date().toISOString()
    cleanupWindows.push({ before, after })
    expect(response.status).toBe(200)
  })
})
