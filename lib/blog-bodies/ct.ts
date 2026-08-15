import type { PostBody } from "./types"

/**
 * Connecticut — no in-state buyer. Hartford 15.8% against Stamford 8.6%, a
 * 7.2-point gap across about forty miles of I-95 and one of the sharpest
 * wealth gradients in the country.
 *
 * Deliberately framed around that gradient. Rhode Island shares the same
 * generated angle and is the same size, so the two pages must not converge:
 * RI is written around being small enough to reach three states' buyers, this
 * one around inequality inside a single small state.
 */
export const CT: PostBody = {
  label: "Hartford vs the coast",
  title: "Selling Diabetic Test Strips in Connecticut: Hartford and Stamford Are Not the Same State",
  heading: "Selling Diabetic Test Strips in Connecticut",
  metaDescription:
    "Hartford reads 15.8% for diagnosed diabetes. Stamford, forty miles down I-95, reads 8.6%. No in-state buyer — how to sell from Connecticut, and the two expired items worth keeping.",

  lead: [
    "Connecticut is a small state with one of the widest internal gaps in the country. Hartford reads 15.8% for diagnosed diabetes. Stamford, about forty miles down I-95, reads 8.6%. New Haven and Bridgeport sit closer to Hartford than to Stamford.",
    "There is no test strip buyer listed anywhere in Connecticut, so everything here goes by post. But the gap is worth understanding, because it is the clearest answer to whether any of this actually helps anyone.",
  ],

  sections: [
    {
      heading: "Two Connecticuts, forty miles apart",
      paragraphs: [
        "Statewide the figure is 10.2%, comfortably below the national rate of 12.1%. On that number alone Connecticut looks like one of the healthier states in the country.",
        "It is, in Stamford, Greenwich and the Gold Coast towns. It is not in Hartford at 15.8%, or in Bridgeport and New Haven, which are among the poorer cities in New England despite sitting in one of the wealthiest states.",
        "10.0% of working-age residents have no health insurance, and that figure is concentrated in the same places as the diabetes rate. For someone uninsured in Hartford, retail is the only price, and retail on test strips is punishing. Sealed supplies that would otherwise be thrown out do not sit around long.",
      ],
    },
    {
      heading: "There is no buyer here, and what that means",
      paragraphs: [
        "Nobody is listed in Connecticut. The nearest options are the New York City buyer to the south-west and the Boston buyer to the north-east, both of which are a genuine drive rather than a quick errand from most of the state.",
        "From Stamford, New York City is close enough that it may be worth asking about for a large lot. From Hartford, both are roughly two hours. For anything smaller than a big lot, mail-in is simply easier and the label costs you nothing across all 289 of the state's ZIP codes.",
        "Connecticut is compact enough that transit times are short either way — usually a day or two.",
      ],
    },
    {
      heading: "The two expired things worth keeping",
      paragraphs: [
        "Nearly every guide on this subject says expired supplies are worthless. For test strips that is right — a degraded strip gives an inaccurate reading, which is a safety problem rather than a bargain.",
        "Two exceptions, and they are the two thrown away most often. Expired Omnipod pods — 5, DASH and Classic — still have value. So do expired Dexcom G7 sensors. Both pay at a reduced rate rather than nothing.",
        "Expired Dexcom G6 sensors do not qualify, and neither does anything else. But before a clear-out goes out with the rubbish, those two are worth pulling aside.",
      ],
    },
    {
      heading: "What makes a box sellable",
      paragraphs: [
        "Factory-sealed and unopened, in the original packaging. An opened box cannot be resold at any price, because nobody downstream can verify how it was stored. This is the most common reason a parcel is refused.",
        "Not obtained through Medicare or Medicaid. Supplies paid for by those programmes cannot legally be resold. Private insurance or out of pocket is fine, and a pharmacy label carrying your name makes no difference.",
        "For test strips, at least six months before the expiry date. Below that the value drops away quickly.",
        "Check the count before dismissing a small stack — a 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
      ],
    },
    {
      heading: "Selling by post properly",
      paragraphs: [
        "Get the number in writing before anything ships. The actual figure for what you actually have — brand, count, expiry dates — not a range and not an \"up to\". A buyer who will not commit before your parcel leaves intends to revise once it has arrived, and at that point you have no leverage left.",
        "Use the prepaid label and keep the tracking number. Payment runs from when the parcel is received and verified rather than from when you posted it.",
        "Photograph the sealed boxes with dates and lot numbers visible before they go, and keep those photographs until the money lands. Do not open a box to photograph the contents — opening it destroys the thing that gave it value.",
        "If the number changes on arrival, ask for the specific reason and for photographs of what was received. A concrete cause is legitimate; a vague one is a renegotiation, and you can ask for the supplies back instead.",
      ],
    },
    {
      heading: "Who usually ends up selling",
      paragraphs: [
        "19.5% of Connecticut residents are 65 or over, one of the higher shares in the country, and that is where most unused supplies originate — a prescription changed, a move into assisted living, or a family clearing a house after a death.",
        "It is rarely someone who set out to sell diabetic supplies. Most people arrive here having already decided the alternative was throwing them away.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there a buyer anywhere in Connecticut?",
      a: "No. The nearest listed options are New York City to the south-west and Boston to the north-east. From Stamford, New York may be worth asking about for a large lot; from most of the state, mail-in is easier and costs you nothing.",
    },
    {
      q: "Why is Hartford's rate so much higher than Stamford's?",
      a: "Hartford reads 15.8% and Stamford 8.6% — a 7.2-point gap across about forty miles. It follows income, insurance coverage and food access rather than distance. Bridgeport and New Haven sit closer to Hartford than to Stamford.",
    },
    {
      q: "Are expired supplies worth anything?",
      a: "Two things are: Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors, both at a reduced rate. Expired test strips and expired Dexcom G6 sensors are not worth selling.",
    },
    {
      q: "My supplies came through Medicaid. Can I sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold. Anything you received through private insurance or paid for yourself is fine.",
    },
    {
      q: "How quickly will I be paid?",
      a: "A day or two in transit from Connecticut, then payment within 24 hours of the parcel being received and verified. The shipping label is prepaid and costs you nothing.",
    },
    {
      q: "Can I send different brands in one parcel?",
      a: "Yes. Mixed lots are quoted as a single lot rather than item by item, and ten or more boxes generally earns a better per-box rate than the same boxes sold separately.",
    },
  ],
}
