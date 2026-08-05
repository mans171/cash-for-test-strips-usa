-- supabase/migrations/20260804000000_buyer_portal_and_orders.sql

alter table companies add column email text;
alter table companies add column mail_in boolean not null default false;

create table submissions (
  id uuid primary key default gen_random_uuid(),
  target_company_id uuid references companies(id),
  payload jsonb not null,
  submitted_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table submissions enable row level security;

create policy submissions_insert_anon on submissions
  for insert
  to public
  with check (true);

alter table leads add column items jsonb;
alter table leads add column channel text check (channel in ('sms', 'email'));
alter table leads add column matched_company_id uuid references companies(id);

insert into companies (name, slug, phone, mail_in, active, description, states)
values (
  'CFTS Mail-In',
  'cfts-mail-in',
  '5187799751',
  true,
  true,
  'Mail-in option for states without a local buyer.',
  '{}'
);
