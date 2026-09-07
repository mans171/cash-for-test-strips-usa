import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { STATE_BLOG_POSTS } from '@/lib/blog-posts'
import { STATE_LABELS } from '@/lib/states'
import { publishableCityTargets } from '@/lib/city-page-content'
import type { Company } from '@/lib/types'

const BASE_URL = 'https://cash4teststripsusa.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/directory`, changeFrequency: 'daily', priority: 0.9 },
    // Hub above the 50 state pages and 27 city pages. High priority on purpose:
    // it is the parent that gives those 77 URLs an inbound path (see
    // lib/hub-page-content.ts for why it exists).
    { url: `${BASE_URL}/sell-test-strips`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/sell`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/buyer`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/is-it-legal-to-sell-diabetic-test-strips`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/how-much-are-diabetic-test-strips-worth`, changeFrequency: 'monthly', priority: 0.8 },
    // Hand-written feature post; not in STATE_BLOG_POSTS, so not covered by blogRoutes below.
    {
      url: `${BASE_URL}/blog/sell-test-strips-albany-ny`,
      lastModified: '2026-08-13',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  const blogRoutes: MetadataRoute.Sitemap = STATE_BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.datePublished,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const stateRoutes: MetadataRoute.Sitemap = Object.keys(STATE_LABELS)
    .filter((code) => code !== 'CANADA')
    .map((code) => ({
      url: `${BASE_URL}/sell-test-strips/${code.toLowerCase()}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  // One query serves both the company routes and the city gate below. RLS
  // (companies_public_read, USING active = true) already excludes deactivated
  // buyers, so a buyer who leaves the network drops out of both at once.
  const { data: companies } = await supabase
    .from('companies')
    .select('slug, lat, lng')
    .eq('mail_in', false)

  // A city page 404s when no buyer is within CITY_BUYER_RADIUS_MI — the
  // anti-doorway gate, enforced in the page itself. The sitemap MUST apply the
  // same rule via the same function, or removing a buyer leaves Google being
  // told to crawl pages that no longer exist. That is exactly what happened on
  // 2026-09-06 to /wv/charleston and /wv/huntington.
  const buyersForGate = (companies ?? []) as unknown as Company[]
  const cityRoutes: MetadataRoute.Sitemap = publishableCityTargets(buyersForGate).map((c) => ({
    url: `${BASE_URL}/sell-test-strips/${c.state.toLowerCase()}/${c.slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const companyRoutes: MetadataRoute.Sitemap = (companies ?? []).map((c) => ({
    url: `${BASE_URL}/company/${c.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...blogRoutes, ...stateRoutes, ...cityRoutes, ...companyRoutes]
}
