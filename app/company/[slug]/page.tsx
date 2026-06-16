import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";

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
  CANADA: "Canada",
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("companies")
    .select("name, city, states, description")
    .eq("slug", slug)
    .single();

  if (!data) return { title: "Buyer Not Found" };

  const stateLabel = data.states[0] ? STATE_LABELS[data.states[0]] : null;
  return {
    title: `${data.name} — Sell Test Strips${stateLabel ? ` in ${stateLabel}` : ""}`,
    description:
      data.description ??
      `${data.name} buys unused diabetic test strips for cash${stateLabel ? ` in ${stateLabel}` : ""}.`,
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, slug, url, city, owner_name, states, payment_methods, accepted_brands, rating, description, featured, phone")
    .eq("slug", slug)
    .single();

  if (!company) notFound();

  const stateNames = company.states.map((s: string) => STATE_LABELS[s] ?? s);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/directory" className="text-sm text-emerald-600 hover:underline mb-6 inline-block">
        ← Back to directory
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {company.featured && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Featured
                </span>
              )}
              {company.rating && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  ★ {company.rating}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            {company.city && (
              <p className="text-gray-500 text-sm mt-1">📍 {company.city}</p>
            )}
          </div>

          {company.url && (
            <a
              href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 bg-emerald-600 text-white font-semibold px-5 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
            >
              Visit Website →
            </a>
          )}
        </div>

        {/* Description */}
        {company.description && (
          <p className="text-gray-600 leading-relaxed mb-8">{company.description}</p>
        )}

        {/* Details grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <DetailBlock
            label="States served"
            value={stateNames.length > 0 ? stateNames.join(", ") : "Contact for availability"}
          />
          {company.payment_methods?.length > 0 && (
            <DetailBlock
              label="Payment methods"
              value={company.payment_methods.join(", ")}
            />
          )}
          {company.accepted_brands?.length > 0 && (
            <DetailBlock
              label="Brands accepted"
              value={company.accepted_brands.join(", ")}
            />
          )}
          {company.owner_name && (
            <DetailBlock label="Contact" value={company.owner_name} />
          )}
        </div>

        {/* CTA */}
        <div className="bg-emerald-50 rounded-xl p-6 text-center">
          <h2 className="font-semibold text-gray-900 mb-2">Ready to sell?</h2>
          <p className="text-sm text-gray-500 mb-4">
            {company.url
              ? "Visit their website to get a quote and arrange payment."
              : "Tap the button below to get connected with this buyer."}
          </p>
          {company.url ? (
            <a
              href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
            >
              Visit site →
            </a>
          ) : company.phone ? (
            <a
              href={`tel:${company.phone}`}
              className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
            >
              Contact
            </a>
          ) : null}
        </div>
      </div>

      {/* Back link */}
      <div className="mt-8 text-center">
        <Link href="/directory" className="text-sm text-gray-400 hover:text-emerald-600 transition-colors">
          ← Browse all buyers
        </Link>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-sm text-gray-700">{value}</dd>
    </div>
  );
}
