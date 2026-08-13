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
    ];
  },
};

export default nextConfig;
