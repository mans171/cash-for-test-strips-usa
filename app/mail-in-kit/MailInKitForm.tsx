"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PRODUCT_BRANDS } from "@/lib/product-catalog";
import { MAIL_IN_STATE_LABELS } from "@/lib/states";
import { HONEYPOT_FIELD } from "@/lib/honeypot";
import { OWNER_PHONE } from "@/lib/owner";
import { PAYOUT_METHODS, PAYOUT_METHOD_LABELS, expirationChoices, totalBoxes, type MailInItem, type PayoutMethod } from "@/lib/mail-in";

// Three steps, then a confirmation whose primary button is the seller's FINAL
// step: text us for a quote. There is no "make my label" control anywhere in
// this file on purpose — labels are made by us, after a price is agreed.
//
// Each line has an OPTIONAL month select that only asks — it never blocks a
// step and carries no wording about date condition. No price anywhere either:
// standing rules for this site.

type Brand = (typeof PRODUCT_BRANDS)[number];
type Step = 1 | 2 | 3;
type Done = { orderNumber: string; statusPath: string };

const CATEGORIES = ["Test Strips", "CGM", "Infusion Sets", "Lancets"] as const;
const STEP_LABELS = ["Your items", "Ship from", "Get paid"] as const;
const OWNER_DIGITS = OWNER_PHONE.replace(/\D/g, "");

const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const PRIMARY = "bg-cash text-white font-semibold px-6 py-3 rounded-lg hover:bg-cash-hover transition-colors disabled:opacity-50";
const QUIET = "border border-gray-200 text-gray-700 font-medium px-5 py-3 rounded-lg text-sm";

const PAYOUT_HINTS: Record<PayoutMethod, { field: string | null; hint: string }> = {
  zelle: { field: "Zelle phone number or email", hint: "The phone number or email your Zelle is registered to." },
  cash_app: { field: "Your $cashtag", hint: "For example $yourname." },
  venmo: { field: "Your Venmo @username", hint: "For example @your-name." },
  ach: { field: null, hint: "We'll collect bank details securely by phone — do not enter account numbers here." },
  wire: { field: null, hint: "We'll collect bank details securely by phone — do not enter account numbers here." },
  check: { field: "Name to write the check to (optional)", hint: "We mail the check to the ship-from address you gave in step 2." },
};

function productName(brand: Brand, line: Brand["lines"][number]): string {
  return line.code ? `${brand.label} — ${line.label} (${line.code})` : `${brand.label} — ${line.label}`;
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <ol className="flex items-center gap-2 mb-5" aria-label="Progress">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const reached = step <= current;
        return (
          <li key={label} className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black ${reached ? "bg-ink text-electric" : "bg-gray-200 text-gray-500"}`}>
              {step < current ? "✓" : step}
            </span>
            <span className={`text-xs font-medium truncate ${step === current ? "text-cash" : "text-gray-400"}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function MailInKitForm() {
  const [step, setStep] = useState<Step>(1);
  const [items, setItems] = useState<MailInItem[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [contact, setContact] = useState({ name: "", phone: "", email: "", street1: "", street2: "", city: "", state: "", zip: "" });
  const [method, setMethod] = useState<PayoutMethod | "">("");
  const [handle, setHandle] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const setField = (patch: Partial<typeof contact>) => setContact((prev) => ({ ...prev, ...patch }));

  function addItem(product: string) {
    const name = product.trim();
    if (!name) return;
    setItems((prev) => {
      const existing = prev.findIndex((item) => item.product === name);
      if (existing >= 0) return prev.map((item, i) => (i === existing ? { ...item, boxes: item.boxes + 1 } : item));
      return [...prev, { product: name, boxes: 1 }];
    });
    setBrand(null);
    setCustom("");
    setError("");
  }

  function setBoxes(index: number, boxes: number) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, boxes } : item)));
  }

  // Blank ("Not sure") removes the key, so the line posts exactly as it did
  // before this field existed.
  function setExpiration(index: number, value: string) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const { product, boxes } = item;
        return value ? { product, boxes, expiration: value } : { product, boxes };
      })
    );
  }

  function next() {
    setError("");
    if (step === 1) {
      if (items.length === 0) return setError("Add at least one product so we know what to quote.");
      if (items.some((item) => !Number.isInteger(item.boxes) || item.boxes < 1)) return setError("Each product needs a box count of 1 or more.");
      setStep(2);
    } else if (step === 2) {
      if (!contact.name.trim()) return setError("Please enter your name.");
      if (contact.phone.replace(/\D/g, "").length < 10) return setError("Please enter a phone number we can text your quote to.");
      if (!contact.street1.trim() || !contact.city.trim()) return setError("Please enter your street address and city.");
      if (!contact.state) return setError("Please choose your state.");
      if (!/^\d{5}(-\d{4})?$/.test(contact.zip.trim())) return setError("Please enter a 5-digit ZIP code.");
      setStep(3);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    setError("");
    if (!method) return setError("Please choose how you want to be paid.");
    const hint = PAYOUT_HINTS[method];
    if (hint.field && method !== "check" && !handle.trim()) return setError(`Please enter: ${hint.field.toLowerCase()}.`);

    setSending(true);
    try {
      const res = await fetch("/api/mail-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          expected_items: items,
          note,
          payout_method: method,
          payout_handle: hint.field ? handle : "",
          [HONEYPOT_FIELD]: honeypot,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || "Something went wrong. Please call or text us instead.");
      setDone({ orderNumber: data.order_number ?? "", statusPath: data.status_path ?? "" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    const message = `Hi, I just submitted mail-in kit ${done.orderNumber}. Can I get a quote?`;
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
        <div>
          <p className="text-xs font-extrabold text-cash uppercase tracking-wider">Kit saved</p>
          <h3 className="text-xl font-black text-gray-900 mt-1">One step left: text us for your quote</h3>
          {done.orderNumber && (
            <p className="text-sm text-gray-600 mt-2">
              Your kit number is <strong className="text-gray-900">{done.orderNumber}</strong>.
            </p>
          )}
        </div>
        <a href={`sms:${OWNER_DIGITS}?&body=${encodeURIComponent(message)}`} className={`${PRIMARY} text-center`}>
          Text us to get your quote and label
        </a>
        <a href={`tel:${OWNER_DIGITS}`} className={`${QUIET} text-center`}>
          Or call {OWNER_PHONE}
        </a>
        <p className="text-sm text-gray-700 font-medium">Your label is sent after you approve our quote.</p>
        {done.statusPath && (
          <p className="text-sm text-gray-600">
            Follow your kit any time on{" "}
            <Link href={done.statusPath} className="text-cash font-semibold underline">your status page</Link>. Save that link — it is private to you.
          </p>
        )}
      </div>
    );
  }

  const monthChoices = expirationChoices();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <StepIndicator current={step} />

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-semibold text-gray-900">What do you have?</h3>

          {items.length > 0 && (
            <ul className="flex flex-col gap-2">
              {items.map((item, i) => (
                <li key={item.product} className="flex flex-col gap-2 border border-gray-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 min-w-0 text-sm text-gray-800 break-words">{item.product}</span>
                    <label className="flex items-center gap-1 shrink-0 text-xs text-gray-500">
                      <input
                        aria-label={`Boxes of ${item.product}`}
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={Number.isFinite(item.boxes) ? item.boxes : ""}
                        onChange={(e) => setBoxes(i, Number(e.target.value))}
                        className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-900"
                      />
                      boxes
                    </label>
                    <button type="button" onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))} className="text-xs font-medium text-red-600 shrink-0">
                      Remove
                    </button>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-gray-500 mb-1" htmlFor={`kit-exp-${i}`}>Expiration month (optional)</label>
                    <select
                      id={`kit-exp-${i}`}
                      className={`${INPUT} min-w-0 text-gray-900`}
                      value={item.expiration ?? ""}
                      onChange={(e) => setExpiration(i, e.target.value)}
                    >
                      <option value="">Not sure</option>
                      {monthChoices.map((choice) => (
                        <option key={choice.value} value={choice.value}>{choice.label}</option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
              <li className="text-xs text-gray-500">Total boxes: {totalBoxes(items.filter((item) => Number.isFinite(item.boxes)))}</li>
            </ul>
          )}

          {brand ? (
            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => setBrand(null)} className="text-xs font-medium text-gray-500 hover:text-cash self-start">← Back to brands</button>
              <p className="text-xs font-medium text-gray-500">Which {brand.label} product?</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {brand.lines.map((line) => (
                  <button
                    type="button"
                    key={line.label}
                    onClick={() => addItem(productName(brand, line))}
                    className="flex flex-col items-center gap-1 border border-gray-200 rounded-lg p-2 text-center hover:border-cash transition-colors"
                  >
                    <Image src={line.image} alt={`${brand.label} ${line.label}`} width={40} height={40} className="object-contain h-10 w-10" />
                    <span className="text-[11px] leading-tight text-gray-700">{line.label}</span>
                    {line.code && <span className="text-[9px] leading-tight text-gray-400">{line.code}</span>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium text-gray-500">{items.length === 0 ? "Tap a brand to add it" : "Add another product"}</p>
              {CATEGORIES.map((category) => (
                <div key={category}>
                  <p className="text-xs text-gray-400 mb-1">{category}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {PRODUCT_BRANDS.filter((b) => b.category === category).map((b) => (
                      <button
                        type="button"
                        key={`${b.category}:${b.key}`}
                        onClick={() => (b.lines.length === 1 ? addItem(productName(b, b.lines[0])) : setBrand(b))}
                        className="flex flex-col items-center gap-1 border border-gray-200 rounded-lg p-2 text-center hover:border-cash transition-colors min-w-0"
                      >
                        <Image src={b.image} alt={b.label} width={56} height={56} className="object-contain h-14 w-14" />
                        <span className="text-[11px] leading-tight text-gray-700 break-words max-w-full">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <label className={LABEL} htmlFor="kit-custom">Don&apos;t see it? Type it in</label>
                <div className="flex gap-2">
                  <input id="kit-custom" className={`${INPUT} min-w-0`} value={custom} maxLength={200} placeholder="Brand and product" onChange={(e) => setCustom(e.target.value)} />
                  <button type="button" onClick={() => addItem(custom)} disabled={!custom.trim()} className="shrink-0 text-sm font-medium border border-cash text-cash px-4 rounded-lg disabled:opacity-40">
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className={LABEL} htmlFor="kit-note">Anything we should know? (optional)</label>
            <textarea id="kit-note" className={INPUT} rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-gray-900">Where are you shipping from?</h3>
          <div>
            <label className={LABEL} htmlFor="kit-name">Your name</label>
            <input id="kit-name" className={INPUT} autoComplete="name" value={contact.name} onChange={(e) => setField({ name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL} htmlFor="kit-phone">Mobile phone</label>
              <input id="kit-phone" className={INPUT} type="tel" inputMode="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setField({ phone: e.target.value })} />
            </div>
            <div>
              <label className={LABEL} htmlFor="kit-email">Email (optional)</label>
              <input id="kit-email" className={INPUT} type="email" autoComplete="email" value={contact.email} onChange={(e) => setField({ email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={LABEL} htmlFor="kit-street1">Street address</label>
            <input id="kit-street1" className={INPUT} autoComplete="address-line1" value={contact.street1} onChange={(e) => setField({ street1: e.target.value })} />
          </div>
          <div>
            <label className={LABEL} htmlFor="kit-street2">Apt, suite, unit (optional)</label>
            <input id="kit-street2" className={INPUT} autoComplete="address-line2" value={contact.street2} onChange={(e) => setField({ street2: e.target.value })} />
          </div>
          <div>
            <label className={LABEL} htmlFor="kit-city">City</label>
            <input id="kit-city" className={INPUT} autoComplete="address-level2" value={contact.city} onChange={(e) => setField({ city: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className={LABEL} htmlFor="kit-state">State</label>
              <select id="kit-state" className={INPUT} autoComplete="address-level1" value={contact.state} onChange={(e) => setField({ state: e.target.value })}>
                <option value="">Choose…</option>
                {Object.entries(MAIL_IN_STATE_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
              </select>
            </div>
            <div className="min-w-0">
              <label className={LABEL} htmlFor="kit-zip">ZIP code</label>
              <input id="kit-zip" className={INPUT} inputMode="numeric" autoComplete="postal-code" maxLength={10} value={contact.zip} onChange={(e) => setField({ zip: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-gray-500">This is the address printed on your prepaid label, so it needs to be where the box is leaving from.</p>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-gray-900">How do you want to be paid?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Payout method">
            {PAYOUT_METHODS.map((m) => (
              <button
                type="button"
                key={m}
                role="radio"
                aria-checked={method === m}
                onClick={() => { setMethod(m); setHandle(""); setError(""); }}
                className={`border rounded-lg px-3 py-3 text-sm font-medium transition-colors ${method === m ? "border-cash ring-2 ring-cash/30 text-gray-900" : "border-gray-200 text-gray-700 hover:border-cash"}`}
              >
                {PAYOUT_METHOD_LABELS[m]}
              </button>
            ))}
          </div>
          {method && (
            <div>
              {PAYOUT_HINTS[method].field && (
                <>
                  <label className={LABEL} htmlFor="kit-handle">{PAYOUT_HINTS[method].field}</label>
                  <input id="kit-handle" className={INPUT} maxLength={200} autoComplete="off" value={handle} onChange={(e) => setHandle(e.target.value)} />
                </>
              )}
              <p className="text-xs text-gray-500 mt-1">{PAYOUT_HINTS[method].hint}</p>
            </div>
          )}
          <p className="text-xs text-gray-500">You are paid after your box arrives and is checked in.</p>
        </div>
      )}

      {/* Honeypot: off-screen, never seen or tabbed to by a person. */}
      <div style={{ position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden" }}>
        <input name={HONEYPOT_FIELD} autoComplete="off" tabIndex={-1} aria-hidden="true" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600 mt-4" role="alert">{error}</p>}

      <div className="flex gap-2 mt-5">
        {step > 1 && (
          <button type="button" onClick={() => { setError(""); setStep((step - 1) as Step); }} className={QUIET}>Back</button>
        )}
        {step < 3 ? (
          <button type="button" onClick={next} className={`${PRIMARY} flex-1`}>Continue</button>
        ) : (
          <button type="button" onClick={submit} disabled={sending} className={`${PRIMARY} flex-1`}>{sending ? "Saving…" : "Save my kit"}</button>
        )}
      </div>
    </div>
  );
}
