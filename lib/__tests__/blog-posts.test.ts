import { describe, it, expect } from 'vitest'
import { STATE_BLOG_POSTS } from '@/lib/blog-posts'

describe('STATE_BLOG_POSTS datePublished', () => {
  it('gives every post a valid ISO date', () => {
    for (const post of STATE_BLOG_POSTS) {
      expect(post.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(post.datePublished))).toBe(false)
    }
  })

  it('stagger the dates rather than using one identical date for every post', () => {
    const uniqueDates = new Set(STATE_BLOG_POSTS.map((p) => p.datePublished))
    expect(uniqueDates.size).toBeGreaterThan(1)
  })

  it('keeps every date in the past relative to the plan (before 2026-08-10)', () => {
    for (const post of STATE_BLOG_POSTS) {
      expect(Date.parse(post.datePublished)).toBeLessThan(Date.parse('2026-08-10'))
    }
  })
})
