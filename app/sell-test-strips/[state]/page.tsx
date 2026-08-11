import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { buildFaqPageSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import { stripCompanyContact } from "@/lib/company-contact";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types";

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

type Props = { params: Promise<{ state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const code = state.toUpperCase();
  const label = STATE_LABELS[code];
  if (!label) return { title: "State Not Found" };

  return {
    title: `Sell Diabetic Test Strips in ${label} — Find Local Cash Buyers`,
    description: `Find cash buyers for unused diabetic test strips in ${label}. Get paid fast via PayPal, Zelle, or check. Browse local buyers near you.`,
    alternates: { canonical: `https://cash4teststripsusa.com/sell-test-strips/${state.toLowerCase()}` },
  };
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const code = state.toUpperCase();
  const label = STATE_LABELS[code];

  if (!label) notFound();

  const { data } = await supabase
    .from("companies")
    .select("id, name, slug, url, email, phone, city, owner_name, states, payment_methods, accepted_brands, rating, description, featured")
    .contains("states", [code])
    .order("featured", { ascending: false })
    .order("name");

  const rawCompanies = (data ?? []) as Company[];

  const supabaseServer = await createServerSupabaseClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const isAuthenticated = !!user;
  const companies = isAuthenticated ? rawCompanies : rawCompanies.map(stripCompanyContact);

  const faqs = [
    {
      q: `Is it legal to sell test strips in ${label}?`,
      a: `Yes. Selling unused, unexpired, unopened diabetic test strips is legal in ${label} and across the US. Strips must be in their original packaging and not have been paid for by Medicare or Medicaid.`,
    },
    {
      q: "What brands do buyers typically accept?",
      a: "Most buyers accept OneTouch, Freestyle, Accu-Chek, Contour, Bayer, and Walmart ReliOn. Contact the specific buyer to confirm they accept your brand.",
    },
    {
      q: "How do I get paid?",
      a: "Payment methods vary by buyer — most offer PayPal, Zelle, Venmo, check, or cash in person. Check each buyer's listing for details.",
    },
    {
      q: "Do the strips need to be unopened?",
      a: "Yes. Buyers require strips to be in their original, unopened packaging with at least 6 months before the expiration date.",
    },
  ];

  const pageUrl = `https://cash4teststripsusa.com/sell-test-strips/${state.toLowerCase()}`;
  const faqSchema = buildFaqPageSchema(faqs.map((f) => ({ question: f.q, answer: f.a })));
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "https://cash4teststripsusa.com" },
    { name: "Directory", url: "https://cash4teststripsusa.com/directory" },
    { name: label, url: pageUrl },
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        {" / "}
        <Link href="/directory" className="hover:text-emerald-600">Directory</Link>
        {" / "}
        <span className="text-gray-700">{label}</span>
      </nav>

      {/* Hero copy — SEO targeted */}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">
        Sell Diabetic Test Strips in {label}
      </h1>
      <p className="text-gray-600 max-w-2xl mb-8 leading-relaxed">
        Looking to sell unused diabetic test strips in {label}? We've compiled a list of
        trusted local buyers who pay cash — via PayPal, Zelle, check, or in person.
        No shipping required in most cases.
      </p>

      {companies.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <p className="font-semibold text-gray-800 mb-2">No buyers listed in {label} yet</p>
          <p className="text-sm text-gray-500 mb-4">
            We're always adding new buyers. In the meantime, browse our national directory
            — many buyers ship and buy from any state.
          </p>
          <Link
            href="/directory"
            className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
          >
            Browse all buyers
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-6">
            {companies.length} buyer{companies.length !== 1 ? "s" : ""} in {label}
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {companies.map((c) => (
              <StateCompanyCard key={c.id} company={c} isAuthenticated={isAuthenticated} />
            ))}
          </div>
        </>
      )}

      {/* FAQ — helps SEO */}
      <div className="border-t border-gray-100 pt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
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
        <p className="text-sm text-gray-400 mb-3">Looking in a different state?</p>
        <div className="flex flex-wrap gap-2">
          {["NY", "TX", "FL", "CA", "PA", "NC", "OH", "GA", "MA", "NJ", "IN", "SC"].map((s) => (
            <Link
              key={s}
              href={`/sell-test-strips/${s.toLowerCase()}`}
              className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
            >
              {STATE_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function StateCompanyCard({
  company,
  isAuthenticated,
}: {
  company: Company;
  isAuthenticated: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm leading-snug">{company.name}</h2>
          {company.city && <p className="text-xs text-gray-400 mt-0.5">{company.city}</p>}
        </div>
        {company.featured && (
          <span className="shrink-0 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
      </div>

      {company.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{company.description}</p>
      )}

      {company.payment_methods?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {company.payment_methods.map((m: string) => (
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

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-1 text-sm">{q}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
    </div>
  );
}
