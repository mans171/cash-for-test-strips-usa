import { describe, it, expect, afterEach } from 'vitest'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { POST } from '../route'

const cleanupIds: string[] = []

afterEach(async () => {
  if (cleanupIds.length) {
    await supabaseAdmin.from('leads').delete().in('id', cleanupIds)
    cleanupIds.length = 0
  }
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/leads', () => {
  it('returns 400 when items is empty', async () => {
    const response = await POST(makeRequest({ items: [], matchedCompanyId: null, channel: 'sms' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 for an invalid channel', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'carrier-pigeon',
      })
    )
    expect(response.status).toBe(400)
  })

  it('creates a lead and returns the prefilled message', async () => {
    const response = await POST(
      makeRequest({
        items: [{ brand: 'OneTouch Verio', count: 1, expiration: '2027-01', condition: 'sealed' }],
        matchedCompanyId: null,
        channel: 'sms',
        sourcePage: '/sell',
      })
    )
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.leadId).toBeDefined()
    expect(body.message).toContain('OneTouch Verio')
    cleanupIds.push(body.leadId)
  })
})
