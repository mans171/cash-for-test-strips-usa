-- Mail-in kits, stage 1: the tables behind the admin "Mail-in" tab.
--
-- A seller anywhere in the country agrees a quote privately, then mails their
-- diabetic supplies in. One row per kit in mail_in_orders; one row per thing
-- that happened to it in mail_in_events (the timeline).
--
-- Purely ADDITIVE. No existing table is altered; the only contact with the
-- existing schema is the nullable foreign key mail_in_orders.lead_id -> leads.
-- Every statement is `if not exists`, so the file is safe to replay.
--
-- Stage 1 moves statuses by hand. The EasyPost / tracking / label / token
-- columns exist now, nullable, so stages 2-3 (label purchase, seller kit page,
-- tracking webhook) need no destructive change later.
--
-- There is no updated_at trigger in this repo, so updated_at is set in code
-- (lib/mail-in.ts planOrderPatch), same as admin_credentials.

create table if not exists public.mail_in_orders (
  id            uuid primary key default gen_random_uuid(),

  -- Human-friendly reference, e.g. MK-7G2K9Q. Generated server-side.
  order_number  text not null unique,
  -- Secret for the future seller link (/kit/<token>): 32 random bytes, hex.
  -- Generated server-side; never sent to a browser in stage 1.
  token         text not null unique check (char_length(token) >= 64),

  status        text not null default 'quote_agreed' check (status in (
                  'quote_agreed', 'kit_sent', 'label_made', 'in_transit',
                  'delivered', 'checked_in', 'paid', 'problem', 'closed')),
  problem_reason text,

  -- Seller contact. Most kits start from a text thread, so nothing is
  -- mandatory except a way to reach them.
  name          text,
  phone         text,
  email         text,
  constraint mail_in_orders_contact_present
    check (nullif(btrim(phone), '') is not null or nullif(btrim(email), '') is not null),

  -- Ship-from address. Filled by the seller on the kit page in stage 2.
  street1       text,
  street2       text,
  city          text,
  state         text,
  zip           text,

  -- Arrays of {"product": text, "boxes": int}.
  expected_items jsonb not null default '[]'::jsonb
                  check (jsonb_typeof(expected_items) = 'array'),
  received_items jsonb
                  check (received_items is null or jsonb_typeof(received_items) = 'array'),

  payout_method text check (payout_method in ('zelle', 'cash_app', 'venmo', 'ach', 'wire', 'check')),
  payout_handle text,

  -- Admin-only. Never exposed on a public page or to the seller link.
  quoted_amount numeric(10,2) check (quoted_amount is null or quoted_amount >= 0),
  paid_amount   numeric(10,2) check (paid_amount is null or paid_amount >= 0),
  paid_at       timestamptz,

  internal_notes text,

  lead_id       uuid references public.leads (id) on delete set null,

  -- EasyPost (stage 2-3). All nullable.
  easypost_shipment_id text,
  tracking_code        text,
  carrier              text,
  service              text,
  label_url            text,
  label_pdf_url        text,
  qr_url               text,
  label_created_at     timestamptz,

  -- Milestones. kit_sent_at / delivered_at / checked_in_at are stamped by a
  -- manual move today; first_scan_at is the carrier's and is left to stage 3.
  kit_sent_at   timestamptz,
  first_scan_at timestamptz,
  delivered_at  timestamptz,
  checked_in_at timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists mail_in_orders_status_idx     on public.mail_in_orders (status);
create index if not exists mail_in_orders_created_at_idx on public.mail_in_orders (created_at desc);
create index if not exists mail_in_orders_paid_at_idx    on public.mail_in_orders (paid_at) where paid_at is not null;
create index if not exists mail_in_orders_lead_id_idx    on public.mail_in_orders (lead_id) where lead_id is not null;
-- The stage-3 webhook looks a kit up by tracking code.
create index if not exists mail_in_orders_tracking_code_idx on public.mail_in_orders (tracking_code) where tracking_code is not null;

create table if not exists public.mail_in_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.mail_in_orders (id) on delete cascade,
  type       text not null,
  detail     jsonb,
  actor      text not null default 'admin' check (actor in ('admin', 'system', 'seller')),
  created_at timestamptz not null default now()
);

create index if not exists mail_in_events_order_created_idx
  on public.mail_in_events (order_id, created_at);

-- ROW LEVEL SECURITY: ENABLED ON BOTH TABLES, WITH NO POLICIES. DELIBERATE.
--
-- With RLS on and no policy, the anon and authenticated roles can read and
-- write NOTHING here — not through PostgREST, not through a signed-in
-- session. Only the service role (which bypasses RLS) reaches these tables,
-- and it is only used from server routes that have already checked the admin
-- session (app/api/admin/mail-in/*). These rows hold seller contact details,
-- payout handles and dollar amounts.
--
-- Do NOT add a policy to "fix" an empty result. The stage-2 seller kit page
-- reads by token through a server route, never through a policy.
alter table public.mail_in_orders enable row level security;
alter table public.mail_in_events enable row level security;

-- Belt and braces: Supabase's default privileges grant table access to anon
-- and authenticated on anything created in `public`. RLS already blocks them;
-- revoking means a policy added by mistake later still exposes nothing.
revoke all on table public.mail_in_orders from anon, authenticated;
revoke all on table public.mail_in_events from anon, authenticated;
