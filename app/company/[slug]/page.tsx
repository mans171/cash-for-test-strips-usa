import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { STATE_LABELS } from "@/lib/states";
import type { Company } from "@/lib/types";
import { stripCompanyContact } from "@/lib/company-contact";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildLocalBusinessSchema, buildFaqPageSchema } from "@/lib/schema";
import type { FaqItem } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";
import { isValidZip, haversineMiles, withDistance } from "@/lib/geo";
import { getZipCentroid } from "@/lib/zip-lookup";
import { COMPANY_COLUMNS } from "@/lib/company-columns";
import { BuyerCard } from "@/app/components/BuyerCard";
import { UnlockContact } from "@/app/components/UnlockContact";
import { MonogramAvatar, VerifiedBadge, FeaturedBadge, PinIcon } from "@/app/components/ui";

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

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Join a list of strings naturally: "A, B and C" (no Oxford comma). */
function joinNatural(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  const last = items[items.length - 1];
  return `${items.slice(0, -1).join(", ")} and ${last}`;
}

/**
 * Stable integer hash derived from a slug string.
 * Pure function — identical on every call with the same input.
 * Used to deterministically vary FAQ phrasing and ordering per buyer
 * without any runtime randomness (which would break caching and confuse
 * the crawler by producing different structured-data text on each render).
 */
function slugHash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = ((h * 31) + slug.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** One-sentence intro built entirely from database fields. */
function buildIntro(company: Company, stateNames: string[]): string {
  const location = company.city
    ? `based in ${company.city}`
    : stateNames.length > 0
    ? `serving ${stateNames[0]}`
    : "operating nationwide";

  const modes = company.transaction_modes ?? ["meetup"];
  let modePhrase: string;
  if (modes.includes("mail_in") && (modes.includes("meetup") || modes.includes("pickup"))) {
    modePhrase = "through local meetups and a mail-in program";
  } else if (modes.includes("mail_in")) {
    modePhrase = "through a mail-in program";
  } else if (modes.includes("pickup")) {
    modePhrase = "by arranging direct pickups";
  } else {
    modePhrase = "through local meetups";
  }

  const since = company.est_year ? ` and has been buying since ${company.est_year}` : "";

  return `${company.name} is a diabetic test strip buyer ${location}${since}. They purchase unused, sealed, unexpired strips ${modePhrase}.`;
}

/** Prose sentence for accepted brands. */
function buildBrandsText(company: Company, brands: string[]): string {
  if (brands.length === 0) return "";
  const listed = joinNatural(brands);
  return `${company.name} accepts test strips from ${listed}. Strips must be factory-sealed and unexpired — opened boxes are not purchased.`;
}

/** Prose sentence for payment methods and response time. */
function buildPaymentText(company: Company): string {
  const methods = company.payment_methods ?? [];
  const payPart = methods.length > 0
    ? `Payment is made via ${joinNatural(methods)}.`
    : "Contact the buyer for payment details.";

  const speedPart = company.response_time
    ? ` Most sellers hear back within ${company.response_time}.`
    : "";

  const sincePart = company.est_year
    ? ` ${company.name} has been buying test strips since ${company.est_year}.`
    : "";

  return `${payPart}${speedPart}${sincePart}`.trim();
}

/**
 * Build FAQ items as FaqItem[] (matching lib/schema.ts) so the same array
 * feeds both the visible Q&A block and the FAQPage JSON-LD.
 *
 * Google requires that visible text and structured data match exactly — using
 * one source array guarantees this. If a profile has zero eligible items
 * (e.g. no brands, no payment data, no states) an empty array is returned
 * and no JSON-LD script is emitted.
 *
 * Phrasing and ordering vary deterministically per slug via slugHash() so
 * profiles with similar field values still look distinct to a crawler. The
 * output is identical on every render for a given slug — no Math.random,
 * no Date.now — so server-side caching and crawler consistency are preserved.
 */
function buildFAQ(
  company: Company,
  stateNames: string[],
  slug: string,
): FaqItem[] {
  const name = company.name;
  const h = slugHash(slug);

  // Each candidate gets a sort key derived from non-overlapping bit windows
  // of h so phrasing selection (low bits) and ordering (high bits) are
  // independent from each other and across question types.
  const candidates: Array<{ sortKey: number; item: FaqItem }> = [];

  // ── Brands ──────────────────────────────────────────────────────────────
  const brands = company.accepted_brands ?? [];
  if (brands.length > 0) {
    const listed = joinNatural(brands);
    const brandPhrasings: FaqItem[] = [
      {
        question: `What test strip brands does ${name} accept?`,
        answer: `${name} buys ${listed} test strips. Boxes must be factory-sealed and unexpired.`,
      },
      {
        question: `Which diabetic test strip brands does ${name} purchase?`,
        answer: `Accepted brands include ${listed}. Strips must arrive in the original sealed packaging and must not be expired.`,
      },
      {
        question: `Does ${name} buy all test strip brands?`,
        answer: `${name} accepts ${listed}. Only factory-sealed, unexpired boxes are purchased.`,
      },
    ];
    candidates.push({
      sortKey: (h >> 2) & 0xff,
      item: brandPhrasings[h % brandPhrasings.length],
    });
  }

  // ── Transaction modes ────────────────────────────────────────────────────
  const modes = company.transaction_modes ?? ["meetup"];
  const modeLabels: Record<string, string> = {
    meetup: "local meetup",
    pickup: "direct pickup",
    mail_in: "mail-in",
  };
  const modeWords = modes.map((m) => modeLabels[m] ?? m);
  const modePhrasings: FaqItem[] = [
    {
      question: `How does selling to ${name} work?`,
      answer: `${name} buys strips via ${joinNatural(modeWords)}. Unlock the contact details on this page to reach them and arrange a transaction.`,
    },
    {
      question: `What is the process for selling test strips to ${name}?`,
      answer: `Contact ${name} to get started. They purchase strips via ${joinNatural(modeWords)}.`,
    },
    {
      question: `How do I contact ${name} to sell my test strips?`,
      answer: `Unlock the contact details on this page, then reach out to ${name} directly. Transactions are done via ${joinNatural(modeWords)}.`,
    },
  ];
  candidates.push({
    sortKey: (h >> 10) & 0xff,
    item: modePhrasings[(h >> 4) % modePhrasings.length],
  });

  // ── Payment ──────────────────────────────────────────────────────────────
  const methods = company.payment_methods ?? [];
  if (methods.length > 0) {
    const speedNote = company.response_time
      ? ` Most sellers receive a response within ${company.response_time}.`
      : "";
    const payPhrasings: FaqItem[] = [
      {
        question: `How does ${name} pay for test strips?`,
        answer: `${name} pays via ${joinNatural(methods)}.${speedNote}`,
      },
      {
        question: `What payment methods does ${name} use?`,
        answer: `Payment is made via ${joinNatural(methods)}.${speedNote}`,
      },
      {
        question: `When and how does ${name} pay sellers?`,
        answer: `${name} uses ${joinNatural(methods)} to pay sellers.${speedNote}`,
      },
    ];
    candidates.push({
      sortKey: (h >> 18) & 0xff,
      item: payPhrasings[(h >> 12) % payPhrasings.length],
    });
  }

  // ── Geography ────────────────────────────────────────────────────────────
  if (stateNames.length > 0) {
    const stateList =
      stateNames.length <= 3
        ? joinNatural(stateNames)
        : `${stateNames.slice(0, 3).join(", ")} and ${stateNames.length - 3} more state${stateNames.length - 3 > 1 ? "s" : ""}`;
    const geoPhrasings: FaqItem[] = [
      {
        question: `What areas does ${name} serve?`,
        answer: `${name} buys test strips${company.city ? ` in the ${company.city} area` : ""} and serves ${stateList}. Sellers from those areas can contact them directly through this listing.`,
      },
      {
        question: `Where does ${name} buy test strips?`,
        answer: `${name} serves ${stateList}${company.city ? `, with a base in ${company.city}` : ""}. Reach out through this listing to arrange a transaction.`,
      },
    ];
    candidates.push({
      sortKey: (h >> 24) & 0xff,
      item: geoPhrasings[(h >> 20) % geoPhrasings.length],
    });
  }

  // Sort by independent hash windows so question order differs per slug
  return candidates.sort((a, b) => a.sortKey - b.sortKey).map((c) => c.item);
}

// ─── page ─────────────────────────────────────────────────────────────────────

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

  // Build prose content and FAQ from existing database fields only.
  // The same faqItems array feeds both the visible Q&A block and the JSON-LD
  // FAQPage schema — Google requires the two to match exactly.
  const introText = buildIntro(company, stateNames);
  const brandsText = buildBrandsText(company, company.accepted_brands ?? []);
  const paymentText = buildPaymentText(company);
  const faqItems = buildFAQ(company, stateNames, slug);
  const faqSchema = faqItems.length > 0 ? buildFaqPageSchema(faqItems) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={localBusinessSchema} />
      {/* FAQPage JSON-LD — only emitted when there are FAQ items to avoid an
          empty mainEntity array, which Google Rich Results Test flags. The
          visible Q&A block below renders the identical text so structured data
          and page content stay in sync (required by Google's SD guidelines). */}
      {faqSchema && <JsonLd data={faqSchema} />}
      <Link href="/directory" className="text-sm text-gray-500 hover:text-ink mb-6 inline-block">back to directory</Link>

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

        {/* Intro paragraph — data-driven, unique per buyer */}
        <p className="text-gray-700 leading-relaxed mb-6">{introText}</p>

        {/* Buyer's own description (optional) */}
        {company.description && (
          <p className="text-gray-600 leading-relaxed mb-6">{company.description}</p>
        )}

        {/* Brands — prose sentence rather than chip list */}
        {brandsText && (
          <ProfileSection label="What they buy">
            <p className="text-sm text-gray-700 leading-relaxed">{brandsText}</p>
          </ProfileSection>
        )}

        {/* How they work — prose */}
        <ProfileSection label="How this buyer works">
          <p className="text-sm text-gray-700 leading-relaxed">
            {(company.transaction_modes ?? ["meetup"]).includes("mail_in") &&
            (company.transaction_modes ?? []).some((m) => m !== "mail_in")
              ? `${company.name} offers two options: sellers can arrange a local meetup or use the mail-in program — whichever is more convenient.`
              : (company.transaction_modes ?? ["meetup"]).includes("mail_in")
              ? `${company.name} accepts strips by mail. Once you reach out, they will provide mailing instructions.`
              : (company.transaction_modes ?? []).includes("pickup")
              ? `${company.name} can arrange a direct pickup at your location. Contact them to set up a time.`
              : `${company.name} meets locally to complete transactions. Contact them to agree on a convenient location.`}
          </p>
        </ProfileSection>

        {/* Payment & speed — prose */}
        <ProfileSection label="Payment &amp; speed">
          <p className="text-sm text-gray-700 leading-relaxed">{paymentText}</p>
        </ProfileSection>

        {/* States served — with internal links to state pages */}
        <ProfileSection label="States served">
          {company.states.length > 0 ? (
            <p className="text-sm text-gray-700">
              {company.states.map((code, i) => (
                <span key={code}>
                  {i > 0 && <span className="text-gray-400">, </span>}
                  <Link
                    href={`/sell-test-strips/${code.toLowerCase()}`}
                    className="text-ink-deep underline underline-offset-2 hover:no-underline"
                  >
                    {STATE_LABELS[code] ?? code}
                  </Link>
                </span>
              ))}
            </p>
          ) : (
            <p className="text-sm text-gray-700">Contact for availability</p>
          )}
        </ProfileSection>

        {company.owner_name && (
          <ProfileSection label="Contact person">
            <p className="text-sm text-gray-700">{company.owner_name}</p>
          </ProfileSection>
        )}

        {/* Per-buyer FAQ — visible Q&A block.
            Text must match the FAQPage JSON-LD above exactly (same faqItems source).
            Phrasing and order vary per slug via slugHash() — deterministic, never random. */}
        {faqItems.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-base font-extrabold text-gray-900 mb-4">
              Frequently asked about {company.name}
            </h2>
            <div className="space-y-4">
              {faqItems.map(({ question, answer }) => (
                <div key={question}>
                  <p className="text-sm font-semibold text-gray-800">{question}</p>
                  <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-ink rounded-xl p-6 text-center text-white mt-8">
          <h2 className="font-black text-lg mb-1">Ready to sell to {company.name.split(" ")[0]}?</h2>
          <p className="text-sm text-white/60 mb-4">Contact info unlocks free — takes 10 seconds.</p>
          <UnlockContact company={company} isAuthenticated={isAuthenticated} size="page" />
        </div>
      </div>

      {/* Nearby buyers */}
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

      {/* Internal navigation to related state pages */}
      {company.states.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3">
            Sell test strips by state
          </p>
          <div className="flex flex-wrap gap-2">
            {company.states.map((code) => (
              <Link
                key={code}
                href={`/sell-test-strips/${code.toLowerCase()}`}
                className="text-sm text-ink-deep underline underline-offset-2 hover:no-underline"
              >
                {STATE_LABELS[code] ?? code}
              </Link>
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
