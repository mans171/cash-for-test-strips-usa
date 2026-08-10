import { describe, it, expect, afterEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { signSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { createClaim } from '@/lib/claims'
import { GET } from '../route'

// createClaim sends a fire-and-forget notification email via next/server's
// after(), which throws when called outside a real request scope (as in
// tests). Same precedent as app/api/admin/claims/review/__tests__/route.test.ts.
vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: (cb: () => unknown) => {
      void cb()
    },
  }
})

const cleanupCompanySlugs: string[] = []
const cleanupClaimIds: string[] = []
const cleanupUserIds: string[] = []

afterEach(async () => {
  if (cleanupClaimIds.length) {
    await supabaseAdmin.from('claims').delete().in('id', cleanupClaimIds)
    cleanupClaimIds.length = 0
  }
  if (cleanupCompanySlugs.length) {
    await supabaseAdmin.from('companies').delete().in('slug', cleanupCompanySlugs)
    cleanupCompanySlugs.length = 0
  }
  for (const id of cleanupUserIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
  cleanupUserIds.length = 0
})

function makeRequest(cookie?: string) {
  return new Request('http://localhost/api/admin/data', {
    headers: cookie ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookie}` } : {},
  })
}

describe('GET /api/admin/data', () => {
  it('rejects requests without a valid admin session', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })

  it('includes pending claims with buyer identity and company info', async () => {
    const { data: userData } = await supabaseAdmin.auth.admin.createUser({
      email: `admin-data-claims-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)
    await supabaseAdmin.from('profiles').insert({
      id: userId,
      role: 'buyer',
      name: 'Admin Data Test Buyer',
      phone: '5551239999',
      address_street: '1 Test Ave',
      address_city: 'Troy',
      address_state: 'NY',
      address_zip: '12180',
    })

    const { data: company } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Admin Data Claims Co', slug: 'admin-data-claims-co', states: ['NY'], active: true, phone: '5559994301' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(company!.slug)

    const claim = await createClaim({ companyId: company!.id, userId, submittedPhone: '5559994301' })
    cleanupClaimIds.push(claim.id)

    const response = await GET(makeRequest(signSession()))
    const body = await response.json()
    expect(response.status).toBe(200)

    const found = body.claims.find((c: { id: string }) => c.id === claim.id)
    expect(found).toBeDefined()
    expect(found.company.name).toBe('Admin Data Claims Co')
    expect(found.buyer.email).toBe(userData!.user!.email)
  })
})
