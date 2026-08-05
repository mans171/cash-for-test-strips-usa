"use client";

import { useState } from "react";
import { STATE_LABELS } from "@/lib/states";
import type { Company, OrderItem } from "@/lib/types";

type Stage = "build" | "results" | "sent";

const emptyItem: OrderItem = { brand: "", count: 1, expiration: "", condition: "sealed" };

export function SellFlowClient() {
  const [stage, setStage] = useState<Stage>("build");
  const [state, setState] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ ...emptyItem }]);
  const [buyers, setBuyers] = useState<Company[]>([]);
  const [mailIn, setMailIn] = useState<Company | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<Company | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  function updateItem(index: number, patch: Partial<OrderItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  async function handleFindBuyers(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!state) {
      setError("Select your state.");
      return;
    }
    if (items.some((i) => !i.brand || !i.count)) {
      setError("Fill in brand and count for every item.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sell/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setBuyers(body.buyers ?? []);
      setMailIn(body.mailIn ?? null);
      setStage("results");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(buyer: Company, channel: "sms" | "email") {
    setSelectedBuyer(buyer);
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, matchedCompanyId: buyer.id, channel, sourcePage: "/sell" }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setMessage(body.message);
      setStage("sent");
      if (channel === "sms" && buyer.phone) {
        window.open(`sms:${buyer.phone}?body=${encodeURIComponent(body.message)}`, "_blank");
      } else if (channel === "email" && buyer.email) {
        window.open(`mailto:${buyer.email}?subject=${encodeURIComponent("Quote request from cash4teststripsusa.com")}&body=${encodeURIComponent(body.message)}`, "_blank");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (stage === "sent" && selectedBuyer) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-emerald-700 font-medium">Message ready for {selectedBuyer.name}.</p>
        <p className="text-sm text-gray-500">If your phone/email app didn&apos;t open, copy this and send it yourself:</p>
        <textarea readOnly value={message} className="border border-gray-200 rounded-lg p-3 text-sm h-40" />
      </div>
    );
  }

  if (stage === "results") {
    const cards = buyers.length > 0 ? buyers : mailIn ? [mailIn] : [];
    if (cards.length === 0) {
      return (
        <p className="text-sm text-gray-500">
          We couldn&apos;t find a buyer for your area right now. Email{" "}
          <a href="mailto:feldon.richards@gmail.com" className="text-emerald-600 hover:underline">feldon.richards@gmail.com</a>{" "}
          or call <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> directly and we&apos;ll help you sell your strips.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        {buyers.length === 0 && mailIn && (
          <p className="text-sm text-gray-500">No local buyer in your state yet — here&apos;s our mail-in option.</p>
        )}
        {cards.map((c) => (
          <div key={c.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{c.name}</p>
              {c.city && <p className="text-xs text-gray-400">{c.city}</p>}
            </div>
            <div className="flex gap-2">
              {c.phone && (
                <button
                  onClick={() => handleSend(c, "sms")}
                  disabled={sending}
                  className="text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  {sending && selectedBuyer?.id === c.id ? "Sending..." : "Text"}
                </button>
              )}
              {c.email && (
                <button
                  onClick={() => handleSend(c, "email")}
                  disabled={sending}
                  className="text-xs font-medium border border-emerald-600 text-emerald-700 px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  {sending && selectedBuyer?.id === c.id ? "Sending..." : "Email"}
                </button>
              )}
            </div>
          </div>
        ))}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleFindBuyers} className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Your state</label>
        <select value={state} onChange={(e) => setState(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2">
          <option value="">Select a state</option>
          {Object.entries(STATE_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 border border-gray-100 rounded-lg p-3">
          <input
            placeholder="Brand (e.g. OneTouch Verio)"
            value={item.brand}
            onChange={(e) => updateItem(i, { brand: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1 col-span-2"
          />
          <input
            type="number"
            min={1}
            placeholder="Box count"
            value={item.count}
            onChange={(e) => updateItem(i, { count: Number(e.target.value) })}
            className="border border-gray-200 rounded-lg px-2 py-1"
          />
          <input
            placeholder="Expiration (e.g. 2027-01)"
            value={item.expiration}
            onChange={(e) => updateItem(i, { expiration: e.target.value })}
            className="border border-gray-200 rounded-lg px-2 py-1"
          />
          <select
            value={item.condition}
            onChange={(e) => updateItem(i, { condition: e.target.value as OrderItem["condition"] })}
            className="border border-gray-200 rounded-lg px-2 py-1 col-span-2"
          >
            <option value="sealed">Sealed</option>
            <option value="unsealed">Unsealed</option>
          </select>
        </div>
      ))}
      <button type="button" onClick={addItem} className="text-sm text-emerald-600 self-start">+ Add another item</button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
        {loading ? "Finding buyers..." : "Find My Buyer"}
      </button>
    </form>
  );
}
