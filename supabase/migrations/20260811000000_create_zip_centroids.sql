-- US ZIP (ZCTA) centroids for proximity search. Source: US Census Bureau
-- ZCTA Gazetteer (public domain). State derived from ZIP prefix ranges.
create table public.zip_centroids (
  zip   text primary key,
  lat   double precision not null,
  lng   double precision not null,
  state text
);

alter table public.zip_centroids enable row level security;

create policy "zip_centroids_public_read"
  on public.zip_centroids for select
  to anon, authenticated
  using (true);
