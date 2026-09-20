-- "Started, didn't finish" capture for the /sell form.
--
-- /sell asks for a mobile number on its FIRST screen. When the seller moves on
-- to the buyers list, one row lands here: the number, an optional first name,
-- their state and what they listed. If they go on to send a request,
-- /api/leads stamps completed_lead_id + completed_at. If they leave instead,
-- the row shows in /admin under "Started, didn't finish" and the owner can
-- text them BY HAND from his own phone. Nothing sends a message automatically;
-- there is no SMS provider on this site.
--
-- Purely ADDITIVE. No existing table is altered; the only contact with the
-- existing schema is the nullable foreign key completed_lead_id -> leads.
-- Every statement is `if not exists`, so the file is safe to replay.
--
-- There is no updated_at trigger in this repo, so updated_at is set in code,
-- same as mail_in_orders and admin_credentials.

create table if not exists public.sell_starts (
  id          uuid primary key default gen_random_uuid(),

  -- Digits only, US leading 1 dropped (lib/sell-starts.ts phoneDigits).
  phone       text not null check (phone ~ '^[0-9]{10,15}$'),
  name        text,
  state       text,

  -- Array of {"brand": text, "count": int, "expiration": text, "condition": text}.
  items       jsonb not null default '[]'::jsonb
                check (jsonb_typeof(items) = 'array'),

  source_page text,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Set by /api/leads when the same visitor (same id AND same phone) finishes.
  completed_lead_id uuid references public.leads (id) on delete set null,
  completed_at      timestamptz,

  -- Admin only: the owner texted them / took the row off the list.
  contacted_at timestamptz,
  dismissed_at timestamptz,
  admin_note   text
);

create index if not exists sell_starts_created_at_idx on public.sell_starts (created_at desc);
create index if not exists sell_starts_phone_idx      on public.sell_starts (phone);

-- ROW LEVEL SECURITY: ENABLED, WITH NO POLICIES. DELIBERATE.
--
-- With RLS on and no policy, the anon and authenticated roles can read and
-- write NOTHING here — not through PostgREST, not through a signed-in
-- session. Only the service role (which bypasses RLS) reaches this table, and
-- it is used from exactly three server routes:
--   - POST /api/sell-starts           insert only, behind a strict whitelist
--   - POST /api/leads                 stamps completion, matched on id AND phone
--   - /api/admin/*                    after the admin session has been checked
-- These rows hold seller phone numbers.
--
-- Do NOT add a policy to "fix" an empty result or a failed insert. The public
-- form never talks to this table directly; it goes through the route above.
alter table public.sell_starts enable row level security;

-- Belt and braces: Supabase's default privileges grant table access to anon
-- and authenticated on anything created in `public`. RLS already blocks them;
-- revoking means a policy added by mistake later still exposes nothing.
revoke all on table public.sell_starts from anon, authenticated;
