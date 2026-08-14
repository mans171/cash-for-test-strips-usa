#!/usr/bin/env python3
"""
Assigns each state blog post a content angle and emits lib/blog-angles.ts.

Why this is frozen rather than computed at render time: the angle decides the
page title. Titles that churn whenever a buyer is added or a dataset refreshes
would repeatedly reset each page's search history. Regenerate deliberately.

Three angles are *earned* from data and assigned by rank:
  estate       - the states with the largest 65+ population share
  safe-mail-in - zero-buyer states, furthest from any buyer, where mail-in is
                 the only honest framing
  local-buyers - buyer states with the largest populations

The rest are product and format angles. Every listed buyer accepts the same
seven brands, so a product angle is a query-targeting choice, not a claim that
one state's buyers differ from another's. Assignment is round-robin over states
sorted by code so it is deterministic and reproducible.
"""
import json
import re
import math

REPO = "/Users/feldonrichards/code/cash-for-test-strips-usa"

health = {}
src = open(f"{REPO}/lib/state-health-data.ts").read()
for m in re.finditer(r"\n  ([A-Z]{2}): \{(.*?)\n  \},", src, re.S):
    code, body = m.group(1), m.group(2)
    def g(k):
        mm = re.search(rf"{k}: ([^,\n]+)", body)
        v = mm.group(1)
        return None if v == "null" else float(v)
    health[code] = {
        "senior": g("seniorSharePct"),
        "pop": g("population"),
        "diabetes": g("diabetesPrevalence"),
    }

# State centroids, reused from the module the state-page fix already ships.
cent = {}
csrc = re.search(r"STATE_CENTROIDS: Record<string, LatLng> = \{(.*?)\n\}", src if False else open(f"{REPO}/lib/state-geo.ts").read(), re.S).group(1)
for m in re.finditer(r"(\w{2}):\s*\{\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)\s*\}", csrc):
    cent[m.group(1)] = (float(m.group(2)), float(m.group(3)))

BUYERS = json.load(open("buyers.json"))
buyer_states = set()
buyer_pts = []
for b in BUYERS:
    if b.get("mail_in"):
        continue
    for s in b.get("states") or []:
        buyer_states.add(s)
    if b.get("lat") is not None:
        buyer_pts.append((b["lat"], b["lng"]))

print("states with an in-state buyer:", len(buyer_states), sorted(buyer_states))


def haversine(a, b):
    R = 3958.7613
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp = p2 - p1
    dl = math.radians(b[1] - a[1])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


ALL = sorted(health)
no_buyer = [s for s in ALL if s not in buyer_states]
has_buyer = [s for s in ALL if s in buyer_states]

dist_to_buyer = {}
for s in no_buyer:
    if s in cent and buyer_pts:
        dist_to_buyer[s] = min(haversine(cent[s], p) for p in buyer_pts)

assigned = {}
reason = {}

# 1. estate — earned by 65+ share
for s in sorted(ALL, key=lambda x: -(health[x]["senior"] or 0))[:6]:
    assigned[s] = "estate"
    reason[s] = f"{health[s]['senior']}% of residents are 65+, among the highest in the country"

# 2. safe-mail-in — earned by remoteness from any buyer
remote = sorted((s for s in no_buyer if s not in assigned),
                key=lambda x: -dist_to_buyer.get(x, 0))[:6]
for s in remote:
    assigned[s] = "safe-mail-in"
    reason[s] = f"no in-state buyer; nearest is {round(dist_to_buyer[s])} miles from the state's centre"

# 3. local-buyers — earned by having in-state buyers, largest populations first
for s in sorted((x for x in has_buyer if x not in assigned),
                key=lambda x: -(health[x]["pop"] or 0))[:6]:
    assigned[s] = "local-buyers"
    reason[s] = "has in-state buyers and one of the largest populations among them"

# 4. remaining — deterministic round robin over product and format angles
ROTATION = ["dexcom", "libre", "omnipod", "meter-brands", "expired", "bulk", "worth"]
rest = [s for s in ALL if s not in assigned]
for i, s in enumerate(rest):
    assigned[s] = ROTATION[i % len(ROTATION)]
    reason[s] = "rotation; all listed buyers accept the same brands, so this is a query-targeting choice"

from collections import Counter
print("angle spread:", dict(Counter(assigned.values())))
assert len(assigned) == len(ALL), (len(assigned), len(ALL))

lines = [
    "/**",
    " * Content angle per state blog post.",
    " *",
    " * GENERATED FILE — do not hand-edit. See docs/seo/state-health-data-sources.md.",
    " *",
    " * The angle decides each post's title, lead section, and FAQ set, so that the",
    " * 51 posts target different queries instead of repeating one template with the",
    " * state name swapped through it.",
    " *",
    " * Frozen deliberately: titles that changed whenever a buyer was added or a",
    " * dataset refreshed would keep resetting each page's search history.",
    " * Regenerate only when you intend titles to move.",
    " *",
    " * 'estate', 'safe-mail-in' and 'local-buyers' are earned from data and assigned",
    " * by rank. The rest are product and format angles assigned by rotation: every",
    " * listed buyer accepts the same seven brands, so a product angle targets a",
    " * different query, it does not assert that one state's buyers differ.",
    " */",
    "",
    "export type PostAngle =",
    "  | \"local-buyers\"",
    "  | \"safe-mail-in\"",
    "  | \"estate\"",
    "  | \"dexcom\"",
    "  | \"libre\"",
    "  | \"omnipod\"",
    "  | \"meter-brands\"",
    "  | \"expired\"",
    "  | \"bulk\"",
    "  | \"worth\"",
    "",
    "/** Why each state carries the angle it does. Kept so the choice is auditable. */",
    "export const ANGLE_RATIONALE: Record<string, string> = {",
]
for s in ALL:
    lines.append(f'  {s}: "{reason[s]}",')
lines += ["}", "", "export const STATE_ANGLES: Record<string, PostAngle> = {"]
for s in ALL:
    lines.append(f'  {s}: "{assigned[s]}",')
lines += ["}", ""]

out = f"{REPO}/lib/blog-angles.ts"
open(out, "w").write("\n".join(lines))
print("wrote", out)
for s in ["ME", "MT", "TX", "NY", "CA", "WV", "AK", "HI"]:
    print(f"  {s}: {assigned[s]:<13} — {reason[s]}")
