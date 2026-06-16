# PRD — Cash For Test Strips USA

## Overview
A directory website that connects people who want to sell unused diabetic test strips with local cash buyers. The site earns revenue through referral traffic to listed buyer companies. SEO and content marketing (blog + backlinking) are the primary growth channels.

---

## Goals

1. Rank on Google for "[state] sell diabetic test strips" and related keywords
2. Drive qualified outbound clicks to 20+ listed buyer websites
3. Track every outbound click so we know which listings perform
4. Build trust with users through clean design, blog content, and transparent listings
5. Capture lead data where possible (newsletter, contact form)

---

## Users

**Primary:** People with unused diabetic test strips (diabetics, caregivers, estate liquidators) who want quick cash and don't know where to sell.

**Secondary:** Buyer companies who want referral traffic and may eventually pay for featured placement.

---

## Features

### 1. Company Directory
- List of 20+ buyer companies with: name, logo, states served, payment methods, accepted brands, star rating, link
- Filter by state, brand accepted, payment method (PayPal, check, Zelle, etc.)
- Each company gets its own detail page (good for internal linking + SEO)
- "Visit Site" button routes through `/api/track` before redirecting

### 2. Click Tracking
- API route: `GET /api/track?company=<id>&url=<encoded-dest>`
- Logs to Supabase: `company_id`, `timestamp`, `referrer`, `user_agent`
- Immediately redirects user to destination
- Dashboard (admin-only) showing clicks per company, per day

### 3. Blog
- Target keywords: "[state] sell test strips for cash", "how to sell diabetic test strips", "best prices for test strips", etc.
- Each post has proper `generateMetadata` for title, description, OG tags
- Posts can be MDX files (simple) or Supabase-backed (scalable)
- Internal links from blog posts to relevant company listings

### 4. State Pages
- `/sell-test-strips/[state]` — lists companies that buy in that state
- Targeted copy for each state for local SEO
- Linked from blog posts and navigation

### 5. Lead Capture (Phase 2)
- Email signup ("Get the best price — we'll contact top buyers for you")
- Contact form for people who want help
- Store submissions in Supabase with `source` field (which page/company they came from)

### 6. Admin Dashboard (Phase 2)
- View clicks by company, date range
- Add/edit/remove company listings
- Manage blog posts

---

## Data Models (Supabase)

### `companies`
| column | type |
|---|---|
| id | uuid |
| name | text |
| slug | text |
| url | text |
| logo_url | text |
| states | text[] |
| payment_methods | text[] |
| accepted_brands | text[] |
| rating | numeric |
| featured | boolean |
| created_at | timestamptz |

### `clicks`
| column | type |
|---|---|
| id | uuid |
| company_id | uuid (FK) |
| referrer | text |
| user_agent | text |
| created_at | timestamptz |

### `leads`
| column | type |
|---|---|
| id | uuid |
| name | text |
| email | text |
| phone | text |
| source_company_id | uuid (FK, nullable) |
| source_page | text |
| created_at | timestamptz |

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Homepage — hero, featured listings, how it works, recent blog posts |
| `/directory` | Full company listing with filters |
| `/company/[slug]` | Company detail page |
| `/sell-test-strips/[state]` | State-specific landing page |
| `/blog` | Blog index |
| `/blog/[slug]` | Individual blog post |
| `/api/track` | Click tracking redirect |
| `/admin` | Admin dashboard (protected, Phase 2) |

---

## SEO Strategy

- Every page has unique `<title>` and `<meta description>`
- State pages target "[state] sell test strips for cash"
- Blog targets long-tail: "how much do test strips sell for", "sell OneTouch strips near me", etc.
- Schema markup: `LocalBusiness`, `FAQPage` on key pages
- Internal linking: blog → state pages → company listings
- Sitemap auto-generated via Next.js

---

## Out of Scope (v1)

- User accounts / login
- Buyer-side portal (companies managing their own listings)
- Real-time conversion tracking on buyer sites (requires buyer cooperation)
- Payments or transaction processing

---

## Success Metrics

- Organic clicks from Google (Search Console)
- Outbound clicks per company (Supabase `clicks` table)
- Email signups / leads captured
- Pages indexed by Google
