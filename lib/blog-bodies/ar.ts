import type { PostBody } from "./types"

/**
 * Arkansas — no in-state buyer. Built on the FreeStyle Libre "US retail
 * versions only" rule, framed as the buy-cheap-online-and-flip trap rather
 * than as a border-crossing issue. California already owns the border framing
 * (San Diego), so Arkansas takes the other half of the same rule: sensors
 * sourced from overseas marketplaces cannot be resold here, and people who
 * hear "sensors are worth money" and go shopping lose the lot.
 *
 * Secondary material: an 11.2-point spread between Pine Bluff and Fayetteville
 * that maps onto the Northwest corner versus the Delta. One paragraph only —
 * the gap frame belongs to other states.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts.
 */
export const AR: PostBody = {
  label: "Libre sensors, the US-retail rule, and why you cannot buy to flip",
  title: "Selling FreeStyle Libre and Test Strips in Arkansas: The Retail Rule",
  heading: "Selling FreeStyle Libre Sensors and Test Strips in Arkansas",
  metaDescription:
    "No test strip buyer operates in Arkansas. This covers the FreeStyle Libre rule that disqualifies the most sensors — US retail versions only — plus what else qualifies and how mail-in works from here.",

  lead: [
    "FreeStyle Libre sensors are the item Arkansas households most often discover they are sitting on, usually after a prescription changes and a month's supply becomes surplus. Libre 1, 2 and 3 are all accepted. There is one condition attached, and it disqualifies more sensors than every other rule on this page put together: US retail versions only.",
    "It is also worth stating early that no buyer operates anywhere in Arkansas. Not Little Rock, not Fayetteville, not Fort Smith. Selling from here means posting, and any page that suggests otherwise is describing a national mail-in service and calling it local.",
  ],

  sections: [
    {
      heading: "Why sensors bought from overseas sellers are worthless here",
      paragraphs: [
        "People hear that CGM sensors have resale value and do the obvious arithmetic: buy them cheaply from an overseas listing, sell them on at a US rate. It does not work, and the reason is not a technicality that someone might overlook. Only US retail versions can be resold in this country. A sensor sourced from abroad cannot be, whatever its condition, whatever the date on it, however convincing the packaging looks.",
        "So if you are considering buying sensors in order to sell them, do not. You will end up holding a box that has no route to a buyer here and no route back to the seller you bought it from. This page is written for people who already have surplus supplies from their own prescriptions, and that is the only version of this that works.",
        "The same logic explains why the seal has to be intact. A sealed US retail box carries its own proof: the packaging, the lot number, the date. Once it is opened, the proof is gone and the box is worth nothing rather than slightly less.",
      ],
    },
    {
      heading: "The expiry advice that is wrong for two products",
      paragraphs: [
        "The best-known guide to this subject tells readers that expired supplies have very low or no resale value. Applied to test strips, we would say the same and we do — an out-of-date strip can return an unreliable reading, and that is a safety problem, not a discount.",
        "It is wrong about two things, both common in Arkansas cupboards. Expired Omnipod pods — 5, DASH and Classic — still pay, at a reduced rate. Expired Dexcom G7 sensors do too. Anything else past date, including expired Dexcom G6 sensors, does not qualify.",
        "That is the entire list of exceptions. Short, but worth reading a label for before the bin lid closes.",
      ],
    },
    {
      heading: "Everything else that qualifies",
      paragraphs: [
        "Test strips: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. At least six months before the expiry date. Box size matters — one 100-count box is worth meaningfully more than two 50-count boxes of the same brand, so do not break up large boxes to make a lot look bigger.",
        "Dexcom: G6 sensors and transmitters, G7 sensors and receivers. The components accepted differ by generation, so read the box rather than assuming.",
        "Pods and pump parts: Omnipod 5, DASH and Classic pods, and some sealed Medtronic and Tandem components. If yours is an unusual item, 518-779-9751 will settle it faster than guessing.",
        "And one exclusion that has nothing to do with condition: supplies obtained through Medicare or Medicaid cannot be resold. A pharmacy label with your name on it is fine — that is a different question from who paid the bill.",
      ],
    },
    {
      heading: "Two Arkansases, one mail-in answer",
      paragraphs: [
        "Statewide, 13.3% of adults have diagnosed diabetes against 12.1% nationally. That average hides a genuine split: Pine Bluff reads 18.7% while Fayetteville reads 7.5%, an 11.2-point gap, with Bentonville at 7.9% and Rogers at 10.9% at the low end and North Little Rock at 14.5% and Fort Smith at 13.8% nearer the top.",
        "The practical consequence is smaller than it looks. Because no buyer operates in either half of the state, a seller in the Delta and a seller in the Northwest corner do exactly the same thing: get a written quote, post a prepaid tracked parcel, get paid on receipt. Across 615 ZIP codes and 3.08 million people, the route is identical.",
        "Around 11.3% of working-age Arkansans have no health insurance, and 18.2% of the state is 65 or over. Between them those two figures describe most of the people who end up either selling surplus supplies or buying them second-hand.",
      ],
    },
    {
      heading: "Doing the sale properly from here",
      paragraphs: [
        "Get the number agreed before the parcel is sealed, against the specific brands, counts and dates you have. Once your box is in someone else's building, a revised figure is not something you can argue with from Jonesboro.",
        "The label should be prepaid and tracked and should cost you nothing. Payment comes within 24 hours of the parcel being received and verified, which is why the tracking record matters — it fixes the date the clock starts.",
        "Photograph the sealed boxes with the dates readable before you pack them, and do not open anything to show what is inside. Keep the photographs until you have been paid.",
      ],
    },
  ],

  faqs: [
    {
      q: "How do I know if my Libre sensors are US retail versions?",
      a: "US retail packaging is what you get from an American pharmacy on an American prescription. Sensors bought from an overseas seller or brought back from another country cannot be resold here. If your supplies came from your own US prescription, you are fine.",
    },
    {
      q: "Is there a buyer in Little Rock or Fayetteville?",
      a: "No. There is no listed buyer anywhere in Arkansas, so an in-person sale is not something this directory can point you to. Mail-in with a prepaid label is the honest answer statewide.",
    },
    {
      q: "Can I buy sensors cheaply and resell them?",
      a: "It does not work and we would advise against attempting it. The US retail restriction removes the arbitrage, and opened or non-retail stock has no route to a buyer here. This market runs on people's own surplus prescriptions.",
    },
    {
      q: "What about supplies that have expired?",
      a: "Omnipod pods in the 5, DASH and Classic versions and Dexcom G7 sensors still pay at a reduced rate. Test strips and Dexcom G6 sensors past their date do not, and should not be sold by anyone.",
    },
    {
      q: "Does it matter that my boxes are different brands?",
      a: "No. A mixed lot is quoted as one lot rather than sorted item by item, and ten or more boxes earns a better per-box rate than several small sends.",
    },
  ],
}
