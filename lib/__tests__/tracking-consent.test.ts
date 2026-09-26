import { describe, it, expect } from 'vitest'
import { browserTrackingAllowed, isPrivatePath, serverTrackingAllowed } from '@/lib/tracking-consent'

describe('tracking consent', () => {
  it('keeps Tag Manager off the private pages', () => {
    for (const p of ['/admin', '/admin/login', '/admin/reset', '/kit/abc123', '/reset-password']) {
      expect(isPrivatePath(p), p).toBe(true)
    }
    for (const p of ['/', '/sell', '/mail-in-kit', '/kit', '/administrator-guide', '/directory', '/privacy']) {
      expect(isPrivatePath(p), p).toBe(false)
    }
  })

  it('loads Tag Manager on public pages for a visitor who has not opted out', () => {
    expect(browserTrackingAllowed({ pathname: '/sell', cookie: 'c4ts_zip=12203', gpc: false })).toBe(true)
  })

  it('does not load it after an opt-out, under Global Privacy Control, or on a private page', () => {
    expect(browserTrackingAllowed({ pathname: '/sell', cookie: 'a=1; c4ts_ad_optout=1', gpc: false })).toBe(false)
    expect(browserTrackingAllowed({ pathname: '/sell', cookie: '', gpc: true })).toBe(false)
    expect(browserTrackingAllowed({ pathname: '/kit/tok', cookie: '', gpc: false })).toBe(false)
  })

  it('applies the same rules to the server half', () => {
    expect(serverTrackingAllowed(new Headers())).toBe(true)
    expect(serverTrackingAllowed(new Headers({ 'sec-gpc': '1' }))).toBe(false)
    expect(serverTrackingAllowed(new Headers({ cookie: 'c4ts_ad_optout=1' }))).toBe(false)
    expect(serverTrackingAllowed(new Headers({ cookie: 'c4ts_ad_optout=0' }))).toBe(true)
  })
})
