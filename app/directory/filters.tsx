"use client";

import { useRouter } from "next/navigation";

export function DirectoryFilters({
  currentState,
  stateLabels,
}: {
  currentState?: string;
  stateLabels: Record<string, string>;
}) {
  const router = useRouter();

  function handleStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val) {
      router.push(`/directory?state=${val.toLowerCase()}`);
    } else {
      router.push("/directory");
    }
  }

  const sortedStates = Object.entries(stateLabels).sort((a, b) =>
    a[1].localeCompare(b[1])
  );

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      <select
        value={currentState?.toUpperCase() ?? ""}
        onChange={handleStateChange}
        className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
      >
        <option value="">All states</option>
        {sortedStates.map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>

      {currentState && (
        <button
          onClick={() => router.push("/directory")}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
