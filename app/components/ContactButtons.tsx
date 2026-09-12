import { btnPrimary, btnSecondary } from "./ui"
import { hasAnyContact } from "@/lib/company-contact"
import type { Company } from "@/lib/types"

export function ContactButtons({ company, size = "card" }: { company: Company; size?: "card" | "page" }) {
  if (!hasAnyContact(company)) return null
  const sizing = size === "page" ? "px-6 py-3 text-sm w-auto" : "px-3 py-2 text-xs w-full"
  const wrap = size === "page" ? "inline-flex flex-wrap gap-2" : "flex flex-col gap-2 w-full"
  return (
    <div className={wrap}>
      {company.phone && (
        <a href={`tel:${company.phone.replace(/[^0-9+]/g, "")}`} className={`${btnPrimary} ${sizing}`}>
          Call or text {company.phone}
        </a>
      )}
      {company.url && (
        <a
          href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
          target="_blank" rel="noopener noreferrer"
          className={`${company.phone ? btnSecondary : btnPrimary} ${sizing}`}
        >
          Visit site →
        </a>
      )}
      {!company.phone && !company.url && company.email && (
        <a href={`mailto:${company.email}`} className={`${btnPrimary} ${sizing}`}>Email buyer</a>
      )}
    </div>
  )
}
