import type { PostBody } from "./types"

/**
 * Tennessee — no in-state buyer. Built as a valuation page: what actually
 * moves the number, ordered from the checks that can zero a box outright down
 * to the ones that adjust it at the margin. That is the literal reading of the
 * "worth" angle and nobody writing about this subject does it properly —
 * competitor pages describe the process, not the mechanics.
 *
 * Massachusetts shares the generated angle and is built on the who-paid
 * question instead, which suits a state with near-universal coverage. There is
 * no shared structure or argument between the two.
 *
 * Because the site quotes payout tiers rather than prices, this page describes
 * direction and relative magnitude only. No dollar figures anywhere.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts.
 */
export const TN: PostBody = {
  label: "What actually decides the number, in order of how much it matters",
  title: "What Diabetic Test Strips Are Worth in Tennessee: What Moves the Number",
  heading: "What Diabetic Test Strips and Supplies Are Worth in Tennessee",
  metaDescription:
    "Six things decide what a box of diabetic supplies is worth, and the first three can take it to nothing. A Tennessee seller's guide to valuation, in order of how much each factor matters.",

  lead: [
    "Most pages about selling diabetic supplies describe the process — get a quote, post the box, get paid. Very few explain what the quote is actually built from, which is the thing anyone holding a pile of boxes wants to know before they start.",
    "Six factors decide it. The first three are pass-or-fail and can take a box to nothing on their own. The last three adjust the number once a box has cleared them. Tennessee has no listed buyer of its own, in Nashville, Memphis, Knoxville or anywhere else, so the sale runs by post — but the valuation is the same wherever you are sending it from.",
  ],

  sections: [
    {
      heading: "One: the seal, which decides everything or nothing",
      paragraphs: [
        "A box has to be factory-sealed, unopened and in its original packaging. The seal is not a cosmetic preference. It is the only mechanism by which the next person can establish that nothing has been swapped, split or stored badly since the box left the manufacturer.",
        "So an opened box is not worth less. It is worth nothing, and there is no version of the conversation in which that changes. Not one that was opened and immediately closed, not one where the contents are visibly untouched, not one that has been carefully taped back up.",
        "The practical instruction that follows is one people get wrong regularly: never open a box to photograph what is inside it for a quote. Photograph the outside with the expiry date and lot number readable. Opening it is the one action that guarantees you get nothing.",
      ],
    },
    {
      heading: "Two: who paid for it",
      paragraphs: [
        "Supplies obtained through Medicare or Medicaid cannot be resold, and no condition or brand changes that. This is a restriction on the supplies themselves rather than a judgement about the seller.",
        "Supplies bought retail or received through private insurance are not affected. Nor is a pharmacy label with your own name on it — that is entirely ordinary and appears on most of what gets sold. The question is which programme paid, not what is printed on the sticker.",
        "About 11.6% of working-age Tennesseans have no health insurance, above the national picture, which is part of why a second-hand market in sealed supplies exists here at all.",
      ],
    },
    {
      heading: "Three: the date, with two named exceptions",
      paragraphs: [
        "Test strips should have at least six months before their expiry date. Below that the number falls away quickly, because the person who uses them next needs a realistic window in which to do it. Past the date entirely, a strip is worth nothing and should not be sold by anyone — a degraded strip can give an unreliable reading, which is a safety question rather than a price.",
        "The exceptions are narrow and specific. Expired Omnipod pods, in the 5, DASH and Classic versions, still pay at a reduced rate. Expired Dexcom G7 sensors do too. Expired Dexcom G6 sensors do not, and nothing else past date does either.",
        "This matters because the most-read guide on this subject in the country states flatly that expired supplies have very low or no resale value. As a general rule it is sound. As a blanket rule it sends two genuinely valuable items to the bin, and they are two of the most common items in a Tennessee clear-out.",
      ],
    },
    {
      heading: "Four: the brand and product",
      paragraphs: [
        "Once a box has cleared the first three checks, the product itself sets the band. Test strips: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. CGM: Dexcom G6 sensors and transmitters, G7 sensors and receivers, FreeStyle Libre 1, 2 and 3 sensors. Pods: Omnipod 5, DASH and Classic.",
        "Some sealed Medtronic and Tandem components qualify as well, but which ones depends on the part rather than the brand, and that is a call to 518-779-9751 rather than an assumption in either direction.",
        "One restriction sits inside this factor rather than alongside it: FreeStyle Libre must be a US retail version. A sensor bought abroad is not a lower-value Libre, it is an unsellable one.",
      ],
    },
    {
      heading: "Five: the count on the box",
      paragraphs: [
        "Box size is the factor people most often assume is neutral, and it is not. A single 100-count box of strips is worth meaningfully more than two 50-count boxes of the same brand, even though the number of strips is identical.",
        "The practical consequence is that you should never break a large box down into smaller units, and should not think of small boxes as interchangeable with large ones when estimating what you have. Keep the packaging exactly as it came.",
      ],
    },
    {
      heading: "Six: how much you send at once",
      paragraphs: [
        "Quantity improves the per-box rate. Ten or more boxes does better than the same boxes split into several small sends, so there is a real cost to drip-feeding a collection out over months.",
        "Mixing types is not a problem and does not need managing. Strips, sensors and pods go together as one lot and are quoted as one lot rather than sorted item by item. There is no advantage in separating brands, and separating them can push each parcel below the threshold where the rate improves.",
      ],
    },
    {
      heading: "Who is doing the selling in Tennessee",
      paragraphs: [
        "About 13.6% of Tennessee adults have diagnosed diabetes against 12.1% nationally, and the internal spread is wide: Memphis reads 17.6% and Jackson 16.7% at one end, Franklin 9.6% and Murfreesboro 9.9% at the other, an eight-point gap between towns in the same state. Nashville-Davidson sits at 10.9%, Chattanooga at 13.9%, Knoxville at 12.6%.",
        "Around 17.7% of the state is 65 or over, and that cohort is where most surplus supplies originate — a prescription changes, someone moves onto a sensor, or a family clears a house and finds boxes nobody had opened. Very little of what gets sold was bought with selling in mind.",
        "Across 636 ZIP codes and no buyer anywhere in the state, the route is the same from all of them: a written quote agreed first, a prepaid tracked label that costs you nothing, and payment within 24 hours of the parcel being received and verified.",
      ],
    },
  ],

  faqs: [
    {
      q: "Which factor makes the biggest difference to what I get?",
      a: "The seal, by a distance, because it is the one that can take a box from its full value to nothing. Source and dates come next. Brand, box count and lot size adjust the figure but only once a box has cleared the first three.",
    },
    {
      q: "Is there a buyer anywhere in Tennessee?",
      a: "No listing in Memphis, Nashville, Knoxville, Chattanooga or anywhere else in the state. Mail-in with a prepaid label is the honest answer from all 636 ZIP codes.",
    },
    {
      q: "Why is one 100-count box worth more than two 50s?",
      a: "Because the box itself is the unit that gets resold, and a larger box carries more value in a single sealed package. It is also why breaking a large box down works against you.",
    },
    {
      q: "Do expired supplies have any value?",
      a: "Omnipod pods in the 5, DASH and Classic versions and Dexcom G7 sensors do, at a reduced rate. Expired test strips and expired Dexcom G6 sensors do not.",
    },
    {
      q: "Should I get a quote before or after I post?",
      a: "Before, always, and in writing against the brands, counts and dates you actually hold. A figure produced after the parcel has arrived somewhere is not one you agreed to, and there is nothing left to push back with at that point.",
    },
    {
      q: "Can I send strips, sensors and pods in the same parcel?",
      a: "Yes, and it is usually better. Mixed lots are quoted as one lot, and keeping everything together helps reach the ten-box point where the per-box rate improves.",
    },
  ],
}
