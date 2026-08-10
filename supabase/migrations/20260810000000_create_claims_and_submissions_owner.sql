-- supabase/migrations/20260810000000_create_claims_and_submissions_owner.sql

create table public.claims (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id),
  user_id         uuid not null references auth.users(id),
  submitted_phone text not null,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);

alter table public.claims enable row level security;
-- No policies at all: every read/write goes through a server route that
-- authenticates the caller first (getCurrentUser() for buyers, the admin
-- session cookie for admin routes), then uses supabaseAdmin. Matches
-- submissions' locked-down pattern after the anon-insert policy was removed.

alter table public.submissions add column submitted_by_user_id uuid references auth.users(id);
