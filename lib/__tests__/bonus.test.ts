import { describe, it, expect } from 'vitest'
import { honorsBonus } from '@/lib/bonus'
describe('honorsBonus', () => {
  it('house line, any formatting', () => {
    expect(honorsBonus({ phone: '518-278-6008', mail_in: false, slug: 'x' })).toBe(true)
    expect(honorsBonus({ phone: '5182786008', mail_in: false, slug: 'x' })).toBe(true)
    expect(honorsBonus({ phone: '518-779-9751', mail_in: false, slug: 'x' })).toBe(true)
  })
  it('mail-in', () => { expect(honorsBonus({ phone: null, mail_in: true, slug: 'cfts-mail-in' })).toBe(true) })
  it('third party with its own number does not', () => {
    expect(honorsBonus({ phone: '689-250-2042', mail_in: false, slug: 'liliana-orlando-fl' })).toBe(false)
    expect(honorsBonus({ phone: null, mail_in: false, slug: '864medex-greenville-sc' })).toBe(false)
  })
})
