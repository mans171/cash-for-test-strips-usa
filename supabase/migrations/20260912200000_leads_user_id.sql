-- Sellers who are signed in can see the orders they submitted. Signing in stays
-- optional: user_id is null for anonymous submissions and nothing reads it then.
alter table public.leads
  add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists leads_user_id_idx on public.leads (user_id);

-- Inserting stays open to the public — that is the whole point of these forms,
-- and the old leads_insert_anon (20260614000000_initial_schema.sql) was
-- `with check (true)` with NO `to` clause, so it reached every role. Keep that
-- reach (no `to` clause here either), but stop a caller naming somebody else as
-- the owner: now that user_id decides whose "My Orders" list a row shows up on,
-- `true` would let a direct anon PostgREST insert plant a row on another
-- person's list.
--
-- An anonymous submission carries a null user_id and is accepted exactly as
-- before. A signed-in submission may only stamp its own id.
drop policy if exists "leads_insert_anon" on public.leads;
create policy "leads_insert_public"
  on public.leads for insert
  with check (user_id is null or user_id = auth.uid());

-- Reading is new and scoped to the row's owner. Anonymous rows carry a null
-- user_id, and `null = auth.uid()` is null (not true), so they stay unreadable.
-- Dropped first so this file is safe to replay: Postgres has no
-- `create policy if not exists`.
drop policy if exists "leads_select_own" on public.leads;
create policy "leads_select_own"
  on public.leads for select
  to authenticated
  using (user_id = auth.uid());
