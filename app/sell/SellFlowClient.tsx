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
  const [activeIndex, setActiveIndex] = useState(0);

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
    setActiveIndex(items.length);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSelectedBrandIdentities((prev) => prev.filter((_, i) => i !== index));
    setSelectedLines((prev) => prev.filter((_, i) => i !== index));
    setSelectedMonths((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex((prev) => {
      if (index < prev) return prev - 1;
      if (index === prev) return Math.min(prev, items.length - 2);
      return prev;
    });
  }

  function goBackToBrands(index: number) {
    setSelectedBrandIdentities((prev) => prev.map((id, i) => (i === index ? null : id)));
    setSelectedLines((prev) => prev.map((l, i) => (i === index ? "" : l)));
  }

  function composeBrandString(brand: (typeof PRODUCT_BRANDS)[number], line: (typeof PRODUCT_BRANDS)[number]["lines"][number]) {
    return line.code ? `${brand.label} — ${line.label} (${line.code})` : `${brand.label} — ${line.label}`;
  }

  function selectBrand(index: number, brand: (typeof PRODUCT_BRANDS)[number]) {
    setSelectedBrandIdentities((prev) => prev.map((id, i) => (i === index ? brandIdentity(brand) : id)));
    if (brand.lines.length === 1) {
      const onlyLine = brand.lines[0];
      setSelectedLines((prev) => prev.map((l, i) => (i === index ? onlyLine.label : l)));
      updateItem(index, { brand: composeBrandString(brand, onlyLine) });
    } else {
      setSelectedLines((prev) => prev.map((l, i) => (i === index ? "" : l)));
      updateItem(index, { brand: "" });
    }
  }

  function selectLine(index: number, brand: (typeof PRODUCT_BRANDS)[number], lineLabel: string) {
    const chosenLine = brand.lines.find((l) => l.label === lineLabel);
    setSelectedLines((prev) => prev.map((l, i) => (i === index ? lineLabel : l)));
    updateItem(index, { brand: chosenLine ? composeBrandString(brand, chosenLine) : "" });
  }

  function clearProduct(index: number) {
    setSelectedBrandIdentities((prev) => prev.map((id, i) => (i === index ? null : id)));
    setSelectedLines((prev) => prev.map((l, i) => (i === index ? "" : l)));
    updateItem(index, { brand: "" });
  }

  function selectMonths(index: number, months: number) {
    setSelectedMonths((prev) => prev.map((m, i) => (i === index ? months : m)));
    const isBoundaryValue = months === 0 || months === EXPIRATION_MONTH_OPTIONS[EXPIRATION_MONTH_OPTIONS.length - 1].value;
    const expirationValue = isBoundaryValue
      ? EXPIRATION_MONTH_OPTIONS.find((opt) => opt.value === months)!.label
      : monthsFromNowToYYYYMM(months, new Date());
    updateItem(index, { expiration: expirationValue });
  }

  function clearMonths(index: number) {
    setSelectedMonths((prev) => prev.map((m, i) => (i === index ? null : m)));
    updateItem(index, { expiration: "" });
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

      {items.map((item, i) =>
        i !== activeIndex ? (
          <div
            key={i}
            className="flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <span className="text-gray-700">
              {item.brand || "Incomplete item"} × {item.count} box{item.count === 1 ? "" : "es"}
              {item.expiration ? ` (exp: ${item.expiration})` : ""}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <button type="button" onClick={() => setActiveIndex(i)} className="text-xs font-medium text-emerald-700 hover:underline">
                Edit
              </button>
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)} className="text-xs font-medium text-red-600 hover:underline">
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : (
        <div key={i} className="grid grid-cols-2 gap-2 border border-gray-100 rounded-lg p-3">
          {item.brand ? (
            <div className="col-span-2 flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <span className="text-sm text-emerald-800">
                Selected: <span className="font-medium">{item.brand}</span>
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => clearProduct(i)}
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Change
                </button>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : selectedBrandIdentities[i] ? (() => {
            const brand = PRODUCT_BRANDS.find((b) => brandIdentity(b) === selectedBrandIdentities[i])!;
            return (
              <div className="col-span-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => goBackToBrands(i)}
                  className="text-xs font-medium text-gray-500 hover:text-emerald-700 self-start"
                >
                  ← Back
                </button>
                <label className="text-xs font-medium text-gray-500">Which specific product?</label>
                <div className="grid grid-cols-3 gap-2">
                  {brand.lines.map((productLine) => (
                    <button
                      type="button"
                      key={productLine.label}
                      onClick={() => selectLine(i, brand, productLine.label)}
                      className={`flex flex-col items-center gap-1 border rounded-lg p-2 text-center transition-colors ${
                        selectedLines[i] === productLine.label
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <Image src={productLine.image} alt={`${brand.label} ${productLine.label}`} width={40} height={40} className="object-contain h-10 w-10" />
                      <span className="text-[11px] leading-tight text-gray-700">{productLine.label}</span>
                      {productLine.code && (
                        <span className="text-[9px] leading-tight text-gray-400">{productLine.code}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })() : (
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
                        className="flex flex-col items-center gap-1 border border-gray-200 rounded-lg p-2 text-center transition-colors hover:border-emerald-300"
                      >
                        <Image src={brand.image} alt={brand.label} width={64} height={64} className="object-contain h-16 w-16" />
                        <span className="text-[11px] leading-tight text-gray-700">{brand.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {item.brand && (
            <>
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
                  onChange={(e) => {
                    if (e.target.value === "") {
                      clearMonths(i);
                    } else {
                      selectMonths(i, Number(e.target.value));
                    }
                  }}
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
            </>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        disabled={!items[activeIndex]?.brand}
        className="text-sm text-emerald-600 self-start disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        + Add another item
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg">
        {loading ? "Finding buyers..." : "Find My Buyer"}
      </button>
    </form>
  );
}
