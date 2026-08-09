import { describe, it, expect } from 'vitest'
import { DEFAULT_EXPIRATION_MONTHS, getExpirationMonthOptions, isEffectivelyExpired, monthsFromNowToYYYYMM } from '@/lib/expiration'

describe('getExpirationMonthOptions', () => {
  it('has 26 options from 0 to 24 months plus a 24+ catch-all, each labeled with its calendar month', () => {
    const aug27 = new Date(2026, 7, 27) // August 27, 2026
    const options = getExpirationMonthOptions(aug27)
    expect(options).toHaveLength(26)
    expect(options[0]).toEqual({ value: 0, label: 'Already expired / less than 1 month' })
    expect(options[1]).toEqual({ value: 1, label: '1 month (Sep 2026)' })
    expect(options[9]).toEqual({ value: 9, label: '9 months (May 2027)' })
    expect(options[24]).toEqual({ value: 24, label: '24 months (Aug 2028)' })
    expect(options[25]).toEqual({ value: 25, label: '24+ months' })
  })

  it('defaults to the current date when none is passed', () => {
    expect(getExpirationMonthOptions()).toHaveLength(26)
  })
})

describe('DEFAULT_EXPIRATION_MONTHS', () => {
  it('is 9', () => {
    expect(DEFAULT_EXPIRATION_MONTHS).toBe(9)
  })
})

describe('isEffectivelyExpired', () => {
  it('is expired when today is past the 25th and only 1 month was selected', () => {
    const aug27 = new Date(2026, 7, 27) // August 27, 2026
    expect(isEffectivelyExpired(1, aug27)).toBe(true)
  })

  it('is not expired when today is past the 25th but 2+ months were selected', () => {
    const aug27 = new Date(2026, 7, 27)
    expect(isEffectivelyExpired(2, aug27)).toBe(false)
  })

  it('is not expired when today is on/before the 25th and 1 month was selected', () => {
    const aug25 = new Date(2026, 7, 25)
    expect(isEffectivelyExpired(1, aug25)).toBe(false)
  })

  it('0 months selected is always expired regardless of the day', () => {
    const aug10 = new Date(2026, 7, 10)
    expect(isEffectivelyExpired(0, aug10)).toBe(true)
  })
})

describe('monthsFromNowToYYYYMM', () => {
  it('computes the target YYYY-MM by adding calendar months to today', () => {
    const aug27 = new Date(2026, 7, 27)
    expect(monthsFromNowToYYYYMM(1, aug27)).toBe('2026-09')
    expect(monthsFromNowToYYYYMM(0, aug27)).toBe('2026-08')
  })

  it('rolls over into the next year correctly', () => {
    const nov15 = new Date(2026, 10, 15)
    expect(monthsFromNowToYYYYMM(3, nov15)).toBe('2027-02')
  })
})
