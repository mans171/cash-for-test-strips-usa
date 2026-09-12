"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SignupForm } from "@/app/components/SignupForm"
import { safeNextPath } from "@/lib/next-path"

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  )
}

function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") === "buyer" ? "buyer" : "customer"
  const next = safeNextPath(searchParams.get("next"))

  return <SignupForm role={role} onSuccess={() => router.push(next)} />
}
