-- ============================================================
-- Cash For Test Strips USA — Initial Schema
-- ============================================================

-- Companies directory listing
create table public.companies (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  url             text not null,
  logo_url        text,
  states          text[] not null default '{}',
  payment_methods text[] not null default '{}',
  accepted_brands text[] not null default '{}',
  rating          numeric(2,1) check (rating >= 0 and rating <= 5),
  featured        boolean not null default false,
  active          boolean not null default true,
  description     text,
  created_at      timestamptz not null default now()
);

create index on public.companies (slug);
create index on public.companies using gin (states);
create index on public.companies (featured) where featured = true;

-- Outbound click tracking
create table public.clicks (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  referrer    text,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index on public.clicks (company_id);
create index on public.clicks (created_at);

-- Lead / contact form submissions
create table public.leads (
  id                 uuid primary key default gen_random_uuid(),
  name               text,
  email              text,
  phone              text,
  source_company_id  uuid references public.companies (id) on delete set null,
  source_page        text,
  notes              text,
  created_at         timestamptz not null default now()
);

create index on public.leads (created_at);
create index on public.leads (source_company_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.companies enable row level security;
alter table public.clicks    enable row level security;
alter table public.leads     enable row level security;

-- Public can read active companies
create policy "companies_public_read"
  on public.companies for select
  using (active = true);

-- Clicks are insert-only from public (the /api/track route uses service role key)
-- No public read on clicks — admin only via service role
create policy "clicks_insert_anon"
  on public.clicks for insert
  with check (true);

-- Leads are insert-only from public
create policy "leads_insert_anon"
  on public.leads for insert
  with check (true);

-- ============================================================
-- Seed: a few placeholder companies to test with
-- ============================================================

insert into public.companies (name, slug, url, states, payment_methods, accepted_brands, rating, featured, description)
values
  (
    'Cash For Diabetic Supplies',
    'cash-for-diabetic-supplies',
    'https://example.com',
    array['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'],
    array['PayPal','Check','Zelle'],
    array['OneTouch','Freestyle','Accu-Chek','Contour','Bayer','Walmart ReliOn'],
    4.8,
    true,
    'Top-rated nationwide buyer. Fast payment via PayPal or check.'
  );
