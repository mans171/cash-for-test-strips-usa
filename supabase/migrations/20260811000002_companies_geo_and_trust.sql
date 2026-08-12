alter table public.companies add column if not exists lat double precision;
alter table public.companies add column if not exists lng double precision;
alter table public.companies add column if not exists verified boolean not null default false;
alter table public.companies add column if not exists transaction_modes text[] not null default '{meetup}';
alter table public.companies add column if not exists response_time text;
alter table public.companies add column if not exists est_year int;
