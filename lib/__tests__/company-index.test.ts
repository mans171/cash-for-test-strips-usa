import { describe, it, expect } from 'vitest'
import { isIndexableProfile } from '@/lib/company-index'
describe('isIndexableProfile', () => {
  it('house number and no site → noindex', () => { expect(isIndexableProfile({ phone: '518-278-6008', url: null, mail_in: false })).toBe(false) })
  it('house number but own site → index', () => { expect(isIndexableProfile({ phone: '518-278-6008', url: 'https://x', mail_in: false })).toBe(true) })
  it('own number → index', () => { expect(isIndexableProfile({ phone: '689-250-2042', url: null, mail_in: false })).toBe(true) })
  it('mail-in → noindex', () => { expect(isIndexableProfile({ phone: null, url: null, mail_in: true })).toBe(false) })
})
