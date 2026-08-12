import Link from "next/link";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { DirectorySearch } from "./filters";
import { STATE_LABELS } from "@/lib/states";
import type { Company } from "@/lib/types";
import { stripCompanyContact } from "@/lib/company-contact";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildItemListSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import { BuyerCard } from "@/app/components/BuyerCard";
import { UnlockContact } from "@/app/components/UnlockContact";
import { ZipCookieSync } from "@/app/components/ZipCookieSync";
import { btnOnDark } from "@/app/components/ui";
import { isValidZip } from "@/lib/geo";
import { getZipCentroid, tierCompanies, type CompanyWithMiles } from "@/lib/zip-lookup";
import { COMPANY_COLUMNS } from "@/lib/company-columns";

export const metadata: Metadata = {
  title: "Directory — Find Test Strip Buyers Near You",
  description:
    "Browse our full directory of cash buyers for diabetic test strips. Search by ZIP code to find buyers near you.",
  // All ?state=/?zip= filtered views canonicalize to the unfiltered directory —
  // same content with a subset applied, not distinct pages.
  alternates: { canonical: "https://cash4teststripsusa.com/directory" },
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; zip?: string }>;
}) {
  const { state, zip } = await searchParams;

  let query = supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("mail_in", false)
    .order("featured", { ascending: false })
    .order("name");

  if (state) query = query.contains("states", [state.toUpperCase()]);

  const { data } = await query;
  const rawCompanies = (data ?? []) as Company[];

  const supabaseServer = await createServerSupabaseClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const isAuthenticated = !!user;
  const companies = isAuthenticated ? rawCompanies : rawCompanies.map(stripCompanyContact);

  // ZIP proximity mode
  const zipValid = !!zip && isValidZip(zip);
  const centroid = zipValid ? await getZipCentroid(supabase, zip) : null;
  const tiers = centroid ? tierCompanies(companies, centroid) : null;

  // Search-input cookie prefill: pre-fill from ?zip= or the last searched ZIP
  // cookie, but never auto-run a proximity search from the cookie alone —
  // tiers above are computed only from the ?zip= query param.
  const cookieZip = (await cookies()).get("c4ts_zip")?.value;
  const prefillZip = zipValid ? zip : cookieZip && isValidZip(cookieZip) ? cookieZip : undefined;

  // Mail-in fallback card data (Feldon's own operation) — only in ZIP mode.
  // A searched ZIP must never dead-end, so mailIn staying null (query error,
  // or the row missing/deactivated) is not treated as "nothing to show" —
  // MailInFallback renders a generic /sell fallback in that case instead of
  // silently disappearing. See the render call below.
  let mailIn: Company | null = null;
  if (tiers) {
    const { data: mailInRow, error: mailInError } = await supabase
      .from("companies")
      .select(COMPANY_COLUMNS)
      .eq("mail_in", true)
      .limit(1)
      .maybeSingle();
    if (mailInError) console.error("mail-in fallback lookup failed:", mailInError.message);
    if (mailInRow) {
      const row = mailInRow as Company;
      mailIn = isAuthenticated ? row : stripCompanyContact(row);
    }
  }

  const itemListSchema = buildItemListSchema(
    companies.map((c) => ({ name: c.name, url: `https://cash4teststripsusa.com/company/${c.slug}` }))
  );

  const stateCode = state?.toUpperCase();
  const stateLabel = stateCode ? (STATE_LABELS[stateCode] ?? stateCode) : null;
  const zipStateLabel = centroid?.state ? (STATE_LABELS[centroid.state] ?? centroid.state) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <JsonLd data={itemListSchema} />
      {zipValid && centroid && <ZipCookieSync zip={zip!} />}

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
          {centroid
            ? `Buyers near ${zip}`
            : stateLabel
              ? `Test Strip Buyers in ${stateLabel}`
              : "Find a Test Strip Buyer"}
        </h1>
        <p className="text-gray-500">
          {centroid
            ? "Sorted by distance from your ZIP — contact info unlocks with a free account."
            : `${companies.length} buyer${companies.length !== 1 ? "s" : ""} found${stateLabel ? ` in ${stateLabel}` : ""}`}
        </p>
        {zip && !zipValid && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3 inline-block">
            "{zip}" isn't a valid 5-digit ZIP — showing all buyers instead.
          </p>
        )}
        {zip && zipValid && !centroid && (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3 inline-block">
            We couldn't locate ZIP {zip} — showing all buyers instead.
          </p>
        )}
      </div>

      <DirectorySearch currentState={state} currentZip={prefillZip} stateLabels={STATE_LABELS} />

      {tiers ? (
        <div className="space-y-10">
          <TierSection title="Near you" subtitle="Within 25 miles" companies={tiers.near} isAuthenticated={isAuthenticated} />
          <TierSection title="Within driving distance" subtitle="25–100 miles" companies={tiers.driving} isAuthenticated={isAuthenticated} />
          <TierSection
            title={zipStateLabel ? `Serving ${zipStateLabel}` : "Serving your state"}
            subtitle="Statewide buyers"
            companies={tiers.inState}
            isAuthenticated={isAuthenticated}
          />
          {tiers.near.length === 0 && tiers.driving.length === 0 && tiers.inState.length === 0 && (
            <p className="text-gray-500">
              No local buyers near {zip} yet — but you're covered:
            </p>
          )}
          <MailInFallback company={mailIn} isAuthenticated={isAuthenticated} />
          <p className="text-sm text-gray-400">
            Not what you're looking for? <Link href="/directory" className="underline hover:text-ink">Browse all buyers</Link>
          </p>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">No buyers found</p>
          <p className="text-sm">
            Try clearing the state filter or{" "}
            <a href="mailto:feldon.richards@gmail.com" className="text-cash hover:underline">contact us</a> to add your area.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <BuyerCard key={c.id} company={c} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      )}
    </div>
  );
}

function TierSection({
  title,
  subtitle,
  companies,
  isAuthenticated,
}: {
  title: string;
  subtitle: string;
  companies: CompanyWithMiles[];
  isAuthenticated: boolean;
}) {
  if (companies.length === 0) return null;
  return (
    <section>
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{subtitle}</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => (
          <BuyerCard key={c.id} company={c} isAuthenticated={isAuthenticated} />
        ))}
      </div>
    </section>
  );
}

// company is null when the mail-in row lookup errored or came back empty
// (query failure, or the row missing/deactivated) — the section still
// renders so a searched ZIP never dead-ends, just with a generic /sell CTA
// instead of a real buyer's UnlockContact gate. No contact data involved in
// that variant, so there's no security surface to strip for anon visitors.
function MailInFallback({ company, isAuthenticated }: { company: Company | null; isAuthenticated: boolean }) {
  return (
    <section className="bg-ink rounded-2xl p-6 sm:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-[11px] font-extrabold text-electric uppercase tracking-wider mb-1">
            Mail-in — serves all 50 states
          </p>
          <h2 className="text-xl font-black mb-1">No local buyer? We buy by mail.</h2>
          <p className="text-sm text-white/70">
            Free prepaid shipping label, payment within 24 hours of verification.
          </p>
        </div>
        <div className="shrink-0">
          {company ? (
            <UnlockContact company={company} isAuthenticated={isAuthenticated} size="page" />
          ) : (
            <Link href="/sell" className={btnOnDark}>
              Start a sale →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
