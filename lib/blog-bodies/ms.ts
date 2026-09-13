import type { PostBody } from "./types"

/**
 * Mississippi — 15.5% of adults with diagnosed diabetes, among the highest in
 * the country, and Greenville at 22.5% against Clinton at 11.6%, a 10.9-point
 * gap. The fact that carries this post: Clinton, the lowest-rate city in the
 * state, is still at roughly the national average of 12.1%. Mississippi has no
 * low end.
 *
 * That, plus 11.5% of working-age adults uninsured and nobody BASED in the
 * state, makes this the one post where the honest subject is where these
 * supplies actually go and who ends up using them. It is a demand-side page,
 * not a coverage page, and it does not pretend the mail-in route puts anything
 * back into the Delta.
 *
 * UPDATED 2026-09-07: a buyer now covers Mississippi, but is not located in it.
 * The post says exactly that and no more. It deliberately does NOT promise an
 * in-person handover in Jackson, Greenville or on the Coast, because nobody is
 * there to do one — claiming otherwise would be the single most misleading
 * thing this page could say.
 */
export const MS: PostBody = {
  label: "Highest need, nobody based here",
  title: "Selling Diabetic Test Strips in Mississippi: Where These Supplies Actually Go",
  heading: "Selling Diabetic Test Strips in Mississippi",
  metaDescription:
    "Greenville's diabetes rate is 22.5% — more than one adult in five. Mississippi is covered, but no buyer is based in the state. What sealed supplies are worth, why government-covered stock can't be sold, and the two expired items to keep.",

  lead: [
    "In Greenville, 22.5% of adults have diagnosed diabetes. That is more than one adult in five, and it is the highest city figure we hold for any state. Meridian reads 19.7% and Jackson 18.4%.",
    "Mississippi as a whole sits at 15.5% against a national rate of 12.1%. A buyer covers the state, but none is based in it — not in Jackson, not on the Coast, not in the Delta. Those facts sit uncomfortably together and this page is not going to pretend otherwise.",
  ],

  sections: [
    {
      heading: "Mississippi has no low end",
      paragraphs: [
        "Most states have a city that reads well below the national average — a university town, a wealthy suburb, somewhere young. In Michigan it is Ann Arbor at 6.4%. In Colorado it is Fort Collins at 6.2%. Those places pull the state average down and make the headline figure look milder than the worst-affected parts of the state actually are.",
        "Mississippi does not have one. The lowest city figure in the state is Clinton at 11.6%, and the national rate is 12.1%. The healthiest city in Mississippi is roughly average for the country.",
        "Olive Branch reads 11.9% and Southaven 12.5%, both in the northern corner near the Tennessee line. Biloxi is 13.5%, Hattiesburg 13.6%, Tupelo 14.1%, Gulfport 16.0%. The floor is high everywhere and the ceiling, in Greenville, is 22.5%.",
        "The gap between Greenville and Clinton is 10.9 points, which is a wide spread by any measure. What makes Mississippi different is that the spread runs from bad to worse rather than from bad to fine.",
      ],
    },
    {
      heading: "What 11.5% uninsured means for a sealed box",
      paragraphs: [
        "Just over one in nine working-age adults in Mississippi has no health insurance. Among the states, that is a high figure, and it is the other half of the picture the prevalence numbers only half describe.",
        "Diabetes is not an expensive condition to treat once. It is expensive to treat every day for the rest of your life, and the consumables are the part that never stops. Somebody without cover pays retail for strips and sensors out of their own pocket, every month, indefinitely.",
        "That is the demand this whole market runs on. Sealed, in-date supplies that one household no longer needs move to a household that is paying full price for the same box. It is not charity and nobody should present it as such — it is a resale market — but the thing being resold is genuinely useful to whoever ends up with it.",
        "The honest caveat: posting a box out of Mississippi does not put it back into Greenville. Supplies bought here enter a national secondary market and go wherever the next buyer is. If your motivation for selling is that the need is on your doorstep, that is worth knowing before you decide.",
      ],
    },
    {
      heading: "Nobody is based in Mississippi, and that is unlikely to change",
      paragraphs: [
        "Mississippi is covered on this directory, but nobody operates out of Jackson, the Gulf Coast, the Delta or anywhere else in the state. That is a genuine gap rather than an oversight in the listings, and it is the difference between being able to sell and being able to hand a box over locally.",
        "The reason is that an in-person buyer needs volume within a short drive to justify the driving, and Mississippi spreads under three million people across 427 ZIP codes with no single dominant metro area. High prevalence does not by itself create a local trade, because the people with the condition are the ones consuming supplies rather than the ones with a cupboard of spares.",
        "So this is a mail-in state. The prepaid label costs you nothing from any of those 427 ZIP codes, the Delta included, and payment follows within 24 hours of the parcel arriving and being verified.",
      ],
    },
    {
      heading: "The question of who paid, and why it matters more here",
      paragraphs: [
        "Supplies obtained through a government-covered program cannot be resold. That rule applies everywhere, but it is worth stating plainly in a state where a large share of prescriptions run through public programs, because it is the condition most likely to disqualify what you are holding.",
        "It is about the program the supplies came through, not about you. If you paid retail, or the supplies came through private insurance, or they were given to you by a relative who paid for them privately, that is a different situation and the sale is straightforward.",
        "A pharmacy label with a name printed on it is not the problem people assume it is. Nobody is asked to explain how a box came into their possession. What matters is the funding route, the seal being intact, and the date on the end of the box.",
        "If you are not sure which program paid for something — and in a house where somebody has died and left a cupboard full of boxes, that is a common position to be in — ring and ask rather than sending it and hoping.",
      ],
    },
    {
      heading: "What most guides get wrong about the dates",
      paragraphs: [
        "The article that ranks highest in the country for this subject tells readers that expired supplies have very low or no resale value, full stop. For strips that is right, and the reason is not commercial. A degraded strip can give a false reading, and in a state where a fifth of Greenville's adults are managing this condition daily, a false reading is a real harm rather than a bad deal.",
        "But two named items are bought past their expiry date, at a reduced rate: Omnipod pods in the 5, DASH and Classic versions, and Dexcom G7 sensors. Nothing else. Expired G6 sensors are not bought and no expired strip is bought.",
        "If you are clearing out a house here and working through boxes by date, separate out any pods and any G7 sensors before the bin bag comes out. It takes a minute and it is the single most valuable check on this page.",
        "For anything still in date, strips want at least six months of shelf life left on them. Under that, the tier drops away quickly.",
      ],
    },
    {
      heading: "Posting from Mississippi without losing money",
      paragraphs: [
        "Get the figure in writing before the parcel leaves the house. Not a range and not an \"up to\" number — the specific figure for the brands, counts and dates you actually have. A buyer who will not commit before you post is one who expects to revise it downwards once the box is in their building, at which point you have nothing to push back with.",
        "Photograph the sealed boxes before they go, with the expiry date and lot number readable. Do not open anything to show what is inside. An opened box cannot be resold at all, so opening one to prove its contents destroys the only thing that made it worth sending.",
        "Use the prepaid label, keep the tracking number, and hold the photographs until you have been paid. Most of these transactions are unremarkable. The photographs matter for the small number that are not, because the whole of any dispute comes down to what condition the boxes were in when they left your hands.",
      ],
    },
  ],

  faqs: [
    {
      q: "My supplies came through a government program. Is there any way to sell them?",
      a: "No. Supplies obtained through a government-covered program cannot be resold, and there is no version of that which works. If part of what you are holding came through a government program and part was bought retail, the retail portion can still be sold — it is worth ringing to sort out which is which rather than sending the lot.",
    },
    {
      q: "Who actually ends up using the supplies I send?",
      a: "People buying diabetic supplies out of pocket, usually because they are uninsured or their cover does not stretch to the quantity they need. It is a resale market, so the boxes go where the next buyer is, which will not necessarily be in Mississippi.",
    },
    {
      q: "Is there anywhere in Jackson or on the Coast I can sell in person?",
      a: "Nobody is based there. Mississippi is covered by a listing, so you can sell from anywhere in the state, but a prepaid parcel is the practical route rather than a local handover. If someone sets up in Jackson or Gulfport, they will appear on the Mississippi page.",
    },
    {
      q: "I've got expired Dexcom sensors. Are those worth anything?",
      a: "It depends which generation. Expired G7 sensors are bought at a reduced rate. Expired G6 sensors are not bought at all. The distinction catches people out constantly, so check the box before deciding.",
    },
    {
      q: "The boxes belonged to a relative who has died. Can I still sell them?",
      a: "Yes, provided the supplies were not obtained through a government-covered program and the boxes are still factory-sealed. A pharmacy label carrying their name does not prevent a sale. If you cannot work out how a particular prescription was funded, ask before sending it.",
    },
  ],
}
