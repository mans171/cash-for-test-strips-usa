-- supabase/migrations/20260805000001_remove_submissions_anon_insert_policy.sql
--
-- Removes the anon INSERT policy on submissions. The anon key is public
-- (shipped to the browser), so an anon insert-only policy let anyone POST
-- directly to Supabase's REST API and bypass createSubmission's phone-
-- ownership check entirely (found during final-review adjudication of the
-- buyer-portal-and-order-flow plan). createSubmission now writes through
-- supabaseAdmin (service role, bypasses RLS) instead of the anon client.

drop policy submissions_insert_anon on submissions;
