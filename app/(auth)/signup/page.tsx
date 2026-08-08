"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") === "buyer" ? "buyer" : "customer"

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const supabase = createBrowserSupabaseClient()

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
      setSubmitting(false)
      return
    }

    router.push("/")
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
        {error && <p className="text-sm text-red-600">{error}</p>}
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
