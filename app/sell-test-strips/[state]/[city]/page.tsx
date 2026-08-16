import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { buildFaqPageSchema, buildBreadcrumbSchema, buildLocalBusinessSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import { stripCompanyContact } from "@/lib/company-contact";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";
import { BuyerCard } from "@/app/components/BuyerCard";
import { COMPANY_COLUMNS } from "@/lib/company-columns";
import { STATE_LABELS } from "@/lib/states";
import { CITY_TARGETS, type CityTarget } from "@/lib/city-geo";
import { zipsNearPoint } from "@/lib/zip-lookup";
import { buildCityFaqs, cityIntro, nearbyBuyers, siblingCities } from "@/lib/city-page-content";

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
  if (!target) return { title: "City Not Found" };

  const pageUrl = `https://cash4teststripsusa.com/sell-test-strips/${state.toLowerCase()}/${city}`;
  return {
    title: `Sell Diabetic Test Strips in ${target.name}, ${target.state} — Cash Buyers Near You`,
    description: `Verified buyers near ${target.name}, ${target.state} pay cash for unused diabetic test strips via PayPal, Zelle, or check. Compare real distances and contact a buyer in minutes.`,
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
  const rawMailIn = ((mailInData ?? []) as Company[])[0] ?? null;
  const rawBuyers = nearbyBuyers(target, allInPerson, 100);

  // Anti-doorway gate, enforced again here (not just at generateStaticParams
  // build time): a page for a target with no buyer within range must not
  // render. See docs/seo/2026-08-12-city-page-spec.md Rule 2.
  if (rawBuyers.length === 0) notFound();

  const supabaseServer = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  const isAuthenticated = !!user;

  const buyers = isAuthenticated
    ? rawBuyers
    : rawBuyers.map((c) => ({ ...stripCompanyContact(c), miles: c.miles }));
  const mailIn = rawMailIn ? (isAuthenticated ? rawMailIn : stripCompanyContact(rawMailIn)) : null;

  const faqs = buildCityFaqs({ target, buyers: rawBuyers, hasMailIn: !!rawMailIn });
  const siblings = siblingCities(target.slug, 6);
  const zips = await zipsNearPoint(supabase, { lat: target.lat, lng: target.lng }, target.state, 30, 20);
  const intro = cityIntro(target, rawBuyers);
  const stateLabel = STATE_LABELS[target.state] ?? target.state;

  const pageUrl = `https://cash4teststripsusa.com/sell-test-strips/${state.toLowerCase()}/${city}`;
  const faqSchema = buildFaqPageSchema(faqs.map((f) => ({ question: f.q, answer: f.a })));
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://cash4teststripsusa.com" },
    { name: "Directory", url: "https://cash4teststripsusa.com/directory" },
    { name: stateLabel, url: `https://cash4teststripsusa.com/sell-test-strips/${target.state.toLowerCase()}` },
    { name: target.name, url: pageUrl },
  ]);
  // One LocalBusiness block per nearby buyer, sibling <script> tags rather
  // than a hand-rolled @graph wrapper — the state page already proves
  // multiple JSON-LD blocks on one page are valid and indexable.
  const buyerSchemas = rawBuyers.map((b) =>
    buildLocalBusinessSchema({
      name: b.name,
      url: b.url ?? pageUrl,
      telephone: null, // contact fields stay out of schema regardless of auth state
      description: b.description,
      areaServed: [target.name, stateLabel],
      paymentAccepted: b.payment_methods ?? [],
    })
  );

  const brands = [...new Set(rawBuyers.flatMap((b) => b.accepted_brands ?? []))].sort((a, b) =>
    a.localeCompare(b)
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
      <p className="text-gray-600 max-w-2xl mb-8 leading-relaxed">{intro}</p>

      <p className="text-sm text-gray-400 mb-6">
        {buyers.length} buyer{buyers.length !== 1 ? "s" : ""} near {target.name}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {buyers.map((c) => (
          <BuyerCard key={c.id} company={c} isAuthenticated={isAuthenticated} />
        ))}
      </div>

      {mailIn && (
        <div className="mb-12">
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            Prefer to mail your strips instead?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <BuyerCard company={mailIn} isAuthenticated={isAuthenticated} />
          </div>
        </div>
      )}

      {brands.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            Brands accepted near {target.name}
          </h2>
          <p className="text-gray-600 max-w-2xl text-sm leading-relaxed">
            {brands.join(", ")} — available from {buyers.length} local buyer{buyers.length !== 1 ? "s" : ""}.
            Individual buyers accept different subsets; check a listing before you go.
          </p>
        </div>
      )}

      {zips.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            We serve these ZIP codes near {target.name}
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
          {faqs.map((f) => (
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
