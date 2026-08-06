-- supabase/migrations/20260805000002_admin_credentials_and_reset_tokens.sql

create table admin_credentials (
  id uuid primary key default gen_random_uuid(),
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table admin_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table admin_credentials enable row level security;
alter table admin_reset_tokens enable row level security;
-- No policies on either table: only the service-role client (supabaseAdmin,
-- which bypasses RLS) may read or write. Nothing here is ever anon-accessible.
