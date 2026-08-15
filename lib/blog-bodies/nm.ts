import type { PostBody } from "./types"

/**
 * New Mexico — no in-state buyer. Built on the demand side rather than the
 * supply side: 15.6% of working-age adults here have no health insurance, one
 * of the highest rates in the country, and 20.3% of the state is 65 or over.
 * The page answers the question a New Mexico seller actually asks — who is on
 * the other end of this, and why would anyone pay for a used-looking box —
 * because the answer is local and it is uncomfortable in a useful way.
 *
 * Alabama shares the generated "dexcom" angle and measured 90.7% identical to
 * this state under the old template. The two are now built on opposite halves
 * of the market: Alabama on breadth of supply and mail logistics, New Mexico
 * on uninsurance, age and where the boxes go. No section heading, ordering or
 * paragraph is shared between them.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts.
 */
export const NM: PostBody = {
  label: "Who buys these supplies, and why New Mexico has so many of them",
  title: "Selling Diabetic Supplies in New Mexico: Where the Boxes Actually Go",
  heading: "Selling Diabetic Test Strips and CGM Supplies in New Mexico",
  metaDescription:
    "New Mexico has one of the highest uninsured rates in the country and no in-state test strip buyer. This explains who ends up buying resold supplies, what qualifies, and how mail-in works from here.",

  lead: [
    "Most guides to selling diabetic supplies never say who is buying them. That omission is more noticeable in New Mexico than almost anywhere, because 15.6% of working-age adults in this state have no health insurance — one of the highest rates in the country — and a good share of those people are the reason a second-hand market for sealed supplies exists at all.",
    "There is no buyer listed anywhere in New Mexico. Not in Albuquerque, not in Las Cruces, not in Santa Fe. Everything below assumes you will be posting rather than driving, and says so plainly rather than dressing up a national mail-in service as local coverage.",
  ],

  sections: [
    {
      heading: "Why anybody pays for a box that has already been dispensed",
      paragraphs: [
        "The short answer is that a sealed box is a sealed box. A factory-sealed carton of test strips that has never been opened is the same product it was on the pharmacy shelf, and the person who ends up with it is usually someone paying out of their own pocket because no plan is paying for them.",
        "That is why the seal rule is absolute rather than fussy. Once a box has been opened, nobody downstream can be sure what happened to it, and the entire basis on which the next person can trust it disappears. An opened box is worth nothing, and no explanation of why it was opened changes that.",
        "It is also why Medicare and Medicaid supplies are excluded. Where a public programme has already paid for the item, it cannot be resold. That has nothing to do with how carefully you have looked after it. A pharmacy label with your name on it, by contrast, is completely ordinary and affects nothing.",
      ],
    },
    {
      heading: "New Mexico's age profile is doing most of the work",
      paragraphs: [
        "About 20.3% of New Mexicans are 65 or over. That is a large older share by any measure, and it matters here because most supplies that get sold were never bought with selling in mind. A prescription changes. Someone moves from finger-sticks to a sensor. A family clears a house after a death and finds a cupboard of boxes nobody knew about.",
        "Statewide, 13.2% of adults have diagnosed diabetes against 12.1% nationally, so New Mexico sits modestly above the national line rather than dramatically so. The variation inside the state is narrower than in much of the South: South Valley reads 15.4% and Rio Rancho 10.6%, a gap of 4.8 points, with Albuquerque at 11.3%, Santa Fe at 11.7% and Roswell at 14.4%.",
        "Put the age share and the uninsured share together and you get the shape of the market in one sentence: an older population generating surplus supplies, and a large uninsured population that cannot easily afford them new.",
      ],
    },
    {
      heading: "The expiry rule almost everyone gets wrong",
      paragraphs: [
        "Search this subject and you will be told, repeatedly and confidently, that expired supplies have essentially no resale value. For test strips that is correct — a strip past date can give an unreliable reading, and nobody should be trading in those.",
        "Two exceptions break the rule, and they are not obscure items. Expired Omnipod pods, in the 5, DASH and Classic versions, still have value. Expired Dexcom G7 sensors do too. Both are paid at a reduced rate, but reduced is a long way from nothing, and both are things New Mexico households throw out weekly on the strength of advice that does not apply to them.",
        "The boundary is narrow and worth stating precisely: expired Dexcom G6 sensors do not qualify, and no other expired item does either. Check the box, then decide.",
      ],
    },
    {
      heading: "Posting from a state with no buyer in it",
      paragraphs: [
        "Get a firm figure before anything is packed. Not a range and not an estimate, but a number for the brands, counts and dates you actually have. Once your parcel is in someone else's warehouse you have no leverage left, and a buyer who will not commit beforehand is telling you something about how the conversation will go afterwards.",
        "Photograph the sealed boxes with the expiry date visible. Do not open anything to show what is inside — that destroys the value you are photographing. Keep the pictures until the money has arrived, because if anything is disputed, the condition of the boxes at the moment they left New Mexico is the only fact that settles it.",
        "The label should be prepaid and tracked, and it should cost you nothing. Payment follows within 24 hours of the parcel arriving and being verified against your description.",
      ],
    },
    {
      heading: "What qualifies",
      paragraphs: [
        "Strips: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. Six months or more before the expiry date, and remember that one 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
        "Sensors and monitors: Dexcom G6 sensors and transmitters, G7 sensors and receivers, FreeStyle Libre 1, 2 and 3. One qualifier on Libre catches people out — US retail versions only. Sensors sourced from outside the country cannot be resold here regardless of condition.",
        "Pods and pump components: Omnipod 5, DASH and Classic pods, plus some sealed Medtronic and Tandem parts. If you are unsure whether a particular component is on the list, ring 518-779-9751 before posting it rather than after.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there a buyer in Albuquerque or Santa Fe?",
      a: "No. There is no listed buyer anywhere in New Mexico, so an in-person sale is not an option this directory can offer you. Mail-in with a prepaid label is the realistic route from every one of the state's 371 ZIP codes.",
    },
    {
      q: "Who ends up with the supplies I sell?",
      a: "Generally people buying out of pocket because nothing is covering the cost for them. In a state where 15.6% of working-age adults are uninsured, that is not an abstract group. It is also why sealed condition is non-negotiable — the next person has to be able to trust the box.",
    },
    {
      q: "My relative has died and I am clearing the house. Can I sell what I find?",
      a: "Yes, provided the boxes are sealed and were not obtained through Medicare or Medicaid. You are not asked to account for how the supplies came to be in the house. Check dates before discarding anything — Omnipod pods and Dexcom G7 sensors still have value past expiry.",
    },
    {
      q: "Do expired Dexcom sensors count?",
      a: "G7 sensors do, at a reduced rate. G6 sensors do not. It is a genuine distinction rather than a technicality, so read the box rather than assuming that all Dexcom stock behaves the same way.",
    },
    {
      q: "How long does the whole thing take from New Mexico?",
      a: "Transit time plus verification, then payment within 24 hours of the parcel being received and checked. The clock starts at arrival rather than at posting, which is why the tracking number is worth keeping.",
    },
  ],
}
