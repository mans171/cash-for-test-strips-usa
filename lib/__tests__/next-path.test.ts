import { describe, it, expect } from 'vitest'
import { safeNextPath } from '@/lib/next-path'

describe('safeNextPath', () => {
  it('accepts a same-origin path', () => {
    expect(safeNextPath('/orders')).toBe('/orders')
    expect(safeNextPath('/orders?x=1')).toBe('/orders?x=1')
  })

  it('rejects anything that leaves the site', () => {
    expect(safeNextPath('//evil.example.com')).toBe('/')
    expect(safeNextPath('/\\evil.example.com')).toBe('/')
    expect(safeNextPath('https://evil.example.com')).toBe('/')
    expect(safeNextPath('orders')).toBe('/')
  })

  it('falls back when absent', () => {
    expect(safeNextPath(null)).toBe('/')
    expect(safeNextPath('')).toBe('/')
  })
})
