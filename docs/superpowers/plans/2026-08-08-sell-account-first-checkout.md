# Sell Account-First Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `/sell` so building the order and giving contact info double as account creation — one "Create your account" submission reveals the matched buyer(s) already unlocked, with no separate gate/modal after the fact.

**Architecture:** `SellFlowClient` gains a new `"account"` stage between `"build"` and `"results"`. An anonymous customer who submits the build stage lands on `"account"` (no buyer data fetched yet); a returning logged-in customer skips straight to `"results"` as today. Submitting the account form creates the Supabase account, then immediately fetches buyers and shows `"results"` — always authenticated by that point, so `RequiresAccount`/`AccountModal` are removed from this page entirely.

**Tech Stack:** Next.js 16.2.9 App Router, existing Supabase Auth infrastructure (`createBrowserSupabaseClient`, `useUser`) — no new dependencies, no API/schema changes.

## Global Constraints

- No buyer information (names, cities, or contact actions) renders before an anonymous customer completes the account form — the `"account"` stage never fetches buyers.
- The account form's button reads exactly **"Create your account"** (not "Submit," not "Create account").
- A customer who is already logged in when they submit the build stage skips the `"account"` stage entirely and goes straight to `"results"`, with contact fields auto-filled from their existing profile (unchanged behavior).
- `RequiresAccount` and `AccountModal` are removed from `app/sell/SellFlowClient.tsx` only — both stay untouched everywhere else (`/directory`, `/company/[slug]`).
- No changes to `/api/sell/match` or `/api/leads` — both already correctly require/check authentication server-side; this plan is client-side only.
- No new automated tests — this repo has no component-test tooling, consistent with every prior `/sell`/`/signup` change.

---

### Task 1: Account-first checkout flow in `SellFlowClient`

**Files:**
- Modify: `app/sell/SellFlowClient.tsx`

**Interfaces:**
- Consumes: `useUser()`, `createBrowserSupabaseClient()`, `fetchOwnProfileContact()` (all existing, unchanged signatures).
- Produces: no new exports — this is the only file in this plan.

Read the current `app/sell/SellFlowClient.tsx` in full before editing (it's ~576 lines). This task touches: imports, the `Stage` type, state declarations, the auto-fill effect's dependency array, `handleFindBuyers`, a new `insertProfile`/`handleCreateAccount`/`handleRetryProfile` set of functions, a new `"account"` stage render block, and the `"results"` stage's button rendering + outer return structure. Do NOT touch the `"build"` stage's item-building JSX (state/brand/line selection, expiration, condition — everything below the final `return (` at the bottom of the file), `runMatch`, `handleSend`, or the `"sent"` stage — all unchanged.

- [ ] **Step 1: Update imports**

Find:

```tsx
import { useUser } from "@/lib/auth-client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { fetchOwnProfileContact } from "@/lib/profile-lookup";
import { RequiresAccount } from "@/app/components/RequiresAccount";
import { AccountModal } from "@/app/components/AccountModal";
```

Replace with:

```tsx
import { useUser } from "@/lib/auth-client";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { fetchOwnProfileContact } from "@/lib/profile-lookup";
```

- [ ] **Step 2: Update the `Stage` type**

Find:

```tsx
type Stage = "build" | "results" | "sent";
```

Replace with:

```tsx
type Stage = "build" | "account" | "results" | "sent";
```

- [ ] **Step 3: Replace the modal/gate state with account-form state**

Find:

```tsx
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [refillTrigger, setRefillTrigger] = useState(0);
  const [refreshingMatch, setRefreshingMatch] = useState(false);
```

Replace with:

```tsx
  const [password, setPassword] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountPendingUserId, setAccountPendingUserId] = useState<string | null>(null);
```

- [ ] **Step 4: Simplify the auto-fill effect's dependency array**

Find:

```tsx
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
  }, [user, refillTrigger]);
```

Replace with:

```tsx
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
```

This still handles both post-account-creation (values already set from the account form, so `prev ||` no-ops harmlessly) and the returning-logged-in-customer path (values empty, gets filled from their profile) — it no longer needs `refillTrigger` since there's no post-hoc "unlock" moment to react to anymore.

- [ ] **Step 5: Remove `refreshMatchAfterAuth` and branch `handleFindBuyers` on login state**

Find:

```tsx
  // After a customer logs in or signs up via the modal, the buyer cards on
  // screen still hold the pre-login (contact-stripped) response. Re-run the
  // search so the now-authenticated request returns real email/phone. Keep
  // this quiet on failure — don't blank out results the customer can already
  // see just because a background refresh didn't succeed.
  async function refreshMatchAfterAuth() {
    if (!state) return;
    setRefreshingMatch(true);
    try {
      await runMatch(state);
    } catch {
      // Swallow — keep showing the existing (possibly still-gated) results
      // rather than clearing the list or surfacing an error for a refresh
      // the customer didn't explicitly trigger.
    } finally {
      setRefreshingMatch(false);
    }
  }

  async function handleSend(buyer: Company, channel: "sms" | "email") {
```

Replace with:

```tsx
  async function handleSend(buyer: Company, channel: "sms" | "email") {
```

- [ ] **Step 6: Branch `handleFindBuyers` on whether the customer is already logged in**

Find:

```tsx
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
      await runMatch(state);
      setStage("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }
```

Replace with:

```tsx
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
```

- [ ] **Step 7: Add `insertProfile`, `handleCreateAccount`, and `handleRetryProfile`**

Find:

```tsx
  async function handleSend(buyer: Company, channel: "sms" | "email") {
```

(this is the same line Step 5 left in place — insert the three new functions immediately above it)

Replace with:

```tsx
  async function insertProfile(userId: string) {
    const supabase = createBrowserSupabaseClient();
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      role: "customer",
      name: customerName,
      phone: customerPhone,
      address_street: addressStreet,
      address_city: addressCity,
      address_state: addressState,
      address_zip: addressZip,
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

  async function handleSend(buyer: Company, channel: "sms" | "email") {
```

- [ ] **Step 8: Add the `"account"` stage render block**

Find:

```tsx
  if (stage === "results") {
```

Replace with:

```tsx
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

        <form onSubmit={handleCreateAccount} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900">Your Info</h2>
          <p className="text-xs text-gray-500 -mt-2">We use this to find your local buyer and let you reach them directly.</p>
          <input
            type="text"
            required
            placeholder="Your name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="tel"
            required
            placeholder="Phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            placeholder="Street address"
            value={addressStreet}
            onChange={(e) => setAddressStreet(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="City"
              value={addressCity}
              onChange={(e) => setAddressCity(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1"
            />
            <input
              type="text"
              required
              placeholder="State"
              value={addressState}
              onChange={(e) => setAddressState(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-20"
            />
            <input
              type="text"
              required
              placeholder="ZIP"
              value={addressZip}
              onChange={(e) => setAddressZip(e.target.value)}
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
      </div>
    );
  }

  if (stage === "results") {
```

- [ ] **Step 9: Remove the "unlocking" message and drop the outer fragment wrapper on the `"results"` stage**

Find:

```tsx
    const cards = buyers.length > 0 ? buyers : mailIn ? [mailIn] : [];
    const nameMissing = customerName.trim().length === 0;
    return (
      <>
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setStage("build")}
          className="text-xs font-medium text-gray-500 hover:text-emerald-700 self-start"
        >
          ← Back to your order
        </button>
```

Replace with:

```tsx
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
```

- [ ] **Step 10: Remove the "Unlocking buyer contact info..." paragraph**

Find:

```tsx
        {refreshingMatch && (
          <p className="text-xs text-gray-400">Unlocking buyer contact info...</p>
        )}
        {cards.length === 0 ? (
```

Replace with:

```tsx
        {cards.length === 0 ? (
```

- [ ] **Step 11: Remove the `RequiresAccount` gate around the buyer-card action buttons**

Find:

```tsx
                {(c.email || c.phone || c.hasContact) && (
                  <RequiresAccount onRequestAccount={() => setAccountModalOpen(true)}>
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
                  </RequiresAccount>
                )}
```

Replace with:

```tsx
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
```

- [ ] **Step 12: Remove the `AccountModal` render and closing fragment tag**

Find:

```tsx
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
      {accountModalOpen && (
        <AccountModal
          onClose={() => setAccountModalOpen(false)}
          onSuccess={() => {
            setAccountModalOpen(false);
            setRefillTrigger((n) => n + 1);
            refreshMatchAfterAuth();
          }}
        />
      )}
      </>
    );
  }
```

Replace with:

```tsx
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    );
  }
```

- [ ] **Step 13: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors — confirm no leftover references to `RequiresAccount`, `AccountModal`, `accountModalOpen`, `refillTrigger`, `refreshingMatch`, or `refreshMatchAfterAuth` anywhere in the file.

- [ ] **Step 14: Build check**

Run: `npm run build`
Expected: succeeds

- [ ] **Step 15: Run the full test suite**

Run: `npm test`
Expected: all existing tests pass (no test files touched by this task).

- [ ] **Step 16: Manual browser verification**

Start `npm run dev`, then in a browser:

1. **Anonymous visitor:** build an order (any product, count, expiration, condition), select a state matched to a real buyer, submit. Confirm you land on the `"account"` stage — no buyer names, cities, or contact info visible anywhere on this screen, just the Order Summary and the "Your Info" form.
2. Fill in name, phone, email, password (8+ chars), street, city, state, ZIP. Click "Create your account." Confirm you land directly on `"results"` with the matched buyer card(s) showing already-live "Request Quote"/"Text Now" buttons — no gate, no "Create an account" message, no modal.
3. Click one of the contact buttons. Confirm it behaves exactly as before (email sent to buyer + you CC'd, or the SMS deep-link opens) and the confirmation screen shows.
4. **Returning logged-in visitor:** with the account just created still logged in (or after logging back in), reload `/sell`, build a new order, submit. Confirm you skip the `"account"` stage entirely and land straight on `"results"`, with the Contact Information fields pre-filled from your profile.
5. Clean up the test account created in step 2 the same way prior tasks in this project have (delete via `supabaseAdmin.auth.admin.deleteUser()` in a one-off script, removed after running), and verify via SQL against the live Supabase project (`whgwneuarnrsktolmqdj`) that no stray rows remain in `auth.users`, `profiles`, or `leads`.

Stop the dev server when done.

- [ ] **Step 17: Commit**

```bash
git add app/sell/SellFlowClient.tsx
git commit -m "feat: fold account creation into the /sell checkout flow, remove the post-hoc account gate"
```

---

## Self-Review Notes

- **Spec coverage:** Architecture ("account" stage insertion, branch on login state — Steps 2, 6), Components (`insertProfile`/`handleCreateAccount`/`handleRetryProfile`, removed `RequiresAccount`/`AccountModal` — Steps 1, 7, 11, 12), Data Flow (all 4 steps from the spec walked in the manual verification checklist), Error Handling (mirrors `SignupForm`'s three failure modes — Step 7's code), Testing (Step 16's checklist covers both the new-account and returning-customer paths from the spec's Testing section).
- **Placeholder scan:** none found — every step has complete, runnable code.
- **Type consistency:** `insertProfile(userId: string)` matches its one call site in `handleCreateAccount`/`handleRetryProfile`. `handleCreateAccount`/`handleRetryProfile`/`insertProfile` all reference the same state variable names declared in Step 3 (`password`, `addressStreet`, `addressCity`, `addressState`, `addressZip`, `accountSubmitting`, `accountError`, `accountPendingUserId`) and the pre-existing `customerName`/`customerPhone`/`customerEmail`/`state` — no renamed or mismatched variables between steps.
