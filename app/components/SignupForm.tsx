// app/components/SignupForm.tsx
"use client"

import { useEffect, useState } from "react"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/auth-client"

export function SignupForm({
  onSuccess,
  role = "customer",
}: {
  onSuccess: () => void
  role?: "customer" | "buyer"
}) {
  const { user, loading } = useUser()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [addressStreet, setAddressStreet] = useState("")
  const [addressCity, setAddressCity] = useState("")
  const [addressState, setAddressState] = useState("")
  const [addressZip, setAddressZip] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user && !pendingUserId && !submitting) {
      onSuccess()
    }
  }, [loading, user, pendingUserId, submitting, onSuccess])

  async function insertProfile(userId: string) {
    const supabase = createBrowserSupabaseClient()
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      role,
      name,
      phone,
      address_street: addressStreet,
      address_city: addressCity,
      address_state: addressState,
      address_zip: addressZip,
    })

    if (profileError) {
      setError(`Account created but profile setup failed: ${profileError.message}`)
      setPendingUserId(userId)
      setSubmitting(false)
      return
    }

    onSuccess()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const supabase = createBrowserSupabaseClient()

    // NOTE: this flow assumes "Confirm email" is OFF in Supabase Auth
    // settings (Authentication > Providers > Email), so signUp() returns a
    // live session immediately. If it's ever turned back on, signUp()
    // returns session: null and we can't insert the profile yet (no
    // authenticated session for RLS) — handled below.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setSubmitting(false)
      return
    }

    const userId = signUpData.user?.id
    if (!userId) {
      setError("Account created but sign-up response was incomplete. Please try logging in.")
      setSubmitting(false)
      return
    }

    if (!signUpData.session) {
      setError("Check your email to confirm your account before continuing.")
      setSubmitting(false)
      return
    }

    await insertProfile(userId)
  }

  async function handleRetryProfile() {
    if (!pendingUserId) return
    setError(null)
    setSubmitting(true)
    await insertProfile(pendingUserId)
  }

  if (loading || (user && !pendingUserId && !submitting)) {
    return null
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-6">Create an account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="text"
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="tel"
          required
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <input
          type="text"
          required
          placeholder="Street address"
          value={addressStreet}
          onChange={(e) => setAddressStreet(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        />
        <div className="flex gap-2">
          <input
            type="text"
            required
            placeholder="City"
            value={addressCity}
            onChange={(e) => setAddressCity(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
          />
          <input
            type="text"
            required
            placeholder="State"
            value={addressState}
            onChange={(e) => setAddressState(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-20"
          />
          <input
            type="text"
            required
            placeholder="ZIP"
            value={addressZip}
            onChange={(e) => setAddressZip(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-24"
          />
        </div>
        {error && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-red-600">{error}</p>
            {pendingUserId && (
              <button
                type="button"
                onClick={handleRetryProfile}
                disabled={submitting}
                className="self-start text-sm font-medium text-emerald-700 underline disabled:opacity-50"
              >
                {submitting ? "Retrying..." : "Try again"}
              </button>
            )}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="bg-emerald-600 text-white rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  )
}
