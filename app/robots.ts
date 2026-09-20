// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/orders', '/kit/'],
      },
      { userAgent: 'GPTBot', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/orders', '/kit/'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/orders', '/kit/'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/orders', '/kit/'] },
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/admin', '/admin/', '/api/', '/orders', '/kit/'] },
    ],
    sitemap: 'https://cash4teststripsusa.com/sitemap.xml',
  }
}
