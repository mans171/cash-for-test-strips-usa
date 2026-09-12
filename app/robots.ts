// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/orders'],
      },
      { userAgent: 'GPTBot', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/orders'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/orders'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/orders'] },
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/orders'] },
    ],
    sitemap: 'https://cash4teststripsusa.com/sitemap.xml',
  }
}
