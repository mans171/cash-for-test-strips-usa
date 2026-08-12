"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DirectorySearch({
  currentState,
  currentZip,
  stateLabels,
}: {
  currentState?: string;
  currentZip?: string;
  stateLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [zip, setZip] = useState(currentZip ?? "");

  function submitZip(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = zip.trim();
    if (/^\d{5}$/.test(cleaned)) router.push(`/directory?zip=${cleaned}`);
  }

  function handleStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    router.push(val ? `/directory?state=${val.toLowerCase()}` : "/directory");
  }

  const sortedStates = Object.entries(stateLabels).sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <form onSubmit={submitZip} className="flex items-stretch bg-white border-2 border-ink rounded-lg overflow-hidden">
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
          inputMode="numeric"
          placeholder="Enter ZIP code"
          aria-label="ZIP code"
          className="px-3 py-2 text-sm w-36 focus:outline-none"
        />
        <button type="submit" className="bg-ink text-electric font-extrabold text-sm px-4 hover:bg-ink-deep transition-colors">
          Find buyers
        </button>
      </form>

      <select
        value={currentState?.toUpperCase() ?? ""}
        onChange={handleStateChange}
        aria-label="Filter by state"
        className="text-sm border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-cash"
      >
        <option value="">All states</option>
        {sortedStates.map(([code, label]) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>

      {(currentState || currentZip) && (
        <button onClick={() => router.push("/directory")} className="text-sm text-gray-500 hover:text-ink underline">
          Clear
        </button>
      )}
    </div>
  );
}
