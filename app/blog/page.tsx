import Link from "next/link";
import type { Metadata } from "next";
import { STATE_BLOG_POSTS } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog — How to Sell Diabetic Test Strips for Cash by State",
  description:
    "State-by-state guides on how to sell unused diabetic test strips for cash. Find local buyers, learn what's accepted, and get paid fast via PayPal, Zelle, or check.",
  alternates: { canonical: 'https://cash4teststripsusa.com/blog' },
};

export default function BlogIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <nav className="text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-emerald-600">Home</Link>
          {" / "}
          <span className="text-gray-700">Blog</span>
        </nav>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          How to Sell Diabetic Test Strips for Cash — State Guides
        </h1>
        <p className="text-gray-500 max-w-2xl leading-relaxed">
          Browse our state-by-state guides to selling unused diabetic test strips for cash. We accept
          all major brands, single boxes, and bulk lots. Call us at{" "}
          <a href="tel:5187799751" className="text-emerald-600 font-semibold hover:underline">
            518-779-9751
          </a>{" "}
          — most inquiries answered within hours.
        </p>
      </div>

      {/* Featured city guides — hand-written, outside the state-guide set */}
      <Link
        href="/blog/sell-test-strips-albany-ny"
        className="group block bg-white border border-emerald-100 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            City guide
          </span>
          <span className="text-xs text-gray-400">Albany, NY</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">
          Where to Sell Diabetic Test Strips in Albany, NY
        </h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Who buys unused strips, CGM sensors and Omnipod pods across the Capital Region, what they
          pay for, and how same-day local pickup works.
        </p>
      </Link>

      {/* State grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STATE_BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {post.stateCode}
              </span>
              <span className="text-xs text-gray-400">Sell Test Strips</span>
            </div>
            <h2 className="text-sm font-semibold text-gray-900 leading-snug group-hover:text-emerald-700 transition-colors">
              {post.stateName}
            </h2>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
              {post.metaDescription}
            </p>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-14 bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Ready to sell? Call or text us now.
        </h2>
        <p className="text-gray-500 text-sm mb-5">
          We buy all major brands, single boxes, and bulk lots. PayPal, Zelle, check, or cash in hand.
        </p>
        <a
          href="tel:5187799751"
          className="inline-block bg-emerald-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-emerald-700 transition-colors"
        >
          Call 518-779-9751
        </a>
      </div>
    </div>
  );
}
