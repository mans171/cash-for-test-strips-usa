import { describe, it, expect, afterEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { GET } from '../route'

const mockGetCurrentUser = vi.fn()
vi.mock('@/lib/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}))

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
  mockGetCurrentUser.mockReset()
})

describe('GET /api/buyer/claims', () => {
  it('returns 401 when there is no session', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it("returns the caller's own claims joined to company info", async () => {
    // claims.user_id has a real FK to auth.users(id) — needs a real created user,
    // not an arbitrary string.
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `buyer-claims-route-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    expect(userError).toBeNull()
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const { data: company } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'My Listings Test Co', slug: 'my-listings-test-co', states: ['NY'], active: true, phone: '5559994101', city: 'Troy' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(company!.slug)

    const { data: claim } = await supabaseAdmin
      .from('claims')
      .insert({ company_id: company!.id, user_id: userId, submitted_phone: '5559994101', status: 'pending' })
      .select('id')
      .single()
    cleanupClaimIds.push(claim!.id)

    mockGetCurrentUser.mockResolvedValue({ id: userId, email: 'b@example.com', profile: { role: 'buyer' } })
    const response = await GET()
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.claims).toHaveLength(1)
    expect(body.claims[0].company.name).toBe('My Listings Test Co')
    expect(body.claims[0].status).toBe('pending')
  })
})
