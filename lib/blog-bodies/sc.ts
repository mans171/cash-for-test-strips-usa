import type { PostBody } from "./types"

/**
 * South Carolina — one listed buyer, Greenville, up in the Upstate. The page
 * is written as a decision: is the in-person option worth the journey, or is
 * the prepaid parcel the better answer? Most of the state's population and
 * most of its highest rates are nowhere near Greenville — Florence 16.1%,
 * Sumter 15.5%, the Charleston area, Columbia — so for the majority of
 * readers the honest answer is the post, and saying so is more useful than
 * advertising the listing as statewide coverage.
 *
 * Greenville itself reads 10.4%, among the lower figures in the state, which
 * is the same pattern seen elsewhere: coverage follows commerce, not need.
 * Noted in one paragraph rather than made the spine, since North Carolina
 * already owns that observation.
 *
 * Louisiana and New Hampshire share the generated bulk angle and are built
 * on different ideas entirely.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts and
 * no distances, since none are in the South Carolina brief.
 */
export const SC: PostBody = {
  label: "Greenville has a buyer — deciding whether it is worth the journey",
  title: "Selling Diabetic Test Strips in South Carolina: Drive to Greenville or Post?",
  heading: "Selling Diabetic Test Strips in South Carolina",
  metaDescription:
    "South Carolina's only listed test strip buyer is in Greenville. For Charleston, Columbia and the Pee Dee that is a journey rather than an errand. How to decide, and what qualifies either way.",

  lead: [
    "South Carolina has one listed diabetic supply buyer and it is in Greenville, at the top of the Upstate. That is a genuine in-person option, which most states do not have at all, and it is worth knowing about before you decide anything.",
    "It is also a long way from where most of the state lives. Charleston, North Charleston, Columbia, Summerville, Sumter, Florence — none of those is a short trip to Greenville, and the highest diabetes rates in the state are at that end rather than this one. So the useful question is not whether an in-person option exists. It is whether it is worth your journey, and for most readers of this page it will not be.",
  ],

  sections: [
    {
      heading: "When the drive makes sense",
      paragraphs: [
        "It makes sense when you are already in the Upstate, or when you are carrying enough that an on-the-spot inspection and settlement is worth the trip in its own right. An in-person sale collapses the whole process into one visit: the boxes are checked in front of you and the figure is settled while you are standing there.",
        "It also makes sense when you would rather not put a large lot into the post at all. Some people simply do not like the gap between handing something over and being paid, and that is a fair preference rather than an irrational one.",
        "If you do go, go prepared. Sealed boxes only, and a written list of brands, counts and expiry dates. Agree the figure by phone in advance against that list, so there is a number the visit is measured against rather than a conversation starting from nothing.",
      ],
    },
    {
      heading: "When it does not, which is most of the time",
      paragraphs: [
        "Florence reads 16.1% for diagnosed diabetes among adults and Sumter 15.5% — the two highest figures in the state, both in the Pee Dee and the Midlands rather than the Upstate. North Charleston is 13.2%, Rock Hill and Summerville 13.0%, Columbia 12.1%. Statewide the figure is 13.9% against 12.1% nationally.",
        "Greenville itself reads 10.4%, and Mount Pleasant 9.1% and Charleston 9.5% are lower still. The listing therefore sits in one of the lower-prevalence parts of the state, which is the pattern nearly everywhere: coverage follows population density and commercial logic rather than where the need is greatest.",
        "For a seller in Florence, Sumter or the Lowcountry, the prepaid parcel is not a consolation. It costs nothing, it is settled on a written quote agreed beforehand, and payment follows within 24 hours of the parcel being received and verified. On any ordinary lot it is the better use of a day.",
      ],
    },
    {
      heading: "Either route, the same rules decide value",
      paragraphs: [
        "Factory-sealed and unopened. This is not negotiable at a counter any more than it is by post — the seal is what allows the next person to trust the box, and once it is gone the box is worth nothing rather than less. It is also the single most common reason supplies are refused.",
        "Not obtained through Medicare or Medicaid, since those supplies cannot be resold. A pharmacy label with your name on it is ordinary and has no bearing on it; the question is who paid.",
        "For test strips, six months or more before the expiry date. And keep large boxes intact — one 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
        "Quantity matters in both directions too: ten or more boxes earns a better per-box rate, and a mixed lot of different brands and types is quoted as one lot rather than separated out.",
      ],
    },
    {
      heading: "The expired items South Carolina throws away",
      paragraphs: [
        "The best-known article on this subject tells readers that expired supplies have very low or no resale value. For test strips that is right, and we would not take them either — a strip past date can produce an unreliable reading, which is a safety matter rather than a discount.",
        "It is wrong about expired Omnipod pods, in the 5, DASH and Classic versions, which still pay at a reduced rate, and about expired Dexcom G7 sensors, which do the same. Expired Dexcom G6 sensors are not included, and nor is anything else past its date.",
        "In a state where 19.8% of the population is 65 or over, a great deal of what gets sold comes out of a house clear-out rather than a deliberate decision to sell. Those clear-outs are exactly where expired pods and G7 sensors end up in a bin bag on the strength of a date nobody checked against the right rule.",
      ],
    },
    {
      heading: "The accepted list",
      paragraphs: [
        "Test strips: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix.",
        "CGM: Dexcom G6 sensors and transmitters, Dexcom G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 sensors. Libre must be a US retail version — sensors obtained abroad cannot be resold here whatever their condition.",
        "Pods and pump components: Omnipod 5, DASH and Classic pods, plus some sealed Medtronic and Tandem parts. Pods rather than controllers, and anything unusual is worth settling on the phone at 518-779-9751 before you either drive or post it.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is Greenville the only place in South Carolina I can sell in person?",
      a: "Yes, it is the only listing in the state. For the Upstate it is genuinely convenient; from Charleston, Columbia or Florence it is a journey rather than an errand, and the prepaid parcel usually makes more sense.",
    },
    {
      q: "What should I take with me if I do go in person?",
      a: "Sealed boxes only, and a written list of brands, counts and expiry dates. Agree a figure by phone in advance against that list so the visit has a number to be measured against.",
    },
    {
      q: "Does posting cost me anything from South Carolina?",
      a: "No. The label is prepaid from any of the state's 424 ZIP codes, and payment follows within 24 hours of the parcel being received and verified.",
    },
    {
      q: "Are expired supplies worth keeping?",
      a: "Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors are, at a reduced rate. Expired test strips and expired Dexcom G6 sensors are not. Those two exceptions are the entire list.",
    },
    {
      q: "Do I get more by selling in person than by post?",
      a: "The same rules decide value either way — seal, source, dates, brand, count and quantity. What changes is convenience and how quickly it is settled, not the criteria.",
    },
    {
      q: "Can I send strips and sensors in the same parcel?",
      a: "Yes. Mixed lots are quoted as one lot rather than sorted item by item, and keeping everything together helps you reach the ten-box threshold where the per-box rate improves.",
    },
  ],
}
