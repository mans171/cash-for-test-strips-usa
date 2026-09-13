import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { POST_REGISTRY, getRegistryPost } from "@/lib/posts";
import { buildFaqPageSchema, buildArticleSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import { pageTitle } from "@/lib/title";

/**
 * Non-state blog posts only.
 *
 * The 50 state posts used to render here too, from STATE_BLOG_POSTS. They were
 * folded into the state pages on 2026-09-12 — one page per state instead of a
 * post and a landing page competing for the same query — and every state slug
 * now 308s to /sell-test-strips/<code> from next.config.ts. A state slug that
 * somehow reaches this route (the redirect fires first) falls through to
 * notFound(), which is correct: there is no state post any more.
 */

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return POST_REGISTRY.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const registryPost = getRegistryPost(slug);
  if (!registryPost) return { title: pageTitle("Post Not Found") };
  // shortTitle is the <title>-only override for posts whose headline runs past
  // the 60-character budget; the H1 below still renders the full title.
  const metaTitle = pageTitle(registryPost.shortTitle ?? registryPost.title);
  return {
    title: metaTitle,
    description: registryPost.description,
    alternates: { canonical: `https://cash4teststripsusa.com/blog/${registryPost.slug}` },
    openGraph: { title: metaTitle, description: registryPost.description, type: "article" },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const registryPost = getRegistryPost(slug);
  if (!registryPost) notFound();

  const pageUrl = `https://cash4teststripsusa.com/blog/${registryPost.slug}`;
  const articleSchema = buildArticleSchema({
    headline: registryPost.title,
    description: registryPost.description,
    datePublished: registryPost.datePublished,
    url: pageUrl,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://cash4teststripsusa.com" },
    { name: "Blog", url: "https://cash4teststripsusa.com/blog" },
    { name: registryPost.title, url: pageUrl },
  ]);
  const faqSchema = registryPost.faqs?.length
    ? buildFaqPageSchema(registryPost.faqs.map((f) => ({ question: f.q, answer: f.a })))
    : null;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        {" / "}
        <Link href="/blog" className="hover:text-emerald-600">Blog</Link>
        {" / "}
        <span className="text-gray-700">{registryPost.title}</span>
      </nav>

      {/* Hero */}
      <header className="mb-10">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">
          Published {new Date(registryPost.datePublished + "T12:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          {registryPost.title}
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed">{registryPost.description}</p>
      </header>

      {/* Inline CTA */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Have supplies to sell?</p>
          <p className="text-sm text-gray-500 mt-0.5">Call or text — we respond within hours.</p>
        </div>
        <a
          href="tel:5182786008"
          className="shrink-0 bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-emerald-700 transition-colors text-sm"
        >
          Call 518-278-6008
        </a>
      </div>

      {/* Body — HTML from registry post */}
      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: registryPost.bodyHtml }}
      />

      {/* FAQ section */}
      {registryPost.faqs && registryPost.faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {registryPost.faqs.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <div className="mt-14 bg-emerald-700 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Ready to Sell Your Supplies?</h2>
        <p className="text-emerald-100 text-sm mb-6">
          Sealed, unexpired test strips, CGM sensors and insulin pods — we buy them all.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="tel:5182786008"
            className="bg-white text-emerald-700 font-semibold px-8 py-3 rounded-full hover:bg-emerald-50 transition-colors"
          >
            Call 518-278-6008
          </a>
          <Link
            href="/directory"
            className="border border-emerald-400 text-white font-semibold px-8 py-3 rounded-full hover:bg-emerald-600 transition-colors"
          >
            Find a Buyer Near You →
          </Link>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-10 pt-8 border-t border-gray-100">
        <Link href="/blog" className="text-sm text-emerald-600 hover:underline">
          ← All blog posts
        </Link>
      </div>
    </article>
  );
}
