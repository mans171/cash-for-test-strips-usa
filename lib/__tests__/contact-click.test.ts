import { describe, it, expect } from 'vitest'
import { classifyContactHref } from '@/lib/contact-click'

describe('classifyContactHref', () => {
  it('tells our own numbers from a listed buyer', () => {
    expect(classifyContactHref('tel:5182786008')).toEqual({ method: 'call', target: 'house' })
    expect(classifyContactHref('tel:+15182786008')).toEqual({ method: 'call', target: 'house' })
    expect(classifyContactHref('sms:5182786008?&body=Hi')).toEqual({ method: 'text', target: 'house' })
    expect(classifyContactHref('tel:6145550100')).toEqual({ method: 'call', target: 'buyer' })
    expect(classifyContactHref('sms:6145550100?body=hello')).toEqual({ method: 'text', target: 'buyer' })
  })

  it('classifies email and buyer-website links', () => {
    expect(classifyContactHref('mailto:sell@cash4teststripsusa.com')).toEqual({ method: 'email', target: 'house' })
    expect(classifyContactHref('mailto:buyer@example.com')).toEqual({ method: 'email', target: 'buyer' })
    expect(classifyContactHref('/api/track?company=1&url=https%3A%2F%2Fx.com')).toEqual({ method: 'website', target: 'buyer' })
  })

  it('ignores ordinary links', () => {
    expect(classifyContactHref('/sell')).toBeNull()
    expect(classifyContactHref('https://example.com')).toBeNull()
    expect(classifyContactHref(null)).toBeNull()
  })
})
