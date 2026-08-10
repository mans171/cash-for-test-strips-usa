// lib/schema.ts

export type FaqItem = { question: string; answer: string }

export function buildFaqPageSchema(faqs: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

export type BreadcrumbItem = { name: string; url: string }

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export type LocalBusinessInput = {
  name: string
  url: string
  telephone: string | null
  description: string | null
  areaServed: string[]
  paymentAccepted: string[]
}

export function buildLocalBusinessSchema(input: LocalBusinessInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: input.name,
    url: input.url,
  }
  if (input.telephone) schema.telephone = input.telephone
  if (input.description) schema.description = input.description
  if (input.areaServed.length > 0) schema.areaServed = input.areaServed
  if (input.paymentAccepted.length > 0) schema.paymentAccepted = input.paymentAccepted
  return schema
}

export type ArticleInput = {
  headline: string
  description: string
  datePublished: string
  url: string
}

export function buildArticleSchema(input: ArticleInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished,
    url: input.url,
    author: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
    publisher: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
  }
}

export function buildWebsiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Cash For Test Strips USA',
    url: 'https://cash4teststripsusa.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://cash4teststripsusa.com/directory?state={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildServiceSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Diabetic Test Strip Buyer Directory',
    provider: { '@type': 'Organization', name: 'Cash For Test Strips USA' },
    areaServed: 'United States',
  }
}

export type ItemListEntry = { name: string; url: string }

export function buildItemListSchema(items: ItemListEntry[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  }
}
