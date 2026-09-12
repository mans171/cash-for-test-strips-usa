// lib/schema.ts

import { OWNER_PHONE } from './owner'

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
  /** Town the buyer operates from, when known. */
  city: string | null
  /** Two-letter state code the buyer operates from, when known. */
  stateCode: string | null
}

/**
 * PostalAddress for a buyer.
 *
 * Street addresses are not held in the database and are contact-gated anyway,
 * so this is built from the town and state that already appear publicly in the
 * page title and heading. addressCountry is always present, so the address is
 * never an empty object.
 */
function buildPostalAddress(city: string | null, stateCode: string | null): Record<string, unknown> {
  const address: Record<string, unknown> = {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  }
  if (city) address.addressLocality = city
  if (stateCode) address.addressRegion = stateCode
  return address
}

export function buildLocalBusinessSchema(input: LocalBusinessInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: input.name,
    url: input.url,
    // Google requires `address` on LocalBusiness. Without it the item is
    // invalid and earns no rich result — which is what Semrush's Site Audit
    // flagged across the company profiles on 2026-09-10.
    address: buildPostalAddress(input.city, input.stateCode),
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
    // No per-post edit tracking exists yet, so dateModified mirrors
    // datePublished rather than going unset.
    dateModified: input.datePublished,
    image: 'https://cash4teststripsusa.com/opengraph-image',
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

/** The homepage block. It used to describe a Service ("buyer directory") that
 *  pointed at other companies; the site now buys supplies itself, so this is
 *  the business, with the number people actually call. */
export function buildServiceSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Cash For Test Strips USA',
    url: 'https://cash4teststripsusa.com',
    telephone: OWNER_PHONE,
    email: 'sell@cash4teststripsusa.com',
    areaServed: 'United States',
    description:
      'Buys sealed, unexpired diabetic test strips, CGM sensors and pump supplies by mail from any US state, and in person through local buyers.',
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
