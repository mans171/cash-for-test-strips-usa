import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { STATE_BLOG_POSTS, getPostBySlug } from "@/lib/blog-posts";
import { supabase } from "@/lib/supabase";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return STATE_BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { stateName, stateCode, intro } = post;

  const { data: localBuyers } = await supabase
    .from("companies")
    .select("id")
    .contains("states", [stateCode])
    .not("url", "is", null)
    .limit(1);

  const hasLocalBuyers = (localBuyers ?? []).length > 0;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
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
          Sell Diabetic Test Strips in {stateName} for Cash
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">{intro}</p>
      </header>

      {/* Inline CTA */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
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

      {/* Bulk CTA */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Selling a large lot?</p>
          <p className="text-sm text-gray-500 mt-0.5">We specialize in bulk — 10 boxes to 500+. One call, one price, fast payment.</p>
        </div>
        <a
          href="tel:5187799751"
          className="shrink-0 bg-amber-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-amber-600 transition-colors text-sm"
        >
          Sell in Bulk →
        </a>
      </div>

      {/* Content sections */}
      <div className="prose prose-gray max-w-none space-y-10 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">What We Buy in {stateName}</h2>
          <p>
            We buy sealed, unexpired, U.S. retail diabetic supplies from individuals, caregivers,
            pharmacies, and estate liquidators across {stateName}. Whether you have one box or
            hundreds, we want to hear from you —{" "}
            <strong>we specialize in bulk lots</strong> and pay competitively for large quantities.
          </p>

          <div className="mt-5 space-y-5">
            {/* Test Strips */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">🩸 Test Strips</p>
              <ul className="space-y-1.5 list-none pl-0">
                {[
                  "FreeStyle Lite",
                  "Contour Next (all versions)",
                  "Accu-Chek Guide / Aviva / SmartView",
                  "OneTouch Verio / Ultra",
                  "True Metrix",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* CGM */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">📡 CGM Sensors &amp; Transmitters</p>
              <ul className="space-y-1.5 list-none pl-0">
                {[
                  "Dexcom G6 Sensors",
                  "Dexcom G6 Transmitters",
                  "Dexcom G7 Sensors",
                  "Dexcom G7 Receivers",
                  "FreeStyle Libre 1 / 2 / 3 Sensors (U.S. retail versions only)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pods */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">💉 Insulin Delivery Pods (Pods Only)</p>
              <ul className="space-y-1.5 list-none pl-0">
                {[
                  "Omnipod 5 Pods (Box of 5)",
                  "Omnipod DASH Pods (Box of 5)",
                  "Omnipod Classic Pods (Box of 10)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Infusion Sets */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">🧷 Infusion Sets</p>
              <ul className="space-y-1.5 list-none pl-0">
                {[
                  "AutoSoft 90",
                  "AutoSoft XC 6mm",
                  "AutoSoft XC 9mm",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Medtronic */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">🧩 Medtronic / MiniMed (Select Sealed Components)</p>
              <ul className="space-y-1.5 list-none pl-0">
                {[
                  "MiniMed Pump MMT-780G",
                  "MiniMed Mio Advance MMT-242A",
                  "Medtronic Quick-set (Pack of 10) — 396 / 397 / 399",
                  "Medtronic Guardian Sensor 5-pack (all versions except \"B\")",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tandem */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">⚙️ Tandem / t:slim</p>
              <ul className="space-y-1.5 list-none pl-0">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  t:slim X2 Insulin Pump + Control-IQ (must be sent together — Software Version 7.8 only)
                </li>
              </ul>
            </div>
          </div>

          {/* Expired exception callout */}
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-900 mb-1">⚠️ Exception — We Accept Expired Items</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              We accept <strong>expired Omnipod pods</strong> (5, DASH, and Classic) and{" "}
              <strong>expired Dexcom G7 sensors</strong>. These are the only items we take past
              expiration — all other supplies must be unexpired. Call{" "}
              <a href="tel:5187799751" className="font-semibold underline">518-779-9751</a> for
              pricing on expired stock.
            </p>
          </div>

          <p className="mt-5 text-sm text-gray-500">
            All other items must be sealed and unexpired. We do <strong>not</strong> accept supplies
            purchased through Medicare or Medicaid.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">We Pay Top Dollar for Bulk Lots</h2>
          <p>
            Have a large quantity of test strips? That's our sweet spot. Many of our customers are
            estate liquidators, pharmacy buyers, and caregivers who end up with dozens — sometimes
            hundreds — of boxes at a time. We offer <strong>premium pricing for bulk lots</strong>{" "}
            and make the process simple: one call, one price, one fast payment.
          </p>
          <p className="mt-3">
            Whether it's 5 boxes or 500, call or text us at{" "}
            <a href="tel:5187799751" className="text-emerald-600 font-semibold hover:underline">
              518-779-9751
            </a>{" "}
            and we'll give you a price on the spot.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">How to Sell Your Test Strips in {stateName}</h2>
          <ol className="space-y-4 list-none pl-0">
            {[
              {
                step: "1",
                title: "Call or text us",
                body: `Reach out at 518-779-9751. Tell us the brand, quantity, and expiration dates. We'll give you a price immediately — no waiting.`,
              },
              {
                step: "2",
                title: "Ship or meet locally",
                body: hasLocalBuyers
                  ? `We have local buyers in ${stateName} — local pickup is available. For smaller quantities anywhere in the state, we'll send a prepaid shipping label at no cost.`
                  : `We'll send you a prepaid shipping label at no cost. For large bulk lots, local pickup may be available — ask us when you call.`,
              },
              {
                step: "3",
                title: "Get paid fast",
                body: "Once we receive and verify your strips, we pay via PayPal, Zelle, Venmo, check, or cash. Most payments are sent within 24 hours.",
              },
            ].map(({ step, title, body }) => (
              <li key={step} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  {step}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Is It Legal to Sell Test Strips in {stateName}?
          </h2>
          <p>
            Yes — selling unused, unexpired, unopened diabetic test strips is <strong>legal</strong> in{" "}
            {stateName} and throughout the United States. The key requirements are:
          </p>
          <ul className="mt-3 space-y-2 list-none pl-0">
            {[
              "Strips must be in their original, sealed packaging",
              "Strips must not have been purchased using Medicare or Medicaid",
              "Strips should have at least 6 months before expiration",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-gray-500">
            If your strips were covered by Medicare or Medicaid, they cannot legally be resold. When
            in doubt, ask us — we're happy to help you determine whether your strips qualify.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">How Much Can I Get for My Test Strips?</h2>
          <p>
            Prices vary depending on brand, quantity, and expiration date. As a general guide:
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Item</th>
                  <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Typical Price</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["OneTouch Verio / Ultra (test strips)", "$15 – $30/box"],
                  ["FreeStyle Lite (test strips)", "$10 – $25/box"],
                  ["Accu-Chek Guide / Aviva (test strips)", "$10 – $20/box"],
                  ["Contour Next (test strips)", "$8 – $18/box"],
                  ["Dexcom G6 / G7 Sensors", "Starting at $30/box — call for quote"],
                  ["FreeStyle Libre 1 / 2 / 3 Sensors", "$30 – $60/box"],
                  ["Omnipod 5 / DASH / Classic Pods", "Starting at $50/box — call for quote"],
                  ["Other brands / items", "Call for quote"],
                ].map(([brand, price]) => (
                  <tr key={brand} className="border border-gray-100">
                    <td className="px-4 py-2 text-gray-600">{brand}</td>
                    <td className="px-4 py-2 text-gray-600">{price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-400">
            Bulk lots of 10+ boxes typically receive a higher per-box rate. Call{" "}
            <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a>{" "}
            for an exact quote.
          </p>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions — Selling Test Strips in {stateName}
          </h2>
          <div className="space-y-6">
            {[
              {
                q: `How fast will I get paid in ${stateName}?`,
                a: "Most payments are sent within 24 hours of us receiving and verifying your strips. For local transactions in some areas, same-day cash is possible.",
              },
              {
                q: "Do you accept partial boxes or opened packaging?",
                a: "No — we only accept strips in their original, unopened, sealed packaging. Partial or damaged boxes cannot be resold.",
              },
              {
                q: "What if my strips are close to expiring?",
                a: "We generally require at least 6 months before expiration for test strips and most supplies. Exception: we accept expired Omnipod pods and expired Dexcom G7 sensors. Call 518-779-9751 and we'll let you know if we can make an offer.",
              },
              {
                q: "Can I sell strips if I'm an estate liquidator or caregiver?",
                a: "Absolutely. Estate liquidators and caregivers are some of our most frequent customers. We handle bulk lots regularly and make the process as smooth as possible.",
              },
              {
                q: `Do I have to ship the strips, or can you pick them up in ${stateName}?`,
                a: "For most transactions, we provide a prepaid shipping label at no cost to you. For very large bulk lots, local pickup in parts of the country may be available — ask us when you call.",
              },
            ].map(({ q, a }) => (
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
        <h2 className="text-2xl font-bold mb-2">Turn Your Test Strips Into Cash Today</h2>
        <p className="text-emerald-100 text-sm mb-6">
          We buy all brands, single boxes, and bulk lots across {stateName}. PayPal, Zelle, check, or cash.
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
            Find Local Buyers in {stateName} →
          </Link>
        </div>
      </div>

      {/* Internal links to other states */}
      <div className="mt-10 pt-8 border-t border-gray-100">
        <p className="text-sm text-gray-400 mb-3">Read guides for other states</p>
        <div className="flex flex-wrap gap-2">
          {STATE_BLOG_POSTS.filter((p) => p.stateCode !== stateCode)
            .slice(0, 12)
            .map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
              >
                {p.stateName}
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
