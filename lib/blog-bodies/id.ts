import type { PostBody } from "./types"

/**
 * Idaho — built on valuation mechanics rather than geography.
 *
 * Idaho's headline number is Rexburg at 4.3%, the lowest city reading in the
 * data, sitting 7.3 points below Caldwell inside the same small state. That is
 * a striking spread, and the useful thing about it is that it changes nothing
 * about what any individual seller gets. So this post inverts the usual
 * structure: it opens on what actually sets the value of a box — brand, count,
 * dates, seal, quantity — and uses the Rexburg/Caldwell gap as the argument
 * that where you live is not on that list. The no-buyer fact and the 394-mile
 * distance are stated plainly but sit late, because they are not the spine.
 *
 * Deliberately avoids Utah's "low-prevalence state, so where do the supplies
 * go" argument, which is already written. Figures from lib/state-health-data.ts
 * and lib/blog-angles.ts. No prices anywhere.
 */
export const ID: PostBody = {
  label: "What actually sets the value of a box in Idaho — and what doesn't",
  title: "Selling Diabetic Test Strips in Idaho: What Actually Sets the Number",
  heading: "Selling Diabetic Test Strips in Idaho",
  metaDescription:
    "Rexburg reads 4.3% and Caldwell 11.6%, and neither figure changes what your boxes are worth. What actually moves the number in Idaho: brand, count, dates, seal and quantity.",

  lead: [
    "Idaho contains the widest and the narrowest ends of this in one small state. Caldwell's diagnosed diabetes rate is 11.6%. Rexburg's is 4.3% — the lowest reading of any city in this data set, less than half the national figure of 12.1%. Four of the state's largest cities sit in the same valley and still differ by several points.",
    "None of which affects what your boxes are worth. That is the point of this page. What decides the number is what is in the boxes, what condition they are in and how many of them there are — and people routinely give away value by not knowing which of those things they can still change.",
  ],

  sections: [
    {
      heading: "The four things that move the number",
      paragraphs: [
        "Brand and product first. Test strips are the familiar half: FreeStyle Lite, Contour Next in all versions, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. Continuous monitoring is the other half and usually the more valuable one: Dexcom G6 sensors and transmitters, G7 sensors and receivers, FreeStyle Libre 1, 2 and 3. Omnipod pods in the 5, DASH and Classic versions, pods rather than controllers. Some sealed Medtronic and Tandem components too, though those are worth a call rather than an assumption.",
        "Count second, and this is the one people get wrong most often. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand, even though the strips inside add up to the same number. If you have a choice about which boxes to send, that difference is free money and most sellers never notice it.",
        "Dates third. Test strips want at least six months left before expiry. Under that the value drops away quickly, because whoever ends up using them needs enough time to work through the box before it turns.",
        "Quantity fourth. Ten or more boxes earns a better per-box rate than the same boxes trickled out separately, and a mixed lot is quoted as one lot rather than item by item. You do not need to separate brands or types before sending — sorting them is helpful for describing what you have, not a requirement.",
      ],
    },
    {
      heading: "The two disqualifiers, which are absolute",
      paragraphs: [
        "The seal has to be intact. Factory-sealed, unopened, in the manufacturer's original packaging. An opened box is worth nothing at all, because nobody downstream has any way to know how it was stored or what happened to it. This is not a grading question with a lower tier — it is the difference between an item and no item.",
        "And the supplies cannot have been obtained through Medicare or Medicaid. Stock paid for by those programmes cannot be resold. If yours came through private insurance or you bought it retail, that is a different situation entirely, and a pharmacy label with your name printed on it is irrelevant — nobody is asking you to account for how you came to have them.",
        "FreeStyle Libre carries one extra condition worth flagging separately: US retail versions only. Sensors purchased outside the country cannot be resold here, whatever state they are in.",
      ],
    },
    {
      heading: "The expiry advice that is right about strips and wrong about everything else",
      paragraphs: [
        "The most-read guide on this subject in the country tells readers that expired supplies have very low or no resale value, full stop. For test strips it has that right. A degraded strip returns an inaccurate reading, an inaccurate glucose reading is a safety problem rather than a bargain, and nobody should be buying or selling them.",
        "Applied to everything else, it is simply wrong, and it is wrong about the two items people are most likely to bin on its authority. Expired Omnipod pods — 5, DASH and Classic — still carry value. So do expired Dexcom G7 sensors. Both at a reduced rate rather than nothing.",
        "Expired Dexcom G6 sensors do not qualify. Nothing else past its date does either. Two exceptions, and knowing them is worth more than every other paragraph on this page put together.",
      ],
    },
    {
      heading: "Where the buyers are, which is not Idaho",
      paragraphs: [
        "There is no buyer listed anywhere in Idaho. The nearest one to the centre of the state is roughly 394 miles out, which is shorter than the equivalent figure from Montana or the Dakotas and still far too far to drive with a bag of boxes.",
        "So this is a postal transaction from anywhere in Idaho — Boise City, Coeur d'Alene, Twin Falls or a ZIP code with three hundred people in it. The label is prepaid and reaches all 280 of the state's ZIP codes at no cost to you. If a buyer asks you to pay postage on a sale like this, that alone tells you what you are dealing with.",
        "Get the actual figure in writing before the parcel leaves. Not a range, not an \"up to\", not a table of averages — the number for what you specifically have, based on brand, count and dates. Once your boxes are 394 miles away, a buyer who never committed to a figure has no reason to start.",
      ],
    },
    {
      heading: "Why Rexburg and Caldwell read so differently",
      paragraphs: [
        "Type 2 diabetes risk climbs steeply with age, so a city's reading tracks its age profile more closely than almost anything else. A town whose population skews heavily young will report a low rate almost regardless of what else is true about it, and that is the most likely explanation for a figure as low as Rexburg's 4.3%.",
        "Idaho as a whole reads 10.1% on the CDC's 2023 BRFSS estimates, below the national 12.1%, with 17.7% of the population aged 65 or over and 10.7% of working-age adults uninsured. Nampa is 10.6%, Idaho Falls 10.2%, Twin Falls 10.7%, Post Falls 10.0% — a cluster of towns that look much alike, with Boise City at 8.7% and Meridian at 8.4% below them.",
        "For a seller none of this is actionable, and it is worth saying so directly rather than dressing a statistic up as advice. It explains why no buyer has set up in a state of just under two million people. It has no bearing on what your unopened boxes are worth.",
      ],
    },
  ],

  faqs: [
    {
      q: "I have two 50-count boxes rather than one 100-count. Does that really matter?",
      a: "Yes, more than most people expect. A single 100-count box is worth meaningfully more than two 50-count boxes of the same brand holding the same number of strips. It is one of the few things about a pile of supplies that is worth checking before you decide what to send.",
    },
    {
      q: "Do I need to sort everything by brand before sending it?",
      a: "No. A mixed lot is quoted as one lot, so different brands and different product types can travel together. Sorting helps you describe accurately what you have when you ask for a figure, which is worth doing, but it is not a condition of the sale.",
    },
    {
      q: "Is it worth sending just two or three boxes?",
      a: "It can be, since the label costs you nothing either way. But ten or more boxes earns a better per-box rate, so if you expect more to accumulate it is usually worth waiting and sending once rather than making several small shipments.",
    },
    {
      q: "Does living in a low-rate part of Idaho affect what I am offered?",
      a: "No. Offers are set by brand, count, expiry dates and condition. Rexburg reading 4.3% and Caldwell reading 11.6% describes who lives there, not what a sealed box of Contour Next is worth.",
    },
    {
      q: "I bought Libre sensors while travelling outside the US. Can I sell them?",
      a: "No. FreeStyle Libre has to be the US retail version. Sensors bought abroad cannot be resold here regardless of condition or how recently they were purchased, and this catches people out often enough to be worth checking the packaging.",
    },
    {
      q: "How quickly does payment happen from Idaho?",
      a: "Payment is made within 24 hours of the parcel being received and verified. Verification means the boxes are checked against what you described — brand, count, dates, seals. The transit time before that depends on where in the state you posted from.",
    },
  ],
}
