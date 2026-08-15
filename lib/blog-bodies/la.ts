import type { PostBody } from "./types"

/**
 * Louisiana — one listed buyer, Baton Rouge, and the highest state diabetes
 * rate in this batch at 15.2%. The striking fact in the brief is that every
 * one of the ten Louisiana cities we hold figures for sits above the national
 * rate: the lowest, Metairie, reads 13.4% against a national 12.1%. There is
 * no low-prevalence corner of this state.
 *
 * The page is built as a practical guide to assembling a lot, which is what
 * follows from that: in Louisiana households genuinely do accumulate multiple
 * boxes, and how you group and describe them is what determines the rate.
 * Nobody else writes an inventory-and-packing page for this.
 *
 * New Hampshire and South Carolina share the generated bulk angle and are
 * built differently — NH on the wait-versus-send decision, SC on whether the
 * in-person option is worth the drive.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts.
 */
export const LA: PostBody = {
  label: "Putting a lot together in the state with no low-prevalence corner",
  title: "Selling Diabetic Supplies in Louisiana: How to Put a Lot Together",
  heading: "Selling Diabetic Test Strips and Supplies in Louisiana",
  metaDescription:
    "Every major Louisiana city sits above the national diabetes rate, and there is a listed buyer in Baton Rouge. A practical guide to assembling, describing and sending a mixed lot of diabetic supplies.",

  lead: [
    "Louisiana is the rare state with no low-prevalence corner. About 15.2% of adults here have diagnosed diabetes against 12.1% nationally, and the lowest figure among the state's ten cities is Metairie at 13.4% — still above the national line. Monroe reads 19.7%, Alexandria 19.1%, Shreveport 17.6%, Baton Rouge 15.3%, New Orleans 15.1%.",
    "The practical effect is that Louisiana households accumulate supplies. Not one stray box, but a drawer of them, often across several brands and several years of prescription changes. This page is about what to do with that: how to group it, how to describe it, and where the value is won. There is one listed buyer in the state, in Baton Rouge, and everywhere else is a prepaid parcel.",
  ],

  sections: [
    {
      heading: "Do not sort it into brands",
      paragraphs: [
        "The instinct with a drawer full of mixed supplies is to separate it — strips here, sensors there, this brand from that one — and then sell each pile to whoever seems best for it. That is more work for a worse result.",
        "A mixed lot is quoted as a single lot. There is no requirement to separate types or brands, and no advantage in doing it. What matters is the total, because ten or more boxes earns a better per-box rate than the same boxes broken into small sends. Splitting a drawer across three parcels can move every one of them below that threshold.",
        "The one grouping decision that does matter runs the other way. Do not break large boxes down to make a lot look bigger, and do not think of two 50-count boxes as equivalent to one 100-count box. They are not: the 100-count box is worth meaningfully more than the pair.",
      ],
    },
    {
      heading: "Write the inventory before you ring anyone",
      paragraphs: [
        "A quote is only as good as the description it was given against, so the description is worth ten minutes. For each box: the brand and product name, the count, the expiry date, and whether the seal is intact. That is four pieces of information and it is all anyone needs.",
        "Doing it in advance has a second benefit. Working through the drawer box by box is how you find the items that do not qualify before they are in a parcel rather than after — the one that has been opened, the one with a date four months out, the sensor a relative brought back from abroad.",
        "Then get the figure agreed in writing against that inventory, before anything is packed. Once the parcel is in another state, the written quote is the whole of your position.",
      ],
    },
    {
      heading: "What comes out of the pile before it ships",
      paragraphs: [
        "Any box that has been opened. The factory seal is the reason a box can be resold at all — it is what allows the next person to establish that nothing has been altered. An opened box is worth nothing, not a reduced amount, and this is the most common reason a parcel comes back.",
        "Anything obtained through Medicare or Medicaid, which cannot be resold whatever its condition. A pharmacy label with your own name on it is entirely ordinary and does not affect the sale; the question is who paid, not what is printed on the sticker.",
        "Test strips with less than six months before expiry, where the value falls away sharply. And FreeStyle Libre sensors that are not US retail versions — sensors bought outside the country cannot be resold here regardless of date or condition.",
      ],
    },
    {
      heading: "What should not come out of the pile",
      paragraphs: [
        "Two expired items, both of which the best-known guide on this subject tells readers to treat as worthless. Expired Omnipod pods — 5, DASH and Classic — still pay at a reduced rate. Expired Dexcom G7 sensors do too.",
        "That guide is right about test strips, and so are we: a strip past its date can give an unreliable reading, and that is a safety question rather than a pricing one. Expired Dexcom G6 sensors are also out. But the blanket version of the advice costs Louisiana sellers real money, and in a drawer that has been accumulating for years, expired pods are exactly the thing most likely to be in it.",
        "So work through dates last, not first. A date alone does not decide whether something goes in the bin.",
      ],
    },
    {
      heading: "Baton Rouge, and the rest of the state",
      paragraphs: [
        "The Baton Rouge listing is the only in-person option in Louisiana. For the capital region it is genuinely convenient, and an in-person sale removes the gap between handing the boxes over and being paid, which is the part of a postal sale people like least.",
        "It does not do much for the north of the state, and the north is where the rates are highest. Monroe at 19.7%, Alexandria at 19.1% and Shreveport at 17.6% are the three highest figures in Louisiana and none of them is a short trip to Baton Rouge. From up there, and from the Lafayette and Lake Charles side as well, posting is the sensible route rather than a compromise.",
        "The prepaid tracked label costs nothing from any of the state's 539 ZIP codes. Payment follows within 24 hours of the parcel being received and verified against the inventory you supplied.",
      ],
    },
  ],

  faqs: [
    {
      q: "Do I need to separate brands or types before sending?",
      a: "No. A mixed lot is quoted as one lot. Separating it takes time and can push you below the ten-box threshold where the per-box rate improves, so it works against you twice.",
    },
    {
      q: "Is the Baton Rouge buyer worth the drive from Shreveport or Monroe?",
      a: "Generally not. That is the other end of the state and the prepaid label costs nothing. The in-person option is genuinely useful for the Baton Rouge region and less so the further north you go.",
    },
    {
      q: "What should my inventory list actually say?",
      a: "Brand and product name, count, expiry date, and confirmation the seal is intact, for each box. That is what a quote is given against, and having it written down before you call makes the whole exchange faster.",
    },
    {
      q: "I have two 50-count boxes rather than one 100. Does it matter?",
      a: "Yes. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand, which is also why you should never break a large box down.",
    },
    {
      q: "There are expired pods in the drawer. Bin them?",
      a: "No. Omnipod 5, DASH and Classic pods still pay past their expiry date, at a reduced rate, and so do expired Dexcom G7 sensors. Expired test strips and expired G6 sensors are the ones to discard.",
    },
    {
      q: "How long does payment take?",
      a: "Within 24 hours of the parcel being received and verified. Verification is someone checking the boxes against your inventory, which is why an accurate list at the start makes the end faster.",
    },
  ],
}
