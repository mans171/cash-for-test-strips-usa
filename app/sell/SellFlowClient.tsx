"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { STATE_LABELS } from "@/lib/states";
import type { Company, OrderItem } from "@/lib/types";
import { PRODUCT_BRANDS } from "@/lib/product-catalog";
import { EXPIRATION_MONTH_OPTIONS, isEffectivelyExpired, monthsFromNowToYYYYMM } from "@/lib/expiration";
import { useUser } from "@/lib/auth-client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { fetchOwnProfileContact } from "@/lib/profile-lookup";
import { LoginForm } from "@/app/components/LoginForm";

type Stage = "build" | "account" | "results" | "sent";

const emptyItem: OrderItem = { brand: "", count: 1, expiration: "", condition: "sealed" };

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
  const [password, setPassword] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountPendingUserId, setAccountPendingUserId] = useState<string | null>(null);
  const [accountMode, setAccountMode] = useState<"signup" | "login">("signup");
  const { user, loading: authLoading } = useUser();
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
    if (user) {
      setLoading(true);
      try {
        await runMatch(state);
        setStage("results");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't reach the server. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
      return;
    }
    setStage("account");
  }

  async function insertProfile(userId: string) {
    const supabase = createBrowserSupabaseClient();
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      role: "customer",
      name: customerName,
      phone: customerPhone,
      address_street: "",
      address_city: addressCity,
      address_state: addressState,
      address_zip: "",
    });

    if (profileError) {
      setAccountError(`Account created but profile setup failed: ${profileError.message}`);
      setAccountPendingUserId(userId);
      setAccountSubmitting(false);
      return;
    }

    try {
      await runMatch(state);
      setStage("results");
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Couldn't reach the server. Check your connection and try again.");
    } finally {
      setAccountSubmitting(false);
    }
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountError(null);
    setAccountSubmitting(true);

    const supabase = createBrowserSupabaseClient();

    // NOTE: this flow assumes "Confirm email" is OFF in Supabase Auth
    // settings, so signUp() returns a live session immediately — same
    // assumption SignupForm makes, documented there.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: customerEmail,
      password,
    });

    if (signUpError) {
      setAccountError(signUpError.message);
      setAccountSubmitting(false);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      setAccountError("Account created but sign-up response was incomplete. Please try again.");
      setAccountSubmitting(false);
      return;
    }

    if (!signUpData.session) {
      setAccountError("Check your email to confirm your account before continuing.");
      setAccountSubmitting(false);
      return;
    }

    await insertProfile(userId);
  }

  async function handleRetryProfile() {
    if (!accountPendingUserId) return;
    setAccountError(null);
    setAccountSubmitting(true);
    await insertProfile(accountPendingUserId);
  }

  // Runs after LoginForm's own signInWithPassword succeeds — same post-auth
  // steps the signup path runs in insertProfile above.
  async function handleLoginSuccess() {
    setAccountError(null);
    try {
      await runMatch(state);
      setStage("results");
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : "Couldn't reach the server. Check your connection and try again.");
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
            <p className="text-emerald-700 font-medium">
              Almost done — send the text we opened in your messages app to {selectedBuyer.name}.
            </p>
            <p className="text-sm text-gray-500">
              Nothing has been sent yet. If your messages app didn&apos;t open automatically, use the link below.
            </p>
            {sentMessage && digitsOnlyPhone && (
              <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{sentMessage}</p>
                <a
                  href={`sms:${digitsOnlyPhone}?body=${encodeURIComponent(sentMessage)}`}
                  className="text-sm font-medium text-emerald-600 hover:underline self-start"
                >
                  Open my messages app
                </a>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-emerald-700 font-medium">Request sent to {selectedBuyer.name}.</p>
            <p className="text-sm text-gray-500">They&apos;ll reach out to you directly to arrange your sale.</p>
          </>
        )}
        <div className="border border-gray-200 rounded-lg p-4">
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

  if (stage === "account") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setStage("build")}
          className="text-xs font-medium text-gray-500 hover:text-emerald-700 self-start"
        >
          ← Back to your order
        </button>

        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Order Summary</h2>
          <div className="flex flex-col gap-1">
            {items.map((item, i) => (
              <p key={i} className="text-sm text-gray-600">
                {item.brand} × {item.count} box{item.count === 1 ? "" : "es"} (exp: {item.expiration}, {item.condition})
              </p>
            ))}
          </div>
        </div>

        {accountMode === "signup" ? (
          <>
            <form onSubmit={handleCreateAccount} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
              <h2 className="font-semibold text-gray-900">Your Info</h2>
              <p className="text-xs text-gray-500 -mt-2">We use this to find your local buyer and let you reach them directly.</p>
              <input
                type="text"
                required
                autoComplete="name"
                placeholder="Your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="tel"
                required
                autoComplete="tel"
                placeholder="Phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  autoComplete="address-level2"
                  placeholder="City"
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1"
                />
                <input
                  type="text"
                  required
                  autoComplete="address-level1"
                  placeholder="State"
                  value={addressState}
                  onChange={(e) => setAddressState(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24"
                />
              </div>
              {accountError && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-red-600">{accountError}</p>
                  {accountPendingUserId && (
                    <button
                      type="button"
                      onClick={handleRetryProfile}
                      disabled={accountSubmitting}
                      className="self-start text-sm font-medium text-emerald-700 underline disabled:opacity-50"
                    >
                      {accountSubmitting ? "Retrying..." : "Try again"}
                    </button>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={accountSubmitting}
                className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {accountSubmitting ? "Creating your account..." : "Create your account"}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 -mt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAccountError(null);
                  setAccountMode("login");
                }}
                className="text-emerald-700 underline"
              >
                Log in
              </button>
            </p>
          </>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
            <LoginForm onSuccess={handleLoginSuccess} />
            {accountError && <p className="text-sm text-red-600 text-center -mt-4">{accountError}</p>}
            <p className="text-center text-sm text-gray-500 -mt-2">
              Need an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setAccountError(null);
                  setAccountMode("signup");
                }}
                className="text-emerald-700 underline"
              >
                Sign up
              </button>
            </p>
          </div>
        )}
      </div>
    );
  }

  if (stage === "results") {
    const cards = buyers.length > 0 ? buyers : mailIn ? [mailIn] : [];
    const nameMissing = customerName.trim().length === 0;
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setStage("build")}
          className="text-xs font-medium text-gray-500 hover:text-emerald-700 self-start"
        >
          ← Back to your order
        </button>

        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Order Summary</h2>
          <div className="flex flex-col gap-1">
            {items.map((item, i) => (
              <p key={i} className="text-sm text-gray-600">
                {item.brand} × {item.count} box{item.count === 1 ? "" : "es"} (exp: {item.expiration}, {item.condition})
              </p>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Contact Information</h2>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Your name *</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Phone (optional)</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email (optional)</label>
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {cards.length === 0 ? (
          <p className="text-sm text-gray-500">
            We couldn&apos;t find a buyer for your area right now. Email{" "}
            <a href="mailto:feldon.richards@gmail.com" className="text-emerald-600 hover:underline">feldon.richards@gmail.com</a>{" "}
            or call <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> directly and we&apos;ll help you sell your strips.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {buyers.length === 0 && mailIn && (
              <p className="text-sm text-gray-500">No local buyer in your state yet — here&apos;s our mail-in option.</p>
            )}
            {cards.map((c) => (
              <div key={c.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.city && <p className="text-xs text-gray-400">{c.city}</p>}
                </div>
                {(c.email || c.phone) && (
                  <div className="flex gap-2">
                    {c.email && (
                      <button
                        onClick={() => handleSend(c, "email")}
                        disabled={sending || nameMissing}
                        title={nameMissing ? "Enter your name first" : undefined}
                        className="text-xs font-medium bg-emerald-600 text-white px-3 py-2 rounded-lg disabled:opacity-50"
                      >
                        {sending && selectedBuyer?.id === c.id ? "Sending..." : "Request Quote"}
                      </button>
                    )}
                    {c.phone && (
                      <button
                        onClick={() => handleSend(c, "sms")}
                        disabled={sending || nameMissing}
                        title={nameMissing ? "Enter your name first" : undefined}
                        className="text-xs font-medium border border-emerald-600 text-emerald-700 px-3 py-2 rounded-lg disabled:opacity-50"
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
        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-gray-100 rounded-lg p-3">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
      <button
        type="submit"
        disabled={loading || authLoading}
        className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "Finding buyers..." : authLoading ? "Checking your account..." : "Find My Buyer"}
      </button>
    </form>
  );
}
