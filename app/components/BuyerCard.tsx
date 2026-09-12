import Link from "next/link"
import type { Company } from "@/lib/types"
import { STATE_LABELS } from "@/lib/states"
import { Chip, VerifiedBadge, FeaturedBadge, MonogramAvatar, PinIcon, btnSecondary } from "./ui"
import { ContactButtons } from "./ContactButtons"
import { hasAnyContact } from "@/lib/company-contact"
import { hasProfilePage } from "@/lib/company-profile"
import { honorsBonus, BONUS_MENTION_COPY } from "@/lib/bonus"

export function BuyerCard({
  company,
}: {
  company: Company & { miles?: number | null }
}) {
  const stateLabels = company.states
    .slice(0, 2)
    .map((s) => STATE_LABELS[s] ?? s)
    .join(", ")
  const moreStates = company.states.length > 2 ? ` +${company.states.length - 2}` : ""
  const brands = company.accepted_brands ?? []
  const showContact = hasAnyContact(company)
  // Mail-in buyers have no /company/[slug] page — linking to one ships a 404.
  const showProfile = hasProfilePage(company)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all">
      <div className="flex items-start gap-3">
        <MonogramAvatar name={company.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-extrabold text-gray-900 text-sm leading-snug">{company.name}</h3>
            {company.verified && <VerifiedBadge />}
            {company.featured && <FeaturedBadge />}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            {company.miles != null && (
              <span className="inline-flex items-center gap-0.5 font-bold text-ink-deep bg-electric/20 px-1.5 py-0.5 rounded-md">
                <PinIcon className="w-3 h-3" />~{company.miles < 10 ? company.miles.toFixed(1) : Math.round(company.miles)} mi
              </span>
            )}
            <span className="truncate">
              {company.city ? `${company.city} · ` : ""}
              {stateLabels}
              {moreStates}
            </span>
          </p>
        </div>
        {company.rating != null && (
          <span className="shrink-0 text-xs font-bold text-green-800 bg-green-50 px-2 py-0.5 rounded-md">
            ★ {company.rating}
          </span>
        )}
      </div>

      {company.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{company.description}</p>
      )}

      {brands.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {brands.slice(0, 3).map((b) => (
            <Chip key={b}>{b}</Chip>
          ))}
          {brands.length > 3 && <span className="text-xs text-gray-400 py-0.5">+{brands.length - 3}</span>}
        </div>
      )}

      {company.payment_methods?.length > 0 && (
        <p className="text-xs text-gray-600">
          💵 {company.payment_methods.join(" · ")}
          {company.response_time ? (
            <span className="font-semibold text-gray-800"> · Responds in {company.response_time}</span>
          ) : null}
        </p>
      )}

      {/* Stacked, not side by side: ContactButtons renders up to two buttons of
          its own (call + visit site), and sitting that column next to a single
          "View profile" button left one half twice the height of the other. */}
      {(showProfile || showContact) && (
        <div className="flex flex-col gap-2 mt-auto pt-1">
          {showProfile && (
            <Link href={`/company/${company.slug}`} className={`${btnSecondary} w-full !px-3 !py-2 !text-xs`}>
              View profile
            </Link>
          )}
          {showContact && <ContactButtons company={company} />}
          {showContact && honorsBonus(company) && (
            <p className="text-[11px] text-emerald-700 font-semibold">💵 {BONUS_MENTION_COPY}</p>
          )}
        </div>
      )}
    </div>
  )
}
