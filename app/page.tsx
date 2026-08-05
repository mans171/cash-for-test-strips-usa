import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cash For Test Strips USA — Sell Diabetic Test Strips Near You",
  description:
    "Find local cash buyers for your unused diabetic test strips. Get paid fast via PayPal, Zelle, or check. Free to use. No account needed.",
};

type Company = {
  id: string;
  name: string;
  slug: string;
  url: string | null;
  phone: string | null;
  city: string | null;
  states: string[];
  payment_methods: string[];
  accepted_brands: string[];
  rating: number | null;
  description: string | null;
  featured: boolean;
};

const STATE_LABELS: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const POPULAR_STATES = ["NY", "TX", "FL", "CA", "PA", "NC", "OH", "GA", "MA", "NJ"];

export default async function HomePage() {
  const { data: featured } = await supabase
    .from("companies")
    .select("id, name, slug, url, phone, city, states, payment_methods, accepted_brands, rating, description, featured")
    .eq("featured", true)
    .limit(6);

  const companies = (featured ?? []) as Company[];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-white border-b border-emerald-100 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Free to use · No account needed
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            Sell Your Unused Test Strips{" "}
            <span className="text-emerald-600">for Cash</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            We connect people who have extra diabetic test strips with local cash buyers across the USA.
            Get paid fast — PayPal, Zelle, check, or cash in hand.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sell"
              className="bg-emerald-600 text-white px-8 py-4 rounded-full text-base font-semibold hover:bg-emerald-700 transition-colors"
            >
              Sell Your Test Strips →
            </Link>
            <a
              href="#how-it-works"
              className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full text-base font-semibold hover:border-emerald-400 transition-colors"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-gray-100 py-5 bg-white">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-gray-500 font-medium">
          <span>✓ No shipping required</span>
          <span>✓ Buyers in 30+ states</span>
          <span>✓ PayPal · Zelle · Check · Cash</span>
          <span>✓ Unopened boxes only</span>
          <span>✓ All major brands accepted</span>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Find a buyer",
                body: "Browse our directory of vetted local buyers and filter by your state.",
              },
              {
                step: "2",
                title: "Contact them",
                body: "Reach out directly — most buyers respond within hours.",
              },
              {
                step: "3",
                title: "Get paid",
                body: "Sell your extra strips and get paid via PayPal, Zelle, check, or cash.",
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured buyers */}
      {companies.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Featured Buyers</h2>
              <Link href="/directory" className="text-sm text-emerald-600 font-medium hover:underline">
                See all buyers →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((c) => (
                <CompanyCard key={c.id} company={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by state */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by State</h2>
          <p className="text-gray-500 text-sm mb-8">Find buyers in your state</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_STATES.map((code) => (
              <Link
                key={code}
                href={`/sell-test-strips/${code.toLowerCase()}`}
                className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
              >
                {STATE_LABELS[code]}
              </Link>
            ))}
            <Link
              href="/directory"
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-emerald-100 transition-colors"
            >
              All states →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-emerald-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-3">Ready to turn strips into cash?</h2>
          <p className="text-emerald-100 mb-6">
            Browse our full directory of buyers — most pay within 24 hours.
          </p>
          <Link
            href="/directory"
            className="inline-block bg-white text-emerald-700 font-semibold px-8 py-4 rounded-full hover:bg-emerald-50 transition-colors"
          >
            Find a Buyer →
          </Link>
        </div>
      </section>
    </>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const stateLabels = company.states
    .slice(0, 3)
    .map((s) => STATE_LABELS[s] ?? s)
    .join(", ");
  const moreStates = company.states.length > 3 ? ` +${company.states.length - 3} more` : "";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{company.name}</h3>
        {company.rating && (
          <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            ★ {company.rating}
          </span>
        )}
      </div>
      {company.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{company.description}</p>
      )}
      <p className="text-xs text-gray-400">
        {stateLabels}
        {moreStates}
      </p>
      {company.payment_methods?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {company.payment_methods.map((m) => (
            <span key={m} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {m}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-auto pt-1">
        <Link
          href={`/company/${company.slug}`}
          className="flex-1 text-center text-xs font-medium border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:border-emerald-400 hover:text-emerald-700 transition-colors"
        >
          View details
        </Link>
        {company.url ? (
          <a
            href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Visit site →
          </a>
        ) : (
          <a
            href={`tel:${company.phone ?? "5187799751"}`}
            className="flex-1 text-center text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Contact
          </a>
        )}
      </div>
    </div>
  );
}
