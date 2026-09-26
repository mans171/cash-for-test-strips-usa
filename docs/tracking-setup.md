# Tracking setup — console runbook

Cash For Test Strips USA (cash4teststripsusa.com). Code shipped in the `feat/tracking` PR.
The code does nothing until the env vars below are set in Vercel and the Tag Manager
container is built and published. Every id arrives as an env var; none is in the repo, and
`lib/__tests__/tracking-isolation.test.ts` fails the build if one is hardcoded.

## The assets (created 9/25/2026)

| Asset | Id | Notes |
|---|---|---|
| Meta dataset (pixel) | `1427465186154419` | "Cash For Test Strips USA - Website", business `680482935753169`, connected to ad account `act_2051814728788076` only |
| Tag Manager container | `GTM-MVVFK288` | this site only |
| GA4 property | `G-B1QW619063` (property `556007622`) | configured INSIDE Tag Manager, not in code |

⛔ **Never put an Albany supplies (DTS) or Albany phones (CFPA) id anywhere in this site's
setup** — not their pixel, dataset, page, ad account, container or GA4 property. The full
list is `FORBIDDEN_IDS` in `lib/tracking-config.ts`. A forbidden id pasted into an env var
is ignored at runtime and logged as an error.

## 1. Vercel env vars

Project → Settings → Environment Variables. Names are case-sensitive and fail silently
(a sister project lost days to `Meta_Capi_Access_Token`).

| Name | Value | Production | Preview | Secret? |
|---|---|---|---|---|
| `NEXT_PUBLIC_GTM_ID` | `GTM-MVVFK288` | ✅ | ⛔ leave unset | no (public by design) |
| `META_PIXEL_ID` | `1427465186154419` | ✅ | ⛔ leave unset | no, but server-only |
| `META_CAPI_ACCESS_TOKEN` | token from step 3 | ✅ | ⛔ leave unset | **yes — mark Sensitive** |
| `META_CAPI_TEST_EVENT_CODE` | code from Events Manager → Test Events | only while verifying (step 6), then delete | ⛔ | no |

**Why not Preview:** previews run against the same production database, so a test lead on a
preview URL would be reported to Meta and GA4 as a real one, from a `*.vercel.app` hostname.
With the vars unset, previews load no container and send nothing. Verify on production
instead (step 6) — Tag Assistant and Meta Test Events both work on the live site.

`NEXT_PUBLIC_GTM_ID` is inlined at build time: **redeploy after setting or changing it.**
The server vars are read per request but Vercel still needs a redeploy to pick them up.

There is deliberately **no** `NEXT_PUBLIC_` pixel or GA4 variable. The browser pixel and GA4
are configured inside Tag Manager, so tags change without a deploy.

## 2. Meta Events Manager settings (dataset `1427465186154419`)

Before any tag fires:

1. **Confirm it is a consolidated container.** Offline and web events are only eligible when
   `is_consolidated_container` is `true` (the old DTS pixel was `false` and Meta still answered
   `200`, filing everything wrong):
   `curl -G "https://graph.facebook.com/v22.0/1427465186154419" --data-urlencode "fields=is_consolidated_container" --data-urlencode "access_token=$META_CAPI_ACCESS_TOKEN"`
2. **Settings → Automatic advanced matching: OFF.** When on, the pixel reads email and
   phone fields out of the page's forms in the browser. The server already sends those, hashed,
   and the privacy page does not disclose browser-side form scraping.
3. **Settings → "Track events automatically without code": OFF.** It sends button text and
   page metadata, which on this site means product names — health terms Meta restricts.
4. **Settings → Traffic permissions → Allow list: `cash4teststripsusa.com` only.** Stops any
   other site firing events into this dataset.
5. The ad-account connection (`act_2051814728788076`) is already made. Without it Meta stores
   events and never credits them to ads.

Meta may classify the domain as health-related and apply its restricted-data rules regardless
(it can drop custom parameters and limit some optimization). The code is built for that: the
events Meta sees are standard `Lead` with no product data.

## 3. Conversions API token

Events Manager → dataset `1427465186154419` → Settings → Conversions API → **Set up direct
integration → "Set up without Dataset Quality API"**.

⛔⛔ **Do not take the "Recommended" option ("Set up with Dataset Quality API").** On the
electronics site (9/8) its dataset picker arrived with **10 datasets pre-selected, including
the DTS pixel and datasets**, and the grant cannot be undone once made. The plain option
issues a token that can send events and nothing else.

Put the token in Vercel as `META_CAPI_ACCESS_TOKEN` (Production, Sensitive). Never in the repo,
never in a chat.

## 4. The events the site pushes

Every event goes to `window.dataLayer` as `{ event: '<name>', ...params }`. **No PII ever**:
no phone, email, name, address or free text (`lib/data-layer.ts` also strips anything
contact-shaped at runtime). Tag Manager only loads on public pages, and not at all for a
visitor who opted out on /privacy or whose browser sends Global Privacy Control.

| Event | Fires when | Params (exact keys) |
|---|---|---|
| `sell_start` | /sell: first product tile tapped (once per page load) | — |
| `sell_product_selected` | /sell: an item's product fully chosen | `product_category` (`test_strips` / `cgm` / `infusion_sets` / `lancets` / `other`), `item_number` |
| `sell_phone_captured` | /sell: screen one's phone saved (the "Started, didn't finish" row exists), once per page load | — |
| `sell_buyers_shown` | /sell: step two, the buyers list (count 0 = no-buyer screen) | `buyer_count`, `mail_in_offered` (bool), `state` (2-letter) |
| `lead_submit` | /sell: request sent to a buyer (server confirmed) | `event_id`, `lead_type` = `sell`, `channel` (`sms` / `email`), `item_count` |
| `mail_kit_start` | /mail-in-kit: first item added (once per page load) | — |
| `mail_kit_step` | /mail-in-kit: moved to step 2 (ship from) or 3 (get paid) | `step` (2 / 3) |
| `mail_kit_request` | /mail-in-kit: kit saved (server confirmed) | `event_id`, `lead_type` = `mail_kit`, `item_count` |
| `bulk_form_start` | /sell-test-strips-in-bulk: first field focused (once) | — |
| `bulk_lead_submit` | /sell-test-strips-in-bulk: inquiry saved (server confirmed) | `event_id`, `lead_type` = `bulk` |
| `contact_click` | any call / text / email / buyer-website link, anywhere | `method` (`call` / `text` / `email` / `website`), `target` (`house` = our number or address, `buyer` = a listed buyer) |
| `sign_up` | account created (seller or buyer) | `role` (`customer` / `buyer`) |

The three **money events** — `lead_submit`, `mail_kit_request`, `bulk_lead_submit` — are also
sent server-side to the Conversions API as `Lead`, with the same `event_id`.

⛔ **`product_category` is for GA4 only.** Never map it, or any other param, into a Meta tag.
The Meta tags send `eventID` and nothing else.

## 5. Tag Manager container `GTM-MVVFK288`

### Variables (Data Layer Variable, version 2)

Name each `DLV - <key>` with Data Layer Variable Name = the key:
`event_id`, `lead_type`, `channel`, `item_count`, `product_category`, `item_number`,
`buyer_count`, `mail_in_offered`, `state`, `step`, `method`, `target`, `role`.

### Triggers

| Trigger | Type | Setting |
|---|---|---|
| `CE - site events` | Custom Event | Event name, **use regex matching**: `^(sell_start\|sell_product_selected\|sell_phone_captured\|sell_buyers_shown\|lead_submit\|mail_kit_start\|mail_kit_step\|mail_kit_request\|bulk_form_start\|bulk_lead_submit\|contact_click\|sign_up)$` |
| `CE - lead_submit` | Custom Event | `lead_submit` |
| `CE - mail_kit_request` | Custom Event | `mail_kit_request` |
| `CE - bulk_lead_submit` | Custom Event | `bulk_lead_submit` |

(In the regex, type plain `|` — the backslashes above are only Markdown escaping.)

### Tags

1. **GA4 — Google tag.** Tag type Google Tag, Tag ID `G-B1QW619063`, trigger
   **Initialization - All Pages**.
2. **GA4 — site events.** Tag type GA4 Event, Measurement ID `G-B1QW619063`, Event Name
   `{{Event}}`, trigger `CE - site events`. Event parameters: one row per variable above,
   parameter name = the key, value = `{{DLV - key}}`. A param an event does not carry is
   simply left off by GA4, so one tag serves every event.
3. **Meta — base pixel.** Custom HTML, trigger **All Pages** (Page View):
   ```html
   <script>
   !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
   n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
   n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
   t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
   document,'script','https://connect.facebook.net/en_US/fbevents.js');
   fbq('init', '1427465186154419');
   fbq('track', 'PageView');
   </script>
   ```
   Do NOT pass a third `init` argument (that is manual advanced matching, i.e. PII).
4. **Meta — Lead (sell).** Custom HTML, trigger `CE - lead_submit`, Advanced settings →
   Tag Sequencing → *fire "Meta — base pixel" before this tag*:
   ```html
   <script>fbq('track', 'Lead', {}, {eventID: {{DLV - event_id}}});</script>
   ```
5. **Meta — Lead (mail-in kit).** Same, trigger `CE - mail_kit_request`.
6. **Meta — Lead (bulk).** Same, trigger `CE - bulk_lead_submit`.

**`eventID` is what dedupes the browser Lead against the server Lead.** Without it Meta
counts every lead twice. It must be the fourth argument's `eventID` (capital ID), from
`{{DLV - event_id}}`.

Submit and **Publish** the container.

### GA4 admin

- Admin → Events → mark `lead_submit`, `mail_kit_request`, `bulk_lead_submit` as **key events**.
- Admin → Custom definitions → event-scoped dimensions for `lead_type`, `channel`,
  `product_category`, `method`, `target`, `role`, `state`; metrics for `item_count`,
  `buyer_count` if wanted. Without these the params are collected but not reportable.
- Admin → Data collection → leave **Google signals OFF** (it would make GA4 data usable for
  ad personalization, which the privacy page does not describe).

## 6. Verify (production, after the deploy)

A test submission is real data. Use the **mail-in kit** form — it only alerts the owner.
Dismiss the test kit in /admin afterwards. Do not test through /sell: it contacts a real buyer.

1. **Tag Manager Preview.** Tag Manager → Preview → `https://cash4teststripsusa.com/mail-in-kit`.
   Walk the form. In Tag Assistant confirm, in order: `mail_kit_start`, `mail_kit_step` (2),
   `mail_kit_step` (3), `mail_kit_request` with an `event_id` UUID, and that "GA4 — site
   events" and "Meta — Lead (mail-in kit)" fired on it. Tap a phone link: `contact_click`.
   Confirm no dataLayer entry holds a phone, email or name.
2. **GA4 DebugView** (Admin → DebugView). Preview mode marks the session as debug; the same
   events appear with their params.
3. **Meta Test Events.** Events Manager → dataset → Test Events. Copy the test code into
   `META_CAPI_TEST_EVENT_CODE` in Vercel Production and redeploy. Open the site through the
   Test Events page's own "open website" box (that tags the browser half), submit a kit, and
   confirm **one** `Lead` marked as received from **Browser and Server** and
   **Deduplicated**. Two separate Leads = `eventID` is not reaching the pixel tag; recheck
   step 5, tag 5.
   The Test Events page resets its channel selection on reload — pick "Website" again before
   concluding nothing arrived.
4. **Remove `META_CAPI_TEST_EVENT_CODE`** and redeploy. Leaving it set keeps every real lead
   in the test stream.
5. **Opt-out.** Open `/privacy#do-not-sell`, press the button. After the reload, DevTools →
   Network shows no `gtm.js` request. Opt back in.

⛔ **A `200` from the Conversions API does not prove the events are usable.** Judge by Events
Manager, not the API response. On a new dataset the UI can lead the stats API by over an hour.

## How it works (for the next engineer)

- `lib/tracking-config.ts` — the only reader of the env vars (literal `process.env.NAME`),
  plus the forbidden-id list and the runtime guard. **Server only.**
- `lib/meta-capi.ts` — hashing (sha256 of normalized email; phone as 11 digits with the US
  country code), payload building, the 3-second send. Called as `reportLead()` from
  `app/api/leads`, `app/api/bulk-leads` and `app/api/mail-in` **after** the row is saved (and,
  for an emailed /sell request, after the buyer email succeeds). Never throws; a Meta outage
  never costs a lead. **Server only.**
- `lib/data-layer.ts` — the typed event list and `pushEvent()`. Reads no config; safe in the
  browser.
- `lib/tracking-consent.ts` — the rules for when tracking may run, shared by both halves.
- `app/components/TagManager.tsx` (server) → `GtmLoader.tsx` (client): renders nothing without
  `NEXT_PUBLIC_GTM_ID`; loads the container only on allowed pages; owns the delegated
  `contact_click` listener.
- Dedupe: the route generates `event_id` (UUID), sends it to the Conversions API, and returns it
  (`eventId` from /api/leads and /api/bulk-leads, `event_id` from /api/mail-in); the form pushes
  it with its dataLayer event; the Meta tag passes it as `eventID`.
