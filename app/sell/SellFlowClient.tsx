"use client";

import { useState } from "react";
import Image from "next/image";
import { STATE_LABELS } from "@/lib/states";
import type { Company, OrderItem } from "@/lib/types";
import { PRODUCT_BRANDS } from "@/lib/product-catalog";
import { EXPIRATION_MONTH_OPTIONS, isEffectivelyExpired, monthsFromNowToYYYYMM } from "@/lib/expiration";

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
  const [selectedBrandIdentities, setSelectedBrandIdentities] = useState<(string | null)[]>([null]);
  const [selectedLines, setSelectedLines] = useState<string[]>([""]);
  const [selectedMonths, setSelectedMonths] = useState<(number | null)[]>([null]);

  function brandIdentity(brand: (typeof PRODUCT_BRANDS)[number]) {
    return `${brand.category}:${brand.key}`;
  }

  function updateItem(index: number, patch: Partial<OrderItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
    setSelectedBrandIdentities((prev) => [...prev, null]);
    setSelectedLines((prev) => [...prev, ""]);
    setSelectedMonths((prev) => [...prev, null]);
  }

  function selectBrand(index: number, brand: (typeof PRODUCT_BRANDS)[number]) {
    setSelectedBrandIdentities((prev) => prev.map((id, i) => (i === index ? brandIdentity(brand) : id)));
    setSelectedLines((prev) => prev.map((l, i) => (i === index ? "" : l)));
    updateItem(index, { brand: "" });
  }

  function selectLine(index: number, brand: (typeof PRODUCT_BRANDS)[number], line: string) {
    setSelectedLines((prev) => prev.map((l, i) => (i === index ? line : l)));
    updateItem(index, { brand: line ? `${brand.label} — ${line}` : "" });
  }

  function selectMonths(index: number, months: number) {
    setSelectedMonths((prev) => prev.map((m, i) => (i === index ? months : m)));
    updateItem(index, { expiration: monthsFromNowToYYYYMM(months, new Date()) });
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
          <div className="col-span-2 flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">What are you selling?</label>
            {(["Test Strips", "CGM", "Infusion Sets", "Lancets"] as const).map((category) => (
              <div key={category}>
                <p className="text-xs text-gray-400 mb-1">{category}</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRODUCT_BRANDS.filter((b) => b.category === category).map((brand) => (
                    <button
                      type="button"
                      key={brandIdentity(brand)}
                      onClick={() => selectBrand(i, brand)}
                      className={`flex flex-col items-center gap-1 border rounded-lg p-2 text-center transition-colors ${
                        selectedBrandIdentities[i] === brandIdentity(brand)
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <Image src={brand.image} alt={brand.label} width={64} height={64} className="object-contain h-16 w-16" />
                      <span className="text-[11px] leading-tight text-gray-700">{brand.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {selectedBrandIdentities[i] && (
              <select
                value={selectedLines[i]}
                onChange={(e) => {
                  const brand = PRODUCT_BRANDS.find((b) => brandIdentity(b) === selectedBrandIdentities[i]);
                  if (brand) selectLine(i, brand, e.target.value);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1"
              >
                <option value="">Select the specific product</option>
                {PRODUCT_BRANDS.find((b) => brandIdentity(b) === selectedBrandIdentities[i])?.lines.map((line) => (
                  <option key={line} value={line}>
                    {line}
                  </option>
                ))}
              </select>
            )}
          </div>
          <input
            type="number"
            min={1}
            placeholder="Box count"
            value={item.count}
            onChange={(e) => updateItem(i, { count: Number(e.target.value) })}
            className="border border-gray-200 rounded-lg px-2 py-1"
          />
          <div className="flex flex-col gap-1">
            <select
              value={selectedMonths[i] ?? ""}
              onChange={(e) => selectMonths(i, Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1"
            >
              <option value="">Months until expiration</option>
              {EXPIRATION_MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {selectedMonths[i] !== null && isEffectivelyExpired(selectedMonths[i]!, new Date()) && (
              <p className="text-xs text-amber-600">
                This may already be considered expired by most buyers — you can still submit, but let the buyer know when you message them.
              </p>
            )}
          </div>
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
