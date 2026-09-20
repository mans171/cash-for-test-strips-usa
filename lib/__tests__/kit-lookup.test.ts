import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase-admin', async () => ({ supabaseAdmin: (await import('@/test/mail-in-fake-db')).fakeDb.client }))

import { fakeDb } from '@/test/mail-in-fake-db'
import { loadSellerView } from '../kit-lookup'

const MINE = 'c'.repeat(64)
const THEIRS = 'd'.repeat(64)

beforeEach(() => fakeDb.reset())

describe('loadSellerView — the /kit/<token> lookup', () => {
  it.each(['', 'abc', 'C'.repeat(64), 'c'.repeat(63), `${'c'.repeat(64)}x`, "c' or '1'='1", '../admin'])(
    'returns null for the malformed token %j without touching the database',
    async (token) => {
      fakeDb.seedOrder({ token: MINE })
      expect(await loadSellerView(token)).toBeNull()
      expect(fakeDb.state.touched).toBe(0)
    }
  )

  it('returns null for a well-formed token nobody holds, and for a closed kit', async () => {
    fakeDb.seedOrder({ token: MINE })
    expect(await loadSellerView('e'.repeat(64))).toBeNull()
    fakeDb.seedOrder({ token: THEIRS, status: 'closed' })
    expect(await loadSellerView(THEIRS)).toBeNull()
  })

  it('serializes nothing sensitive, and nothing about any other seller', async () => {
    fakeDb.seedOrder({
      token: MINE, order_number: 'MK-MINE01', status: 'paid', paid_amount: 118.27, paid_at: '2026-09-25T12:00:00.000Z',
      quoted_amount: 123.45, problem_reason: 'REASON-SENTINEL', lead_id: '22222222-2222-4222-8222-222222222222',
    })
    fakeDb.seedOrder({ token: THEIRS, order_number: 'MK-THEIRS', name: 'Other Person', phone: '2125550199' })

    const json = JSON.stringify(await loadSellerView(MINE))
    expect(json).toContain('MK-MINE01')
    expect(json).toContain('"paid":true')
    for (const secret of [
      '123.45', '118.27', 'pat-secret-handle@example.com', 'INTERNAL-NOTE-SENTINEL', 'REASON-SENTINEL', 'zelle',
      MINE, THEIRS, 'MK-THEIRS', 'Other Person', '2125550199', '22222222-2222', '5185550100', '12 Elm St',
    ]) {
      expect(json, secret).not.toContain(secret)
    }
  })
})
