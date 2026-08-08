"use client"

import { useRouter } from "next/navigation"
import { LoginForm } from "@/app/components/LoginForm"

export default function LoginPage() {
  const router = useRouter()

  return <LoginForm onSuccess={() => router.push("/")} />
}
