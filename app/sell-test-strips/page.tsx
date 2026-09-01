import Link from "next/link";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import type { Company } from "@/lib/types";
import { COMPANY_COLUMNS } from "@/lib/company-columns";
import { JsonLd } from "@/app/components/JsonLd";
import { buildFaqPageSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { btnPrimary, btnOnDark } from "@/app/components/ui";
import {
  buildHubFaqs,
  buildHubRegions,
  buildHubTotals,
  regionSummary,
  stateFactLine,
  type HubRegion,
  type HubState,
} from "@/lib/hub-page-content";

// Canonical belongs on the page, never in the root layout — putting it in the
// layout once made every route claim the homepage as its canonical.
export const metadata: Metadata = {
  title: "Sell Diabetic Test Strips — Buyers in All 50 States",
  description:
    "Find out who buys unused diabetic test strips in your state. Browse all 50 states and 27 city guides, with local buyer counts and mail-in options for states with no buyer nearby.",
  alternates: { canonical: "https://cash4teststripsusa.com/sell-test-strips" },
};

export default async function SellTestStripsHub() {
  // Same shape as the state pages: in-person buyers drive the per-state counts,
  // and one mail-in row tells us whether "no local buyer" states still have a
  // route to sell. Contact columns are never rendered here, only counted.
  const [{ data: inPersonData }, { data: mailInData }] = await Promise.all([
    supabase
      .from("companies")
      .select(COMPANY_COLUMNS)
      .eq("mail_in", false)
      .order("featured", { ascending: false })
      .order("name"),
    supabase.from("companies").select("id").eq("mail_in", true).limit(1),
  ]);

  const buyers = (inPersonData ?? []) as Company[];
  const hasMailIn = (mailInData ?? []).length > 0;

  const regions = buildHubRegions(buyers);
  const totals = buildHubTotals(regions, buyers);
  const faqs = buildHubFaqs({ totals, regions, hasMailIn });

  const pageUrl = "https://cash4teststripsusa.com/sell-test-strips";
  const faqSchema = buildFaqPageSchema(faqs.map((f) => ({ question: f.q, answer: f.a })));
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://cash4teststripsusa.com" },
    { name: "Sell Test Strips", url: pageUrl },
  ]);

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />

      {/* Hero */}
      <section className="bg-ink text-white py-14 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-sm text-white/40 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            {" / "}
            <span className="text-white/70">Sell Test Strips</span>
          </nav>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] mb-4">
            Sell diabetic test strips<br />
            <span className="text-electric">in any state.</span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mb-8 leading-relaxed">
            Every state has a page showing who buys there, what they accept, and how they pay.
            {" "}
            {totals.statesWithBuyers} of the {totals.stateCount} states have an in-person buyer listed
            {hasMailIn ? ", and the rest are covered by mail-in" : ""}. Start with your state below.
          </p>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span className="text-white/60">
              <b className="text-electric font-black text-lg">{totals.stateCount}</b> state guides
            </span>
            <span className="text-white/60">
              <b className="text-electric font-black text-lg">{totals.cityCount}</b> city guides
            </span>
            <span className="text-white/60">
              <b className="text-electric font-black text-lg">{totals.buyerCount}</b> in-person buyers
            </span>
            <span className="text-white/60">
              <b className="text-electric font-black text-lg">{totals.statesWithBuyers}</b> states with a local buyer
            </span>
          </div>
        </div>
      </section>

      {/* How to use this page */}
      <section className="border-b border-gray-100 bg-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-extrabold text-gray-900 mb-5">How to use this page</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: "Start with your state",
                body: "The state page lists every buyer serving that state, the brands they take, and how they pay.",
              },
              {
                title: "Check for a city guide",
                body: "Cities listed under a state have a verified in-person buyer within about 50 miles, so you can be paid on the spot.",
              },
              {
                title: "No local buyer? Still sellable",
                body: hasMailIn
                  ? "Mail-in buyers accept sealed, unexpired boxes from anywhere in the US. Your state page shows that option alongside the nearest in-person buyers."
                  : "Your state page shows the closest listed buyers and roughly how far away each one is.",
              },
            ].map(({ title, body }) => (
              <div key={title}>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* States by region */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto space-y-14">
          {regions.map((region) => (
            <RegionBlock key={region.name} region={region} hasMailIn={hasMailIn} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-4 bg-ground border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="font-bold text-gray-900 mb-1 text-sm">{f.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/directory" className={btnPrimary}>
              Search buyers by ZIP →
            </Link>
            <Link
              href="/how-much-are-diabetic-test-strips-worth"
              className="inline-flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 font-semibold text-sm px-5 py-3 rounded-lg hover:border-ink hover:text-ink transition-colors"
            >
              What are they worth?
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 px-4 bg-ink text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Not sure where to start?</h2>
          <p className="text-white/70 mb-6">
            Enter your ZIP and we&apos;ll sort every buyer by how far they are from you.
          </p>
          <Link href="/directory" className={btnOnDark}>
            Find a buyer near me →
          </Link>
        </div>
      </section>
    </>
  );
}

function RegionBlock({ region, hasMailIn }: { region: HubRegion; hasMailIn: boolean }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-1.5">{region.name}</h2>
        <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
          {regionSummary(region, hasMailIn)}
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {region.states.map((state) => (
          <StateCard key={state.code} state={state} hasMailIn={hasMailIn} />
        ))}
      </div>
    </div>
  );
}

function StateCard({ state, hasMailIn }: { state: HubState; hasMailIn: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-cash transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <Link href={state.href} className="font-bold text-gray-900 hover:text-cash transition-colors">
          {state.label}
        </Link>
        {state.buyerCount > 0 && (
          <span className="shrink-0 text-[11px] font-extrabold text-green-800 bg-green-100 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
            Local
          </span>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-2">{stateFactLine(state, hasMailIn)}</p>

      {state.cities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
          {state.cities.map((c) => (
            <Link
              key={c.slug}
              href={`/sell-test-strips/${c.state.toLowerCase()}/${c.slug}`}
              className="text-[11px] bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full hover:border-cash hover:text-cash transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
