import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { buildFaqPageSchema, buildBreadcrumbSchema, buildArticleSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import type { Company } from "@/lib/types";
import { BuyerCard } from "@/app/components/BuyerCard";
import { btnPrimary } from "@/app/components/ui";
import { COMPANY_COLUMNS } from "@/lib/company-columns";
import { STATE_LABELS as ALL_STATE_LABELS } from "@/lib/states";
import { buildStateFaqs, joinList, nearestBuyers, siblingStates, statePageH1 } from "@/lib/state-page-content";
import { publishableCityTargets } from "@/lib/city-page-content";
import { bodyFor } from "@/lib/blog-bodies";
import { STATE_BLOG_POSTS } from "@/lib/blog-posts";

// Canada is excluded here on purpose: this route is the US state directory and
// is enumerated as such in app/sitemap.ts.
const STATE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(ALL_STATE_LABELS).filter(([code]) => code !== "CANADA")
);

type Props = { params: Promise<{ state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const code = state.toUpperCase();
  const label = STATE_LABELS[code];
  if (!label) return { title: "State Not Found" };

  // The hand-written state guide moved here from /blog/sell-diabetic-test-
  // strips-<state> on 2026-09-12, and it brings its own title and description
  // with it — those are what the post ranked on. The derived pair below stays
  // as the fallback for any state that never had a written body.
  const guide = bodyFor(code);

  return {
    title: guide?.title ?? `Sell Diabetic Test Strips in ${label} — Find Local Cash Buyers`,
    description:
      guide?.metaDescription ??
      `Find cash buyers for unused diabetic test strips in ${label}. Get paid fast via PayPal, Zelle, or check. Browse local buyers near you.`,
    alternates: { canonical: `https://cash4teststripsusa.com/sell-test-strips/${state.toLowerCase()}` },
  };
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const code = state.toUpperCase();
  const label = STATE_LABELS[code];

  if (!label) notFound();

  // All in-person buyers, not just this state's: the out-of-state ones are what
  // give a no-buyer state real "nearest option" content instead of boilerplate.
  const [{ data: inPersonData }, { data: mailInData }] = await Promise.all([
    supabase
      .from("companies")
      .select(COMPANY_COLUMNS)
      .eq("mail_in", false)
      .order("featured", { ascending: false })
      .order("name"),
    supabase
      .from("companies")
      .select(COMPANY_COLUMNS)
      .eq("mail_in", true)
      .limit(1),
  ]);

  const allInPerson = (inPersonData ?? []) as Company[];
  // Contact details are public on every card — the account gate was removed
  // on 2026-09-12. See lib/company-contact.ts.
  const companies = allInPerson.filter((c) => c.states.includes(code));
  const mailIn = ((mailInData ?? []) as Company[])[0] ?? null;
  const nearby = companies.length === 0 ? nearestBuyers(code, allInPerson, 3) : [];

  // The hand-written guide that used to be the state's blog post. Its FAQ set
  // replaces the derived one outright where it exists — it is written about
  // this state rather than assembled from the buyer counts.
  const guide = bodyFor(code);
  const statePost = STATE_BLOG_POSTS.find((p) => p.stateCode === code);

  const faqs =
    guide?.faqs ??
    buildStateFaqs({
      stateCode: code,
      buyers: companies,
      nearby,
      hasMailIn: !!mailIn,
    });

  const siblings = siblingStates(code, 8);
  // Gated, not raw: a city page 404s when no buyer is within
  // CITY_BUYER_RADIUS_MI of it, so linking CITY_TARGETS unconditionally
  // advertises dead pages — which is what kept West Virginia's two city
  // pages linked after their buyer was deactivated.
  const cities = publishableCityTargets(allInPerson).filter((c) => c.state === code);

  // Intro copy is derived too — the old fixed line promised "trusted local
  // buyers" and "no shipping required" on all 50 pages, which was simply untrue
  // on the 31 states that have no local buyer at all.
  const introCities = joinList(
    [...new Set(companies.map((c) => c.city).filter((c): c is string => !!c))].sort()
  );
  const nearestMiles = nearby.length > 0 ? Math.round(nearby[0].miles) : null;

  // Assembled as a string rather than JSX fragments so punctuation does not end
  // up with stray whitespace in front of it.
  const noBuyerIntro = (() => {
    const options: string[] = [];
    if (mailIn) options.push("mail your sealed boxes to a national mail-in buyer from anywhere in the state");
    if (nearestMiles !== null) {
      options.push(
        `drive to the nearest in-person buyer, about ${nearestMiles} miles from the centre of ${label}`
      );
    }
    if (options.length === 0) return `No buyer is based in ${label} yet — we are adding buyers state by state.`;
    return `No buyer is based in ${label} yet, and you do not need one. You can ${joinList(options, "or")}.`;
  })();

  const buyerIntro =
    `${companies.length} verified ${companies.length === 1 ? "buyer pays" : "buyers pay"} cash for ` +
    `unused diabetic test strips in ${label}${introCities ? `, based in ${introCities}` : ""}. ` +
    `Compare them below, then contact one directly — most pay the same day you meet.`;

  const pageUrl = `https://cash4teststripsusa.com/sell-test-strips/${state.toLowerCase()}`;
  const faqSchema = buildFaqPageSchema(faqs.map((f) => ({ question: f.q, answer: f.a })));
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://cash4teststripsusa.com" },
    { name: "Directory", url: "https://cash4teststripsusa.com/directory" },
    { name: label, url: pageUrl },
  ]);
  // Carried over from the blog post along with its body, so the guide keeps
  // its Article markup and its original publish date on the new URL.
  const articleSchema =
    guide && statePost
      ? buildArticleSchema({
          headline: guide.title,
          description: guide.metaDescription,
          datePublished: statePost.datePublished,
          url: pageUrl,
        })
      : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      {articleSchema && <JsonLd data={articleSchema} />}
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-cash">Home</Link>
        {" / "}
        <Link href="/directory" className="hover:text-cash">Directory</Link>
        {" / "}
        <span className="text-gray-700">{label}</span>
      </nav>

      {/* Hero copy — SEO targeted.
          H1 is derived from statePageH1() rather than hardcoded so it is
          structurally distinct from the blog post H1 ("Selling Diabetic Test
          Strips in [State]") and the city page H1 ("Sell Diabetic Test Strips
          in [City], [State]"). This was the root cause of the 2026-09-01
          duplicate-canonical report for /sell-test-strips/tx. */}
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-3">
        {statePageH1(label, companies.length > 0)}
      </h1>
      <p className="text-gray-600 max-w-2xl mb-8 leading-relaxed">
        {companies.length > 0 ? buyerIntro : noBuyerIntro}
      </p>

      {companies.length === 0 ? (
        <>
          {mailIn && (
            <div className="mb-12">
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                Mail your strips in from anywhere in {label}
              </h2>
              <p className="text-gray-600 max-w-2xl mb-5 text-sm leading-relaxed">
                Mail-in buyers accept sealed, unexpired boxes from any US state. You ship the
                strips and get paid once they arrive and are checked — no local buyer needed.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <BuyerCard company={mailIn} />
              </div>
            </div>
          )}

          {nearby.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">
                Closest in-person buyers to {label}
              </h2>
              <p className="text-gray-600 max-w-2xl mb-5 text-sm leading-relaxed">
                If you would rather be paid on the spot, these are the nearest buyers who meet
                sellers in person. Distances are measured from the centre of {label}, so your own
                drive may be shorter or longer.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearby.map((c) => (
                  <BuyerCard key={c.id} company={c} />
                ))}
              </div>
            </div>
          )}

          {!mailIn && nearby.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
              <p className="font-semibold text-gray-800 mb-2">No buyers listed in {label} yet</p>
              <p className="text-sm text-gray-500 mb-4">
                We&apos;re always adding new buyers. In the meantime, browse our national directory.
              </p>
              <Link href="/directory" className={btnPrimary}>
                Browse all buyers
              </Link>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-6">
            {companies.length} buyer{companies.length !== 1 ? "s" : ""} in {label}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {companies.map((c) => (
              <BuyerCard key={c.id} company={c} />
            ))}
          </div>
        </>
      )}

      {cities.length > 0 && (
        <div className="mb-12 pt-8 border-t border-gray-100">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Browse cities in {label}</h2>
          <div className="flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link
                key={c.slug}
                href={`/sell-test-strips/${c.state.toLowerCase()}/${c.slug}`}
                className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-cash hover:text-cash transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* The state guide — the hand-written body that used to live at
          /blog/sell-diabetic-test-strips-<state>. That post and this page were
          two URLs chasing the same query; the post now 308s here (see
          lib/state-post-redirects.ts) and its writing is the page's depth.
          The written `heading` opens the section — the page keeps its own H1. */}
      {guide && (
        <section className="mt-12 pt-8 border-t border-gray-100 max-w-3xl">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">{guide.heading}</h2>
          {guide.lead.map((p) => (
            <p key={p} className="text-gray-700 leading-relaxed mb-4">{p}</p>
          ))}
          {guide.sections.map((s) => (
            <div key={s.heading} className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{s.heading}</h3>
              {s.paragraphs.map((p) => (
                <p key={p} className="text-gray-700 leading-relaxed mb-4">{p}</p>
              ))}
            </div>
          ))}
        </section>
      )}

      {/* FAQ — helps SEO */}
      <div className="border-t border-gray-100 pt-12">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">
          Frequently Asked Questions — Selling Test Strips in {label}
        </h2>
        <div className="space-y-6">
          {faqs.map((f) => (
            <Faq key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>

      {/* Other states */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <p className="text-sm text-gray-400 mb-3">States near {label}</p>
        <div className="flex flex-wrap gap-2">
          {siblings.map((s) => (
            <Link
              key={s}
              href={`/sell-test-strips/${s.toLowerCase()}`}
              className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-cash hover:text-cash transition-colors"
            >
              {STATE_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-1 text-sm">{q}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
    </div>
  );
}
