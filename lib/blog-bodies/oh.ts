import type { PostBody } from "./types"

/**
 * Ohio — one listed buyer, Toledo, which also covers Detroit. The state has
 * the sharpest intra-state spread of any of the large states: Lorain 18.5%,
 * Cleveland 17.7%, Dayton 17.6%, Canton 17.1%, Akron 16.5%, against Columbus
 * at 11.8%. That is the story, and it is a genuinely different one from the
 * "where are the buyers" framing used in the other big states.
 */
export const OH: PostBody = {
  label: "Where the need is",
  title: "Selling Diabetic Test Strips in Ohio: One Buyer, and a Very Uneven State",
  heading: "Selling Diabetic Test Strips in Ohio",
  metaDescription:
    "Ohio's diabetes rate runs from 11.8% in Columbus to 18.5% in Lorain. One in-person buyer, in Toledo. What sealed supplies are worth, and the two expired items worth keeping.",

  lead: [
    "Ohio has one in-person buyer on this directory, in Toledo, which also serves Detroit across the border. Cleveland, Columbus, Cincinnati, Akron, Dayton and Canton have none.",
    "That is worth stating plainly, because Ohio is also a state where the need is unusually concentrated — and it is concentrated in exactly the cities that have no buyer nearby.",
  ],

  sections: [
    {
      heading: "Ohio is not one state for this",
      paragraphs: [
        "13.2% of Ohio adults have diagnosed diabetes, according to the CDC's 2023 BRFSS estimates, against a national rate of 12.1%. On its own that is unremarkable.",
        "The city figures are not. Lorain reads 18.5%, Cleveland 17.7%, Dayton 17.6%, Canton 17.1% and Akron 16.5%. Columbus reads 11.8%. That is a spread of nearly seven points inside one state, and it is the widest of any large state in the country.",
        "Those higher figures are among the highest of any city in the United States. It tracks the difference between the older manufacturing cities along the lake and the Miami Valley, and a state capital with a large university and a younger population.",
        "For anyone holding unused supplies, what that means practically is simple: in most of Ohio there are people nearby who need what you are holding, and there is nowhere obvious to take it.",
      ],
    },
    {
      heading: "Where you can hand supplies over",
      paragraphs: [
        "Toledo is the one in-person option, and it covers the north-west corner of the state plus the Detroit area. If you are in Toledo, Bowling Green, or up toward the Michigan line, that is a normal drive.",
        "From Cleveland, Toledo is about 115 miles. From Columbus, roughly 145. From Cincinnati, closer to 200. Those are real drives, and for a handful of boxes none of them make sense against a prepaid label that costs you nothing.",
        "For a large lot the arithmetic changes and it can be worth the trip. That is worth asking about when you get the quote rather than deciding in advance.",
        "Everywhere else in the state's 1,233 ZIP codes, mail-in is the route, and payment goes out within 24 hours of the parcel being received and verified.",
      ],
    },
    {
      heading: "The two expired things worth keeping",
      paragraphs: [
        "The near-universal advice is that expired supplies are worthless. For test strips that is correct — a degraded strip gives an inaccurate reading, and that is a safety problem, not a discount.",
        "Two exceptions. Expired Omnipod pods — 5, DASH and Classic — still have value, and so do expired Dexcom G7 sensors. Both at a reduced rate rather than nothing at all.",
        "Expired Dexcom G6 sensors do not qualify. Nothing else does either. But those two are thrown away constantly on the strength of advice that does not apply to them, so check before the bin.",
      ],
    },
    {
      heading: "What has to be true before a box is worth anything",
      paragraphs: [
        "It has to be factory-sealed and unopened, in original packaging. An opened box is finished whatever is left inside it, because nobody downstream can verify how it was stored. This is the most common reason a parcel gets refused.",
        "It cannot have come through Medicare or Medicaid. Supplies paid for by those programmes cannot legally be resold. Private insurance or paid for yourself is fine, and a pharmacy label with your name on it changes nothing.",
        "For test strips, at least six months should remain before the expiry date. Below that the value falls off quickly.",
        "Box count is worth checking before you write off a small stack — a 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
      ],
    },
    {
      heading: "Shipping from Ohio without getting burned",
      paragraphs: [
        "Get the number in writing before anything leaves the house. Not a range, not an \"up to\" figure — the actual number for what you actually have, based on brand, count and dates. A buyer who will not commit before the parcel ships intends to revise afterwards, when you have no leverage.",
        "Use the prepaid label and keep the tracking number. Payment runs from receipt and verification, so tracking is what puts a date on that.",
        "Photograph the sealed boxes with dates and lot numbers visible. Do not open anything to photograph the contents — opening a box destroys the thing that made it worth money.",
        "If a quote is revised after arrival, ask for the specific reason and photographs of what was received. A legitimate revision has a concrete cause: a seal broken in transit, a misread date, a count that differs from what was described. A vague one is a renegotiation, and you can ask for the supplies back instead.",
      ],
    },
    {
      heading: "Who tends to be selling",
      paragraphs: [
        "19.1% of Ohioans are 65 or over, and that is where most of what gets sold originates — a prescription changed, someone moved into care, or a family is clearing a house and finds a cupboard nobody knew about.",
        "8.0% of working-age Ohioans have no health insurance, which is close to the national middle. Ohio's resale demand is driven less by that than by the sheer concentration of diagnosed diabetes in the older industrial cities, where a great many people are managing the condition on tight budgets whether insured or not.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there a buyer in Cleveland or Columbus?",
      a: "Not on this directory. Toledo is the only in-person buyer listed in Ohio. Cleveland is about 115 miles from it and Columbus about 145, so for most of the state mail-in with a prepaid label is the practical route.",
    },
    {
      q: "Why is the diabetes rate so different across Ohio?",
      a: "Lorain reads 18.5% and Cleveland 17.7% against 11.8% in Columbus — a near seven-point spread, the widest of any large state. It tracks the difference between the older manufacturing cities and a younger state capital, and it reflects age, income and insurance coverage rather than geography.",
    },
    {
      q: "Do you buy expired Dexcom sensors?",
      a: "Expired G7 sensors, yes, at a reduced rate. Expired G6 sensors, no. Sealed in-date G6 sensors, transmitters, G7 sensors and receivers are all bought normally.",
    },
    {
      q: "My supplies came through Medicaid. Can I sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold. Anything you received through private insurance or paid for yourself is fine.",
    },
    {
      q: "Is it worth driving to Toledo from Cincinnati?",
      a: "For a few boxes, no — that is roughly 200 miles each way against a prepaid label that costs you nothing. For a large lot the numbers can justify it. Get the quote first and decide from the real figure.",
    },
    {
      q: "I have a mixed pile from clearing a relative's house. Does that complicate things?",
      a: "No, and it is one of the most common cases. Mixed lots are quoted as one lot rather than item by item, and quantity improves the per-box rate — ten or more boxes generally does better than the same boxes sold separately.",
    },
  ],
}
