import { describe, it, expect } from 'vitest'
import {
  buildFaqPageSchema,
  buildBreadcrumbSchema,
  buildLocalBusinessSchema,
  buildArticleSchema,
  buildWebsiteSchema,
  buildServiceSchema,
  buildItemListSchema,
} from '@/lib/schema'

describe('buildFaqPageSchema', () => {
  it('builds a FAQPage schema with mainEntity questions', () => {
    const result = buildFaqPageSchema([
      { question: 'Is it legal?', answer: 'Yes, in most cases.' },
      { question: 'How fast is payment?', answer: 'Within 24 hours.' },
    ])
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'Is it legal?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, in most cases.' } },
        { '@type': 'Question', name: 'How fast is payment?', acceptedAnswer: { '@type': 'Answer', text: 'Within 24 hours.' } },
      ],
    })
  })

  it('handles an empty list', () => {
    expect(buildFaqPageSchema([])).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [],
    })
  })
})

describe('buildBreadcrumbSchema', () => {
  it('builds a BreadcrumbList with 1-indexed positions', () => {
    const result = buildBreadcrumbSchema([
      { name: 'Home', url: 'https://cash4teststripsusa.com' },
      { name: 'Alabama', url: 'https://cash4teststripsusa.com/blog/sell-diabetic-test-strips-alabama' },
    ])
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cash4teststripsusa.com' },
        { '@type': 'ListItem', position: 2, name: 'Alabama', item: 'https://cash4teststripsusa.com/blog/sell-diabetic-test-strips-alabama' },
      ],
    })
  })
})

describe('buildLocalBusinessSchema', () => {
  it('includes optional fields when present', () => {
    const result = buildLocalBusinessSchema({
      name: 'Test Buyer Co',
      url: 'https://cash4teststripsusa.com/company/test-buyer-co',
      telephone: '5185551234',
      description: 'We buy test strips.',
      areaServed: ['New York', 'New Jersey'],
      paymentAccepted: ['PayPal', 'Zelle'],
    })
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Test Buyer Co',
      url: 'https://cash4teststripsusa.com/company/test-buyer-co',
      telephone: '5185551234',
      description: 'We buy test strips.',
      areaServed: ['New York', 'New Jersey'],
      paymentAccepted: ['PayPal', 'Zelle'],
    })
  })

  it('omits optional fields when absent', () => {
    const result = buildLocalBusinessSchema({
      name: 'Anon Buyer Co',
      url: 'https://cash4teststripsusa.com/company/anon-buyer-co',
      telephone: null,
      description: null,
      areaServed: [],
      paymentAccepted: [],
    })
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Anon Buyer Co',
      url: 'https://cash4teststripsusa.com/company/anon-buyer-co',
    })
  })
})

describe('buildArticleSchema', () => {
  it('builds an Article schema with org author/publisher', () => {
    const result = buildArticleSchema({
      headline: 'Sell Diabetic Test Strips in Alabama',
      description: 'A guide to selling test strips in Alabama.',
      datePublished: '2026-05-19',
      url: 'https://cash4teststripsusa.com/blog/sell-diabetic-test-strips-alabama',
    })
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Sell Diabetic Test Strips in Alabama',
      description: 'A guide to selling test strips in Alabama.',
      datePublished: '2026-05-19',
      dateModified: '2026-05-19',
      image: 'https://cash4teststripsusa.com/opengraph-image',
      url: 'https://cash4teststripsusa.com/blog/sell-diabetic-test-strips-alabama',
      author: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
      publisher: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
    })
  })
})

describe('buildWebsiteSchema / buildServiceSchema', () => {
  it('builds a WebSite schema with a SearchAction', () => {
    const result = buildWebsiteSchema()
    expect(result).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Cash For Test Strips USA',
      url: 'https://cash4teststripsusa.com',
    })
    expect(result.potentialAction).toBeDefined()
  })

  it('builds a Service schema', () => {
    expect(buildServiceSchema()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Diabetic Test Strip Buyer Directory',
      provider: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
      areaServed: 'United States',
    })
  })
})

describe('buildItemListSchema', () => {
  it('builds an ItemList with 1-indexed positions', () => {
    const result = buildItemListSchema([
      { name: 'Test Buyer One', url: 'https://cash4teststripsusa.com/company/test-buyer-one' },
      { name: 'Test Buyer Two', url: 'https://cash4teststripsusa.com/company/test-buyer-two' },
    ])
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Test Buyer One', url: 'https://cash4teststripsusa.com/company/test-buyer-one' },
        { '@type': 'ListItem', position: 2, name: 'Test Buyer Two', url: 'https://cash4teststripsusa.com/company/test-buyer-two' },
      ],
    })
  })
})
