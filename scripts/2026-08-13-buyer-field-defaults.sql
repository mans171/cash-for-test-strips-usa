-- Buyer field defaults — 2026-08-13
--
-- Why: all 28 active in-person buyers had empty accepted_brands,
-- payment_methods and response_time, so the data-derived FAQs added to
-- /sell-test-strips/[state] in commit f2edddd never fire. Company profile
-- pages also render "Ask the buyer" instead of payment info.
--
-- Scope: CFTS-branded listings ONLY (24 of 29). The 5 third-party listings
-- are deliberately untouched — we cannot assert what another business accepts
-- or how it pays:
--   864 Medex - Greenville, SC
--   Hawks Sport Electronics - Colorado Springs, CO
--   Jaime Cardoso - Charlotte, NC
--   PGH Phone Buyer - Pittsburgh, PA
--   Vancouver Test Strips Buyer - Vancouver, WA
--
-- Run in the Supabase SQL editor for project whgwneuarnrsktolmqdj.
-- Statement 3 is a read-back check — expect 23 in-person + 1 mail-in.

begin;

-- 1. In-person CFTS buyers.
update companies set
  accepted_brands = array['OneTouch','FreeStyle','Accu-Chek','Contour','Dexcom','Omnipod','True Metrix'],
  payment_methods = array['Cash','PayPal','Zelle','Venmo'],
  response_time   = '24 hours'
where active
  and not mail_in
  and (name ilike 'cash for test strips%'
       or name ilike 'cash for diabetic test strips%'
       or name ilike 'cfts%');

-- 2. CFTS Mail-In. No 'Cash' (nobody hands over cash by post), and its
--    transaction_modes was ['meetup'], which made the profile page display
--    "Local meetup" on a mail-only buyer.
update companies set
  accepted_brands   = array['OneTouch','FreeStyle','Accu-Chek','Contour','Dexcom','Omnipod','True Metrix'],
  payment_methods   = array['PayPal','Zelle','Venmo','Check'],
  response_time     = '1-2 business days',
  transaction_modes = array['mail_in']
where active and mail_in;

commit;

-- 3. Read-back verification.
select
  name,
  mail_in,
  array_length(accepted_brands, 1) as brands,
  array_length(payment_methods, 1) as payments,
  response_time,
  transaction_modes
from companies
where active
  and (name ilike 'cash for test strips%'
       or name ilike 'cash for diabetic test strips%'
       or name ilike 'cfts%')
order by mail_in, name;
