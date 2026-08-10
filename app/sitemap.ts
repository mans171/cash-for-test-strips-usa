import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { STATE_BLOG_POSTS } from '@/lib/blog-posts'
import { STATE_LABELS } from '@/lib/states'

const BASE_URL = 'https://cash4teststripsusa.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/directory`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/sell`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/buyer`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/is-it-legal-to-sell-diabetic-test-strips`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/how-much-are-diabetic-test-strips-worth`, changeFrequency: 'monthly', priority: 0.8 },
  ]

  const blogRoutes: MetadataRoute.Sitemap = STATE_BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
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

  const { data: companies } = await supabase
    .from('companies')
    .select('slug')
    .eq('mail_in', false)

  const companyRoutes: MetadataRoute.Sitemap = (companies ?? []).map((c) => ({
    url: `${BASE_URL}/company/${c.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...blogRoutes, ...stateRoutes, ...companyRoutes]
}
