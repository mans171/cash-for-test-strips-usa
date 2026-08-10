// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/'],
      },
      { userAgent: 'GPTBot', allow: '/', disallow: ['/admin', '/admin/', '/api/'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin', '/admin/', '/api/'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin', '/admin/', '/api/'] },
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/admin', '/admin/', '/api/'] },
    ],
    sitemap: 'https://cash4teststripsusa.com/sitemap.xml',
  }
}
