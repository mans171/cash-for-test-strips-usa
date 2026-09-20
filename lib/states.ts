export const STATE_LABELS: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  CANADA: "Canada",
}

export const VALID_STATE_CODES = new Set(Object.keys(STATE_LABELS))

// Where a mail-in seller can ship FROM: the 50 states plus the District of
// Columbia, and never the CANADA pseudo-code. This is deliberately a separate
// list — STATE_LABELS drives the state pages, the sitemap and the directory,
// and DC has no state page, so it must not be added there.
export const MAIL_IN_STATE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries({ ...STATE_LABELS, DC: "District of Columbia" })
    .filter(([code]) => code !== "CANADA")
    .sort(([, a], [, b]) => a.localeCompare(b)),
)

export const MAIL_IN_STATE_CODES = new Set(Object.keys(MAIL_IN_STATE_LABELS))
