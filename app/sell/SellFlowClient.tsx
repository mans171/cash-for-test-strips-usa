"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { STATE_LABELS } from "@/lib/states";
import type { Company, OrderItem } from "@/lib/types";
import { PRODUCT_BRANDS } from "@/lib/product-catalog";
import { DEFAULT_EXPIRATION_MONTHS, getExpirationMonthOptions, isEffectivelyExpired, monthsFromNowToYYYYMM } from "@/lib/expiration";
import { useUser } from "@/lib/auth-client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { fetchOwnProfileContact } from "@/lib/profile-lookup";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import { OWNER_PHONE, PUBLIC_EMAIL } from "@/lib/owner";
import { honorsBonus, BONUS_FORM_COPY } from "@/lib/bonus";

type Stage = "build" | "results" | "sent";

const emptyItem: OrderItem = { brand: "", count: 1, expiration: "", condition: "sealed" };

const SELL_STEPS = ["Your Order", "Your Buyers"] as const;

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center">
      {SELL_STEPS.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={label} className={`flex items-center ${step < SELL_STEPS.length ? "flex-1" : ""}`}>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                  isDone || isActive ? "bg-ink text-electric font-black" : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? "✓" : step}
              </span>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isActive ? "text-cash" : isDone ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {step < SELL_STEPS.length && <div className={`h-px flex-1 mx-2 ${isDone ? "bg-electric/40" : "bg-gray-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export function SellFlowClient() {
  const [stage, setStage] = useState<Stage>("build");
  const [state, setState] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ ...emptyItem }]);
  const [buyers, setBuyers] = useState<Company[]>([]);
  const [mailIn, setMailIn] = useState<Company | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<Company | null>(null);
  const [sentChannel, setSentChannel] = useState<"sms" | "email" | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedBrandIdentities, setSelectedBrandIdentities] = useState<(string | null)[]>([null]);
  const [selectedLines, setSelectedLines] = useState<string[]>([""]);
  const [selectedMonths, setSelectedMonths] = useState<(number | null)[]>([null]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  // Honeypot: rendered off-screen and hidden from assistive tech, so only a
  // form-filling bot ever puts anything in it. See lib/honeypot.ts.
  const [honeypot, setHoneypot] = useState("");
  const { user } = useUser();
  const hasAutoFilledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || hasAutoFilledRef.current === user.id) return;
    setCustomerEmail((prev) => prev || user.email);
    const supabase = createBrowserSupabaseClient();
    fetchOwnProfileContact(supabase, user.id)
      .then((contact) => {
        hasAutoFilledRef.current = user.id;
        if (!contact) return;
        setCustomerName((prev) => prev || contact.name);
        setCustomerPhone((prev) => prev || contact.phone);
      })
      .catch(() => {});
  }, [user]);

  // Prefill state from the last-searched ZIP cookie (set by the directory
  // page) so a visitor who already told us their ZIP doesn't have to repeat
  // it here. Mount-only: never overwrites a state the visitor already chose.
  useEffect(() => {
    if (state) return;
    const m = document.cookie.match(/(?:^|; )c4ts_zip=(\d{5})/);
    if (!m) return;
    fetch(`/api/zip-state?zip=${m[1]}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.state) setState(d.state);
      })
      .catch(() => {});
  }, []);

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
      selectMonths(index, DEFAULT_EXPIRATION_MONTHS);
    } else {
      setSelectedLines((prev) => prev.map((l, i) => (i === index ? "" : l)));
      updateItem(index, { brand: "" });
    }
  }

  function selectLine(index: number, brand: (typeof PRODUCT_BRANDS)[number], lineLabel: string) {
    const chosenLine = brand.lines.find((l) => l.label === lineLabel);
    setSelectedLines((prev) => prev.map((l, i) => (i === index ? lineLabel : l)));
    updateItem(index, { brand: chosenLine ? composeBrandString(brand, chosenLine) : "" });
    if (chosenLine) selectMonths(index, DEFAULT_EXPIRATION_MONTHS);
  }

  function clearProduct(index: number) {
    setSelectedBrandIdentities((prev) => prev.map((id, i) => (i === index ? null : id)));
    setSelectedLines((prev) => prev.map((l, i) => (i === index ? "" : l)));
    updateItem(index, { brand: "" });
  }

  function selectMonths(index: number, months: number) {
    setSelectedMonths((prev) => prev.map((m, i) => (i === index ? months : m)));
    // 0 ("already expired") and 25 ("24+ months") are catch-all buckets, not
    // an actual calendar month — everything in between maps to one.
    const isBoundaryValue = months === 0 || months === 25;
    const expirationValue = isBoundaryValue
      ? getExpirationMonthOptions().find((opt) => opt.value === months)!.label
      : monthsFromNowToYYYYMM(months, new Date());
    updateItem(index, { expiration: expirationValue });
  }

  function clearMonths(index: number) {
    setSelectedMonths((prev) => prev.map((m, i) => (i === index ? null : m)));
    updateItem(index, { expiration: "" });
  }

  // Shared by the initial search and the post-login/signup re-fetch below.
  // Throws on network failure or a non-ok response so callers can decide how
  // to handle it (blocking error vs. silent keep-what's-there).
  async function runMatch(stateCode: string) {
    const res = await fetch("/api/sell/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: stateCode }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error ?? "Something went wrong");
    }
    setBuyers(body.buyers ?? []);
    setMailIn(body.mailIn ?? null);
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
    // No account step: contacts are public since 2026-09-12, so a seller
    // goes straight from their order to the matched buyer's contact form.
    setLoading(true);
    try {
      await runMatch(state);
      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach the server. Check your connection and try again.");
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
        body: JSON.stringify({
          items,
          matchedCompanyId: buyer.id,
          channel,
          sourcePage: "/sell",
          name: customerName,
          email: customerEmail || undefined,
          phone: customerPhone || undefined,
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setStage("sent");
      setSentChannel(channel);
      setSentMessage(typeof body.message === "string" ? body.message : null);
      if (channel === "sms" && buyer.phone && body.message) {
        const digitsOnlyPhone = buyer.phone.replace(/\D/g, "");
        window.open(`sms:${digitsOnlyPhone}?body=${encodeURIComponent(body.message)}`, "_blank");
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (stage === "sent" && selectedBuyer) {
    const digitsOnlyPhone = selectedBuyer.phone ? selectedBuyer.phone.replace(/\D/g, "") : "";
    return (
      <div className="flex flex-col gap-3">
        {sentChannel === "sms" ? (
          <>
            <p className="text-cash font-medium">
              Almost done — send the text we opened in your messages app to {selectedBuyer.name}.
            </p>
            <p className="text-sm text-gray-500">
              Nothing has been sent yet. If your messages app didn&apos;t open automatically, use the link below.
            </p>
            {sentMessage && digitsOnlyPhone && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{sentMessage}</p>
                <a
                  href={`sms:${digitsOnlyPhone}?body=${encodeURIComponent(sentMessage)}`}
                  className="text-sm font-medium text-cash hover:underline self-start"
                >
                  Open my messages app
                </a>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-cash font-medium">Request sent to {selectedBuyer.name}.</p>
            <p className="text-sm text-gray-500">They&apos;ll reach out to you directly to arrange your sale.</p>
          </>
        )}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Your Order</h2>
          <div className="flex flex-col gap-1">
            {items.map((item, i) => (
              <p key={i} className="text-sm text-gray-600">
                {item.brand} × {item.count} box{item.count === 1 ? "" : "es"} (exp: {item.expiration}, {item.condition})
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (stage === "results") {
    const cards = buyers.length > 0 ? buyers : mailIn ? [mailIn] : [];
    const nameMissing = customerName.trim().length === 0;
    return (
      <div className="flex flex-col gap-4">
        <StepIndicator current={2} />
        <button
          type="button"
          onClick={() => setStage("build")}
          className="text-xs font-medium text-gray-500 hover:text-cash self-start"
        >
          ← Back to your order
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Order Summary</h2>
          <div className="flex flex-col gap-1">
            {items.map((item, i) => (
              <p key={i} className="text-sm text-gray-600">
                {item.brand} × {item.count} box{item.count === 1 ? "" : "es"} (exp: {item.expiration}, {item.condition})
              </p>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Contact Information</h2>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Your name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Phone</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}>
              <input
                name={HONEYPOT_FIELD}
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {cards.length === 0 ? (
          <p className="text-sm text-gray-500">
            We couldn&apos;t find a buyer for your area right now. Email{" "}
            <a href={`mailto:${PUBLIC_EMAIL}`} className="text-cash hover:underline">{PUBLIC_EMAIL}</a>{" "}
            or call <a href={`tel:${OWNER_PHONE.replace(/\D/g, "")}`} className="text-cash hover:underline">{OWNER_PHONE}</a> directly and we&apos;ll help you sell your strips.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {buyers.length === 0 && mailIn && (
              <p className="text-sm text-gray-500">No local buyer in your state yet — here&apos;s our mail-in option.</p>
            )}
            {cards.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-3 hover:shadow-md transition-shadow">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.city && <p className="text-xs text-gray-400">{c.city}</p>}
                  {/* Only this card's own buttons submit to this buyer, so the
                      bonus is gated per card, not on the step as a whole. */}
                  {honorsBonus(c) && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">💵 {BONUS_FORM_COPY}</p>
                  )}
                </div>
                {(c.email || c.phone) && (
                  <div className="flex gap-2 shrink-0">
                    {c.email && (
                      <button
                        onClick={() => handleSend(c, "email")}
                        disabled={sending || nameMissing}
                        title={nameMissing ? "Enter your name first" : undefined}
                        className="text-xs font-medium bg-cash text-white px-3 py-2 rounded-lg disabled:opacity-50"
                      >
                        {sending && selectedBuyer?.id === c.id ? "Sending..." : "Request Quote"}
                      </button>
                    )}
                    {c.phone && (
                      <button
                        onClick={() => handleSend(c, "sms")}
                        disabled={sending || nameMissing}
                        title={nameMissing ? "Enter your name first" : undefined}
                        className="text-xs font-medium border border-cash text-cash px-3 py-2 rounded-lg disabled:opacity-50"
                      >
                        {sending && selectedBuyer?.id === c.id ? "Sending..." : "Text Now"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleFindBuyers} className="flex flex-col gap-4">
      <StepIndicator current={1} />
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
              <button type="button" onClick={() => setActiveIndex(i)} className="text-xs font-medium text-cash hover:underline">
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
        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-100 rounded-lg p-3">
          {item.brand ? (
            <div className="col-span-2 flex items-center justify-between gap-2 bg-electric/10 border border-electric/40 rounded-lg px-3 py-2">
              <span className="text-sm text-ink-deep">
                Selected: <span className="font-medium">{item.brand}</span>
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => clearProduct(i)}
                  className="text-xs font-medium text-cash hover:underline"
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
                  className="text-xs font-medium text-gray-500 hover:text-cash self-start"
                >
                  ← Back
                </button>
                <label className="text-xs font-medium text-gray-500">Which specific product?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {brand.lines.map((productLine) => (
                    <button
                      type="button"
                      key={productLine.label}
                      onClick={() => selectLine(i, brand, productLine.label)}
                      className={`flex flex-col items-center gap-1 border rounded-lg p-2 text-center transition-colors ${
                        selectedLines[i] === productLine.label
                          ? "border-cash ring-2 ring-cash/30"
                          : "border-gray-200 hover:border-cash"
                      }`}
                    >
                      <div className="bg-gray-50 rounded-md p-1 flex items-center justify-center">
                        <Image src={productLine.image} alt={`${brand.label} ${productLine.label}`} width={40} height={40} className="object-contain h-10 w-10" />
                      </div>
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500">What are you selling?</label>
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
              {(["Test Strips", "CGM", "Infusion Sets", "Lancets"] as const).map((category) => (
                <div key={category}>
                  <p className="text-xs text-gray-400 mb-1">{category}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {PRODUCT_BRANDS.filter((b) => b.category === category).map((brand) => (
                      <button
                        type="button"
                        key={brandIdentity(brand)}
                        onClick={() => selectBrand(i, brand)}
                        className="flex flex-col items-center gap-1 border border-gray-200 rounded-lg p-2 text-center transition-colors hover:border-cash"
                      >
                        <div className="bg-gray-50 rounded-md p-1.5 flex items-center justify-center">
                          <Image src={brand.image} alt={brand.label} width={64} height={64} className="object-contain h-16 w-16" />
                        </div>
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
                  {getExpirationMonthOptions().map((opt) => (
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
        className="text-sm text-cash self-start disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        + Add another item
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-cash text-white font-semibold px-6 py-3 rounded-lg hover:bg-cash-hover transition-colors disabled:opacity-50 disabled:hover:bg-cash"
      >
        {loading ? "Finding buyers..." : "Find My Buyer"}
      </button>
    </form>
  );
}
