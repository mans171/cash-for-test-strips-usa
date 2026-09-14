import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { buildFaqPageSchema, buildBreadcrumbSchema, buildLocalBusinessSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import type { Company } from "@/lib/types";
import { BuyerCard } from "@/app/components/BuyerCard";
import { COMPANY_COLUMNS } from "@/lib/company-columns";
import { STATE_LABELS } from "@/lib/states";
import { CITY_TARGETS, type CityTarget } from "@/lib/city-geo";
import { zipsNearPoint } from "@/lib/zip-lookup";
import {
  buildAboveTheFold,
  buildBrandsBlock,
  buildCityFaqs,
  buildCitySpecificFaq,
  buildHowItWorks,
  buildMetaDescription,
  cityIntro,
  nearbyBuyers,
  publishableCityTargets,
  siblingCities,
} from "@/lib/city-page-content";
import { honorsBonus } from "@/lib/bonus";
import { pageTitle, cityTitle } from "@/lib/title";

type Props = { params: Promise<{ state: string; city: string }> };

function findTarget(state: string, city: string): CityTarget | undefined {
  return CITY_TARGETS.find(
    (t) => t.state.toLowerCase() === state.toLowerCase() && t.slug === city
  );
}

export async function generateStaticParams() {
  return CITY_TARGETS.map((t) => ({ state: t.state.toLowerCase(), city: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params;
  const target = findTarget(state, city);
  if (!target) return { title: pageTitle("City Not Found") };

  const pageUrl = `https://cash4teststripsusa.com/sell-test-strips/${state.toLowerCase()}/${city}`;

  // Fetch the nearest buyer to build a derived description from real fields.
  const { data: inPersonData } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("mail_in", false)
    .order("featured", { ascending: false })
    .order("name");
  const allInPerson = (inPersonData ?? []) as Company[];
  const nearby = nearbyBuyers(target, allInPerson);
  const description =
    nearby.length > 0
      ? buildMetaDescription(nearby[0], target)
      : `Verified buyers near ${target.name}, ${target.state} pay cash for unused diabetic test strips. Compare real distances and contact a buyer in minutes.`;

  return {
    title: pageTitle(cityTitle(target.name, target.state)),
    description,
    alternates: { canonical: pageUrl },
  };
}

export default async function CityPage({ params }: Props) {
  const { state, city } = await params;
  const target = findTarget(state, city);
  if (!target) notFound();

  const [{ data: inPersonData }, { data: mailInData }] = await Promise.all([
    supabase
      .from("companies")
      .select(COMPANY_COLUMNS)
      .eq("mail_in", false)
      .order("featured", { ascending: false })
      .order("name"),
    supabase.from("companies").select(COMPANY_COLUMNS).eq("mail_in", true).limit(1),
  ]);

  const allInPerson = (inPersonData ?? []) as Company[];
  // Contact details are public on every card — the account gate was removed
  // on 2026-09-12. See lib/company-contact.ts.
  const mailIn = ((mailInData ?? []) as Company[])[0] ?? null;
  // Radius comes from the shared constant, not a literal, so this page and
  // app/sitemap.ts cannot drift apart.
  const buyers = nearbyBuyers(target, allInPerson);

  // Anti-doorway gate, enforced again here (not just at generateStaticParams
  // build time): a page for a target with no buyer within range must not
  // render. See docs/seo/2026-08-12-city-page-spec.md Rule 2.
  if (buyers.length === 0) notFound();

  const nearest = buyers[0];

  // Buyer-first above-the-fold data
  const atf = buildAboveTheFold(nearest, target);
  const howItWorks = buildHowItWorks(nearest, !!mailIn);
  const brands = buildBrandsBlock(buyers);

  const zips = await zipsNearPoint(supabase, { lat: target.lat, lng: target.lng }, target.state, 30, 20);

  // City-specific FAQ — derived from real data, added to the FAQ list
  const citySpecificFaq = buildCitySpecificFaq(nearest, target, zips);
  const faqs = buildCityFaqs({ target, buyers, hasMailIn: !!mailIn });
  const allFaqs = citySpecificFaq ? [citySpecificFaq, ...faqs] : faqs;

  // Pass the live buyer set so the footer never links to a city page that
  // would 404 — see publishableCityTargets in lib/city-page-content.ts.
  const siblings = siblingCities(target.slug, 6, publishableCityTargets(allInPerson));
  const intro = cityIntro(target, buyers);
  const stateLabel = STATE_LABELS[target.state] ?? target.state;

  const pageUrl = `https://cash4teststripsusa.com/sell-test-strips/${state.toLowerCase()}/${city}`;
  const faqSchema = buildFaqPageSchema(allFaqs.map((f) => ({ question: f.q, answer: f.a })));
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://cash4teststripsusa.com" },
    { name: "Directory", url: "https://cash4teststripsusa.com/directory" },
    { name: stateLabel, url: `https://cash4teststripsusa.com/sell-test-strips/${target.state.toLowerCase()}` },
    { name: target.name, url: pageUrl },
  ]);
  // One LocalBusiness block per nearby buyer. Telephone is emitted only for
  // house-answered buyers — their number is already displayed publicly on the
  // buyer card since the 9/12 de-gate PR, so emitting it in structured data
  // does not reveal anything new. Third-party buyer phones stay out of schema
  // to avoid claiming a number we did not obtain permission to broadcast.
  const buyerSchemas = buyers.map((b) =>
    buildLocalBusinessSchema({
      name: b.name,
      url: b.url ?? pageUrl,
      telephone: honorsBonus(b) ? b.phone ?? null : null,
      description: b.description,
      areaServed: [target.name, stateLabel],
      paymentAccepted: b.payment_methods ?? [],
      city: b.city,
      stateCode: b.states[0] ?? null,
    })
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      {buyerSchemas.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}

      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-cash">Home</Link>
        {" / "}
        <Link href="/directory" className="hover:text-cash">Directory</Link>
        {" / "}
        <Link href={`/sell-test-strips/${target.state.toLowerCase()}`} className="hover:text-cash">
          {stateLabel}
        </Link>
        {" / "}
        <span className="text-gray-700">{target.name}</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-3">
        Sell Diabetic Test Strips in {target.name}, {target.state}
      </h1>

      {/* Above-the-fold buyer block — buyer-first, phone at top */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8 max-w-2xl">
        <p className="text-lg font-bold text-gray-900 mb-3">{atf.headline}</p>

        {atf.phone && (
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <a
              href={`sms:${atf.phone.replace(/\D/g, "")}`}
              className="inline-flex items-center justify-center gap-2 bg-cash text-white font-extrabold text-sm px-6 py-3 rounded-lg hover:bg-cash-hover transition-colors"
            >
              Text {atf.phone}
            </a>
            <a
              href={`tel:${atf.phone.replace(/\D/g, "")}`}
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-900 font-semibold text-sm px-6 py-3 rounded-lg hover:border-cash hover:text-cash transition-colors"
            >
              Call {atf.phone}
            </a>
          </div>
        )}

        <ul className="text-sm text-gray-600 space-y-1">
          {atf.hasMeetup && (
            <li className="flex items-start gap-2">
              <span className="text-cash font-bold mt-0.5">✓</span>
              <span>In-person meetup available</span>
            </li>
          )}
          {atf.contextLine && (
            <li className="flex items-start gap-2">
              <span className="text-cash font-bold mt-0.5">✓</span>
              <span>{atf.contextLine}</span>
            </li>
          )}
          {atf.bonusCopy && (
            <li className="flex items-start gap-2">
              <span className="text-cash font-bold mt-0.5">✓</span>
              <span>{atf.bonusCopy}</span>
            </li>
          )}
        </ul>
      </div>

      <p className="text-gray-600 max-w-2xl mb-8 leading-relaxed">{intro}</p>

      <p className="text-sm text-gray-400 mb-6">
        {buyers.length} buyer{buyers.length !== 1 ? "s" : ""} near {target.name}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {buyers.map((c) => (
          <BuyerCard key={c.id} company={c} />
        ))}
      </div>

      {mailIn && (
        <div className="mb-12">
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            Prefer to mail your strips instead?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <BuyerCard company={mailIn} />
          </div>
        </div>
      )}

      {/* Brands block — as a list, not a comma string */}
      {brands.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-extrabold text-gray-900 mb-3">
            {atf.isHouse ? `What we buy near ${target.name}` : `What buyers near ${target.name} accept`}
          </h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 max-w-2xl">
            {brands.map((brand) => (
              <li key={brand} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-cash font-bold">•</span>
                {brand}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-3 max-w-2xl">
            Individual buyers may accept different subsets — confirm with them before traveling.
          </p>
        </div>
      )}

      {/* How it works block — steps derived from real buyer fields */}
      {howItWorks.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-extrabold text-gray-900 mb-6">
            How it works in {target.name}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {howItWorks.map((step) => (
              <div key={step.number} className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-cash/10 text-cash font-black flex items-center justify-center text-sm shrink-0">
                  {step.number}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{step.title}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {zips.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            ZIP codes served near {target.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {zips.map((z) => (
              <Link
                key={z}
                href={`/directory?zip=${z}`}
                className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-cash hover:text-cash transition-colors"
              >
                {z}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 pt-12">
        <h2 className="text-xl font-extrabold text-gray-900 mb-6">
          Frequently Asked Questions — Selling Test Strips Near {target.name}
        </h2>
        <div className="space-y-6">
          {allFaqs.map((f) => (
            <Faq key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>

      {siblings.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-400 mb-3">Nearby cities</p>
          <div className="flex flex-wrap gap-2">
            {siblings.map((s) => (
              <Link
                key={s.slug}
                href={`/sell-test-strips/${s.state.toLowerCase()}/${s.slug}`}
                className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-cash hover:text-cash transition-colors"
              >
                {s.name}, {s.state}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link
          href={`/sell-test-strips/${target.state.toLowerCase()}`}
          className="text-sm text-cash font-semibold hover:underline"
        >
          See all {stateLabel} buyers →
        </Link>
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
