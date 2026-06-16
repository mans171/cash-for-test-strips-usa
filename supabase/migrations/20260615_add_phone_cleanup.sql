-- Add phone contact column
alter table public.companies add column if not exists phone text;

-- Remove records not in the member list
delete from public.companies where slug = 'cash-for-diabetic-supplies';
delete from public.companies where slug = 'aaron-holt-st-louis-mo';

-- Set contact phone for all buyers without a website
update public.companies set phone = '518-779-9751' where url is null;
