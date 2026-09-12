import type { NextConfig } from "next";
import { stateRedirects } from "./lib/state-post-redirects";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Force the www host to the apex domain so Google indexes one canonical
      // host instead of treating www and apex as duplicate copies of the site.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.cash4teststripsusa.com" }],
        destination: "https://cash4teststripsusa.com/:path*",
        permanent: true,
      },
      // The Keyport listing was originally slugged with its previous operator's
      // first name. It has been reassigned and the slug now follows the CFTS
      // convention; this keeps the old URL from 404ing for anything that
      // already links to or has indexed it.
      {
        source: "/company/nichole-keyport-nj",
        destination: "/company/cash-for-test-strips-keyport-nj",
        permanent: true,
      },
      // /price-guide was linked from 23 blog posts but never existed as a
      // route — the guide has always lived at the long URL below. Those links
      // are fixed at source, but this catches anything outside the site that
      // already points at the short path, including whatever Google indexed
      // while they were live. Found by scripts/crawl-check.ts.
      {
        source: "/price-guide",
        destination: "/how-much-are-diabetic-test-strips-worth",
        permanent: true,
      },
      // The 50 state blog posts folded into the 50 state pages — their
      // hand-written bodies now render there. Both URLs targeted the same
      // query and competed with each other; these send the post URL and its
      // accumulated equity to the one surviving page.
      // Source of truth: lib/state-post-redirects.ts (built from STATE_BLOG_POSTS).
      ...stateRedirects(),
    ];
  },
};

export default nextConfig;
