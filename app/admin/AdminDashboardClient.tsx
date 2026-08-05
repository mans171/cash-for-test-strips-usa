"use client";

import { useEffect, useState } from "react";

type DashboardData = {
  submissions: Array<{ id: string; payload: { name: string }; submitted_phone: string; target_company_id: string | null; created_at: string }>;
  leads: Array<{ id: string; items: unknown; channel: string; created_at: string }>;
  clicks: Array<{ id: string; company_id: string; created_at: string }>;
  missingPhones: Array<{ id: string; name: string; city: string | null }>;
};

export function AdminDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<"submissions" | "leads" | "clicks" | "missingPhones">("submissions");
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
        {(["submissions", "leads", "clicks", "missingPhones"] as const).map((t) => (
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
            <div key={s.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{s.payload.name}</p>
                <p className="text-xs text-gray-400">{s.target_company_id ? "Edit" : "New"} · submitted from {s.submitted_phone}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => review(s.id, "approve")} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg">Approve</button>
                <button onClick={() => review(s.id, "reject")} className="text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg">Reject</button>
              </div>
            </div>
          ))}
          {data.submissions.length === 0 && <p className="text-sm text-gray-400">No pending submissions.</p>}
        </div>
      )}

      {tab === "leads" && (
        <div className="flex flex-col gap-2">
          {data.leads.map((l) => (
            <div key={l.id} className="border border-gray-100 rounded-lg p-3 text-sm">
              <p>{l.channel} · {new Date(l.created_at).toLocaleString()}</p>
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
