import { describe, it, expect } from 'vitest'
import { pickBulkRecipient, hasDedicatedBulkBuyer } from '@/lib/bulk-routing'
import { OWNER_EMAIL } from '@/lib/owner'
const co = (o: Partial<{states:string[];email:string|null;active:boolean;mail_in:boolean;name:string;slug:string}> = {}) =>
  ({ states: ['NY'], email: null, active: true, mail_in: false, name: 'N', slug: 's', ...o })
describe('bulk routing', () => {
  it('routes to the state buyer with an email, cc house', () => {
    const r = pickBulkRecipient('NY', [co({ email: 'buyer@x.com', name: 'Albany' })])
    expect(r).toEqual({ to: 'buyer@x.com', cc: OWNER_EMAIL, buyerName: 'Albany' })
  })
  it('falls back to the house when no buyer has an email', () => {
    expect(pickBulkRecipient('NY', [co()])).toEqual({ to: OWNER_EMAIL, cc: null, buyerName: null })
    expect(hasDedicatedBulkBuyer('NY', [co()])).toBe(false)
  })
  it('treats the sell@ house address as no dedicated buyer', () => {
    expect(pickBulkRecipient('NY', [co({ email: 'Sell@cash4teststripsusa.com' })])).toEqual({ to: OWNER_EMAIL, cc: null, buyerName: null })
    expect(hasDedicatedBulkBuyer('NY', [co({ email: 'sell@cash4teststripsusa.com' })])).toBe(false)
  })
  it('ignores inactive and mail-in rows', () => {
    expect(pickBulkRecipient('NY', [co({ email: 'a@b.c', active: false }), co({ email: 'm@b.c', mail_in: true })]).to).toBe(OWNER_EMAIL)
  })
  it('is case-insensitive on the code', () => {
    expect(pickBulkRecipient('ny', [co({ email: 'a@b.c' })]).to).toBe('a@b.c')
  })
})
