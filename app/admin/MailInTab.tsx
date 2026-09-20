"use client";

import { useCallback, useEffect, useState } from "react";
import { PRODUCT_BRANDS } from "@/lib/product-catalog";
import {
  MAIL_IN_STATUSES,
  PAYOUT_METHODS,
  PAYOUT_METHOD_LABELS,
  PIPELINE_STATUSES,
  STATUS_LABELS,
  ageInDays,
  totalBoxes,
  type MailInEvent,
  type MailInItem,
  type MailInOrderForAdmin,
  type MailInStatus,
  type MailInSummary,
  type PayoutMethod,
  type StatusCounts,
} from "@/lib/mail-in";

// The Mail-in tab loads its own data rather than riding on /api/admin/data, so
// a problem here (for instance the mail_in_orders migration not applied yet)
// cannot take the rest of the dashboard down with it.

type ListResponse = {
  orders: MailInOrderForAdmin[];
  truncated: boolean;
  statusCounts: StatusCounts;
  summary: MailInSummary;
};

type DetailResponse = {
  order: MailInOrderForAdmin;
  events: MailInEvent[];
  nextStatuses: MailInStatus[];
};

const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";
const OTHER = "__other__";

// Same "Brand — Line (code)" strings the public sell flow writes into a lead,
// so a kit started from a lead and one typed in by hand read the same.
const PRODUCT_OPTIONS: Array<{ group: string; options: string[] }> = PRODUCT_BRANDS.map((brand) => ({
  group: `${brand.label} · ${brand.category}`,
  options: brand.lines.map((line) =>
    line.code ? `${brand.label} — ${line.label} (${line.code})` : `${brand.label} — ${line.label}`
  ),
}));
const KNOWN_PRODUCTS = new Set(PRODUCT_OPTIONS.flatMap((g) => g.options));

const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm";
const labelClass = "text-xs font-semibold text-gray-500";
const primaryButton = "text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50";
const quietButton = "text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg disabled:opacity-50";

type Fetched<T> = { ok: true; body: T } | { ok: false; error: string };

/** Fetch JSON without touching React state, so an effect can call it and set
 *  state only from the resolved callback. */
async function getJson<T>(url: string, fallbackError: string): Promise<Fetched<T>> {
  try {
    const res = await fetch(url);
    const body = await res.json();
    return res.ok ? { ok: true, body } : { ok: false, error: body.error ?? fallbackError };
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}

function money(value: number | null): string {
  return value === null || value === undefined ? "—" : `$${Number(value).toFixed(2)}`;
}

function formatPhone(digits: string): string {
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : digits;
}

// ---------------------------------------------------------------------------
// Items editor (expected items on a new kit, received items at check-in)
// ---------------------------------------------------------------------------

type DraftItem = { product: string; custom: boolean; boxes: string };

function toDrafts(items: MailInItem[] | null | undefined): DraftItem[] {
  if (!items || items.length === 0) return [{ product: "", custom: false, boxes: "1" }];
  return items.map((item) => ({
    product: item.product,
    custom: !KNOWN_PRODUCTS.has(item.product),
    boxes: String(item.boxes),
  }));
}

/** Blank lines are dropped; a line with a product keeps whatever box count
 *  was typed so the server can say exactly what is wrong with it. */
function fromDrafts(drafts: DraftItem[]): MailInItem[] {
  return drafts
    .filter((d) => d.product.trim() !== "")
    .map((d) => ({ product: d.product.trim(), boxes: Number(d.boxes) }));
}

function ItemsEditor({ drafts, onChange }: { drafts: DraftItem[]; onChange: (next: DraftItem[]) => void }) {
  function update(index: number, patch: Partial<DraftItem>) {
    onChange(drafts.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  return (
    <div className="flex flex-col gap-2">
      {drafts.map((draft, index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <select
              aria-label="Product"
              className={inputClass}
              value={draft.custom ? OTHER : draft.product}
              onChange={(e) =>
                e.target.value === OTHER
                  ? update(index, { custom: true, product: "" })
                  : update(index, { custom: false, product: e.target.value })
              }
            >
              <option value="">Choose a product…</option>
              {PRODUCT_OPTIONS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </optgroup>
              ))}
              <option value={OTHER}>Other (type it in)</option>
            </select>
            {draft.custom && (
              <input
                aria-label="Product name"
                className={inputClass}
                placeholder="Product name"
                value={draft.product}
                onChange={(e) => update(index, { product: e.target.value })}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              aria-label="Boxes"
              className={`${inputClass} w-24`}
              type="number"
              min={1}
              inputMode="numeric"
              value={draft.boxes}
              onChange={(e) => update(index, { boxes: e.target.value })}
            />
            <span className="text-xs text-gray-400">boxes</span>
            <button
              type="button"
              className="text-xs text-red-600 px-2 py-1.5"
              onClick={() => onChange(drafts.length > 1 ? drafts.filter((_, i) => i !== index) : toDrafts([]))}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="self-start text-xs text-emerald-600 hover:underline"
        onClick={() => onChange([...drafts, { product: "", custom: false, boxes: "1" }])}
      >
        + Add another product
      </button>
    </div>
  );
}

function ItemsList({ items, empty }: { items: MailInItem[] | null; empty: string }) {
  if (!items || items.length === 0) return <p className="text-xs text-gray-400">{empty}</p>;
  return (
    <ul className="text-xs text-gray-700 flex flex-col gap-1">
      {items.map((item, i) => (
        <li key={`${item.product}-${i}`} className="flex justify-between gap-2">
          <span className="min-w-0 break-words">{item.product}</span>
          <span className="font-semibold shrink-0">× {item.boxes}</span>
        </li>
      ))}
      <li className="flex justify-between gap-2 border-t border-gray-200 pt-1 font-semibold">
        <span>Total boxes</span>
        <span>{totalBoxes(items)}</span>
      </li>
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Kit details form (new kit + edit)
// ---------------------------------------------------------------------------

type DetailsDraft = {
  name: string;
  phone: string;
  email: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  payout_method: string;
  payout_handle: string;
  quoted_amount: string;
  internal_notes: string;
  items: DraftItem[];
};

function draftFromOrder(order?: MailInOrderForAdmin): DetailsDraft {
  return {
    name: order?.name ?? "",
    phone: order?.phone ?? "",
    email: order?.email ?? "",
    street1: order?.street1 ?? "",
    street2: order?.street2 ?? "",
    city: order?.city ?? "",
    state: order?.state ?? "",
    zip: order?.zip ?? "",
    payout_method: order?.payout_method ?? "",
    payout_handle: order?.payout_handle ?? "",
    quoted_amount: order?.quoted_amount === null || order?.quoted_amount === undefined ? "" : String(order.quoted_amount),
    internal_notes: order?.internal_notes ?? "",
    items: toDrafts(order?.expected_items),
  };
}

function draftToBody(draft: DetailsDraft): Record<string, unknown> {
  return {
    name: draft.name,
    phone: draft.phone,
    email: draft.email,
    street1: draft.street1,
    street2: draft.street2,
    city: draft.city,
    state: draft.state,
    zip: draft.zip,
    payout_method: draft.payout_method || null,
    payout_handle: draft.payout_handle,
    quoted_amount: draft.quoted_amount.trim() === "" ? null : draft.quoted_amount,
    internal_notes: draft.internal_notes,
    expected_items: fromDrafts(draft.items),
  };
}

function DetailsForm({
  initial,
  submitLabel,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  initial: DetailsDraft;
  submitLabel: string;
  busy: boolean;
  error: string | null;
  onSubmit: (body: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<DetailsDraft>(initial);
  const set = (patch: Partial<DetailsDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draftToBody(draft));
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Seller name</span>
          <input className={inputClass} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Phone</span>
          <input className={inputClass} type="tel" inputMode="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className={labelClass}>Email</span>
          <input className={inputClass} type="email" value={draft.email} onChange={(e) => set({ email: e.target.value })} />
        </label>
      </div>
      <p className="text-xs text-gray-400 -mt-2">A phone number or an email is required.</p>

      <div>
        <p className={`${labelClass} mb-2`}>What they said they are sending</p>
        <ItemsEditor drafts={draft.items} onChange={(items) => set({ items })} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Quoted amount (admin only)</span>
          <input className={inputClass} inputMode="decimal" placeholder="0.00" value={draft.quoted_amount} onChange={(e) => set({ quoted_amount: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Payout method</span>
          <select className={inputClass} value={draft.payout_method} onChange={(e) => set({ payout_method: e.target.value })}>
            <option value="">Not chosen yet</option>
            {PAYOUT_METHODS.map((m) => (
              <option key={m} value={m}>{PAYOUT_METHOD_LABELS[m]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className={labelClass}>Payout handle (Zelle phone or email, $cashtag, mailing name…)</span>
          <input className={inputClass} value={draft.payout_handle} onChange={(e) => set({ payout_handle: e.target.value })} />
        </label>
      </div>

      <details className="text-sm">
        <summary className="text-xs text-emerald-600 cursor-pointer">Ship-from address (optional for now)</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className={labelClass}>Street address</span>
            <input className={inputClass} value={draft.street1} onChange={(e) => set({ street1: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className={labelClass}>Apt, suite, unit</span>
            <input className={inputClass} value={draft.street2} onChange={(e) => set({ street2: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>City</span>
            <input className={inputClass} value={draft.city} onChange={(e) => set({ city: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>State</span>
              <input className={inputClass} maxLength={2} placeholder="NY" value={draft.state} onChange={(e) => set({ state: e.target.value.toUpperCase() })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>ZIP</span>
              <input className={inputClass} inputMode="numeric" value={draft.zip} onChange={(e) => set({ zip: e.target.value })} />
            </label>
          </div>
        </div>
      </details>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Internal notes (never shown to the seller)</span>
        <textarea className={inputClass} rows={3} value={draft.internal_notes} onChange={(e) => set({ internal_notes: e.target.value })} />
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={primaryButton}>{busy ? "Saving…" : submitLabel}</button>
        <button type="button" onClick={onCancel} className={quietButton}>Cancel</button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

const FIELD_LABELS: Record<string, string> = {
  name: "name",
  phone: "phone",
  email: "email",
  street1: "street address",
  street2: "address line 2",
  city: "city",
  state: "state",
  zip: "ZIP",
  expected_items: "expected items",
  received_items: "received items",
  payout_method: "payout method",
  payout_handle: "payout handle",
  quoted_amount: "quoted amount",
  paid_amount: "paid amount",
  internal_notes: "notes",
  problem_reason: "problem reason",
  lead_id: "linked lead",
};

function describeEvent(event: MailInEvent): { title: string; note?: string } {
  const detail = event.detail ?? {};
  if (event.type === "created") return { title: "Kit created" };
  if (event.type === "status_changed") {
    const from = STATUS_LABELS[detail.from as MailInStatus] ?? String(detail.from ?? "?");
    const to = STATUS_LABELS[detail.to as MailInStatus] ?? String(detail.to ?? "?");
    const notes: string[] = [];
    if (typeof detail.problem_reason === "string") notes.push(detail.problem_reason);
    if (typeof detail.paid_amount === "number") {
      const method = PAYOUT_METHOD_LABELS[detail.payout_method as PayoutMethod] ?? "";
      notes.push(`${money(detail.paid_amount)}${method ? ` by ${method}` : ""}`);
    }
    return { title: `${from} → ${to}`, note: notes.join(" · ") || undefined };
  }
  if (event.type === "fields_updated") {
    const fields = Array.isArray(detail.fields) ? (detail.fields as string[]) : [];
    return { title: `Updated ${fields.map((f) => FIELD_LABELS[f] ?? f).join(", ") || "details"}` };
  }
  return { title: event.type };
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

type PendingMove = { status: MailInStatus } | null;

function OrderDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<PendingMove>(null);
  const [reason, setReason] = useState("");
  const [received, setReceived] = useState<DraftItem[]>(toDrafts([]));
  const [paidAmount, setPaidAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payHandle, setPayHandle] = useState("");

  useEffect(() => {
    let cancelled = false;
    getJson<DetailResponse>(`/api/admin/mail-in/${id}`, "Failed to load this kit").then((result) => {
      if (cancelled) return;
      if (result.ok) setDetail(result.body);
      else setError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function patch(body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/mail-in/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Failed to save");
        return false;
      }
      setError(null);
      setDetail(result);
      onChanged();
      return true;
    } catch {
      setError(NETWORK_ERROR);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startMove(status: MailInStatus) {
    if (!detail) return;
    setError(null);
    const needsForm = status === "problem" || status === "checked_in" || status === "paid";
    if (!needsForm) {
      if (status === "closed" && !window.confirm("Close this kit? It leaves the board. You can reopen it into Problem later.")) return;
      void patch({ status });
      return;
    }
    setReason("");
    setReceived(toDrafts(detail.order.received_items ?? detail.order.expected_items));
    setPaidAmount(detail.order.quoted_amount === null ? "" : String(detail.order.quoted_amount));
    setPayMethod(detail.order.payout_method ?? "");
    setPayHandle(detail.order.payout_handle ?? "");
    setPending({ status });
  }

  async function confirmMove() {
    if (!pending) return;
    const body: Record<string, unknown> = { status: pending.status };
    if (pending.status === "problem") body.problem_reason = reason;
    if (pending.status === "checked_in") body.received_items = fromDrafts(received);
    if (pending.status === "paid") {
      body.paid_amount = paidAmount.trim() === "" ? null : paidAmount;
      body.payout_method = payMethod || null;
      body.payout_handle = payHandle;
    }
    if (await patch(body)) setPending(null);
  }

  if (!detail) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 mb-6">
        {error ? <p className="text-red-600 text-sm">{error}</p> : <p className="text-sm text-gray-400">Loading kit…</p>}
        <button onClick={onClose} className={`${quietButton} mt-3`}>Close</button>
      </div>
    );
  }

  const { order, events, nextStatuses } = detail;
  const address = [order.street1, order.street2, [order.city, order.state].filter(Boolean).join(", "), order.zip]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="border border-emerald-200 rounded-lg p-4 mb-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{order.order_number} · {order.name ?? "(no name)"}</p>
          <p className="text-xs text-gray-400">
            {STATUS_LABELS[order.status]} · {ageInDays(order.created_at, new Date())} days old · created {new Date(order.created_at).toLocaleDateString()}
          </p>
          {order.status === "problem" && order.problem_reason && (
            <p className="text-xs text-red-600 mt-1 break-words">Problem: {order.problem_reason}</p>
          )}
        </div>
        <button onClick={onClose} className={quietButton}>Close</button>
      </div>

      {editing ? (
        <DetailsForm
          initial={draftFromOrder(order)}
          submitLabel="Save changes"
          busy={busy}
          error={error}
          onCancel={() => { setEditing(false); setError(null); }}
          onSubmit={async (body) => { if (await patch(body)) setEditing(false); }}
        />
      ) : (
        <>
          <div className="text-xs bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {order.phone && (
                <>
                  <a href={`tel:${order.phone}`} className={primaryButton}>Call {formatPhone(order.phone)}</a>
                  <a href={`sms:${order.phone}`} className={quietButton}>Text</a>
                </>
              )}
              {order.email && <a href={`mailto:${order.email}`} className={`${quietButton} break-all`}>{order.email}</a>}
            </div>
            <p className="text-gray-500 break-words"><span className="font-semibold">Ships from:</span> {address || "not given yet"}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 min-w-0">
              <p className={`${labelClass} mb-2`}>Expected</p>
              <ItemsList items={order.expected_items} empty="Nothing listed." />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 min-w-0">
              <p className={`${labelClass} mb-2`}>Received</p>
              <ItemsList items={order.received_items} empty="Not checked in yet." />
            </div>
          </div>

          <div className="text-xs bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
            <span className="font-semibold text-gray-500">Payout method</span>
            <span className="text-gray-700">{order.payout_method ? PAYOUT_METHOD_LABELS[order.payout_method] : "—"}</span>
            <span className="font-semibold text-gray-500">Payout handle</span>
            <span className="text-gray-700 break-all">{order.payout_handle ?? "—"}</span>
            <span className="font-semibold text-gray-500">Quoted</span>
            <span className="text-gray-700">{money(order.quoted_amount)}</span>
            <span className="font-semibold text-gray-500">Paid</span>
            <span className="text-gray-700">
              {money(order.paid_amount)}
              {order.paid_at && ` on ${new Date(order.paid_at).toLocaleDateString()}`}
            </span>
          </div>

          <div>
            <p className={`${labelClass} mb-1`}>Internal notes</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{order.internal_notes ?? "—"}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => { setEditing(true); setPending(null); setError(null); }} className={quietButton}>Edit details</button>
            <button disabled className={quietButton} title="Coming in stage 2">Send kit link</button>
            <span className="text-xs text-gray-400">Coming in stage 2</span>
          </div>

          <div>
            <p className={`${labelClass} mb-2`}>Move this kit</p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  disabled={busy}
                  onClick={() => startMove(status)}
                  className={
                    status === "problem"
                      ? "text-xs border border-red-300 text-red-600 px-3 py-1.5 rounded-lg disabled:opacity-50"
                      : status === "closed"
                        ? quietButton
                        : primaryButton
                  }
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {pending && (
            <div className="border border-gray-200 rounded-lg p-3 flex flex-col gap-3">
              <p className="text-sm font-medium">Move to {STATUS_LABELS[pending.status]}</p>

              {pending.status === "problem" && (
                <label className="flex flex-col gap-1">
                  <span className={labelClass}>What went wrong? (count mismatch, damaged, not as described, returned to sender…)</span>
                  <textarea className={inputClass} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
                </label>
              )}

              {pending.status === "checked_in" && (
                <div>
                  <p className={`${labelClass} mb-2`}>What actually arrived (starts from what was expected)</p>
                  <ItemsEditor drafts={received} onChange={setReceived} />
                </div>
              )}

              {pending.status === "paid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className={labelClass}>Amount paid</span>
                    <input className={inputClass} inputMode="decimal" placeholder="0.00" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className={labelClass}>Payout method</span>
                    <select className={inputClass} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      <option value="">Choose…</option>
                      {PAYOUT_METHODS.map((m) => (
                        <option key={m} value={m}>{PAYOUT_METHOD_LABELS[m]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 sm:col-span-2">
                    <span className={labelClass}>Payout handle</span>
                    <input className={inputClass} value={payHandle} onChange={(e) => setPayHandle(e.target.value)} />
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={confirmMove} disabled={busy} className={primaryButton}>{busy ? "Saving…" : "Confirm"}</button>
                <button onClick={() => { setPending(null); setError(null); }} className={quietButton}>Cancel</button>
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </>
      )}

      <div>
        <p className={`${labelClass} mb-2`}>Timeline</p>
        <ul className="flex flex-col gap-2">
          {events.map((event) => {
            const described = describeEvent(event);
            return (
              <li key={event.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                <p>{described.title}</p>
                {described.note && <p className="text-xs text-gray-500 break-words">{described.note}</p>}
                <p className="text-xs text-gray-400">{new Date(event.created_at).toLocaleString()} · {event.actor}</p>
              </li>
            );
          })}
          {events.length === 0 && <li className="text-sm text-gray-400">Nothing recorded yet.</li>}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The tab
// ---------------------------------------------------------------------------

const SUMMARY_TILES: Array<{ key: keyof MailInSummary; label: string }> = [
  { key: "kitsOut", label: "Kits out" },
  { key: "inTransit", label: "In transit" },
  { key: "deliveredNotCheckedIn", label: "Delivered, not checked in" },
  { key: "checkedInNotPaid", label: "Checked in, not paid" },
  { key: "problems", label: "Problems" },
  { key: "paidThisMonth", label: "Paid this month" },
];

const BOARD_LANES: MailInStatus[] = [...PIPELINE_STATUSES, "problem"];

export function MailInTab() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchList = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (query) params.set("q", query);
    return getJson<ListResponse>(`/api/admin/mail-in${params.size ? `?${params}` : ""}`, "Failed to load mail-in kits");
  }, [statusFilter, query]);

  const apply = useCallback((result: Fetched<ListResponse>) => {
    if (result.ok) {
      setError(null);
      setData(result.body);
    } else {
      setError(result.error);
    }
  }, []);

  const load = useCallback(async () => apply(await fetchList()), [apply, fetchList]);

  useEffect(() => {
    let cancelled = false;
    fetchList().then((result) => {
      if (!cancelled) apply(result);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchList, apply]);

  async function create(body: Record<string, unknown>) {
    setCreateBusy(true);
    try {
      const res = await fetch("/api/admin/mail-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) {
        setCreateError(result.error ?? "Failed to create the kit");
        return;
      }
      setCreateError(null);
      setCreating(false);
      setSelectedId(result.order.id);
      await load();
    } catch {
      setCreateError(NETWORK_ERROR);
    } finally {
      setCreateBusy(false);
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

  const lanes = statusFilter && statusFilter !== "all"
    ? [statusFilter as MailInStatus]
    : statusFilter === "all"
      ? [...MAIL_IN_STATUSES]
      : BOARD_LANES;
  const now = new Date();

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {SUMMARY_TILES.map((tile) => (
          <div key={tile.key} className="border border-gray-200 rounded-lg p-3">
            <p className="text-xl font-bold text-gray-900">{data.summary[tile.key]}</p>
            <p className="text-xs text-gray-500">{tile.label}</p>
          </div>
        ))}
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search.trim());
        }}
      >
        <input
          className={`${inputClass} sm:flex-1`}
          type="search"
          placeholder="Search name, phone or order number"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value === "") setQuery("");
          }}
        />
        <select aria-label="Status" className={`${inputClass} sm:w-44`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Open kits</option>
          <option value="all">Everything</option>
          {MAIL_IN_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className={quietButton}>Search</button>
          <button type="button" onClick={() => { setCreating(true); setSelectedId(null); setCreateError(null); }} className={primaryButton}>
            New kit
          </button>
        </div>
      </form>

      {creating && (
        <div className="border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="font-medium mb-3">New kit</p>
          <DetailsForm
            initial={draftFromOrder()}
            submitLabel="Create kit"
            busy={createBusy}
            error={createError}
            onSubmit={create}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {selectedId && !creating && (
        <OrderDetail key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} onChanged={load} />
      )}

      {data.truncated && (
        <p className="text-xs text-gray-400 mb-3">Showing the newest 500 kits. Use search or a status filter to narrow it down.</p>
      )}

      <div className="flex flex-col gap-6">
        {lanes.map((status) => {
          const cards = data.orders.filter((o) => o.status === status);
          return (
            <section key={status}>
              <h2 className={`text-sm font-semibold mb-2 ${status === "problem" ? "text-red-600" : "text-gray-900"}`}>
                {STATUS_LABELS[status]} <span className="text-gray-400 font-normal">({query ? cards.length : data.statusCounts[status]})</span>
              </h2>
              {cards.length === 0 ? (
                <p className="text-xs text-gray-400">None.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cards.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => { setSelectedId(order.id); setCreating(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className={`text-left border rounded-lg p-3 text-sm min-w-0 ${selectedId === order.id ? "border-emerald-600" : status === "problem" ? "border-red-200" : "border-gray-200"}`}
                    >
                      <p className="font-medium truncate">{order.name ?? "(no name)"}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {order.order_number}
                        {order.phone && ` · ${formatPhone(order.phone)}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {totalBoxes(order.expected_items)} boxes expected · {ageInDays(order.created_at, now)}d old
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
