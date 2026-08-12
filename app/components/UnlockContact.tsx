"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AccountModal } from "./AccountModal"
import { btnPrimary, LockIcon } from "./ui"
import { hasAnyContact } from "@/lib/company-contact"
import type { Company } from "@/lib/types"

export function UnlockContact({
  company,
  isAuthenticated,
  size = "card",
}: {
  company: Company
  isAuthenticated: boolean
  size?: "card" | "page"
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (!hasAnyContact(company)) return null

  const sizing =
    size === "page" ? "px-6 py-3 text-sm w-auto" : "px-3 py-2 text-xs w-full"

  if (isAuthenticated) {
    if (company.url) {
      return (
        <a
          href={`/api/track?company=${company.id}&url=${encodeURIComponent(company.url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnPrimary} ${sizing}`}
        >
          Visit site →
        </a>
      )
    }
    if (company.phone) {
      return (
        <a href={`tel:${company.phone}`} className={`${btnPrimary} ${sizing}`}>
          Contact
        </a>
      )
    }
    return null
  }

  return (
    <div className={size === "page" ? "inline-flex flex-col items-center gap-1" : "flex flex-col gap-1 w-full"}>
      <button type="button" onClick={() => setOpen(true)} className={`${btnPrimary} ${sizing}`}>
        <LockIcon />
        Unlock contact
      </button>
      <p className="text-[11px] text-gray-500 text-center">Free account · takes 10 seconds</p>
      {open && (
        <AccountModal
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
