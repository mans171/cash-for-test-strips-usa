import { describe, it, expect } from 'vitest'
import { stateRedirects } from '@/lib/state-post-redirects'
describe('stateRedirects', () => {
  it('maps every state post to its state page, permanently', () => {
    const r = stateRedirects()
    expect(r).toHaveLength(50)
    expect(r.find((x) => x.source === '/blog/sell-diabetic-test-strips-texas')).toEqual({
      source: '/blog/sell-diabetic-test-strips-texas', destination: '/sell-test-strips/tx', permanent: true,
    })
    expect(new Set(r.map((x) => x.destination)).size).toBe(50)
  })
})
