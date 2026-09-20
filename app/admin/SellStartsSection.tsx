"use client";

import { useState } from "react";
import { STATE_LABELS } from "@/lib/states";
import { ageLabel, displayPhone, followUpSmsHref, phoneDigits, summarizeItems, type SellStartForAdmin } from "@/lib/sell-starts";

// "Started, didn't finish": sellers who gave a number on the first screen of
// /sell and left before sending a request. Follow-up is BY HAND — the Text
// button opens the owner's own messages app with the words filled in. Nothing
// here, or anywhere on the site, sends a message by itself.
//
// No window.confirm / alert: Dismiss asks inline.

type Props = {
  starts: SellStartForAdmin[];
  loadFailed: boolean;
  serverNow: string;
  onChanged: () => Promise<void> | void;
};

export function SellStartsSection({ starts, loadFailed, serverNow, onChanged }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDismissId, setConfirmDismissId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const nowMs = Date.parse(serverNow);

  async function update(id: string, patch: { contacted?: boolean; dismissed?: boolean }) {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/sell-starts/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setActionError(body?.error ?? "Couldn't save that. Try again.");
        return;
      }
      setConfirmDismissId(null);
      await onChanged();
    } catch {
      setActionError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mb-6">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h2 className="font-semibold text-gray-900">
          Started, didn&apos;t finish{" "}
          <span className="text-xs font-medium text-gray-400">({starts.length})</span>
        </h2>
        <p className="text-[11px] text-gray-400 text-right">Text opens your own messages app. Nothing is sent for you.</p>
      </div>

      {loadFailed ? (
        <p className="text-sm text-red-600 border border-red-100 bg-red-50 rounded-lg p-3">
          Couldn&apos;t load this list. If the sell_starts database migration has not been applied yet, that is why. Completed leads below are unaffected.
        </p>
      ) : starts.length === 0 ? (
        <p className="text-sm text-gray-400">Nobody waiting. Sellers who give a number and leave before sending will show here.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {actionError && <p className="text-sm text-red-600">{actionError}</p>}
          {starts.map((s) => {
            const contacted = Boolean(s.contacted_at);
            const busy = busyId === s.id;
            const summary = summarizeItems(s.items);
            return (
              <div
                key={s.id}
                className={`border rounded-lg p-3 text-sm flex flex-col gap-2 ${contacted ? "border-gray-100 bg-gray-50 text-gray-400" : "border-amber-200 bg-amber-50/40"}`}
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className={`font-medium ${contacted ? "text-gray-500" : "text-gray-900"}`}>{s.name || "—"}</span>
                  <a href={`tel:${phoneDigits(s.phone)}`} className="text-emerald-700 hover:underline whitespace-nowrap">
                    {displayPhone(s.phone)}
                  </a>
                  <span>{s.state ? (STATE_LABELS[s.state] ?? s.state) : "—"}</span>
                  <span className="text-xs text-gray-400">{ageLabel(s.created_at, nowMs)}</span>
                </div>
                {summary && <p className="text-xs break-words">{summary}</p>}
                {contacted && (
                  <p className="text-xs">Contacted {new Date(s.contacted_at!).toLocaleString()}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={followUpSmsHref(s.phone, s.name)}
                    className="text-xs font-medium bg-emerald-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Text
                  </a>
                  {!contacted && (
                    <button
                      type="button"
                      onClick={() => update(s.id, { contacted: true })}
                      disabled={busy}
                      className="text-xs font-medium border border-emerald-600 text-emerald-700 px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      Contacted
                    </button>
                  )}
                  {confirmDismissId === s.id ? (
                    <span className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      Take off the list?
                      <button
                        type="button"
                        onClick={() => update(s.id, { dismissed: true })}
                        disabled={busy}
                        className="font-medium border border-red-300 text-red-600 px-3 py-1.5 rounded-lg disabled:opacity-50"
                      >
                        Yes, dismiss
                      </button>
                      <button type="button" onClick={() => setConfirmDismissId(null)} className="font-medium text-gray-500 px-2 py-1.5">
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDismissId(s.id)}
                      disabled={busy}
                      className="text-xs font-medium border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
