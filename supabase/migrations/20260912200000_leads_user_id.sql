-- Sellers who are signed in can see the orders they submitted. Signing in stays
-- optional: user_id is null for anonymous submissions and nothing reads it then.
alter table public.leads
  add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists leads_user_id_idx on public.leads (user_id);

-- No second insert policy is needed. The existing leads_insert_anon
-- (20260614000000_initial_schema.sql) is `for insert with check (true)` with NO
-- `to` clause, so it applies to every role — anon AND authenticated. A signed-in
-- seller's insert is already permitted.
--
-- Reading is new and scoped to the row's owner. Anonymous rows carry a null
-- user_id, and `null = auth.uid()` is null (not true), so they stay unreadable.
create policy "leads_select_own"
  on public.leads for select
  to authenticated
  using (user_id = auth.uid());
