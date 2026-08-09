import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { DirectoryFilters } from "./filters";
import { STATE_LABELS } from "@/lib/states";
import type { Company } from "@/lib/types";
import { stripCompanyContact } from "@/lib/company-contact";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Directory — Find Test Strip Buyers Near You",
  description:
    "Browse our full directory of cash buyers for diabetic test strips. Filter by state, payment method, and brand accepted.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;

  let query = supabase
    .from("companies")
    .select("id, name, slug, url, phone, email, city, owner_name, states, payment_methods, accepted_brands, rating, description, featured")
    .eq("mail_in", false)
    .order("featured", { ascending: false })
    .order("name");

  if (state) {
    query = query.contains("states", [state.toUpperCase()]);
  }

  const { data } = await query;
  const rawCompanies = (data ?? []) as Company[];

  const supabaseServer = await createServerSupabaseClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  const isAuthenticated = !!user;
  const companies = isAuthenticated ? rawCompanies : rawCompanies.map(stripCompanyContact);

  const stateCode = state?.toUpperCase();
  const stateLabel = stateCode ? (STATE_LABELS[stateCode] ?? stateCode) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {stateLabel ? `Test Strip Buyers in ${stateLabel}` : "Find a Test Strip Buyer"}
        </h1>
        <p className="text-gray-500">
          {companies.length} buyer{companies.length !== 1 ? "s" : ""} found
          {stateLabel ? ` in ${stateLabel}` : ""}
        </p>
      </div>

      <DirectoryFilters currentState={state} stateLabels={STATE_LABELS} />

      {companies.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-2">No buyers found</p>
          <p className="text-sm">Try clearing the state filter or{" "}
            <a href="mailto:feldon.richards@gmail.com" className="text-emerald-600 hover:underline">contact us</a> to add your area.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <DirectoryCard key={c.id} company={c} isAuthenticated={isAuthenticated} />
          ))}
        </div>
      )}
    </div>
  );
}

function DirectoryCard({ company, isAuthenticated }: { company: Company; isAuthenticated: boolean }) {
  const stateLabels = company.states
    .slice(0, 2)
    .map((s) => STATE_LABELS[s] ?? s)
    .join(", ");
  const moreStates = company.states.length > 2 ? ` +${company.states.length - 2} more` : "";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm leading-snug">{company.name}</h2>
          {company.city && (
            <p className="text-xs text-gray-400 mt-0.5">{company.city}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
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
      </div>

      {company.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{company.description}</p>
      )}

      <p className="text-xs text-gray-400">
        {stateLabels}{moreStates}
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
