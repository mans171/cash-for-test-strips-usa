"use client";

import { useEffect, useState, useCallback } from "react";
import { STATE_LABELS } from "@/lib/states";
import { useUser, signOut } from "@/lib/auth-client";
import { SignupForm } from "@/app/components/SignupForm";
import { LoginForm } from "@/app/components/LoginForm";
import type { Company, SubmissionPayload } from "@/lib/types";

type BuyerClaim = {
  id: string;
  company_id: string;
  status: "pending" | "approved" | "rejected";
  submitted_phone: string;
  created_at: string;
  company: Company | null;
};

// "checking": initial load / re-check after auth. "wrong-role": a session exists
// but /api/buyer/claims still 401'd (a customer account, not a buyer) — shown
// instead of re-rendering Signup/LoginForm, since those forms treat ANY existing
// session as already-successful and would otherwise call onSuccess in a loop.
// "auth": no session at all — show the signup/login toggle.
type Stage =
  | "checking"
  | "wrong-role"
  | "auth"
  | "dashboard"
  | "claim-phone"
  | "claim-choose"
  | "claim-confirm"
  | "add-form"
  | "edit-form"
  | "submitted";

const emptyPayload: SubmissionPayload = { name: "", states: [] };

export function BuyerPortalClient() {
  const { user, loading: userLoading } = useUser();
  const [stage, setStage] = useState<Stage>("checking");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [claims, setClaims] = useState<BuyerClaim[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Claim flow state
  const [phone, setPhone] = useState("");
  const [matches, setMatches] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Form state, shared by add-form and edit-form
  const [form, setForm] = useState<SubmissionPayload>(emptyPayload);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      let res = await fetch("/api/buyer/claims");
      if (res.status === 401 && user) {
        // Right after signup, onAuthStateChange can fire (making `user` truthy)
        // before SignupForm's own insertProfile() has finished writing the
        // profiles row with role: 'buyer'. A single fast retry gives that
        // insert time to land before we conclude this is a genuine
        // wrong-role session.
        await new Promise((resolve) => setTimeout(resolve, 400));
        res = await fetch("/api/buyer/claims");
      }
      if (res.status === 401) {
        setStage(user ? "wrong-role" : "auth");
        return;
      }
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        setStage("checking");
        return;
      }
      setClaims(body.claims as BuyerClaim[]);
      setStage("dashboard");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStage("checking");
    }
  }, [user]);

  useEffect(() => {
    if (userLoading) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
    // Only re-run when the session itself changes (userLoading flips, or user
    // identity changes) — loadDashboard is intentionally not a dependency here
    // since it's recreated whenever `user` changes, which would otherwise loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user?.id]);

  function backToDashboard() {
    setError(null);
    setPhone("");
    setMatches([]);
    setSelectedCompany(null);
    setForm(emptyPayload);
    setEditingCompanyId(null);
    loadDashboard();
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/buyer-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      const companies = body.companies as Company[];
      if (companies.length === 0) {
        setEditingCompanyId(null);
        setForm({ ...emptyPayload, phone });
        setStage("add-form");
      } else if (companies.length === 1) {
        setSelectedCompany(companies[0]);
        setStage("claim-confirm");
      } else {
        setMatches(companies);
        setStage("claim-choose");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function chooseCompany(company: Company) {
    setSelectedCompany(company);
    setStage("claim-confirm");
  }

  async function handleClaimConfirm() {
    if (!selectedCompany) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: selectedCompany.id, submittedPhone: phone }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setStage("submitted");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function startAddListing() {
    setError(null);
    setForm(emptyPayload);
    setEditingCompanyId(null);
    setStage("add-form");
  }

  function startEditListing(claim: BuyerClaim) {
    if (!claim.company) return;
    setError(null);
    setEditingCompanyId(claim.company.id);
    setForm({
      name: claim.company.name,
      phone: claim.company.phone,
      email: claim.company.email,
      url: claim.company.url,
      city: claim.company.city,
      owner_name: claim.company.owner_name,
      states: claim.company.states,
      payment_methods: claim.company.payment_methods,
      accepted_brands: claim.company.accepted_brands,
      description: claim.company.description,
    });
    setStage("edit-form");
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.phone) {
      setError("Enter a phone number so customers and admins can reach you.");
      return;
    }
    if (form.states.length === 0) {
      setError("Select at least one state you serve.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCompanyId: editingCompanyId, submittedPhone: form.phone, payload: form }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setStage("submitted");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleState(code: string) {
    setForm((f) => ({
      ...f,
      states: f.states.includes(code) ? f.states.filter((s) => s !== code) : [...f.states, code],
    }));
  }

  if (stage === "checking" || userLoading) {
    if (error) {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => loadDashboard()} className="self-start text-sm font-medium text-emerald-700 underline">
            Try again
          </button>
        </div>
      );
    }
    return <p className="text-gray-400 text-sm">Loading...</p>;
  }

  if (stage === "wrong-role") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600">
          This account isn&apos;t a buyer account. Log out and sign up with a different email to manage a buyer listing.
        </p>
        <button
          onClick={async () => {
            await signOut();
            setStage("auth");
            setAuthMode("signup");
          }}
          className="self-start text-sm font-medium text-emerald-700 underline"
        >
          Log out
        </button>
      </div>
    );
  }

  if (stage === "auth") {
    return (
      <div className="flex flex-col gap-4">
        {authMode === "signup" ? (
          <>
            <SignupForm role="buyer" onSuccess={loadDashboard} />
            <p className="text-center text-sm text-gray-500">
              Already have a buyer account?{" "}
              <button type="button" onClick={() => setAuthMode("login")} className="text-emerald-700 underline">
                Log in
              </button>
            </p>
          </>
        ) : (
          <>
            <LoginForm onSuccess={loadDashboard} compact />
            <p className="text-center text-sm text-gray-500">
              New buyer?{" "}
              <button type="button" onClick={() => setAuthMode("signup")} className="text-emerald-700 underline">
                Create an account
              </button>
            </p>
          </>
        )}
      </div>
    );
  }

  if (stage === "submitted") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-emerald-700 font-medium">Submitted — pending review. We&apos;ll email you once it&apos;s reviewed.</p>
        <button onClick={backToDashboard} className="self-start text-sm font-medium text-emerald-700 underline">
          Back to My Listings
        </button>
      </div>
    );
  }

  if (stage === "dashboard") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex gap-3">
          <button onClick={() => { setPhone(""); setStage("claim-phone"); }} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
            Claim a listing
          </button>
          <button onClick={startAddListing} className="border border-emerald-600 text-emerald-700 font-semibold px-4 py-2 rounded-lg">
            Add a new listing
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex flex-col gap-3">
          {claims.length === 0 && <p className="text-sm text-gray-400">You don&apos;t have any listings yet.</p>}
          {claims.map((c) => (
            <div key={c.id} className="border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{c.company?.name ?? "(listing not found)"}</p>
                <p className="text-xs text-gray-400">{c.company?.city} · {c.status}</p>
              </div>
              {c.status === "approved" && (
                <button onClick={() => startEditListing(c)} className="text-xs text-emerald-700 underline">
                  Manage
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === "claim-phone") {
    return (
      <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Business phone number</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2"
          placeholder="518-555-0100"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
            {loading ? "Looking up..." : "Continue"}
          </button>
          <button type="button" onClick={backToDashboard} className="text-sm text-gray-500 underline">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  if (stage === "claim-choose") {
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
        <button type="button" onClick={backToDashboard} className="self-start text-sm text-gray-500 underline">
          Cancel
        </button>
      </div>
    );
  }

  if (stage === "claim-confirm" && selectedCompany) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          Claim <span className="font-medium text-gray-900">{selectedCompany.name}</span> ({selectedCompany.city}) using phone{" "}
          <span className="font-medium text-gray-900">{phone}</span>?
        </p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={handleClaimConfirm} disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
            {loading ? "Submitting..." : "Submit claim"}
          </button>
          <button type="button" onClick={backToDashboard} className="text-sm text-gray-500 underline">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // add-form / edit-form
  return (
    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
      <h2 className="font-semibold text-gray-900">{stage === "edit-form" ? "Edit your listing" : "Add a new listing"}</h2>
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
          required
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
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
          {loading ? "Submitting..." : "Submit for review"}
        </button>
        <button type="button" onClick={backToDashboard} className="text-sm text-gray-500 underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
