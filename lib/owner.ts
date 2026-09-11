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
