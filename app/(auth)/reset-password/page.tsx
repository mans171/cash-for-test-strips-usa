"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

// useSearchParams() requires a Suspense boundary — without one, `next build`
// fails outright on this page, it's not just a lint warning.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const code = searchParams.get("code")

  const [exchanging, setExchanging] = useState(true)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!code) {
      setLinkError("This reset link is invalid or missing its code.")
      setExchanging(false)
      return
    }
    const supabase = createBrowserSupabaseClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) {
        setLinkError("This reset link has expired or already been used. Request a new one.")
      }
      setExchanging(false)
    })
  }, [code])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)
    const supabase = createBrowserSupabaseClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setDone(true)
  }

  if (exchanging) {
    return <p className="max-w-sm mx-auto px-4 py-24 text-center text-sm text-gray-500">Verifying your link...</p>
  }

  if (linkError) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <p className="text-sm text-red-600 mb-4">{linkError}</p>
        <a href="/forgot-password" className="text-sm text-emerald-600 hover:underline">
          Request a new link
        </a>
      </div>
    )
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-4 py-24 text-center">
        <p className="text-sm text-emerald-700 font-medium mb-4">Password updated.</p>
        <button
          onClick={() => router.push("/login")}
          className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg"
        >
          Log in
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-xl font-bold mb-4">Set a New Password</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2"
          placeholder="New password"
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2"
          placeholder="Confirm new password"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? "Saving..." : "Set new password"}
        </button>
      </form>
    </div>
  )
}
