"use client";

import { useState } from "react";
import { STATE_LABELS } from "@/lib/states";
import type { Company, SubmissionPayload } from "@/lib/types";

type Stage = "phone" | "choose" | "form" | "submitted";

export function BuyerPortalClient() {
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [matches, setMatches] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Company | null>(null);
  const [form, setForm] = useState<SubmissionPayload>({ name: "", states: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/buyer-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    const companies = body.companies as Company[];
    if (companies.length === 0) {
      setForm({ name: "", states: [], phone });
      setSelected(null);
      setStage("form");
    } else if (companies.length === 1) {
      setSelected(companies[0]);
      setForm({
        name: companies[0].name,
        phone: companies[0].phone,
        email: companies[0].email,
        url: companies[0].url,
        city: companies[0].city,
        owner_name: companies[0].owner_name,
        states: companies[0].states,
        payment_methods: companies[0].payment_methods,
        accepted_brands: companies[0].accepted_brands,
        description: companies[0].description,
      });
      setStage("form");
    } else {
      setMatches(companies);
      setStage("choose");
    }
  }

  function chooseCompany(company: Company) {
    setSelected(company);
    setForm({
      name: company.name,
      phone: company.phone,
      email: company.email,
      url: company.url,
      city: company.city,
      owner_name: company.owner_name,
      states: company.states,
      payment_methods: company.payment_methods,
      accepted_brands: company.accepted_brands,
      description: company.description,
    });
    setStage("form");
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.phone && !form.email) {
      setError("Enter a phone number or email so buyers/customers can reach you.");
      return;
    }
    if (form.states.length === 0) {
      setError("Select at least one state you serve.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetCompanyId: selected?.id ?? null, submittedPhone: phone, payload: form }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    setStage("submitted");
  }

  function toggleState(code: string) {
    setForm((f) => ({
      ...f,
      states: f.states.includes(code) ? f.states.filter((s) => s !== code) : [...f.states, code],
    }));
  }

  if (stage === "submitted") {
    return <p className="text-emerald-700 font-medium">Submitted — pending review. We&apos;ll email or call you once it&apos;s live.</p>;
  }

  if (stage === "phone") {
    return (
      <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Your phone number</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2"
          placeholder="518-555-0100"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
          {loading ? "Looking up..." : "Continue"}
        </button>
      </form>
    );
  }

  if (stage === "choose") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">Multiple listings share that phone number — which one is you?</p>
        {matches.map((c) => (
          <button
            key={c.id}
            onClick={() => chooseCompany(c)}
            className="text-left border border-gray-200 rounded-lg px-4 py-3 hover:border-emerald-400"
          >
            <p className="font-medium text-gray-900">{c.name}</p>
            <p className="text-xs text-gray-400">{c.city}</p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Business name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
        <input
          type="tel"
          value={form.phone ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Email (optional)</label>
        <input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">City</label>
        <input
          type="text"
          value={form.city ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">States you serve</label>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-2">
          {Object.entries(STATE_LABELS).map(([code, label]) => (
            <button
              type="button"
              key={code}
              onClick={() => toggleState(code)}
              className={`text-xs px-2 py-1 rounded-full border ${
                form.states.includes(code) ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
        {loading ? "Submitting..." : "Submit for review"}
      </button>
    </form>
  );
}
