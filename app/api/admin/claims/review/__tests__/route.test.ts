import { describe, it, expect, afterEach, vi } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { signSession, ADMIN_SESSION_COOKIE_NAME } from '@/lib/admin-auth'
import { createClaim } from '@/lib/claims'
import { POST } from '../route'

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

function makeRequest(body: unknown, cookie?: string) {
  return new Request('http://localhost/api/admin/claims/review', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie: `${ADMIN_SESSION_COOKIE_NAME}=${cookie}` } : {}),
    },
  })
}

describe('POST /api/admin/claims/review', () => {
  it('rejects requests without a valid admin session', async () => {
    const response = await POST(makeRequest({ claimId: 'x', action: 'approve' }))
    expect(response.status).toBe(401)
  })

  it('approves a pending claim when authenticated', async () => {
    const { data: userData } = await supabaseAdmin.auth.admin.createUser({
      email: `claims-review-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const { data: company } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Admin Claim Review Co', slug: 'admin-claim-review-co', states: ['NY'], active: true, phone: '5559994201' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(company!.slug)

    const claim = await createClaim({ companyId: company!.id, userId, submittedPhone: '5559994201' })
    cleanupClaimIds.push(claim.id)

    const response = await POST(makeRequest({ claimId: claim.id, action: 'approve' }, signSession()))
    expect(response.status).toBe(200)

    const { data: updated } = await supabaseAdmin.from('claims').select('status').eq('id', claim.id).single()
    expect(updated?.status).toBe('approved')
  })

  it('rejects a pending claim when authenticated', async () => {
    const { data: userData } = await supabaseAdmin.auth.admin.createUser({
      email: `claims-review-reject-test-${Date.now()}@example.com`,
      password: 'test-password-123',
      email_confirm: true,
    })
    const userId = userData!.user!.id
    cleanupUserIds.push(userId)

    const { data: company } = await supabaseAdmin
      .from('companies')
      .insert({ name: 'Claim Reject Test Co', slug: 'claim-reject-test-co', states: ['NY'], active: true, phone: '5559994202' })
      .select('id, slug')
      .single()
    cleanupCompanySlugs.push(company!.slug)

    const claim = await createClaim({ companyId: company!.id, userId, submittedPhone: '5559994202' })
    cleanupClaimIds.push(claim.id)

    const response = await POST(makeRequest({ claimId: claim.id, action: 'reject' }, signSession()))
    expect(response.status).toBe(200)

    const { data: updated } = await supabaseAdmin.from('claims').select('status').eq('id', claim.id).single()
    expect(updated?.status).toBe('rejected')
  })

  it('returns 400 when claimId is missing', async () => {
    const response = await POST(makeRequest({ action: 'approve' }, signSession()))
    expect(response.status).toBe(400)
  })

  it('returns 400 when action is invalid', async () => {
    const response = await POST(makeRequest({ claimId: 'x', action: 'bogus' }, signSession()))
    expect(response.status).toBe(400)
  })
})
