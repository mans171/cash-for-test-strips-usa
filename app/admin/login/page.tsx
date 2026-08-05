"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Wrong password");
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-24">
      <h1 className="text-xl font-bold mb-4">Admin Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2"
          placeholder="Password"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">Log in</button>
      </form>
    </div>
  );
}
