import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { STATE_LABELS } from '@/lib/states'
import { POST_REGISTRY } from '@/lib/posts'
import { publishableCityTargets } from '@/lib/city-page-content'
import { isIndexableProfile } from '@/lib/company-index'
import type { Company } from '@/lib/types'

const BASE_URL = 'https://cash4teststripsusa.com'

// Date the hand-written state guides moved onto the state pages (2026-09-12). Bump when their content next changes.
const STATE_GUIDES_MODIFIED = '2026-09-12'

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
    // Reseller-facing money page: its own search intent, not a blog post.
    { url: `${BASE_URL}/sell-test-strips-in-bulk`, changeFrequency: 'monthly', priority: 0.9 },
    // /buyer is login-gated; Google rejected it on 2026-09-01 and it must not
    // appear in the sitemap. The page itself carries noindex robots metadata.
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/is-it-legal-to-sell-diabetic-test-strips`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/how-much-are-diabetic-test-strips-worth`, changeFrequency: 'monthly', priority: 0.8 },
    // Hand-written feature post; its own route, not part of the state set.
    {
      url: `${BASE_URL}/blog/sell-test-strips-albany-ny`,
      lastModified: '2026-08-13',
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // The 50 state posts are gone from /blog — their bodies moved onto the
  // state pages and their URLs permanently redirect there (next.config.ts).
  // A redirecting URL must never be submitted in a sitemap; the state routes
  // below carry the posts' publish dates instead.

  // Non-state posts registered in lib/posts/index.ts.
  const registryRoutes: MetadataRoute.Sitemap = POST_REGISTRY.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.dateModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const stateRoutes: MetadataRoute.Sitemap = Object.keys(STATE_LABELS)
    .filter((code) => code !== 'CANADA')
    .map((code) => ({
      url: `${BASE_URL}/sell-test-strips/${code.toLowerCase()}`,
      lastModified: STATE_GUIDES_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))

  // One query serves both the company routes and the city gate below. RLS
  // (companies_public_read, USING active = true) already excludes deactivated
  // buyers, so a buyer who leaves the network drops out of both at once.
  const { data: companies } = await supabase
    .from('companies')
    .select('slug, lat, lng, phone, url, mail_in')
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

  const companyRoutes: MetadataRoute.Sitemap = (companies ?? [])
    .filter(isIndexableProfile)
    .map((c) => ({
      url: `${BASE_URL}/company/${c.slug}`,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  return [...staticRoutes, ...registryRoutes, ...stateRoutes, ...cityRoutes, ...companyRoutes]
}
