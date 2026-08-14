#!/usr/bin/env python3
"""
Builds lib/state-health-data.ts for cash-for-test-strips-usa.

Every figure here is fetched from a public source and carried with its own
vintage year. Nothing is estimated, modelled, or invented. If a value is
missing for a state, the field is omitted so the consuming template can skip
the section rather than render a blank or a guess.

Sources
-------
CDC PLACES, Local Data for Better Health
  - Place (city) data, 2025 release  [eav7-hnsx]  -> BRFSS 2023
  - Place data, GIS format, 2024 release [hbpe-6r8n] -> BRFSS 2022  (KY + PA only;
    those two states are entirely absent from the 2025 release)
  - County data, 2025 release [swc5-untb] -> BRFSS 2023
  - County data, 2024 release [fu4u-a9bh] -> BRFSS 2022  (KY + PA only)
  Measures: DIABETES = diagnosed diabetes among adults;
            ACCESS2  = lack of health insurance, adults 18-64.
  Values are crude prevalence (CrdPrv).

US Census Bureau, Population Estimates Program
  - sc-est2024-agesex-civ.csv, vintage 2024 -> 65+ share of civilian population
"""
import csv
import re
import json
import collections

ABBR = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "District of Columbia": "DC", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI",
    "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
    "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
    "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
    "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI",
    "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX",
    "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}
NAME = {v: k for k, v in ABBR.items()}

ZIP_COUNTS = {
    "AK": 245, "AL": 656, "AR": 615, "AZ": 417, "CA": 1802, "CO": 527, "CT": 289,
    "DC": 57, "DE": 68, "FL": 1013, "GA": 751, "HI": 98, "IA": 970, "ID": 280,
    "IL": 1396, "IN": 807, "KS": 704, "KY": 780, "LA": 539, "MA": 539, "MD": 477,
    "ME": 426, "MI": 992, "MN": 881, "MO": 1035, "MS": 427, "MT": 369, "NC": 853,
    "ND": 388, "NE": 586, "NH": 247, "NJ": 598, "NM": 371, "NV": 181, "NY": 1825,
    "OH": 1233, "OK": 665, "OR": 428, "PA": 1833, "RI": 81, "SC": 424, "SD": 375,
    "TN": 636, "TX": 1989, "UT": 298, "VA": 903, "VT": 265, "WA": 605, "WI": 783,
    "WV": 738, "WY": 178,
}


def weighted(rows, value_key="data_value", pop_key="totalpop18plus"):
    """Population-weighted mean, returned with the population it was drawn from."""
    num = den = 0.0
    for r in rows:
        try:
            v = float(r[value_key]); p = float(r[pop_key])
        except (KeyError, TypeError, ValueError):
            continue
        num += v * p
        den += p
    return (num / den, int(den)) if den else (None, 0)


def load(path):
    with open(path) as fh:
        return json.load(fh)


# ---- county-level: state rollups -------------------------------------------
county_diab = collections.defaultdict(list)
county_unins = collections.defaultdict(list)
county_year = {}

for r in load("places_DIABETES.json"):
    county_diab[r["stateabbr"]].append(r)
    county_year[r["stateabbr"]] = r.get("year")
for r in load("places24_DIABETES_kypa.json"):
    county_diab[r["stateabbr"]].append(r)
    county_year[r["stateabbr"]] = r.get("year")

for r in load("places_ACCESS2.json"):
    county_unins[r["stateabbr"]].append(r)
for r in load("places24_ACCESS2_kypa.json"):
    county_unins[r["stateabbr"]].append(r)

# ---- city-level ------------------------------------------------------------
def clean_place(name):
    """
    Census place names carry qualifiers that read as errors in prose:
    "Butte-Silver Bow (balance)", "Nashville-Davidson metropolitan government
    (balance)". Strip the parenthetical and the government-form wording.
    """
    name = re.sub(r"\s*\([^)]*\)", "", name)
    name = re.sub(r"\s+(metropolitan|metro|consolidated|unified)\s+government.*$", "", name, flags=re.I)
    return name.strip()


cities = collections.defaultdict(list)
for r in load("places_city_DIABETES.json"):
    try:
        cities[r["stateabbr"]].append({
            "name": clean_place(r["locationname"]),
            "pop": int(r["totalpopulation"]),
            "diabetes": float(r["data_value"]),
            "year": int(r["year"]),
        })
    except (KeyError, TypeError, ValueError):
        continue
for r in load("places_city_kypa.json"):
    try:
        cities[r["stateabbr"]].append({
            "name": clean_place(r["locationname"]),
            "pop": int(r["totalpopulation"]),
            "diabetes": float(r["diabetes_crudeprev"]),
            "year": 2022,
        })
    except (KeyError, TypeError, ValueError):
        continue

# ---- 65+ share -------------------------------------------------------------
sen = collections.defaultdict(int)
tot = {}
for r in csv.DictReader(open("popest.csv")):
    if r["SUMLEV"] != "040" or r["SEX"] != "0":
        continue
    age = int(r["AGE"]); val = int(r["POPEST2024_CIV"]); name = r["NAME"]
    if age == 999:
        tot[name] = val
    elif age >= 65:
        sen[name] += val

senior_share = {}
state_pop = {}
for name, total in tot.items():
    ab = ABBR.get(name)
    if ab:
        senior_share[ab] = round(sen[name] / total * 100, 1)
        state_pop[ab] = total

# ---- assemble --------------------------------------------------------------
records = []
for ab in sorted(NAME):
    diab, adults = weighted(county_diab.get(ab, []))
    unins, _ = weighted(county_unins.get(ab, []))

    top = sorted(cities.get(ab, []), key=lambda c: -c["pop"])[:10]
    # Only cities with a real prevalence reading are useful to cite.
    top = [c for c in top if c["diabetes"] is not None]

    records.append({
        "code": ab,
        "name": NAME[ab],
        "diabetesPrevalence": round(diab, 1) if diab is not None else None,
        "uninsuredRate": round(unins, 1) if unins is not None else None,
        "seniorSharePct": senior_share.get(ab),
        "population": state_pop.get(ab),
        "adultsMeasured": adults or None,
        "zipCount": ZIP_COUNTS.get(ab),
        "brfssYear": int(county_year.get(ab)) if county_year.get(ab) else None,
        "cities": top,
    })

missing = [r["code"] for r in records if r["diabetesPrevalence"] is None or not r["cities"]]
print("records:", len(records), "| incomplete:", missing or "none")

hi = max(records, key=lambda r: r["diabetesPrevalence"])
lo = min(records, key=lambda r: r["diabetesPrevalence"])
print(f"diabetes range: {lo['code']} {lo['diabetesPrevalence']}% .. {hi['code']} {hi['diabetesPrevalence']}%")

# ---- emit TypeScript -------------------------------------------------------
def ts_num(v):
    return "null" if v is None else repr(v)


lines = [
    "/**",
    " * Per-state public-health and population figures, used to give each state's",
    " * blog post and landing page genuinely different substance rather than the",
    " * same template with a swapped noun.",
    " *",
    " * GENERATED FILE — do not hand-edit. Regenerate with the script recorded in",
    " * docs/seo/state-health-data-sources.md.",
    " *",
    " * Every number below comes from a named public dataset and carries its own",
    " * vintage. Nothing here is modelled or estimated. A null means the source had",
    " * no reading for that state; callers must omit the sentence rather than",
    " * substitute a guess.",
    " *",
    " * Sources:",
    " *   diabetesPrevalence, cities[].diabetes, uninsuredRate",
    " *     CDC PLACES (BRFSS), crude prevalence among adults.",
    " *     2025 release for 48 states; 2024 release for KY and PA, which are",
    " *     absent from the 2025 release. Each record's brfssYear states which.",
    " *     State figures are population-weighted rollups of the county readings.",
    " *   seniorSharePct, population",
    " *     US Census Bureau Population Estimates, vintage 2024 (civilian).",
    " *   zipCount",
    " *     Count of rows in this project's own zip_centroids table.",
    " */",
    "",
    "export type StateCity = {",
    "  name: string",
    "  pop: number",
    "  /** Diagnosed diabetes among adults, crude prevalence %, CDC PLACES. */",
    "  diabetes: number",
    "  year: number",
    "}",
    "",
    "export type StateHealthData = {",
    "  code: string",
    "  name: string",
    "  /** Population-weighted diagnosed-diabetes prevalence, adults, %. */",
    "  diabetesPrevalence: number | null",
    "  /** Population-weighted uninsured rate, adults 18-64, %. */",
    "  uninsuredRate: number | null",
    "  /** Share of civilian population aged 65+, %. */",
    "  seniorSharePct: number | null",
    "  population: number | null",
    "  /** Adult population the prevalence rollup was weighted across. */",
    "  adultsMeasured: number | null",
    "  /** ZIP codes in this state, from zip_centroids. */",
    "  zipCount: number | null",
    "  /** BRFSS survey year behind this state's prevalence figures. */",
    "  brfssYear: number | null",
    "  /** Largest cities by population, each with its own prevalence reading. */",
    "  cities: StateCity[]",
    "}",
    "",
    "export const STATE_HEALTH_DATA: Record<string, StateHealthData> = {",
]

for r in records:
    lines.append(f'  {r["code"]}: {{')
    lines.append(f'    code: "{r["code"]}",')
    lines.append(f'    name: "{r["name"]}",')
    lines.append(f'    diabetesPrevalence: {ts_num(r["diabetesPrevalence"])},')
    lines.append(f'    uninsuredRate: {ts_num(r["uninsuredRate"])},')
    lines.append(f'    seniorSharePct: {ts_num(r["seniorSharePct"])},')
    lines.append(f'    population: {ts_num(r["population"])},')
    lines.append(f'    adultsMeasured: {ts_num(r["adultsMeasured"])},')
    lines.append(f'    zipCount: {ts_num(r["zipCount"])},')
    lines.append(f'    brfssYear: {ts_num(r["brfssYear"])},')
    lines.append("    cities: [")
    for c in r["cities"]:
        nm = c["name"].replace('"', '\\"')
        lines.append(
            f'      {{ name: "{nm}", pop: {c["pop"]}, '
            f'diabetes: {c["diabetes"]}, year: {c["year"]} }},'
        )
    lines.append("    ],")
    lines.append("  },")

lines.append("}")
lines.append("")
lines.append("export const ALL_STATE_HEALTH = Object.values(STATE_HEALTH_DATA)")
lines.append("")

out = "/Users/feldonrichards/code/cash-for-test-strips-usa/lib/state-health-data.ts"
with open(out, "w") as fh:
    fh.write("\n".join(lines))
print("wrote", out, f"({len(lines)} lines)")
