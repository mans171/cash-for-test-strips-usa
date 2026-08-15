import type { PostBody } from "./types"

/**
 * Nebraska — no in-state buyer, and the flattest state in this batch: every
 * one of its ten cities falls between 8.9% and 11.9%, a 3.0-point spread. No
 * hotspot, no distressed metro carrying the average, nothing that concentrates
 * demand in one place. The page is built on that evenness, because it is also
 * the reason no buyer has set up here and the reason nobody should expect one.
 *
 * Practical spine underneath it: the seal rule, treated properly rather than
 * as a bullet point. It is the single most common reason a parcel is refused
 * and the one that people argue with most.
 *
 * Distinct from Kentucky (a sorting guide) and Wyoming (population
 * arithmetic), which share the generated expired angle.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts.
 */
export const NE: PostBody = {
  label: "An evenly spread state with no buyer, and the seal rule that decides everything",
  title: "Selling Diabetic Test Strips in Nebraska: Even Demand, No Local Buyer",
  heading: "Selling Diabetic Test Strips in Nebraska",
  metaDescription:
    "Nebraska's diabetes rate barely varies between its cities, and no buyer operates in the state. Here is why, what an unopened box has to look like, and which expired supplies still pay.",

  lead: [
    "Nebraska is unusually level. Across the ten cities we hold figures for, the diagnosed diabetes rate runs from 8.9% in Kearney to 11.9% in Columbus — a spread of three points, where many states run to eight or ten. Omaha reads 10.2%, Lincoln 9.5%, Grand Island 11.6%, Hastings 11.7%. There is no outlier and no distressed metro pulling the average around.",
    "That evenness explains something people find odd, which is that no diabetic supply buyer operates anywhere in Nebraska. There is no single place in this state where enough sellers are concentrated to support a counter, so the whole market runs by post — and it runs the same way from Scottsbluff as from Omaha.",
  ],

  sections: [
    {
      heading: "The seal is the entire product",
      paragraphs: [
        "More parcels are refused over this than over everything else combined, so it is worth spending a moment on rather than skimming. A box of test strips or sensors is resellable because it is factory-sealed. The seal is what tells the next person that nothing has been swapped, split, stored badly or handled at all since it left the manufacturer.",
        "Remove the seal and you have not reduced the value of the box, you have removed it. There is no discount tier for an opened box, no allowance for one that was opened but untouched, and no way to reseal it that anyone will accept. This is not a rule invented to catch sellers out. It is the only reason the item can be sold at all.",
        "The practical consequence is one that people get wrong constantly: do not open a box to photograph the contents. Photograph the outside, with the expiry date and lot number readable. If a buyer asks you to open a box to prove what is inside, they are asking you to destroy the thing they are buying.",
        "The one thing that does not matter is the pharmacy label. A sticker with your name and your prescriber on it is entirely ordinary and affects nothing. Who paid is a separate question, and supplies obtained through Medicare or Medicaid cannot be resold regardless of condition.",
      ],
    },
    {
      heading: "Where the boxes come from in a state like this",
      paragraphs: [
        "About 10.7% of Nebraskan adults have diagnosed diabetes, below the national rate of 12.1%. Around 17.5% of the state is 65 or over and 9.9% of working-age adults have no health insurance. None of those figures is extreme, which is rather the point — Nebraska sits close to the middle on all of them.",
        "In a state like that, the supply of sealed unused boxes comes almost entirely from ordinary churn rather than from any one place or circumstance. A prescription changes and a month's stock is suddenly surplus. Somebody moves from finger-sticks to a sensor. A family clears a house and finds a cupboard nobody had opened in years.",
        "Spread across 586 ZIP codes and two million people, that churn is real but thin on the ground in any one town. It is exactly the pattern that produces plenty of sellers statewide and no viable place to put a shop.",
      ],
    },
    {
      heading: "The expiry exceptions that get thrown out",
      paragraphs: [
        "The advice most readily found online is that expired supplies have very low or no resale value. It is right about test strips, for a reason worth respecting: a degraded strip can give an unreliable reading, and that is a safety issue rather than a price negotiation.",
        "It is wrong about two items. Expired Omnipod pods in the 5, DASH and Classic versions still pay. So do expired Dexcom G7 sensors. Both at a reduced rate, both regularly binned by people who read the general advice and applied it to everything.",
        "Expired Dexcom G6 sensors are not included, and nothing else past date is either. Two exceptions, precisely bounded — check which generation and which product you are holding before deciding.",
      ],
    },
    {
      heading: "The accepted list, and the six-month rule",
      paragraphs: [
        "Test strips: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. Aim for at least six months before the expiry date; below that the value falls away because whoever uses them next needs a realistic window. A single 100-count box is worth meaningfully more than two 50-count boxes of the same product.",
        "CGM: Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 sensors. Libre must be a US retail version — sensors from outside the country cannot be resold here at any condition or date.",
        "Pods and pump parts: Omnipod 5, DASH and Classic pods, plus some sealed Medtronic and Tandem components. If you are holding a component you cannot identify, ring 518-779-9751 rather than posting it hopefully.",
      ],
    },
    {
      heading: "Posting from Nebraska",
      paragraphs: [
        "Agree the number before the parcel is sealed, quoted against the actual brands, counts and dates. That written figure is the whole of your position once the box has left the state, which it will have done within a day or two of you handing it over.",
        "Use the prepaid tracked label. It costs you nothing from anywhere in Nebraska, and the tracking is what establishes the date the parcel was received — the point from which payment is counted. Payment follows within 24 hours of receipt and verification.",
        "If a figure changes after arrival, ask for the specific reason and for photographs of what was received. Concrete causes exist: a seal broken in transit, a misread date, a count that differs from the description. A vague revision is not a revision, and you can ask for the supplies back instead.",
      ],
    },
  ],

  faqs: [
    {
      q: "Why is there no buyer in Omaha or Lincoln?",
      a: "Because Nebraska's demand is spread very evenly rather than concentrated — its ten cities sit within three points of each other — and no single place holds enough volume to support a counter. Mail-in is what the state actually has.",
    },
    {
      q: "I opened the box but did not use anything. Can I still sell it?",
      a: "No. There is no partial credit for an opened box. The seal is what lets the next holder trust the contents, and once it is gone that cannot be restored by any means.",
    },
    {
      q: "Which expired items are worth sending?",
      a: "Omnipod pods in the 5, DASH and Classic versions, and Dexcom G7 sensors. Both pay at a reduced rate. Expired test strips and expired Dexcom G6 sensors do not qualify.",
    },
    {
      q: "My strips expire in four months. Are they worth anything?",
      a: "Less than they would be with six or more months left, and the value drops quickly below that line. It is still worth asking rather than assuming, particularly if you have several boxes going at once.",
    },
    {
      q: "Do I pay for the postage?",
      a: "No. The label is prepaid from any Nebraska ZIP code. A buyer asking you to cover shipping on a sale like this is worth being wary of.",
    },
  ],
}
