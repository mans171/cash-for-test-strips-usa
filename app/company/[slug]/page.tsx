import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { STATE_LABELS } from "@/lib/states";
import type { Company } from "@/lib/types";
import { stripCompanyContact } from "@/lib/company-contact";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildLocalBusinessSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import { isValidZip, haversineMiles, withDistance } from "@/lib/geo";
import { getZipCentroid } from "@/lib/zip-lookup";
import { COMPANY_COLUMNS } from "@/lib/company-columns";
import { BuyerCard } from "@/app/components/BuyerCard";
import { UnlockContact } from "@/app/components/UnlockContact";
import { MonogramAvatar, VerifiedBadge, FeaturedBadge, PinIcon, Chip } from "@/app/components/ui";

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
    alternates: { canonical: `https://cash4teststripsusa.com/company/${slug}` },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;

  // mail_in isn't part of COMPANY_COLUMNS (it's a filter field, not a display
  // field — see directory/page.tsx), but the notFound() guard below needs it,
  // so it's appended for this fetch only.
  const { data: rawCompany } = await supabase
    .from("companies")
    .select(`${COMPANY_COLUMNS}, mail_in`)
    .eq("slug", slug)
    .single();

  if (!rawCompany || rawCompany.mail_in) notFound();

  const supabaseServer = await createServerSupabaseClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const isAuthenticated = !!user;
  const company = (isAuthenticated ? rawCompany : stripCompanyContact(rawCompany as Company)) as Company;

  const stateNames = company.states.map((s: string) => STATE_LABELS[s] ?? s);

  const localBusinessSchema = buildLocalBusinessSchema({
    name: company.name,
    url: `https://cash4teststripsusa.com/company/${company.slug}`,
    telephone: company.phone,
    description: company.description,
    areaServed: stateNames,
    paymentAccepted: company.payment_methods ?? [],
  });

  // Distance from the visitor's last searched ZIP (cookie set by directory search)
  const cookieStore = await cookies();
  const cookieZip = cookieStore.get("c4ts_zip")?.value;
  let milesAway: number | null = null;
  if (cookieZip && isValidZip(cookieZip) && company.lat != null && company.lng != null) {
    const centroid = await getZipCentroid(supabase, cookieZip);
    if (centroid) milesAway = haversineMiles(centroid, { lat: company.lat, lng: company.lng });
  }

  // Nearby buyers: top 3 others, by distance when this buyer has coords
  const { data: othersData } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("mail_in", false)
    .neq("id", rawCompany.id);
  const others = ((othersData ?? []) as Company[]).map((c) =>
    isAuthenticated ? c : stripCompanyContact(c)
  );
  const nearby = (
    company.lat != null && company.lng != null
      ? withDistance(others, { lat: company.lat, lng: company.lng })
      : others
          .filter((c) => c.states.some((s) => company.states.includes(s)))
          .map((c) => ({ ...c, miles: null as number | null }))
  ).slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={localBusinessSchema} />
      <Link href="/directory" className="text-sm text-gray-500 hover:text-ink mb-6 inline-block">← Back to directory</Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <MonogramAvatar name={company.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {company.verified && <VerifiedBadge />}
              {company.featured && <FeaturedBadge />}
              {company.rating != null && (
                <span className="text-xs font-bold text-green-800 bg-green-50 px-2 py-0.5 rounded-md">★ {company.rating}</span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">{company.name}</h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
              <PinIcon className="w-3.5 h-3.5" />
              {company.city ?? stateNames[0] ?? "United States"}
              {milesAway != null && (
                <span className="font-bold text-ink-deep bg-electric/20 px-1.5 py-0.5 rounded-md">
                  ~{milesAway < 10 ? milesAway.toFixed(1) : Math.round(milesAway)} mi from you
                </span>
              )}
            </p>
          </div>
        </div>

        {company.description && <p className="text-gray-600 leading-relaxed mb-8">{company.description}</p>}

        {/* What they buy */}
        {company.accepted_brands?.length > 0 && (
          <ProfileSection label="What they buy">
            <div className="flex flex-wrap gap-1.5">
              {company.accepted_brands.map((b) => <Chip key={b}>{b}</Chip>)}
            </div>
          </ProfileSection>
        )}

        {/* How this buyer works */}
        <ProfileSection label="How this buyer works">
          <div className="flex flex-wrap gap-1.5">
            {(company.transaction_modes ?? ["meetup"]).map((m) => (
              <Chip key={m}>{{ meetup: "Local meetup", pickup: "Pickup", mail_in: "Mail-in" }[m] ?? m}</Chip>
            ))}
          </div>
        </ProfileSection>

        {/* Payment & speed */}
        <ProfileSection label="Payment & speed">
          <p className="text-sm text-gray-700">
            {company.payment_methods?.length ? company.payment_methods.join(" · ") : "Ask the buyer"}
            {company.response_time && <span className="font-semibold"> · Responds in {company.response_time}</span>}
            {company.est_year && <span className="text-gray-400"> · Buying since {company.est_year}</span>}
          </p>
        </ProfileSection>

        <ProfileSection label="States served">
          <p className="text-sm text-gray-700">{stateNames.length > 0 ? stateNames.join(", ") : "Contact for availability"}</p>
        </ProfileSection>

        {company.owner_name && (
          <ProfileSection label="Contact person">
            <p className="text-sm text-gray-700">{company.owner_name}</p>
          </ProfileSection>
        )}

        {/* CTA */}
        <div className="bg-ink rounded-xl p-6 text-center text-white mt-8">
          <h2 className="font-black text-lg mb-1">Ready to sell to {company.name.split(" ")[0]}?</h2>
          <p className="text-sm text-white/60 mb-4">Contact info unlocks free — takes 10 seconds.</p>
          <UnlockContact company={company} isAuthenticated={isAuthenticated} size="page" />
        </div>
      </div>

      {/* Nearby */}
      {nearby.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Other buyers nearby</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearby.map(({ miles: _m, ...c }) => (
              <BuyerCard key={c.id} company={c as Company} isAuthenticated={isAuthenticated} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  )
}
