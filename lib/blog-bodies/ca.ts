import type { PostBody } from "./types"

/**
 * California — buyers in Sacramento and San Diego, none in Los Angeles, which
 * is the largest city in the country by some distance after New York. Saying
 * that plainly is the most useful thing this page can do for an LA reader, and
 * no competitor page will do it.
 *
 * California is also where the Libre "US retail versions only" rule bites
 * hardest, because cross-border purchases in San Diego are common. That is a
 * genuinely local, genuinely useful warning.
 */
export const CA: PostBody = {
  title: "Selling Diabetic Test Strips in California: Sacramento, San Diego, and the LA Gap",
  heading: "Selling Diabetic Test Strips in California",
  metaDescription:
    "California has in-person buyers in Sacramento and San Diego — and none in Los Angeles. Where coverage is, why Libre sensors bought in Tijuana can't be resold, and the two expired items worth keeping.",

  lead: [
    "California has buyers listed in Sacramento and San Diego. It does not have one in Los Angeles, which is the largest city in the state and by a wide margin the one where most unused supplies are sitting in cupboards.",
    "That is an awkward thing for a directory to say about its own coverage, but it is the useful thing. If you are in LA, Orange County or the Inland Empire, you are shipping — and the label costs you nothing, so it is less of a problem than it sounds.",
  ],

  sections: [
    {
      heading: "Where in California you can hand supplies over",
      paragraphs: [
        "Sacramento covers the Central Valley's northern end and the greater Sacramento area. San Diego covers the far south of the state. Between them is most of California's population and no listed in-person buyer.",
        "San Jose, San Francisco, Oakland, Fresno, Bakersfield, Long Beach and Anaheim have no in-person buyer on this directory. Long Beach and Anaheim are near enough to nothing that helps; San Diego is roughly a two-hour drive from Anaheim, which is a real drive for a small lot and a reasonable one for a large one.",
        "Everywhere else, mail-in with a prepaid label is the route, and it reaches all 1,802 of California's ZIP codes at the same cost to you: nothing.",
      ],
    },
    {
      heading: "The Libre rule that catches California sellers specifically",
      paragraphs: [
        "We buy sealed FreeStyle Libre 1, 2 and 3 sensors — but US retail versions only. Sensors bought outside the United States cannot be resold here, regardless of condition, seal or expiry date.",
        "This matters more in California than almost anywhere else. Buying diabetes supplies across the border in Tijuana is common and entirely legal for personal use, and people are often surprised to learn that the same sealed box cannot then be resold in the US.",
        "It is not a judgement about the product — it is about what can lawfully re-enter the US retail supply chain. If your Libre sensors came from a pharmacy in Mexico, they are not sellable here. Check the box before you package anything up, because it saves a wasted parcel and an awkward conversation.",
        "The same principle applies to any supplies sourced abroad, not only Libre.",
      ],
    },
    {
      heading: "The two expired things worth keeping",
      paragraphs: [
        "The standard advice everywhere is that expired supplies have no resale value. For test strips that is correct — a degraded strip gives an inaccurate reading, which is a safety problem rather than a bargain, and nobody should be trading them.",
        "Two exceptions. Expired Omnipod pods — 5, DASH and Classic — still have value, and so do expired Dexcom G7 sensors. Both pay at a reduced rate rather than nothing.",
        "Expired Dexcom G6 sensors do not qualify. Nothing else does either. But those two are the ones most reliably thrown away on the strength of advice that does not apply to them.",
      ],
    },
    {
      heading: "What makes a box sellable",
      paragraphs: [
        "Factory-sealed and unopened, in original packaging. An opened box cannot be resold at any price, because nobody downstream can verify how it was stored — and this is the most common reason a parcel gets refused.",
        "Not obtained through Medicare or Medi-Cal. Supplies paid for by those programmes cannot legally be resold. Private insurance or out of pocket is fine, and a pharmacy label with your name on it makes no difference.",
        "For test strips, at least six months before the expiry date. Below that, value falls off quickly.",
        "Box count is worth checking. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand, so a small-looking stack can be worth more than you would guess.",
      ],
    },
    {
      heading: "California's numbers are not one number",
      paragraphs: [
        "11.7% of California adults have diagnosed diabetes, according to the CDC's 2023 BRFSS estimates — a shade below the national rate of 12.1%.",
        "The state average conceals a wide spread. Fresno reads 12.7% and Bakersfield 12.4%, against 9.2% in San Diego and 9.7% in San Francisco. The Central Valley carries a noticeably heavier burden than the coastal cities, and it also has less in the way of nearby buyers.",
        "10.6% of working-age Californians have no health insurance. That is the demand side — for someone uninsured, retail is the only price, and retail on test strips is punishing. Sealed boxes that would otherwise be binned tend to find a use quickly.",
      ],
    },
    {
      heading: "Shipping from California without getting burned",
      paragraphs: [
        "Get the number in writing before anything ships. Not a range, not an \"up to\" figure — the actual number for what you actually have. A buyer who will not commit before the parcel leaves is one who intends to revise afterwards, when you have no leverage left.",
        "Use the prepaid label and keep the tracking number. Payment runs from when the parcel is received and verified, so the tracking is what puts a date on that.",
        "Photograph the sealed boxes with dates and lot numbers visible before they go. Do not open anything to photograph the contents — opening a box destroys the thing that gave it value.",
        "If a quote changes after arrival, ask for the specific reason and for photographs of what was received. A legitimate revision has a concrete cause. A vague one is a renegotiation, and you can ask for the supplies back instead.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there a buyer in Los Angeles?",
      a: "Not on this directory. Sacramento and San Diego have in-person buyers listed; Los Angeles does not. From LA, mail-in with a prepaid label is the realistic route and costs you nothing.",
    },
    {
      q: "I bought my Libre sensors in Mexico. Can I sell them?",
      a: "No. We buy US retail versions only, so sensors bought abroad cannot be resold here regardless of condition or expiry date. This comes up regularly in San Diego — check the box before packing anything.",
    },
    {
      q: "Do you buy expired Omnipod pods in California?",
      a: "Yes, at a reduced rate — Omnipod 5, DASH and Classic. Expired Dexcom G7 sensors too. Those are the only two exceptions; everything else has to be in date.",
    },
    {
      q: "My supplies came through Medi-Cal. Can I sell them?",
      a: "No. Medi-Cal is California's Medicaid programme, and supplies obtained through Medicare or Medicaid cannot be resold. Anything you got through private insurance or paid for yourself is fine.",
    },
    {
      q: "Is San Diego worth driving to from Orange County?",
      a: "For a handful of boxes, probably not — mail-in costs you nothing and takes the drive out of it. For a large lot the numbers change and it can be worth it. Ask when you get the quote and decide from the actual figure.",
    },
    {
      q: "I have boxes from several brands and a few different types. Does that complicate the sale?",
      a: "No. Mixed lots are quoted as a single lot rather than item by item, and quantity improves the per-box rate. Ten or more boxes generally does better than the same boxes sold piecemeal.",
    },
  ],
}
