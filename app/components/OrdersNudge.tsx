"use client"

import Link from "next/link"
import { useUser } from "@/lib/auth-client"

/** Shown after a quote request or bulk inquiry is submitted. Signing in is
 *  never required to submit — this is an optional way to keep track.
 *
 *  A lead sent while signed OUT carries no user_id, so signing up afterwards
 *  will not pull it in. The copy says so rather than implying a backfill. */
/** `className` lands on whichever root actually renders, so a caller can set
 *  its own spacing without wrapping the component in a div that would leave an
 *  empty spacer while `useUser` is still loading. */
export function OrdersNudge({ className = "" }: { className?: string }) {
  const { user, loading } = useUser()

  if (loading) return null

  if (user) {
    return (
      <Link href="/orders" className={`text-sm font-medium text-cash hover:underline self-start ${className}`}>
        See your orders →
      </Link>
    )
  }

  return (
    <div className={`bg-gray-50 border border-gray-100 rounded-xl p-4 ${className}`}>
      <p className="text-sm text-gray-600">
        Want to track this request?{" "}
        <Link href="/signup?next=/orders" className="font-medium text-cash hover:underline">
          Create a free account
        </Link>{" "}
        or{" "}
        <Link href="/login?next=/orders" className="font-medium text-cash hover:underline">
          sign in
        </Link>{" "}
        to see your orders in one place.
      </p>
      <p className="text-xs text-gray-400 mt-1">Orders you submit while signed in show up here.</p>
    </div>
  )
}
