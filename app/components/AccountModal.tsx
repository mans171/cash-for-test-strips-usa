// app/components/AccountModal.tsx
"use client"

import { useState } from "react"
import { SignupForm } from "./SignupForm"
import { LoginForm } from "./LoginForm"
import { useUser } from "@/lib/auth-client"

export function AccountModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [mode, setMode] = useState<"signup" | "login">("signup")
  const { loading } = useUser()

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          &times;
        </button>
        {loading ? (
          <p className="text-center text-sm text-gray-500 py-12">Loading...</p>
        ) : mode === "signup" ? (
          <>
            <SignupForm onSuccess={onSuccess} />
            <p className="text-center text-sm text-gray-500 pb-6 -mt-4">
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-cash underline">
                Log in
              </button>
            </p>
          </>
        ) : (
          <>
            <LoginForm onSuccess={onSuccess} />
            <p className="text-center text-sm text-gray-500 pb-6 -mt-4">
              Need an account?{" "}
              <button type="button" onClick={() => setMode("signup")} className="text-cash underline">
                Sign up
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
