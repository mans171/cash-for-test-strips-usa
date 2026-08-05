import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { POST } from '../route'

const cleanupIds: string[] = []

afterEach(async () => {
  if (cleanupIds.length) {
    await supabaseAdmin.from('submissions').delete().in('id', cleanupIds)
    cleanupIds.length = 0
  }
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/submissions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/submissions', () => {
  it('returns 400 for an invalid payload', async () => {
    const response = await POST(
      makeRequest({ targetCompanyId: null, submittedPhone: '5551234567', payload: { name: '', states: [] } })
    )
    expect(response.status).toBe(400)
  })

  it('creates a pending submission for a valid payload', async () => {
    const response = await POST(
      makeRequest({
        targetCompanyId: null,
        submittedPhone: '5551234568',
        payload: { name: 'Route Test Co', states: ['NY'], phone: '5551234568' },
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.submissionId).toBeDefined()
    cleanupIds.push(body.submissionId)
  })
})
