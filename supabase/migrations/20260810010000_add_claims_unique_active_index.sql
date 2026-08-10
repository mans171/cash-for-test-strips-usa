create unique index claims_one_active_per_company_user
  on public.claims (company_id, user_id)
  where status in ('pending', 'approved');
