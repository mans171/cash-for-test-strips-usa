import type { NextConfig } from "next";

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
    ];
  },
};

export default nextConfig;
