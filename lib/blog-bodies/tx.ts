import type { PostBody } from "./types"

/**
 * Texas — buyers in Dallas and San Antonio, none in Houston, which is the
 * state's largest city. Saying that plainly is more useful than implying
 * statewide coverage, and it is the thing no competitor page will tell a
 * Houston reader.
 *
 * The other Texas-specific fact worth building on: 19.1% of working-age adults
 * here have no health insurance, the highest rate in the country. That is the
 * demand side of this market, and it explains why resold supplies matter here
 * more than almost anywhere else.
 */
export const TX: PostBody = {
  title: "Selling Diabetic Test Strips in Texas: Where the Buyers Actually Are",
  heading: "Selling Diabetic Test Strips in Texas",
  metaDescription:
    "Texas has in-person buyers in Dallas and San Antonio — and none in Houston, the largest city. Where coverage actually is, what sealed supplies are worth, and the two expired items worth keeping.",

  lead: [
    "Texas is big enough that \"is there a buyer in Texas\" is the wrong question. There are buyers listed in Dallas and San Antonio. There is not one in Houston, which is the largest city in the state and the one with the highest number of people likely to be holding unused supplies.",
    "That gap matters more than a page like this usually admits. If you are in Houston or the Valley, you are shipping, the same as someone in rural Montana — you just have shorter odds of that changing soon.",
  ],

  sections: [
    {
      heading: "Where you can hand supplies over, and where you can't",
      paragraphs: [
        "Dallas and San Antonio both have buyers on this directory who take supplies in person. In practice that means agreeing a number over the phone, meeting somewhere public, and walking away with cash the same day. No parcel, no waiting on verification, no tracking number to watch.",
        "Houston, Austin, El Paso, Fort Worth, Corpus Christi and the Rio Grande Valley do not have a listed in-person buyer. Fort Worth is close enough to Dallas that it is a normal drive. El Paso is roughly 550 miles from the nearest one, which is not.",
        "If you are outside a drive of Dallas or San Antonio, mail-in is the honest route, and the prepaid label costs you nothing regardless of which of the state's 1,989 ZIP codes you are posting from.",
      ],
    },
    {
      heading: "Why there is real demand for this in Texas specifically",
      paragraphs: [
        "19.1% of working-age adults in Texas have no health insurance. That is the highest uninsured rate of any state in the country, and it is the single most important piece of context for why a resale market exists here at all.",
        "For someone uninsured and managing diabetes, retail is the only price there is, and retail on test strips is brutal. The sealed boxes sitting in your cupboard after a prescription change are, to that person, the difference between testing as often as they should and rationing.",
        "That is also why the condition rules are strict rather than fussy. The whole thing only works if what gets resold is genuinely as good as what came out of the pharmacy.",
      ],
    },
    {
      heading: "The two expired things you should not throw away",
      paragraphs: [
        "Most guides on this subject tell you that expired supplies are worthless. For test strips that is correct — a degraded strip gives an inaccurate reading, and an inaccurate glucose reading is a safety problem, not a discount opportunity.",
        "There are exactly two exceptions, and they are the ones people bin without thinking. Expired Omnipod pods — 5, DASH and Classic — still have value. So do expired Dexcom G7 sensors. Both pay at a reduced rate rather than nothing at all.",
        "Expired Dexcom G6 sensors do not qualify. Neither does anything else. But if you are clearing out and you find pods or G7 sensors past their date, check before they go in the bin.",
      ],
    },
    {
      heading: "What decides whether a box is worth anything",
      paragraphs: [
        "The seal has to be unbroken — factory-sealed, original packaging. An opened box cannot be resold at any price, because nobody downstream can verify how it was stored. This is far and away the most common reason a parcel comes back.",
        "It cannot have been bought through Medicare or Medicaid. Supplies paid for by those programmes cannot legally be resold. Supplies you got through private insurance or paid for yourself are fine, and a pharmacy label with your name on it changes nothing.",
        "For test strips, at least six months should remain before the expiry date. Under that and the value drops quickly, because whoever ends up using them needs time to actually get through the box.",
        "Box count matters more than most people expect. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand, so it is worth checking what you actually have before deciding a small pile is not worth a phone call.",
      ],
    },
    {
      heading: "Diabetes in Texas is not one number",
      paragraphs: [
        "Statewide, 12.7% of Texas adults have diagnosed diabetes, according to the CDC's 2023 BRFSS estimates — above the national rate of 12.1%.",
        "The state average hides an enormous spread. El Paso reads 16.4% and Corpus Christi 15.9%, against 8.1% in Austin and 9.9% in Plano. That is more than an eight-point gap between cities in the same state, and it lines up with income and insurance coverage far more than with geography.",
        "San Antonio, one of the two cities with a listed buyer, sits at 15.2% — among the highest of any large city in the country. Houston, which has no listed buyer, is at 13.9%. The coverage map and the need map do not currently match, which is worth saying out loud.",
      ],
    },
    {
      heading: "If you are selling in person, a few practical things",
      paragraphs: [
        "Agree the number before you drive anywhere. Brand, count, expiry dates — get the figure settled on the phone so the meeting is a handover rather than a negotiation.",
        "Meet somewhere public and busy in daylight. A supermarket car park or a bank forecourt is normal for this and no reasonable buyer will object.",
        "Bring the boxes sealed and bring everything you mentioned. If you said forty boxes, bring forty. Turning up with a different quantity than quoted is the fastest way to have a settled price reopened.",
        "Count the cash before you hand anything over. This is not paranoia, it is just how any cash transaction should work.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there a buyer in Houston?",
      a: "Not on this directory. Dallas and San Antonio have in-person buyers listed; Houston does not, despite being the largest city in the state. From Houston, mail-in with a prepaid label is the realistic route.",
    },
    {
      q: "How far is too far to drive for an in-person sale?",
      a: "That depends on the size of the lot. For a handful of boxes it rarely makes sense to drive more than an hour, and mail-in costs you nothing anyway. For a large lot — dozens of boxes or more — the numbers change and it can be worth the trip. Ask when you get the quote.",
    },
    {
      q: "Do you buy expired Omnipod pods in Texas?",
      a: "Yes. Omnipod 5, DASH and Classic pods are accepted past their expiry date at a reduced rate, as are expired Dexcom G7 sensors. Those are the only two exceptions — everything else has to be in date.",
    },
    {
      q: "My supplies came through Medicaid. Can I sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold. Supplies you received through private insurance or paid for yourself are fine.",
    },
    {
      q: "Can I sell FreeStyle Libre sensors I bought in Mexico?",
      a: "No — US retail versions only. This comes up often along the border. Sensors sourced outside the US cannot be resold here regardless of condition or expiry date, so it is worth checking the box before making the trip or the parcel.",
    },
    {
      q: "I have a mix of brands from clearing out a relative's house. Is that a problem?",
      a: "Not at all, and it is common. A mixed lot gets quoted as one lot rather than item by item, and quantity improves the rate — ten or more boxes typically does better than the same boxes handled separately.",
    },
  ],
}
