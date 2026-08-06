"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    await fetch("/api/admin/forgot-password", { method: "POST" });
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24 text-center">
      <h1 className="text-xl font-bold mb-4">Reset Admin Password</h1>
      {sent ? (
        <p className="text-sm text-gray-600">
          If everything's set up correctly, a reset link is on its way to your email. It expires in 30 minutes.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-6">
            We'll email a one-time reset link to the admin address on file.
          </p>
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </>
      )}
      <a href="/admin/login" className="block text-xs text-gray-400 hover:text-emerald-600 mt-6">
        Back to login
      </a>
    </div>
  );
}
