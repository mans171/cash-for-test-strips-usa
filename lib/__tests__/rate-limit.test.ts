import { describe, it, expect } from 'vitest'
import {
  checkRateLimit,
  clientIp,
  pruneRateLimitStore,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  type RateLimitStore,
} from '@/lib/rate-limit'

const T0 = 1_700_000_000_000

describe('checkRateLimit', () => {
  it('allows the first 5 attempts and denies the 6th with a Retry-After', () => {
    const store: RateLimitStore = new Map()
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit('1.1.1.1', { store, now: T0 + i * 1000 })).toEqual({ allowed: true, retryAfterSeconds: 0 })
    }
    const denied = checkRateLimit('1.1.1.1', { store, now: T0 + 30_000 })
    expect(denied.allowed).toBe(false)
    // Window opened at T0, 30s in: 570s remain.
    expect(denied.retryAfterSeconds).toBe(570)
  })

  it('never reports a zero Retry-After while denied', () => {
    const store: RateLimitStore = new Map()
    for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('k', { store, now: T0 })
    const denied = checkRateLimit('k', { store, now: T0 + RATE_LIMIT_WINDOW_MS - 1 })
    expect(denied.allowed).toBe(false)
    expect(denied.retryAfterSeconds).toBe(1)
  })

  it('keys are independent', () => {
    const store: RateLimitStore = new Map()
    for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('a', { store, now: T0 })
    expect(checkRateLimit('a', { store, now: T0 }).allowed).toBe(false)
    expect(checkRateLimit('b', { store, now: T0 }).allowed).toBe(true)
  })

  it('resets once the window has ended', () => {
    const store: RateLimitStore = new Map()
    for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit('a', { store, now: T0 })
    expect(checkRateLimit('a', { store, now: T0 + RATE_LIMIT_WINDOW_MS - 1 }).allowed).toBe(false)
    const fresh = checkRateLimit('a', { store, now: T0 + RATE_LIMIT_WINDOW_MS })
    expect(fresh.allowed).toBe(true)
    expect(store.get('a')?.count).toBe(1)
  })

  it('honours custom max and window', () => {
    const store: RateLimitStore = new Map()
    expect(checkRateLimit('a', { store, now: T0, max: 1, windowMs: 1000 }).allowed).toBe(true)
    expect(checkRateLimit('a', { store, now: T0, max: 1, windowMs: 1000 }).allowed).toBe(false)
    expect(checkRateLimit('a', { store, now: T0 + 1000, max: 1, windowMs: 1000 }).allowed).toBe(true)
  })
})

describe('pruneRateLimitStore', () => {
  it('drops expired keys and keeps live ones', () => {
    const store: RateLimitStore = new Map()
    checkRateLimit('old', { store, now: T0 })
    checkRateLimit('new', { store, now: T0 + RATE_LIMIT_WINDOW_MS - 1 })
    pruneRateLimitStore(store, T0 + RATE_LIMIT_WINDOW_MS)
    expect([...store.keys()]).toEqual(['new'])
  })

  it('is applied on every check, so the map cannot grow unbounded', () => {
    const store: RateLimitStore = new Map()
    for (let i = 0; i < 1000; i++) checkRateLimit(`ip-${i}`, { store, now: T0 })
    expect(store.size).toBe(1000)
    checkRateLimit('later', { store, now: T0 + RATE_LIMIT_WINDOW_MS })
    expect(store.size).toBe(1)
  })
})

describe('clientIp', () => {
  it('takes the first x-forwarded-for hop', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': ' 203.0.113.9 , 10.0.0.1' }))).toBe('203.0.113.9')
  })
  it('falls back to x-real-ip', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4')
  })
  it('prefers x-forwarded-for over x-real-ip', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '5.6.7.8' }))).toBe('1.2.3.4')
  })
  it('treats an empty forwarded header as absent', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': ' , 10.0.0.1', 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8')
  })
  it('is "unknown" with no headers', () => {
    expect(clientIp(new Headers())).toBe('unknown')
  })
})
