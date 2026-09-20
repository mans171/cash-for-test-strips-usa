-- Mail-in kits, stage 2: the public /mail-in-kit form, EasyPost labels and the
-- tracking webhook.
--
-- ADDITIVE ONLY. One CHECK constraint is widened (a new allowed status); five
-- nullable columns are added. No row is rewritten, no column is dropped, and
-- every statement is safe to replay.
--
-- RLS is NOT touched: both tables keep row level security ON with NO policies,
-- and the anon / authenticated revokes from stage 1 stand. The public form and
-- the seller status page go through server routes that use the service role
-- and hand the browser a seller-safe projection (lib/mail-in.ts toSellerView).

-- 1. New FIRST pipeline status: awaiting_quote.
--
-- A kit the seller starts on the site has no price yet. It waits here until a
-- quote is agreed by text; only then does an admin make the label.
--
-- The stage-1 CHECK was written inline, so Postgres named it. That name is
-- almost certainly mail_in_orders_status_check, but rather than trust it, drop
-- EVERY check constraint on this table whose definition mentions the status
-- list, then add one back under a fixed name.
do $$
declare
  found record;
begin
  for found in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'mail_in_orders'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%quote_agreed%'
  loop
    execute format('alter table public.mail_in_orders drop constraint %I', found.conname);
  end loop;
end $$;

alter table public.mail_in_orders
  add constraint mail_in_orders_status_check check (status in (
    'awaiting_quote', 'quote_agreed', 'kit_sent', 'label_made', 'in_transit',
    'delivered', 'checked_in', 'paid', 'problem', 'closed'));

-- The column default stays 'quote_agreed': a kit an admin types in from a text
-- thread already has its price. The public route sets awaiting_quote itself.

-- 2. New columns. All nullable; `source` defaults so existing rows read 'admin'.
alter table public.mail_in_orders
  add column if not exists source text default 'admin'
    check (source in ('admin', 'site'));

-- Which EasyPost key bought the label. A 'test' label is not valid postage;
-- the admin panel and the seller page both badge it. The webhook ignores
-- events whose mode does not match.
alter table public.mail_in_orders
  add column if not exists easypost_mode text
    check (easypost_mode in ('test', 'live'));

alter table public.mail_in_orders add column if not exists easypost_tracker_id text;

-- EasyPost's refund_status after "Void label": submitted / refunded /
-- rejected / not_applicable. Free text on purpose — it is their vocabulary.
alter table public.mail_in_orders add column if not exists label_refund_status text;

-- What the seller typed in the form's optional note. Separate from
-- internal_notes, which is ours and is never shown to them.
alter table public.mail_in_orders add column if not exists seller_note text;

create index if not exists mail_in_orders_easypost_tracker_id_idx
  on public.mail_in_orders (easypost_tracker_id) where easypost_tracker_id is not null;
