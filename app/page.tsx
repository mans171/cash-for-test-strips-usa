import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { buildWebsiteSchema, buildServiceSchema, buildFaqPageSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import { stripCompanyContact } from "@/lib/company-contact";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

export const metadata: Metadata = {
  title: "Cash For Test Strips USA — Sell Diabetic Test Strips Near You",
  description:
    "Find local cash buyers for your unused diabetic test strips. Get paid fast via PayPal, Zelle, or check. Free to use. Free account required.",
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
    .select("id, name, slug, url, email, phone, city, owner_name, states, payment_methods, accepted_brands, rating, description, featured")
    .eq("featured", true)
    .limit(6);

  const rawCompanies = (featured ?? []) as Company[];

  const supabaseServer = await createServerSupabaseClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const isAuthenticated = !!user;
  const companies = isAuthenticated ? rawCompanies : rawCompanies.map(stripCompanyContact);

  const homeFaqs = [
    {
      q: 'What brands do you accept?',
      a: 'We buy all major brands of diabetic test strips — OneTouch, FreeStyle, Accu-Chek, Contour Next, and True Metrix — plus CGM sensors from Dexcom, FreeStyle Libre, and Omnipod, and infusion sets from Medtronic and Tandem. All supplies must be sealed and unexpired, from U.S. retail sources.',
    },
    {
      q: 'Is it legal to sell diabetic test strips?',
      a: "Yes, selling unused, sealed, personally owned diabetic test strips is legal across the United States. The one firm rule: supplies purchased through Medicare or Medicaid cannot be resold. If your strips were paid for out of pocket or through private insurance, you're in the clear.",
    },
    {
      q: 'How fast will I get paid?',
      a: 'Most buyers pay within 24 hours of receiving and verifying your supplies. Payment is sent via PayPal, Zelle, Venmo, check, or cash — your choice. For local transactions, same-day payment is often possible.',
    },
    {
      q: 'How does the process work?',
      a: "Call or text us at 518-779-9751 with the brand, quantity, and expiration date of what you have. We quote you immediately. For most transactions, we send a prepaid shipping label at no cost. Once we receive and verify the strips, you get paid.",
    },
    {
      q: 'What if my strips are expired or the box has been opened?',
      a: "Opened boxes are not accepted — we require original, sealed packaging only. For expired supplies: most expired test strips have no buyer market, but expired Omnipod pods and expired Dexcom G7 sensors are exceptions. Call us and we'll tell you whether what you have qualifies.",
    },
    {
      q: 'Do you buy in bulk?',
      a: 'Yes — bulk is our specialty. Many of our customers are estate liquidators, caregivers, and pharmacies handling large quantities. We buy everything from a single box to 500 or more, and we pay a higher per-box rate on lots of 10 or more boxes.',
    },
  ]

  const websiteSchema = buildWebsiteSchema()
  const serviceSchema = buildServiceSchema()
  const faqSchema = buildFaqPageSchema(homeFaqs.map((f) => ({ question: f.q, answer: f.a })))

  return (
    <>
      <JsonLd data={websiteSchema} />
      <JsonLd data={serviceSchema} />
      <JsonLd data={faqSchema} />
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-white border-b border-emerald-100 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Free to use · Free account required
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
                <CompanyCard key={c.id} company={c} isAuthenticated={isAuthenticated} />
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

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {homeFaqs.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
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

function CompanyCard({ company, isAuthenticated }: { company: Company; isAuthenticated: boolean }) {
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
        {company.url || company.phone || company.hasContact ? (
          isAuthenticated ? (
            company.url ? (
              <a
                href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors block"
              >
                Visit site →
              </a>
            ) : (
              <a
                href={`tel:${company.phone}`}
                className="flex-1 text-center text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors block"
              >
                Contact
              </a>
            )
          ) : (
            <div className="flex-1 flex flex-col gap-1">
              <span className="text-center text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg opacity-40 pointer-events-none block">
                Contact
              </span>
              <p className="text-xs text-red-600 text-center">
                <Link href="/signup" className="underline">Create an account</Link> to view
              </p>
            </div>
          )
        ) : (
          <a
            href="tel:5187799751"
            className="flex-1 text-center text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors block"
          >
            Contact
          </a>
        )}
      </div>
    </div>
  );
}
