import type { PostBody } from "./types"

/**
 * Wyoming — the smallest population in the country at 585,264, across 178 ZIP
 * codes. The page is built on that arithmetic: with the fewest people of any
 * state and a below-average diabetes rate, the number of sealed surplus boxes
 * generated in Wyoming in a year is small, and no buyer is ever going to open
 * a counter to serve it. Saying that plainly, and then explaining that a small
 * lot is still worth posting because the label costs nothing, is the most
 * useful thing this page can do.
 *
 * Distinct from Nebraska (evenness of demand) and Kentucky (a sorting guide),
 * which share the generated expired angle, and from Montana (distance to the
 * nearest buyer) which is the other empty-state page.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts and
 * no distances, since none are in the Wyoming brief.
 */
export const WY: PostBody = {
  label: "The smallest state in the country, and why no buyer will set up here",
  title: "Selling Diabetic Test Strips in Wyoming: Small State, No Buyer, Free Postage",
  heading: "Selling Diabetic Test Strips in Wyoming",
  metaDescription:
    "Wyoming has the smallest population in the country and no diabetic supply buyer. That is arithmetic rather than oversight. Here is why a small lot is still worth posting, and what qualifies.",

  lead: [
    "Wyoming has 585,264 people, fewer than any other state, spread across 178 ZIP codes. About 10.9% of adults here have diagnosed diabetes, below the national figure of 12.1%. Multiply a below-average rate by the smallest population in the country and you get the reason there is no diabetic supply buyer in Wyoming and very likely never will be.",
    "That is worth saying without apology. It is not that the state has been overlooked; it is that the volume of sealed surplus supplies generated here in a year would not keep a counter open. Everything below therefore assumes the post office, and the good news buried in that is simple — the postage costs you nothing, so a small lot is still worth sending.",
  ],

  sections: [
    {
      heading: "Two boxes is still worth doing",
      paragraphs: [
        "The most common reason people in a state like this never sell anything is that they assume a handful of boxes is not worth the trouble. It is a reasonable assumption and it happens to be wrong, because the trouble is smaller than they think.",
        "There is no minimum lot and no charge for the shipping label, so the cost of sending two boxes is the ten minutes it takes to photograph them and hand the parcel over. The only thing scale changes is the rate: ten or more boxes earns a better per-box rate than a small send. A small lot pays less per box, not nothing.",
        "If you do have the option of waiting until you have more, weigh it against the dates. Test strips want at least six months before expiry, so a box you hold back for a year may cross that line while it sits in the cupboard. Waiting to build a bigger lot is sensible; waiting until the dates go is not.",
      ],
    },
    {
      heading: "Two things people in Wyoming bin that they should not",
      paragraphs: [
        "Nearly every article on this subject tells readers that expired supplies are worth very little or nothing at all. That is correct about test strips, and it is correct for a good reason — a strip past its date can give an unreliable reading, which is a safety matter rather than a bargain to be had.",
        "It is not correct about Omnipod pods, in the 5, DASH and Classic versions, which still pay past their expiry date at a reduced rate. Nor about Dexcom G7 sensors, which do the same. Those two are the whole exception list; expired Dexcom G6 sensors do not qualify and neither does anything else.",
        "In a house clear-out, those are exactly the items most likely to go straight in the bin on the strength of a date. Check the box first.",
      ],
    },
    {
      heading: "Jackson and Riverton are not the same state",
      paragraphs: [
        "For a state this small, Wyoming carries a real internal spread. Riverton reads 11.7% and Jackson 6.6%, a difference of 5.1 points, with Casper at 11.0%, Cheyenne at 10.6% and Laramie at 7.0%. That is a resort town and a university town at one end and everywhere else at the other.",
        "Age is the more useful figure for anyone wondering where surplus supplies come from: 19.8% of Wyoming is 65 or over. Most sealed boxes that get sold were never bought with selling in mind — a prescription changed, someone moved onto a pump or a sensor, or a family cleared a house and found a cupboard of stock nobody had opened.",
        "Around 11.6% of working-age adults in the state have no health insurance, which is above the national picture and part of why sealed supplies find a second buyer at all.",
      ],
    },
    {
      heading: "What qualifies and what does not",
      paragraphs: [
        "Accepted, sealed and in date: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra and True Metrix test strips; Dexcom G6 sensors and transmitters; Dexcom G7 sensors and receivers; FreeStyle Libre 1, 2 and 3 sensors; Omnipod 5, DASH and Classic pods; and some sealed Medtronic and Tandem components.",
        "Two qualifiers on that list. FreeStyle Libre must be a US retail version, so sensors obtained abroad cannot be resold here at all. And box count is worth attention — one 100-count box of strips is worth meaningfully more than two 50-count boxes of the same brand, so keep large boxes intact.",
        "Not accepted under any circumstances: anything opened, and anything obtained through Medicare or Medicaid. The first is because the seal is what makes the box resellable at all. The second is a restriction on the supplies themselves rather than a judgement about you, and a pharmacy label with your own name on it has no bearing on it either way.",
      ],
    },
    {
      heading: "How the sale runs from here",
      paragraphs: [
        "Ring or write first and get the figure agreed against what you actually have — the brands, the counts, the dates. A quote that only materialises after your parcel has arrived somewhere else is not a quote you agreed to, and by then there is nothing to push back with. The number is 518-779-9751.",
        "Photograph the sealed boxes with the dates visible before packing, keep the tracking number, and keep the pictures until you have been paid. The label is prepaid, so the whole thing costs you nothing to complete.",
        "Payment follows within 24 hours of the parcel being received and verified. Verification means someone has checked the contents against your description, which is why the clock runs from arrival rather than from the day you posted it.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is it worth selling if I only have a couple of boxes?",
      a: "Yes. There is no minimum and the shipping label is prepaid, so a small lot costs you nothing to send. It pays a lower per-box rate than a lot of ten or more, but a lower rate is not the same as nothing.",
    },
    {
      q: "Will there ever be a buyer in Cheyenne or Casper?",
      a: "It is unlikely. Wyoming has the smallest population in the country and a below-average diabetes rate, so the volume simply is not there to support a local counter. If that ever changes, it will appear on this page.",
    },
    {
      q: "Should I wait until I have more boxes?",
      a: "Only if the dates allow it. Larger lots earn a better per-box rate, but test strips want six months or more before expiry, so holding stock too long can cost you more than the better rate gains.",
    },
    {
      q: "Do expired supplies pay anything?",
      a: "Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors do, at a reduced rate. Expired test strips and expired Dexcom G6 sensors do not, and should not be sold by anyone.",
    },
    {
      q: "What if I cannot tell whether a component is on the list?",
      a: "Ring 518-779-9751 before posting it. Some sealed Medtronic and Tandem parts qualify and some do not, and it is a faster question to ask than to guess at.",
    },
  ],
}
