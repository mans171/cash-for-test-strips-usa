# State Health Data — Sources and Regeneration

**Authored:** 2026-08-14
**Feeds:** `lib/state-health-data.ts`, `lib/blog-angles.ts`

These two files are generated. Do not hand-edit them — a hand edit will be lost
the next time either script runs, and worse, it breaks the guarantee that every
number on the site traces to a named public dataset.

---

## Why this exists

The 50 state blog posts were near-identical. Measured against the live site on
2026-08-13: each post carried ~5,900 characters of visible text, of which about
395 were unique — a single `intro` field. Alabama and Texas shared 5,509
characters verbatim. Pairwise similarity ran 93–97%.

The fix needed genuinely different material per state, and the only honest way
to get that is real data. Everything in `state-health-data.ts` is fetched from a
public source and carries its own vintage. Nothing is modelled, estimated or
invented, and a state with a missing figure renders a shorter page rather than a
padded one.

---

## Sources

### CDC PLACES — Local Data for Better Health

Diagnosed diabetes and uninsured rates, at city and county level, from BRFSS.

| Dataset | Socrata ID | Survey year | Used for |
|---|---|---|---|
| Place (city) data, 2025 release | `eav7-hnsx` | 2023 | City prevalence, 48 states |
| Place data, GIS format, 2024 release | `hbpe-6r8n` | 2022 | City prevalence, **KY and PA only** |
| County data, 2025 release | `swc5-untb` | 2023 | State rollups, 48 states |
| County data, 2024 release | `fu4u-a9bh` | 2022 | State rollups, **KY and PA only** |

Measures used: `DIABETES` (diagnosed diabetes among adults) and `ACCESS2` (lack
of health insurance, adults 18–64). Values are **crude prevalence** (`CrdPrv`),
not age-adjusted.

**The KY/PA gap is real and worth knowing about.** Kentucky and Pennsylvania are
absent from the 2025 PLACES release entirely — zero rows, not a query error.
That is exactly 120 + 67 = 187 counties. Both states fall back to the 2024
release, and every record carries `brfssYear` so each page cites its own vintage
rather than a blended claim. If a later PLACES release restores them, drop the
fallback and the year field will update itself.

State figures are **population-weighted rollups of the county readings**, weighted
by `totalpop18plus`. They are not published state figures. This is a derivation,
and it is why the rollup is labelled as such in the generated file's header.

### US Census Bureau — Population Estimates

`sc-est2024-agesex-civ.csv`, vintage 2024, civilian population. Used for
`seniorSharePct` (65+ share) and `population`.

**Note the Census API now requires a key**, but the bulk CSV under
`www2.census.gov/programs-surveys/popest/` does not. The scripts use the CSV
deliberately so regeneration needs no credentials.

### This project's own database

`zipCount` is a straight count of `zip_centroids` rows per state.

---

## Regenerating

```bash
cd scripts/seo-data

# 1. Fetch the source data into the working directory
curl -sL "https://data.cdc.gov/resource/swc5-untb.json?measureid=DIABETES&datavaluetypeid=CrdPrv&\$limit=5000&\$select=stateabbr,statedesc,locationid,locationname,data_value,low_confidence_limit,high_confidence_limit,totalpopulation,totalpop18plus,year" -o places_DIABETES.json
curl -sL "https://data.cdc.gov/resource/swc5-untb.json?measureid=ACCESS2&datavaluetypeid=CrdPrv&\$limit=5000&\$select=stateabbr,statedesc,locationid,locationname,data_value,low_confidence_limit,high_confidence_limit,totalpopulation,totalpop18plus,year" -o places_ACCESS2.json
curl -sL "https://data.cdc.gov/resource/eav7-hnsx.json?measureid=DIABETES&datavaluetypeid=CrdPrv&\$limit=50000&\$select=stateabbr,locationname,data_value,totalpopulation,totalpop18plus,year" -o places_city_DIABETES.json
# KY + PA fallbacks
curl -sL "https://data.cdc.gov/resource/fu4u-a9bh.json?measureid=DIABETES&datavaluetypeid=CrdPrv&\$where=stateabbr%20in('KY','PA')&\$limit=500&\$select=stateabbr,statedesc,locationid,locationname,data_value,low_confidence_limit,high_confidence_limit,totalpopulation,totalpop18plus,year" -o places24_DIABETES_kypa.json
curl -sL "https://data.cdc.gov/resource/fu4u-a9bh.json?measureid=ACCESS2&datavaluetypeid=CrdPrv&\$where=stateabbr%20in('KY','PA')&\$limit=500&\$select=stateabbr,statedesc,locationid,locationname,data_value,low_confidence_limit,high_confidence_limit,totalpopulation,totalpop18plus,year" -o places24_ACCESS2_kypa.json
curl -sL "https://data.cdc.gov/resource/hbpe-6r8n.json?\$where=stateabbr%20in('KY','PA')&\$limit=10000&\$select=stateabbr,locationname,diabetes_crudeprev,totalpopulation,totalpop18plus" -o places_city_kypa.json
curl -sL "https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/state/asrh/sc-est2024-agesex-civ.csv" -o popest.csv

# 2. Regenerate lib/state-health-data.ts
python3 build-state-health-data.py

# 3. Regenerate lib/blog-angles.ts  (needs buyers.json — see below)
python3 build-blog-angles.py

# 4. Verify
cd ../.. && npx vitest run lib/__tests__/blog-post-content.test.ts
```

`build-blog-angles.py` reads a `buyers.json` holding the active, non-mail-in
buyers with their `states` and lat/lng. Produce it from Supabase:

```sql
select slug, states, mail_in, lat, lng from companies where active;
```

`ZIP_COUNTS` in `build-state-health-data.py` is a literal snapshot. Refresh it if
`zip_centroids` changes materially:

```sql
select state, count(*) from zip_centroids group by state order by state;
```

---

## Why the angle map is frozen

`lib/blog-angles.ts` decides each post's **title**. If it were computed live,
adding one buyer or refreshing one dataset could re-title a dozen pages at once
and reset their search history. It is generated deliberately and committed.

Three angles are earned from data and assigned by rank — `estate` (largest 65+
share), `safe-mail-in` (zero-buyer states furthest from any buyer), and
`local-buyers` (buyer states with the largest populations). `ANGLE_RATIONALE`
records the reason for every state so the choice stays auditable.

The remaining seven are product and format angles assigned by rotation. **This is
deliberate and it is not a data claim.** All 24 CFTS-branded listings carry
identical `accepted_brands`, so no state's buyers accept a different set from any
other's. A product angle targets a different query — "sell Dexcom G6 sensors in
Iowa" is a different search from "sell test strips in Iowa" — and no page asserts
that one state's brand coverage differs.

**Regenerating angles re-titles pages.** Only do it when you intend that.

---

## Measuring duplication

Use `measure-duplication.py`, and use it rather than eyeballing. It builds the
site, strips scripts/styles/tags, normalises the state name out, and runs
`difflib.SequenceMatcher` over the visible text of all 1,225 post pairs. This is
the same method used to measure the state landing pages, kept identical so the
numbers stay comparable across both passes.

```bash
npm run build && python3 scripts/seo-data/measure-duplication.py
```

Baseline before this work (live site, 2026-08-13): mean ~95.5% across sampled
pairs, every post ~5,900 visible characters.
