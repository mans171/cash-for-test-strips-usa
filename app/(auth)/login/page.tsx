"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/app/components/LoginForm"
import { safeNextPath } from "@/lib/next-path"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNextPath(searchParams.get("next"))

  return <LoginForm onSuccess={() => router.push(next)} />
}
