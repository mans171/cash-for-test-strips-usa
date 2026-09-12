/** Where enquiries that belong to the business itself are sent, as opposed to
 *  a matched buyer. Extracted 2026-09-07 when the bulk-seller form needed it —
 *  it was previously a private constant inside app/api/leads/route.ts, so a
 *  second caller would have duplicated the address. One definition. */
export const OWNER_EMAIL = 'feldon.richards@gmail.com'

/** The number printed on the bulk page and on every partner listing. */
export const OWNER_PHONE = '518-278-6008'

/** A reseller lot starts here. Competitors set 75-100 items PER MONTH;
 *  this is 100 pieces in a single lot, which is a lower bar deliberately. */
export const BULK_MIN_PIECES = 100

/** Addresses that land in the house inbox rather than a buyer's own.
 *  On 2026-09-12 every buyer record with no email of its own was set to
 *  sell@cash4teststripsusa.com, which forwards to OWNER_EMAIL. Without this
 *  list every state would look like it "routes to a buyer" and would cc the
 *  same inbox twice. See lib/bulk-routing.ts. */
export const HOUSE_EMAILS = [OWNER_EMAIL, 'sell@cash4teststripsusa.com'] as const
