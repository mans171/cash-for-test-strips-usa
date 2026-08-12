import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { buildWebsiteSchema, buildServiceSchema, buildFaqPageSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import { stripCompanyContact } from "@/lib/company-contact";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";
import { STATE_LABELS } from "@/lib/states";
import { BuyerCard } from "@/app/components/BuyerCard";
import { btnOnDark } from "@/app/components/ui";
import { COMPANY_COLUMNS } from "@/lib/company-columns";

export const metadata: Metadata = {
  title: "Cash For Test Strips USA — Sell Diabetic Test Strips Near You",
  description:
    "Find local cash buyers for your unused diabetic test strips. Get paid fast via PayPal, Zelle, or check. Free to use. Free account required.",
};

const POPULAR_STATES = ["NY", "TX", "FL", "CA", "PA", "NC", "OH", "GA", "MA", "NJ"];

export default async function HomePage() {
  const { data: featured } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("mail_in", false)
    .eq("featured", true)
    .limit(6);

  const { count: localBuyerCount } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("mail_in", false)
    .eq("active", true);

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
      {/* Hero — dark ink, heavy type, ZIP-first */}
      <section className="bg-ink text-white py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="inline-block text-[11px] font-extrabold text-electric uppercase tracking-wider mb-5">
            The national directory of diabetic supply buyers
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-4">
            Turn extra supplies<br />into <span className="text-electric">cash today.</span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8">
            Local buyers pay{" "}
            <Link href="/how-much-are-diabetic-test-strips-worth" className="font-extrabold text-white underline decoration-electric decoration-2 underline-offset-4 hover:text-electric transition-colors">
              up to $100 a box
            </Link>{" "}
            for sealed, unexpired supplies. Cash in hand, same day.
          </p>

          <form action="/directory" method="get" className="flex items-stretch max-w-md mx-auto bg-white rounded-xl p-1.5 shadow-2xl shadow-black/30">
            <input
              name="zip"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              placeholder="Enter your ZIP code"
              aria-label="ZIP code"
              className="flex-1 min-w-0 px-4 text-gray-900 text-sm focus:outline-none rounded-l-lg"
            />
            <button type="submit" className="bg-cash text-white font-extrabold text-sm px-6 py-3.5 rounded-lg hover:bg-cash-hover transition-colors shrink-0">
              Find buyers →
            </button>
          </form>

          <div className="flex justify-center gap-8 mt-10 text-sm">
            <span className="text-white/60"><b className="text-electric font-black text-lg">{localBuyerCount ?? 29}</b> local buyers</span>{/* ?? 29: static fallback if the count query errors */}
            <span className="text-white/60"><b className="text-electric font-black text-lg">24hr</b> payouts</span>
            <span className="text-white/60"><b className="text-electric font-black text-lg">50</b> states</span>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-gray-100 bg-white py-5">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-gray-600 font-medium">
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
                <div className="w-12 h-12 bg-ink text-electric rounded-full flex items-center justify-center text-lg font-black mx-auto mb-4">
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
        <section className="py-16 px-4 bg-ground">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Featured Buyers</h2>
              <Link href="/directory" className="text-sm text-cash font-medium hover:underline">
                See all buyers →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((c) => (
                <BuyerCard key={c.id} company={c} isAuthenticated={isAuthenticated} />
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
                className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full hover:border-cash hover:text-cash transition-colors"
              >
                {STATE_LABELS[code]}
              </Link>
            ))}
            <Link
              href="/directory"
              className="bg-cash/10 border border-cash/30 text-cash text-sm font-medium px-4 py-2 rounded-full hover:bg-cash/20 transition-colors"
            >
              All states →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-ground">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {homeFaqs.map(({ q, a }) => (
              <div key={q}>
                <h3 className="font-bold text-gray-900 mb-1 text-sm">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 bg-ink text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-3">Ready to turn supplies into cash?</h2>
          <p className="text-white/70 mb-6">
            Browse our full directory of buyers — most pay within 24 hours.
          </p>
          <Link href="/directory" className={btnOnDark}>
            Find a Buyer →
          </Link>
        </div>
      </section>
    </>
  );
}
