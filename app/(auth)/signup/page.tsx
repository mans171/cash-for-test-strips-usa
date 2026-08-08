"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SignupForm } from "@/app/components/SignupForm"

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

  return <SignupForm role={role} onSuccess={() => router.push("/")} />
}
