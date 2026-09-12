import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { buildWebsiteSchema, buildServiceSchema, buildFaqPageSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import type { Company } from "@/lib/types";
import { STATE_LABELS } from "@/lib/states";
import { BuyerCard } from "@/app/components/BuyerCard";
import { btnOnDark } from "@/app/components/ui";
import { COMPANY_COLUMNS } from "@/lib/company-columns";
import { REGIONS, REGION_ORDER } from "@/lib/hub-page-content";
import { OWNER_PHONE } from "@/lib/owner";

export const metadata: Metadata = {
  title: "We Buy Diabetic Test Strips — Mail-In or Same-Day Local | Cash For Test Strips USA",
  description:
    "Cash For Test Strips USA buys sealed, unexpired diabetic test strips, Dexcom and Libre sensors and Omnipod supplies. Mail in from any state or meet a local buyer. Call or text 518-278-6008.",
  alternates: { canonical: 'https://cash4teststripsusa.com' },
};

const POPULAR_STATES = ["NY", "TX", "FL", "CA", "PA", "NC", "OH", "GA", "MA", "NJ"];

// Typed once here rather than inline in three CTAs. The stored format is
// hyphenated for humans; a tel: href wants the digits alone.
const TEL_HREF = `tel:${OWNER_PHONE.replace(/-/g, '')}`;
// The same line receives SMS, and a photo of the box is the fastest quote we
// can give, so the secondary CTA opens a text rather than a call.
const SMS_HREF = `sms:${OWNER_PHONE.replace(/\D/g, '')}`;

// What we buy — listed by the names printed on the box, because that is what a
// seller reads off the carton. No prices anywhere: quotes happen in the DM.
const WHAT_WE_BUY = [
  {
    title: 'Test strips',
    items: ['OneTouch Verio / Ultra', 'FreeStyle Lite', 'Accu-Chek Guide / Aviva', 'Contour Next', 'True Metrix'],
  },
  {
    title: 'CGM sensors',
    items: ['Dexcom G6', 'Dexcom G7', 'FreeStyle Libre 2', 'FreeStyle Libre 3'],
  },
  {
    title: 'Pump & pen supplies',
    items: ['Omnipod 5', 'Omnipod DASH', 'Medtronic infusion sets', 'Tandem infusion sets'],
  },
];

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

  const companies = (featured ?? []) as Company[];

  const homeFaqs = [
    {
      q: 'What brands do you accept?',
      a: 'We buy all major brands of diabetic test strips — OneTouch, FreeStyle, Accu-Chek, Contour Next, and True Metrix — plus CGM sensors from Dexcom, FreeStyle Libre, and Omnipod, and infusion sets from Medtronic and Tandem. All supplies must be sealed and unexpired, from U.S. retail sources.',
    },
    {
      q: 'Is it legal to sell diabetic test strips?',
      a: "Yes, selling unused, sealed, personally owned diabetic test strips is legal across the United States. The one firm rule: supplies purchased through a government-covered program cannot be resold. If your supplies were paid for out of pocket or through private insurance, they are yours to sell.",
    },
    {
      q: 'How fast will I get paid?',
      a: 'Local buyers often pay on the spot, the same day. Mail-in sellers are paid the day the box arrives and is verified. Payment is sent via PayPal, Zelle, Venmo, check, or cash — your choice.',
    },
    {
      q: 'How does the process work?',
      a: `Text a photo of your boxes to ${OWNER_PHONE} and we reply with a quote, usually the same day. If you are selling by mail we email you a prepaid shipping label at no cost, and you get paid the day it arrives. If a local buyer covers your area, you can meet them the same day instead.`,
    },
    {
      q: 'What if my strips are expired or the box has been opened?',
      a: "Opened boxes are not accepted — we require original, sealed packaging only. For expired supplies: most expired test strips have no buyer market, but expired Omnipod pods and expired Dexcom G7 sensors are exceptions. Text us a photo and we'll tell you whether what you have qualifies.",
    },
    {
      q: 'Do you buy in bulk?',
      a: 'Yes — bulk is our specialty. Many of our sellers are estate liquidators, caregivers, and pharmacies handling large quantities. We buy from a single box to full estate or pharmacy lots, and large lots get a per-lot quote.',
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
      {/* Hero — we are the buyer. The page used to open on "the national
          directory", which sent every visitor off to someone else before we
          had said what we do. Phone first, mail-in second, ZIP lookup third. */}
      <section className="bg-ink text-white py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="inline-block text-[11px] font-extrabold text-electric uppercase tracking-wider mb-5">
            Nationwide mail-in &middot; Same-day local
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05] mb-4">
            We buy diabetic <span className="text-electric">test strips.</span><br />
            <span className="block text-2xl sm:text-3xl font-black mt-3 text-white/90">
              Mail them in from any state, or sell same&#8209;day to a local buyer.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto mb-8">
            Sealed boxes only. Some expired CGM sensors and pods still qualify. Text a photo of
            what you have and get a quote back fast.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <a
              href={TEL_HREF}
              className="bg-cash text-white font-extrabold text-sm px-7 py-3.5 rounded-lg hover:bg-cash-hover transition-colors"
            >
              Call or text {OWNER_PHONE}
            </a>
            <a
              href={SMS_HREF}
              className="text-white/80 font-bold text-sm px-5 py-3.5 underline decoration-electric decoration-2 underline-offset-4 hover:text-electric transition-colors"
            >
              Text a photo for a quote →
            </a>
          </div>

          <form action="/directory" method="get" className="max-w-md mx-auto">
            <label htmlFor="home-zip" className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
              Or find a local buyer
            </label>
            <div className="flex items-stretch bg-white rounded-xl p-1.5 shadow-2xl shadow-black/30">
              <input
                id="home-zip"
                name="zip"
                inputMode="numeric"
                pattern="[0-9]{5}"
                maxLength={5}
                placeholder="Enter your ZIP code"
                aria-label="ZIP code"
                className="flex-1 min-w-0 px-4 text-gray-900 text-sm focus:outline-none rounded-l-lg"
              />
              <button type="submit" className="bg-ink text-white font-extrabold text-sm px-6 py-3.5 rounded-lg hover:bg-black transition-colors shrink-0">
                Find buyers →
              </button>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-10 text-sm">
            <span className="text-white/60"><b className="text-electric font-black text-lg">{localBuyerCount ?? 29}</b> local buyers</span>{/* ?? 29: static fallback if the count query errors */}
            <span className="text-white/60"><b className="text-electric font-black text-lg">50 states</b> by mail</span>
            <span className="text-white/60"><b className="text-electric font-black text-lg">Quote</b> by text</span>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-gray-100 bg-white py-5">
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-600 font-medium">
          <span>✓ Sealed boxes only. Some expired CGM sensors and pods still qualify.</span>
          <span>✓ Free shipping label for mail-in</span>
          <span>✓ PayPal · Zelle · Check · Cash</span>
          <span>✓ Dexcom · Libre · Omnipod · OneTouch · Contour · Accu-Chek</span>
          <span>✓ Local pickup through {localBuyerCount ?? 29} buyers</span>
        </div>
      </section>

      {/* What we buy */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">What We Buy</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {WHAT_WE_BUY.map(({ title, items }) => (
              <div key={title}>
                <h3 className="font-bold text-gray-900 mb-3 text-sm">{title}</h3>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item} className="text-sm text-gray-500 leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center mt-10">
            Not sure?{" "}
            <a href={TEL_HREF} className="font-bold text-cash hover:underline">
              Text a photo of the box to {OWNER_PHONE}.
            </a>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 px-4 bg-ground">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Text a photo",
                body: "Send a picture of the boxes and their expiration dates.",
              },
              {
                step: "2",
                title: "Get a quote",
                body: "We reply with a firm number, usually the same day.",
              },
              {
                step: "3",
                title: "Get paid",
                body: "Meet a local buyer the same day, or use our free shipping label and get paid when it arrives.",
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
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Buyers who offer local pickup</h2>
              <Link href="/directory" className="text-sm text-cash font-medium hover:underline">
                See all buyers →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((c) => (
                <BuyerCard key={c.id} company={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by state.

          All 50 states are linked from here, not the 10 they used to be. The
          homepage is the strongest internal-link source on the site, and the 40
          states it skipped were reachable only via other states' neighbour
          links — which is why most of them sat in Google's "Discovered —
          currently not indexed" bucket with no referring page detected.

          Laid out as four regional columns rather than 50 chips: a flat wall of
          50 pills is a link dump, while the columns stay scannable and keep the
          section roughly the height it was. The most-searched states keep a
          fast-path row above so the common case is still one glance. */}
      <section className="py-16 px-4 bg-ground">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by State</h2>
          <p className="text-gray-500 text-sm mb-6">Find buyers in your state</p>

          <div className="flex flex-wrap gap-2 mb-10">
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
              href="/sell-test-strips"
              className="bg-cash/10 border border-cash/30 text-cash text-sm font-medium px-4 py-2 rounded-full hover:bg-cash/20 transition-colors"
            >
              All 50 states →
            </Link>
            <Link
              href="/sell-test-strips-in-bulk"
              className="bg-cash/10 border border-cash/30 text-cash text-sm font-medium px-4 py-2 rounded-full hover:bg-cash/20 transition-colors"
            >
              Selling in bulk? →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 border-t border-gray-200 pt-8">
            {REGION_ORDER.map((region) => (
              <div key={region}>
                <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">
                  {region}
                </h3>
                <ul className="space-y-1.5">
                  {REGIONS[region].map((code) => (
                    <li key={code}>
                      <Link
                        href={`/sell-test-strips/${code.toLowerCase()}`}
                        className="text-sm text-gray-600 hover:text-cash transition-colors"
                      >
                        {STATE_LABELS[code]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
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
          <h2 className="text-3xl font-black mb-3">Have supplies to sell?</h2>
          <p className="text-white/70 mb-6">
            Text a photo for a quote, or find a buyer near you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={TEL_HREF} className={btnOnDark}>
              Call or text {OWNER_PHONE}
            </a>
            <Link href="/directory" className="text-white/80 font-bold text-sm px-5 py-3 underline decoration-electric decoration-2 underline-offset-4 hover:text-electric transition-colors">
              Find a local buyer →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
