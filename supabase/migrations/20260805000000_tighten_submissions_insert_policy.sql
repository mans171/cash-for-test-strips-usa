-- supabase/migrations/20260805000000_tighten_submissions_insert_policy.sql

alter policy submissions_insert_anon on submissions
  with check (status = 'pending' and reviewed_at is null);
