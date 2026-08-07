// app/components/RequiresAccount.tsx
"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { useUser } from "@/lib/auth-client"

export function RequiresAccount({ children }: { children: ReactNode }) {
  const { user, loading } = useUser()

  if (loading) {
    return <div className="opacity-50 pointer-events-none">{children}</div>
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-1">
        <div className="opacity-40 pointer-events-none">{children}</div>
        <p className="text-xs text-red-600">
          <Link href="/signup" className="underline">
            Create an account
          </Link>{" "}
          to view this information
        </p>
      </div>
    )
  }

  return <>{children}</>
}
