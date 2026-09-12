import { STATE_BLOG_POSTS } from "./blog-posts"

export type StateRedirect = {
  source: string
  destination: string
  permanent: true
}

/**
 * Every state used to have BOTH a hand-written blog post
 * (`/blog/sell-diabetic-test-strips-texas`) and a state page
 * (`/sell-test-strips/tx`), targeting the same query. The two competed with
 * each other in search and split the internal links between them. The written
 * body now lives on the state page, so the post URL is permanently redirected
 * onto it — one page per state, all the equity on one URL.
 *
 * Imported by `next.config.ts`, so this module must stay plain TypeScript with
 * only relative imports: no path aliases, no React, no server-only modules.
 */
export function stateRedirects(): StateRedirect[] {
  return STATE_BLOG_POSTS.map((post) => ({
    source: `/blog/${post.slug}`,
    destination: `/sell-test-strips/${post.stateCode.toLowerCase()}`,
    permanent: true as const,
  }))
}
