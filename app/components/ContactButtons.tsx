import Link from "next/link"
import { btnOnDark, btnPrimary, btnSecondary } from "./ui"
import { hasAnyContact } from "@/lib/company-contact"
import type { Company } from "@/lib/types"

/** The national mail-in offer has a real form at /mail-in-kit. Until
 *  2026-09-20 the mail-in listing was shown on every no-buyer state page, the
 *  city pages and the directory with call/text buttons only, so the pages that
 *  exist to sell mail-in never pointed at the kit. */
export const MAIL_IN_KIT_HREF = "/mail-in-kit"
export const MAIL_IN_KIT_LABEL = "Start your mail-in kit"

// btnSecondary is dark grey on white; on the dark directory banner it
// would be unreadable.
const btnSecondaryOnDark =
  "inline-flex items-center justify-center gap-1.5 border border-white/30 text-white font-semibold text-sm px-5 py-3 rounded-lg hover:border-white transition-colors"

export function ContactButtons({
  company,
  size = "card",
  tone = "light",
}: {
  company: Company
  size?: "card" | "page"
  tone?: "light" | "dark"
}) {
  // Driven by the flag, never by slug or name: any mail-in listing gets the kit
  // button, and no in-person or third-party buyer ever does.
  const mailIn = company.mail_in === true
  if (!mailIn && !hasAnyContact(company)) return null
  const sizing = size === "page" ? "px-6 py-3 text-sm w-auto" : "px-3 py-2 text-xs w-full"
  const wrap = size === "page" ? "inline-flex flex-wrap gap-2" : "flex flex-col gap-2 w-full"
  const primary = tone === "dark" ? btnOnDark : btnPrimary
  const secondary = tone === "dark" ? btnSecondaryOnDark : btnSecondary
  // On a mail-in listing the kit is the primary action and calling steps down.
  const phoneStyle = mailIn ? secondary : primary
  return (
    <div className={wrap}>
      {mailIn && (
        <Link href={MAIL_IN_KIT_HREF} className={`${primary} ${sizing}`}>
          {MAIL_IN_KIT_LABEL}
        </Link>
      )}
      {company.phone && (
        <a href={`tel:${company.phone.replace(/[^0-9+]/g, "")}`} className={`${phoneStyle} ${sizing}`}>
          Call or text {company.phone}
        </a>
      )}
      {company.url && (
        <a
          href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
          target="_blank" rel="noopener noreferrer"
          className={`${company.phone || mailIn ? secondary : primary} ${sizing}`}
        >
          Visit site →
        </a>
      )}
      {!company.phone && !company.url && company.email && (
        <a href={`mailto:${company.email}`} className={`${phoneStyle} ${sizing}`}>Email buyer</a>
      )}
    </div>
  )
}
