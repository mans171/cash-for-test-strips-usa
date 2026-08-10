"use client";

import { Fragment, useEffect, useState } from "react";

type SubmissionPayload = {
  name: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  states?: string[];
};

type ClaimCompany = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  states: string[];
  owner_name: string | null;
};

type ClaimBuyer = {
  name: string | null;
  email: string | null;
};

type Claim = {
  id: string;
  company_id: string;
  status: "pending" | "approved" | "rejected";
  submitted_phone: string;
  created_at: string;
  company: ClaimCompany | null;
  buyer: ClaimBuyer | null;
};

type CurrentCompany = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  states: string[];
  owner_name: string | null;
};

type DashboardData = {
  submissions: Array<{
    id: string;
    payload: SubmissionPayload;
    submitted_phone: string;
    target_company_id: string | null;
    currentCompany: CurrentCompany | null;
    created_at: string;
  }>;
  claims: Claim[];
  leads: Array<{ id: string; items: unknown; channel: string; created_at: string; name: string | null; email: string | null; phone: string | null }>;
  clicks: Array<{ id: string; company_id: string; created_at: string }>;
  missingPhones: Array<{ id: string; name: string; city: string | null }>;
};

export function AdminDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<"submissions" | "claims" | "leads" | "clicks" | "missingPhones">("submissions");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/data");
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to load dashboard data");
        return;
      }
      setError(null);
      setData(body);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function review(submissionId: string, action: "approve" | "reject") {
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to review submission");
        return;
      }
      await load();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  async function reviewClaim(claimId: string, action: "approve" | "reject") {
    try {
      const res = await fetch("/api/admin/claims/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, action }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to review claim");
        return;
      }
      await load();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-sm mb-3">{error}</p>
        <button onClick={() => { setError(null); load(); }} className="text-xs text-emerald-600 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(["submissions", "claims", "leads", "clicks", "missingPhones"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm px-3 py-1.5 rounded-full border ${tab === t ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 text-gray-600"}`}
          >
            {t} ({data[t].length})
          </button>
        ))}
      </div>

      {tab === "submissions" && (
        <div className="flex flex-col gap-3">
          {data.submissions.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.payload.name}</p>
                  <p className="text-xs text-gray-400">{s.target_company_id ? "Edit" : "New"} · submitted from {s.submitted_phone}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => review(s.id, "approve")} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg">Approve</button>
                  <button onClick={() => review(s.id, "reject")} className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg">Reject</button>
                </div>
              </div>
              {s.currentCompany ? (
                <SubmissionDiff current={s.currentCompany} proposed={s.payload} />
              ) : (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  <p><span className="font-semibold">Name:</span> {s.payload.name}</p>
                  {s.payload.phone && <p><span className="font-semibold">Phone:</span> {s.payload.phone}</p>}
                  {s.payload.email && <p><span className="font-semibold">Email:</span> {s.payload.email}</p>}
                  {s.payload.city && <p><span className="font-semibold">City:</span> {s.payload.city}</p>}
                  {s.payload.states && s.payload.states.length > 0 && (
                    <p><span className="font-semibold">States:</span> {s.payload.states.join(", ")}</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {data.submissions.length === 0 && <p className="text-sm text-gray-400">No pending submissions.</p>}
        </div>
      )}

      {tab === "claims" && (
        <div className="flex flex-col gap-3">
          {data.claims.map((c) => (
            <div key={c.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.company?.name ?? "(company not found)"}</p>
                  <p className="text-xs text-gray-400">
                    Claimed by {c.buyer?.name ?? "unknown"} ({c.buyer?.email ?? "no email on file"}) · submitted from {c.submitted_phone}
                  </p>
                  {c.company?.phone && c.company.phone !== c.submitted_phone && (
                    <p className="text-xs text-red-500">Listing's phone on file: {c.company.phone}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => reviewClaim(c.id, "approve")} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg">Approve</button>
                  <button onClick={() => reviewClaim(c.id, "reject")} className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg">Reject</button>
                </div>
              </div>
            </div>
          ))}
          {data.claims.length === 0 && <p className="text-sm text-gray-400">No pending claims.</p>}
        </div>
      )}

      {tab === "leads" && (
        <div className="flex flex-col gap-2">
          {data.leads.map((l) => (
            <div key={l.id} className="border border-gray-100 rounded-lg p-3 text-sm">
              <p>
                {l.name ?? "(no name)"} · {l.channel} · {new Date(l.created_at).toLocaleString()}
                {l.phone && ` · ${l.phone}`}
                {l.email && ` · ${l.email}`}
              </p>
              <pre className="text-xs text-gray-500 mt-1">{JSON.stringify(l.items)}</pre>
            </div>
          ))}
        </div>
      )}

      {tab === "clicks" && (
        <div className="flex flex-col gap-2">
          {data.clicks.map((c) => (
            <div key={c.id} className="border border-gray-100 rounded-lg p-3 text-sm">
              {c.company_id} · {new Date(c.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      )}

      {tab === "missingPhones" && (
        <div className="flex flex-col gap-2">
          {data.missingPhones.map((c) => (
            <div key={c.id} className="border border-gray-100 rounded-lg p-3 text-sm">
              {c.name} — {c.city}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionDiff({ current, proposed }: { current: CurrentCompany; proposed: SubmissionPayload }) {
  const rows: Array<{ label: string; before: string; after: string }> = [
    { label: "Name", before: current.name ?? "—", after: proposed.name ?? "—" },
    { label: "Phone", before: current.phone ?? "—", after: proposed.phone ?? "—" },
    { label: "Email", before: current.email ?? "—", after: proposed.email ?? "—" },
    { label: "City", before: current.city ?? "—", after: proposed.city ?? "—" },
    {
      label: "States",
      before: current.states?.join(", ") || "—",
      after: proposed.states?.join(", ") || "—",
    },
  ];

  return (
    <div className="text-xs bg-gray-50 rounded-lg p-3 grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1.5">
      <span className="font-semibold text-gray-400"></span>
      <span className="font-semibold text-gray-400">Current</span>
      <span className="font-semibold text-gray-400">Proposed</span>
      {rows.map((row) => {
        const changed = row.before !== row.after;
        return (
          <Fragment key={row.label}>
            <span className="font-semibold text-gray-500">{row.label}</span>
            <span className={changed ? "text-gray-500" : "text-gray-700"}>{row.before}</span>
            <span className={changed ? "text-red-600 font-medium" : "text-gray-700"}>{row.after}</span>
          </Fragment>
        );
      })}
    </div>
  );
}
