// app/components/RequiresAccount.tsx
"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { useUser } from "@/lib/auth-client"

export function RequiresAccount({
  children,
  onRequestAccount,
  className,
}: {
  children: ReactNode
  onRequestAccount?: () => void
  className?: string
}) {
  const { user, loading } = useUser()

  if (loading) {
    return <div className={`opacity-50 pointer-events-none ${className ?? ""}`}>{children}</div>
  }

  if (!user) {
    return (
      <div className={`flex flex-col gap-1 ${className ?? ""}`}>
        <div className="opacity-40 pointer-events-none">{children}</div>
        <p className="text-xs text-red-600">
          {onRequestAccount ? (
            <button type="button" onClick={onRequestAccount} className="underline">
              Create an account
            </button>
          ) : (
            <Link href="/signup" className="underline">
              Create an account
            </Link>
          )}{" "}
          to view this information
        </p>
      </div>
    )
  }

  return <>{children}</>
}
