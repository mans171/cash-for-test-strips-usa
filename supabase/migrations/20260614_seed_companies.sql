-- ============================================================
-- Seed: all known buyers from the directory list
-- ============================================================

-- Make url nullable (many buyers don't have a website yet)
alter table public.companies alter column url drop not null;

-- Add city and owner_name columns
alter table public.companies add column if not exists city text;
alter table public.companies add column if not exists owner_name text;

-- ============================================================
-- Insert buyers
-- ============================================================

insert into public.companies (name, slug, owner_name, city, url, states, featured, active, description)
values

-- North Carolina
(
  'Cash For Test Strips - Raleigh-Greensboro, NC',
  'nirav-raleigh-greensboro-nc',
  'Nirav',
  'Raleigh-Greensboro',
  null,
  array['NC'],
  false, true,
  'Local cash buyer serving the Raleigh-Greensboro, NC area.'
),
(
  'Cash For Test Strips - Raleigh-Durham, NC',
  'curtis-raleigh-durham-nc',
  'Curtis',
  'Raleigh-Durham',
  null,
  array['NC'],
  false, true,
  'Local cash buyer serving the Raleigh-Durham, NC area.'
),
(
  'Jaime Cardoso - Charlotte, NC',
  'jaime-cardoso-charlotte-nc',
  'Jaime Cardoso',
  'Charlotte',
  null,
  array['NC'],
  false, true,
  'Local cash buyer serving Charlotte, NC.'
),

-- Indiana
(
  'Cash For Test Strips Indiana',
  'cash-for-test-strips-indiana',
  'Chris Cripe',
  'Goshen',
  'https://cashforteststripsindiana.com/',
  array['IN'],
  true, true,
  'Indiana''s dedicated test strip buyer. Fast cash paid for unopened diabetic test strips.'
),

-- New York
(
  'Cash for Diabetic Test Strips & CGM Supplies - Albany, NY',
  'cash-for-diabetic-test-strips-albany-ny',
  'Feldon',
  'Albany',
  null,
  array['NY'],
  true, true,
  'Albany, NY''s trusted buyer for diabetic test strips and CGM supplies. Fast payment, top prices.'
),

-- Texas
(
  'Cash For Test Strips - Dallas, TX',
  'ricky-dallas-tx',
  'Ricky',
  'Dallas',
  null,
  array['TX'],
  false, true,
  'Local cash buyer serving Dallas, TX and surrounding areas.'
),
(
  'DTM Mobile - Tyler, TX',
  'dtm-mobile-tyler-tx',
  'Kendrick D',
  'Tyler',
  null,
  array['TX'],
  false, true,
  'Local cash buyer serving Tyler, TX.'
),
(
  'Cash For Test Strips - San Antonio, TX',
  'chris-dia-san-antonio-tx',
  'Chris Dia',
  'San Antonio',
  null,
  array['TX'],
  false, true,
  'Local cash buyer serving San Antonio, TX.'
),

-- Pennsylvania
(
  'PGH Phone Buyer - Pittsburgh, PA',
  'pgh-phone-buyer-pittsburgh-pa',
  'Kevin Price',
  'Pittsburgh',
  'https://pghphonebuyer.com',
  array['PA'],
  false, true,
  'Pittsburgh buyer — cash paid for diabetic test strips and more.'
),
(
  'Cash For Test Strips - Hazleton, PA',
  'alberto-hazleton-pa',
  'Alberto Sangiorgio',
  'Hazleton',
  null,
  array['PA'],
  false, true,
  'Local cash buyer serving Hazleton, PA.'
),
(
  'Cash For Test Strips - Greencastle, PA',
  'alex-quintana-greencastle-pa',
  'Alex Quintana',
  'Greencastle',
  null,
  array['PA'],
  false, true,
  'Local cash buyer serving Greencastle, PA.'
),

-- Kansas
(
  'Cash For Test Strips - Kansas City, KS',
  'chris-utter-kansas-city-ks',
  'Chris Utter',
  'Kansas City',
  null,
  array['KS'],
  false, true,
  'Local cash buyer serving Kansas City, KS.'
),

-- South Carolina
(
  '864 Medex - Greenville, SC',
  '864medex-greenville-sc',
  'Dalven Phelps',
  'Greenville',
  'https://864medex.com',
  array['SC'],
  true, true,
  'Greenville, SC''s trusted buyer for diabetic test strips. Quick cash, no hassle.'
),

-- Nevada
(
  'Cash For Test Strips - Las Vegas, NV',
  'rj-las-vegas-nv',
  'RJ',
  'Las Vegas',
  null,
  array['NV'],
  false, true,
  'Local cash buyer serving Las Vegas, NV.'
),

-- Georgia
(
  'Cash For Test Strips - Savannah, GA',
  'christopher-savannah-ga',
  'Christopher Aaron Smith',
  'Savannah',
  null,
  array['GA'],
  false, true,
  'Local cash buyer serving Savannah, GA.'
),

-- Florida
(
  'Cash For Test Strips - Orlando, FL',
  'liliana-orlando-fl',
  'Liliana',
  'Orlando',
  null,
  array['FL'],
  false, true,
  'Local cash buyer serving Orlando, FL.'
),
(
  'Cash For Test Strips - Miami, FL',
  'melissa-miami-fl',
  'Melissa',
  'Miami',
  null,
  array['FL'],
  false, true,
  'Local cash buyer serving Miami, FL.'
),

-- Canada
(
  'Cash For Test Strips - Ottawa, Canada',
  'alex-asselin-ottawa-canada',
  'Alex Asselin',
  'Ottawa',
  null,
  array['CANADA'],
  false, true,
  'Cash buyer serving Ottawa, Canada.'
),

-- Ohio
(
  'Cash For Test Strips - Cleveland, OH',
  'kurt-bruce-cleveland-oh',
  'Kurt Bruce',
  'Cleveland',
  null,
  array['OH'],
  false, true,
  'Local cash buyer serving Cleveland, OH.'
),
(
  'Cash For Test Strips - Toledo, OH / Detroit, MI',
  'favier-toledo-oh-detroit-mi',
  'Favier C',
  'Toledo / Detroit',
  null,
  array['OH','MI'],
  false, true,
  'Cash buyer serving Toledo, OH and Detroit, MI.'
),

-- New Jersey
(
  'Cash For Test Strips - Keyport, NJ',
  'nichole-keyport-nj',
  'Nichole',
  'Keyport',
  null,
  array['NJ'],
  false, true,
  'Local cash buyer serving Keyport, NJ.'
),

-- Massachusetts
(
  'Cash For Test Strips - Boston, MA',
  'jerome-jones-boston-ma',
  'Jerome Jones',
  'Boston',
  null,
  array['MA'],
  false, true,
  'Local cash buyer serving Boston, MA.'
),

-- New York City
(
  'Cash For Test Strips - New York, NY',
  'kevin-silver-new-york-ny',
  'Kevin Silver',
  'New York City',
  null,
  array['NY'],
  false, true,
  'Local cash buyer serving New York City, NY.'
),

-- Philadelphia
(
  'Cash For Test Strips - Philadelphia, PA',
  'busie-philadelphia-pa',
  'Busie Busie',
  'Philadelphia',
  null,
  array['PA'],
  false, true,
  'Local cash buyer serving Philadelphia, PA.'
),

-- Maryland
(
  'Cash For Test Strips - Silver Spring, MD',
  'abdul-silver-spring-md',
  'Abdul',
  'Silver Spring',
  null,
  array['MD'],
  false, true,
  'Local cash buyer serving Silver Spring, MD.'
),

-- Louisiana
(
  'Cash For Test Strips - Baton Rouge, LA',
  'leonard-fields-baton-rouge-la',
  'Leonard Fields',
  'Baton Rouge',
  null,
  array['LA'],
  false, true,
  'Local cash buyer serving Baton Rouge, LA.'
),

-- California
(
  'Cash For Test Strips - Sacramento, CA',
  'chuck-oru-sacramento-ca',
  'Chuck Oru',
  'Sacramento',
  null,
  array['CA'],
  false, true,
  'Local cash buyer serving Sacramento, CA.'
),
(
  'Cash For Test Strips - San Diego, CA',
  'rene-ramirez-san-diego-ca',
  'Rene Ramirez',
  'San Diego',
  null,
  array['CA'],
  false, true,
  'Local cash buyer serving San Diego, CA.'
),

-- Missouri
(
  'Cash For Test Strips - St. Louis, MO',
  'aaron-holt-st-louis-mo',
  'Aaron Holt',
  'St. Louis',
  null,
  array['MO'],
  false, true,
  'Local cash buyer serving St. Louis, MO.'
),

-- Washington State
(
  'Cash For Test Strips - Washington State',
  'tim-a-washington-state',
  'Tim A',
  'Washington State',
  null,
  array['WA'],
  false, true,
  'Cash buyer serving Washington State.'
),

-- Colorado
(
  'Cash For Test Strips - Colorado',
  'sean-murphy-colorado',
  'Sean Murphy',
  'Colorado',
  null,
  array['CO'],
  false, true,
  'Cash buyer serving Colorado.'
),
(
  'Hawks Sport Electronics - Colorado Springs, CO',
  'hawks-sport-electronics-colorado-springs-co',
  'Spencer',
  'Colorado Springs',
  'https://hawksportelectronics.com/',
  array['CO'],
  false, true,
  'Colorado Springs buyer — cash for diabetic test strips and electronics.'
),

-- West Virginia
(
  'Cash For Test Strips - West Virginia',
  'michele-wilson-west-virginia',
  'Michele Wilson',
  'West Virginia',
  null,
  array['WV'],
  false, true,
  'Cash buyer serving West Virginia.'
);
