@AGENTS.md

# Cash For Test Strips USA — Project Rules

## What this is
A Next.js directory site for finding local cash buyers of diabetic test strips. Features: company listings, click tracking, blog, SEO.

## Stack
- Next.js App Router + TypeScript + Tailwind
- Supabase (listings, click events, lead capture)
- Vercel deployment

## Never do
- Don't hardcode company URLs or prices — all data comes from Supabase
- Don't skip metadata/OG tags — SEO is the whole point of this site
- Don't use client components unless necessary — prefer server components for page routes

## Click tracking pattern
Outbound links go through `/api/track?company=<id>&url=<dest>` — this logs the click to Supabase then redirects. Never link directly to buyer sites.

## Blog
Blog posts are SEO-optimized, targeting state + "sell test strips" keywords. Each post should have a proper `generateMetadata` export.
