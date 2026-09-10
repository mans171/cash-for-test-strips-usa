import { describe, it, expect } from 'vitest'
import { hasProfilePage } from '@/lib/company-profile'

describe('hasProfilePage', () => {
  it('is false for a mail-in buyer, which has no /company page', () => {
    expect(hasProfilePage({ mail_in: true })).toBe(false)
  })

  it('is true for an in-person buyer', () => {
    expect(hasProfilePage({ mail_in: false })).toBe(true)
  })

  it('treats a missing flag as an in-person buyer', () => {
    expect(hasProfilePage({ mail_in: undefined })).toBe(true)
  })
})
