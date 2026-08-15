import type { PostBody } from "./types"

/**
 * Michigan — Detroit 19.2% against Ann Arbor 6.4% is a 12.8-point gap, and
 * checked against every other state it is the widest intra-state city spread in
 * the country. Two cities forty miles apart, one with three times the rate of
 * the other. That is the page.
 *
 * Coverage: the Toledo buyer serves the Detroit area across the state line.
 * That is the only in-person option and it only helps the south-east corner.
 */
export const MI: PostBody = {
  label: "Widest gap in the US",
  title: "Selling Diabetic Test Strips in Michigan: Detroit, Ann Arbor, and 40 Miles",
  heading: "Selling Diabetic Test Strips in Michigan",
  metaDescription:
    "Detroit's diabetes rate is 19.2%. Ann Arbor, forty miles away, is 6.4% — the widest gap between two cities in any US state. What sealed supplies are worth, and where you can sell them.",

  lead: [
    "Detroit and Ann Arbor are about forty miles apart. In Detroit, 19.2% of adults have diagnosed diabetes. In Ann Arbor, 6.4%. Checked against every state in the country, that is the widest gap between two cities anywhere in America.",
    "Three times the rate, forty minutes down I-94. It is the single most useful thing to understand about selling diabetic supplies in Michigan, because it tells you exactly where what you are holding is needed.",
  ],

  sections: [
    {
      heading: "What a 12.8-point gap actually means",
      paragraphs: [
        "Statewide Michigan reads 11.9%, a shade under the national rate of 12.1%. That number describes almost nobody in Michigan.",
        "Detroit at 19.2% is close to one adult in five. Ann Arbor at 6.4% is close to one in sixteen. Warren sits at 12.5%, Lansing 12.4%, Grand Rapids 10.4%, Livonia 9.9%. The state is not one market and never has been.",
        "The gap follows income, insurance and food access rather than geography — a university town against a city that lost its industrial base. Only 6.9% of working-age Michiganders have no health insurance, which is low, and the Detroit figure is high anyway. Insurance coverage is not the whole story here.",
        "For someone with a cupboard of unused supplies, the practical version is short: what you are holding has a use, and it has one close by.",
      ],
    },
    {
      heading: "Where you can hand supplies over",
      paragraphs: [
        "There is one in-person option covering Michigan, and it operates out of Toledo just over the Ohio line, serving the Detroit area as well.",
        "If you are in Detroit, Dearborn, Warren, Ann Arbor or anywhere in the south-east corner, that is a normal drive and an in-person handover with same-day cash is realistic.",
        "Grand Rapids is roughly 200 miles from it. Traverse City is further. The Upper Peninsula is a different proposition entirely — Marquette to Toledo is the better part of a day. For most of the state north or west of Lansing, mail-in is the honest answer, and a prepaid label costs you nothing across all 992 of Michigan's ZIP codes.",
      ],
    },
    {
      heading: "The two expired things worth keeping",
      paragraphs: [
        "The standard advice everywhere is that expired supplies are worthless. For test strips that is right — a degraded strip gives an inaccurate reading, and an inaccurate glucose reading is a safety problem rather than a bargain.",
        "Two exceptions, and they are the two most reliably thrown away. Expired Omnipod pods — 5, DASH and Classic — still have value. So do expired Dexcom G7 sensors. Both at a reduced rate rather than nothing.",
        "Expired Dexcom G6 sensors do not qualify, and nor does anything else. But before a clear-out goes in the bin, those two are worth pulling out.",
      ],
    },
    {
      heading: "What makes a box sellable",
      paragraphs: [
        "Factory-sealed and unopened, in the original packaging. An opened box cannot be resold at any price, because nobody downstream can verify how it was stored. This is the most common reason a parcel gets refused or a settled price gets reopened.",
        "Not obtained through Medicare or Medicaid. Supplies paid for by those programmes cannot legally be resold. Private insurance or paid for yourself is fine, and a pharmacy label carrying your name makes no difference.",
        "For test strips, at least six months before the expiry date. Below that the value falls off quickly, because whoever ends up using them needs time to work through the box.",
        "Check the count before writing off a small stack. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
      ],
    },
    {
      heading: "Posting from the rest of Michigan",
      paragraphs: [
        "Get the number in writing before anything ships — the actual figure for what you actually have, not a range and not an \"up to\". A buyer who will not commit before your parcel leaves intends to revise once it has arrived, and by then you have no leverage.",
        "Use the prepaid label and keep the tracking number. Payment runs from when the parcel is received and verified, so the tracking is what starts that clock. From the Upper Peninsula, allow an extra day or two in transit.",
        "Photograph the sealed boxes with dates and lot numbers visible before they go. Do not open a box to photograph the contents — opening it destroys the thing that made it worth money.",
        "If the quote changes after arrival, ask for the specific reason and photographs of what was received. Legitimate revisions have concrete causes. A vague one is a renegotiation, and you can ask for the supplies back instead.",
      ],
    },
    {
      heading: "Who usually ends up selling",
      paragraphs: [
        "19.6% of Michiganders are 65 or over, and that is where most unused supplies originate — a prescription changed, someone moved into care, or a family clearing a house finds a cupboard nobody knew about.",
        "It is rarely somebody who set out to sell diabetic supplies. Most people arrive at this having already decided the alternative is throwing them away.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there a buyer in Detroit?",
      a: "The nearest in-person buyer operates from Toledo, just over the Ohio line, and covers the Detroit area. For the south-east corner of the state that is a normal drive. From Grand Rapids or further north, mail-in is more practical.",
    },
    {
      q: "Why is Detroit's diabetes rate so much higher than Ann Arbor's?",
      a: "Detroit reads 19.2% and Ann Arbor 6.4% — a 12.8-point gap and the widest between two cities in any state in the country. It tracks income, insurance and food access rather than distance; the two are only about forty miles apart.",
    },
    {
      q: "I'm in the Upper Peninsula. Is this worth doing at all?",
      a: "Yes — shipping costs you nothing regardless of where you post from, and the label is prepaid. Allow an extra day or two in transit, then payment goes out within 24 hours of the parcel being received and verified.",
    },
    {
      q: "Do you buy expired Omnipod pods?",
      a: "Yes, at a reduced rate — Omnipod 5, DASH and Classic — along with expired Dexcom G7 sensors. Those are the only two exceptions; everything else has to be in date.",
    },
    {
      q: "My supplies came through Medicaid. Can I sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold. Anything received through private insurance or paid for yourself is fine.",
    },
    {
      q: "Can I sell several brands together?",
      a: "Yes. Mixed lots are quoted as one lot rather than brand by brand, and quantity improves the per-box rate — ten or more boxes generally does better than the same boxes sold separately.",
    },
  ],
}
