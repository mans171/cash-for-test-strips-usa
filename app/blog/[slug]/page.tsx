import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { STATE_BLOG_POSTS, getPostBySlug } from "@/lib/blog-posts";
import { supabase } from "@/lib/supabase";
import { buildFaqPageSchema, buildArticleSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import { TEST_STRIP_TIERS, CGM_TIERS } from "@/lib/tier-pricing";
import { TierBadge } from "@/app/components/ui";
import { STATE_LABELS } from "@/lib/states";
import { siblingStates } from "@/lib/state-page-content";
import {
  angleFor,
  healthFor,
  topCities,
  postTitle,
  postHeading,
  postMetaDescription,
  postLead,
  angleSection,
  postFaqs,
  PRODUCT_CATEGORIES,
  emphasisCategories,
  emphasisTierTables,
  requirements,
  stateContext,
} from "@/lib/blog-post-content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return STATE_BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  const title = postTitle(post.stateCode, post.stateName);
  const description = postMetaDescription(post.stateCode, post.stateName);

  return {
    title,
    description,
    alternates: { canonical: `https://cash4teststripsusa.com/blog/${slug}` },
    openGraph: { title, description, type: "article" },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { stateName, stateCode } = post;

  // Contact fields are deliberately not selected here. This page renders for
  // anonymous visitors, and selecting url/phone/email would reintroduce the
  // contact-exposure bug class that was cleared out of the homepage and the
  // state landing pages. Buyers are linked through to their gated profile.
  const { data: stateBuyers } = await supabase
    .from("companies")
    .select("id, name, slug, city")
    .contains("states", [stateCode])
    .eq("active", true)
    .eq("mail_in", false);

  const buyers = stateBuyers ?? [];
  const hasLocalBuyers = buyers.length > 0;

  const angle = angleFor(stateCode);
  const health = healthFor(stateCode);
  const cities = topCities(stateCode, 8);
  const lead = postLead(stateCode, stateName);
  const section = angleSection(stateCode, stateName);
  const faqs = postFaqs(stateCode, stateName, hasLocalBuyers);
  const heading = postHeading(stateCode, stateName);

  const expanded = new Set(emphasisCategories(angle, stateCode));
  const shownCategories = PRODUCT_CATEGORIES.filter((c) => expanded.has(c.key));
  const summarisedCategories = PRODUCT_CATEGORIES.filter((c) => !expanded.has(c.key));
  const tierTables = emphasisTierTables(angle);
  const reqs = requirements(angle);
  const context = stateContext(stateCode, stateName);

  // Land neighbours padded by nearest-state distance, so every state is
  // reachable from some other state's post. The previous hardcoded slice of the
  // first 12 posts left 38 states with no inbound link from the blog at all.
  const siblings = siblingStates(stateCode, 10)
    .map((code) => STATE_BLOG_POSTS.find((p) => p.stateCode === code))
    .filter((p): p is (typeof STATE_BLOG_POSTS)[number] => Boolean(p));

  const pageUrl = `https://cash4teststripsusa.com/blog/${slug}`;
  const title = postTitle(stateCode, stateName);
  const description = postMetaDescription(stateCode, stateName);

  const faqSchema = buildFaqPageSchema(faqs.map((f) => ({ question: f.q, answer: f.a })));
  const articleSchema = buildArticleSchema({
    headline: title,
    description,
    datePublished: post.datePublished,
    url: pageUrl,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://cash4teststripsusa.com" },
    { name: "Blog", url: "https://cash4teststripsusa.com/blog" },
    { name: stateName, url: pageUrl },
  ]);

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={faqSchema} />
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        {" / "}
        <Link href="/blog" className="hover:text-emerald-600">Blog</Link>
        {" / "}
        <span className="text-gray-700">{stateName}</span>
      </nav>

      {/* Hero */}
      <header className="mb-10">
        <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
          {stateName} · {stateCode}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          {heading}
        </h1>
        {lead.map((para, i) => (
          <p
            key={i}
            className={
              i === 0
                ? "text-lg text-gray-600 leading-relaxed"
                : "text-base text-gray-600 leading-relaxed mt-4"
            }
          >
            {para}
          </p>
        ))}
      </header>

      {/* Inline CTA */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Ready to sell?</p>
          <p className="text-sm text-gray-500 mt-0.5">Call or text us — we respond within hours.</p>
        </div>
        <a
          href="tel:5187799751"
          className="shrink-0 bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-emerald-700 transition-colors text-sm"
        >
          Call 518-779-9751
        </a>
      </div>

      <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

        {/* Angle-specific section — the part that differs most between posts */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{section.heading}</h2>
          {section.paragraphs.map((para, i) => (
            <p key={i} className={i === 0 ? "" : "mt-3"}>{para}</p>
          ))}
        </section>

        {/* Local figures — every state's table holds different numbers */}
        {cities.length > 0 && health?.brfssYear && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Diabetes Across {stateName}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Diagnosed diabetes among adults in the largest cities in {stateName}.
              Crude prevalence, CDC PLACES, {health.brfssYear} BRFSS data.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">City</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Adults with diagnosed diabetes</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map((c) => (
                    <tr key={c.name} className="border border-gray-100">
                      <td className="px-4 py-2 text-gray-600">{c.name}</td>
                      <td className="px-4 py-2 text-gray-600">{c.diabetes}%</td>
                    </tr>
                  ))}
                  {health.diabetesPrevalence != null && (
                    <tr className="border border-gray-100 bg-gray-50">
                      <td className="px-4 py-2 font-semibold text-gray-700">{stateName} overall</td>
                      <td className="px-4 py-2 font-semibold text-gray-700">
                        {health.diabetesPrevalence}%
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {context && <p className="mt-4">{context}</p>}
          </section>
        )}

        {/* What we buy — expanded only for the categories this post is about */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">What We Buy in {stateName}</h2>
          <p>
            We buy sealed, unexpired, U.S. retail diabetic supplies from individuals,
            caregivers, pharmacies and estate liquidators across {stateName} — one box
            or hundreds.
          </p>

          <div className="mt-5 space-y-5">
            {shownCategories.map((cat) => (
              <div key={cat.key}>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                  {cat.icon} {cat.label}
                </p>
                <ul className="space-y-1.5 list-none pl-0">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {summarisedCategories.length > 0 && (
            <p className="mt-5 text-sm text-gray-500">
              We also buy{" "}
              {summarisedCategories.map((c, i) => (
                <span key={c.key}>
                  {i > 0 && (i === summarisedCategories.length - 1 ? " and " : ", ")}
                  {c.label.replace(/ \(.*\)$/, "").toLowerCase()}
                </span>
              ))}
              . See the{" "}
              <Link href="/price-guide" className="text-emerald-600 font-semibold hover:underline">
                full price guide
              </Link>{" "}
              for the complete list.
            </p>
          )}

          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-900 mb-1">⚠️ Exception — We Accept Expired Items</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              We accept <strong>expired Omnipod pods</strong> (5, DASH and Classic) and{" "}
              <strong>expired Dexcom G7 sensors</strong>. These are the only items we take
              past expiration — everything else must be unexpired. Call{" "}
              <a href="tel:5187799751" className="font-semibold underline">518-779-9751</a>{" "}
              for pricing on expired stock.
            </p>
          </div>

          <p className="mt-5 text-sm text-gray-500">
            All other items must be sealed and unexpired. We do <strong>not</strong> accept
            supplies purchased through Medicare or Medicaid.
          </p>
        </section>

        {/* How to sell — the middle step reflects this state's actual coverage */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            How to Sell Your Supplies in {stateName}
          </h2>
          <ol className="space-y-4 list-none pl-0">
            {[
              {
                step: "1",
                title: "Call or text us",
                body: "Reach out at 518-779-9751. Tell us the brand, quantity and expiration dates. We'll give you a price immediately — no waiting.",
              },
              {
                step: "2",
                title: hasLocalBuyers ? "Meet locally or ship" : "Ship with a prepaid label",
                body: hasLocalBuyers
                  ? `${buyers.length === 1 ? "A buyer" : `${buyers.length} buyers`} on this directory ${buyers.length === 1 ? "covers" : "cover"} ${stateName} in person, so a same-day handover is possible. For anywhere else in the state, we'll send a prepaid shipping label at no cost.`
                  : `There is no buyer listed in ${stateName} yet, so we'll send you a prepaid shipping label at no cost. For very large bulk lots, ask about pickup when you call.`,
              },
              {
                step: "3",
                title: "Get paid",
                body: hasLocalBuyers
                  ? "In person, you're paid on the spot. By post, payment goes out within 24 hours of your parcel being received and verified — PayPal, Zelle, Venmo, check or cash."
                  : "Payment goes out within 24 hours of your parcel being received and verified — PayPal, Zelle, Venmo or check.",
              },
            ].map(({ step, title: stepTitle, body }) => (
              <li key={step} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  {step}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{stepTitle}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Requirements — wording varies by angle; see lib/blog-post-content.ts
            for why this is never phrased as a legal assurance. */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{reqs.heading}</h2>
          <p>{reqs.intro}</p>
          <ul className="mt-3 space-y-2 list-none pl-0">
            {reqs.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            Supplies covered by Medicare or Medicaid cannot be resold. If you are not
            sure which applies to yours, ask us — and see our{" "}
            <Link
              href="/is-it-legal-to-sell-diabetic-test-strips"
              className="text-emerald-600 font-semibold hover:underline"
            >
              guide to the rules around selling
            </Link>
            , which covers this properly.
          </p>
        </section>

        {/* Payout — the tables appear only on posts that are actually about
            pricing. Everywhere else they were twenty identical rows. */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">What It Pays</h2>
          {tierTables.length === 0 ? (
            <p>
              Payout depends on brand, quantity and expiration date, and bulk lots of
              10+ boxes earn a higher per-box rate. The{" "}
              <Link href="/price-guide" className="text-emerald-600 font-semibold hover:underline">
                price guide
              </Link>{" "}
              lists every brand we buy by payout tier. For an exact number on what you
              have, call{" "}
              <a href="tel:5187799751" className="text-emerald-600 font-semibold hover:underline">
                518-779-9751
              </a>
              .
            </p>
          ) : (
            <p>
              Payout depends on brand, quantity and expiration date. Tiers rank brands
              against others in their own category — a mid-tier CGM sensor can still pay
              more per box than a top-tier test strip.
            </p>
          )}

          {tierTables.includes("strips") && (
            <>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mt-6 mb-2">Test Strips</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Item</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Payout Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TEST_STRIP_TIERS.map((row) => (
                      <tr key={row.brand} className="border border-gray-100">
                        <td className="px-4 py-2 text-gray-600">{row.brand}</td>
                        <td className="px-4 py-2"><TierBadge tier={row.tier} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tierTables.includes("cgm") && (
            <>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mt-6 mb-2">CGM Sensors &amp; Pods</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Item</th>
                      <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Payout Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CGM_TIERS.map((row) => (
                      <tr key={row.brand} className="border border-gray-100">
                        <td className="px-4 py-2 text-gray-600">{row.brand}</td>
                        <td className="px-4 py-2"><TierBadge tier={row.tier} /></td>
                      </tr>
                    ))}
                    <tr className="border border-gray-100">
                      <td className="px-4 py-2 text-gray-600">Other brands / items</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">Call for a quote</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tierTables.length > 0 && (
            <p className="mt-3 text-sm text-gray-400">
              Bulk lots of 10+ boxes typically receive a higher per-box rate. Call{" "}
              <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a>{" "}
              for an exact quote.
            </p>
          )}
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Questions From {stateName} Sellers
          </h2>
          <div className="space-y-6">
            {faqs.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="mt-14 bg-emerald-700 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Turn Your Supplies Into Cash</h2>
        <p className="text-emerald-100 text-sm mb-6">
          {hasLocalBuyers
            ? `Local buyers cover ${stateName}, and a prepaid label reaches everywhere else.`
            : `A prepaid label reaches every ZIP code in ${stateName}, and it costs you nothing.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="tel:5187799751"
            className="bg-white text-emerald-700 font-semibold px-8 py-3 rounded-full hover:bg-emerald-50 transition-colors"
          >
            Call 518-779-9751
          </a>
          <Link
            href={`/sell-test-strips/${stateCode.toLowerCase()}`}
            className="border border-emerald-400 text-white font-semibold px-8 py-3 rounded-full hover:bg-emerald-600 transition-colors"
          >
            {hasLocalBuyers ? `Find Buyers in ${stateName} →` : `See ${stateName} Options →`}
          </Link>
        </div>
      </div>

      {/* Internal links — nearest states, so every post is reachable */}
      <div className="mt-10 pt-8 border-t border-gray-100">
        <p className="text-sm text-gray-400 mb-3">Guides for nearby states</p>
        <div className="flex flex-wrap gap-2">
          {siblings.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
            >
              {STATE_LABELS[p.stateCode] ?? p.stateName}
            </Link>
          ))}
          <Link
            href="/blog"
            className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
          >
            All states →
          </Link>
        </div>
      </div>
    </article>
  );
}
