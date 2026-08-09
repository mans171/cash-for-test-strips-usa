"use client"

import { useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createBrowserSupabaseClient()
    // Always show the same confirmation regardless of whether the email
    // matched an account, so this can't be used to check which emails are
    // registered — same approach as the admin forgot-password flow.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    setSent(true)
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24 text-center">
      <h1 className="text-xl font-bold mb-4">Reset Your Password</h1>
      {sent ? (
        <p className="text-sm text-gray-600">
          If that email has an account, a reset link is on its way. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSend} className="flex flex-col gap-3 text-left">
          <p className="text-sm text-gray-500 text-center mb-2">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
      <a href="/login" className="block text-xs text-gray-400 hover:text-emerald-600 mt-6">
        Back to login
      </a>
    </div>
  )
}
