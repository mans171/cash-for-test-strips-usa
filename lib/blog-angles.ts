/**
 * Content angle per state blog post.
 *
 * GENERATED FILE — do not hand-edit. See docs/seo/state-health-data-sources.md.
 *
 * The angle decides each post's title, lead section, and FAQ set, so that the
 * 51 posts target different queries instead of repeating one template with the
 * state name swapped through it.
 *
 * Frozen deliberately: titles that changed whenever a buyer was added or a
 * dataset refreshed would keep resetting each page's search history.
 * Regenerate only when you intend titles to move.
 *
 * 'estate', 'safe-mail-in' and 'local-buyers' are earned from data and assigned
 * by rank. The rest are product and format angles assigned by rotation: every
 * listed buyer accepts the same seven brands, so a product angle targets a
 * different query, it does not assert that one state's buyers differ.
 */

export type PostAngle =
  | "local-buyers"
  | "safe-mail-in"
  | "estate"
  | "dexcom"
  | "libre"
  | "omnipod"
  | "meter-brands"
  | "expired"
  | "bulk"
  | "worth"

/** Why each state carries the angle it does. Kept so the choice is auditable. */
export const ANGLE_RATIONALE: Record<string, string> = {
  AK: "no in-state buyer; nearest is 1642 miles from the state's centre",
  AL: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  AR: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  AZ: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  CA: "has in-state buyers and one of the largest populations among them",
  CO: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  CT: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  DC: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  DE: "21.8% of residents are 65+, among the highest in the country",
  FL: "21.8% of residents are 65+, among the highest in the country",
  GA: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  HI: "22.1% of residents are 65+, among the highest in the country",
  IA: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  ID: "no in-state buyer; nearest is 394 miles from the state's centre",
  IL: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  IN: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  KS: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  KY: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  LA: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  MA: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  MD: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  ME: "23.5% of residents are 65+, among the highest in the country",
  MI: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  MN: "no in-state buyer; nearest is 446 miles from the state's centre",
  MO: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  MS: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  MT: "no in-state buyer; nearest is 566 miles from the state's centre",
  NC: "has in-state buyers and one of the largest populations among them",
  ND: "no in-state buyer; nearest is 600 miles from the state's centre",
  NE: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  NH: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  NJ: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  NM: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  NV: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  NY: "has in-state buyers and one of the largest populations among them",
  OH: "has in-state buyers and one of the largest populations among them",
  OK: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  OR: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  PA: "has in-state buyers and one of the largest populations among them",
  RI: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  SC: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  SD: "no in-state buyer; nearest is 428 miles from the state's centre",
  TN: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  TX: "has in-state buyers and one of the largest populations among them",
  UT: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  VA: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  VT: "22.8% of residents are 65+, among the highest in the country",
  WA: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  WI: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
  WV: "21.9% of residents are 65+, among the highest in the country",
  WY: "rotation; all listed buyers accept the same brands, so this is a query-targeting choice",
}

export const STATE_ANGLES: Record<string, PostAngle> = {
  AK: "safe-mail-in",
  AL: "dexcom",
  AR: "libre",
  AZ: "omnipod",
  CA: "local-buyers",
  CO: "meter-brands",
  CT: "expired",
  DC: "bulk",
  DE: "estate",
  FL: "estate",
  GA: "worth",
  HI: "estate",
  IA: "dexcom",
  ID: "safe-mail-in",
  IL: "libre",
  IN: "omnipod",
  KS: "meter-brands",
  KY: "expired",
  LA: "bulk",
  MA: "worth",
  MD: "dexcom",
  ME: "estate",
  MI: "libre",
  MN: "safe-mail-in",
  MO: "omnipod",
  MS: "meter-brands",
  MT: "safe-mail-in",
  NC: "local-buyers",
  ND: "safe-mail-in",
  NE: "expired",
  NH: "bulk",
  NJ: "worth",
  NM: "dexcom",
  NV: "libre",
  NY: "local-buyers",
  OH: "local-buyers",
  OK: "omnipod",
  OR: "meter-brands",
  PA: "local-buyers",
  RI: "expired",
  SC: "bulk",
  SD: "safe-mail-in",
  TN: "worth",
  TX: "local-buyers",
  UT: "dexcom",
  VA: "libre",
  VT: "estate",
  WA: "omnipod",
  WI: "meter-brands",
  WV: "estate",
  WY: "expired",
}
