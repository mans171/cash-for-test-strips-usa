import type { PostBody } from "./types"

/**
 * Virginia — no in-state buyer despite 8.7 million people and 903 ZIP codes.
 * The spine is that Virginia's two ends face outward in opposite directions:
 * the northern suburbs sit in the Washington belt and the nearest listing to
 * them is across the river in Silver Spring, Maryland, while Hampton Roads and
 * southside look to the North Carolina listings. Virginia's own map is empty
 * in the middle.
 *
 * That is a different construction from the other no-buyer pages: not distance
 * (Montana), not rurality (Iowa), not scale (Illinois), but a state whose two
 * halves belong to two different neighbours' markets. The Arlington 7.3% /
 * Portsmouth 16.1% spread reinforces it rather than being the point.
 *
 * No distances are quoted, because none are in the brief.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts.
 */
export const VA: PostBody = {
  label: "No buyer in Virginia — the state's two ends look to two neighbours",
  title: "Selling Diabetic Test Strips in Virginia: Where the Nearest Buyers Are",
  heading: "Selling Diabetic Test Strips in Virginia",
  metaDescription:
    "There is no test strip buyer anywhere in Virginia. Northern Virginia's nearest listing is in Maryland and Hampton Roads looks to North Carolina — but mail-in works the same from all 903 ZIP codes.",

  lead: [
    "Virginia has 8.7 million people, 903 ZIP codes, and no listed diabetic supply buyer anywhere inside it. Not in Richmond, not in Virginia Beach, not in Arlington. For a state of this size that is unusual, and it is the first thing anyone searching this should be told.",
    "What Virginia does have is neighbours. The northern suburbs sit inside the Washington commuter belt, where the nearest listing is across the Potomac in Silver Spring, Maryland. Hampton Roads and the southside look the other way, towards the North Carolina listings. The middle of the state looks at nothing in particular. That is why this page is organised by which part of Virginia you are in rather than by a single answer.",
  ],

  sections: [
    {
      heading: "Northern Virginia looks north",
      paragraphs: [
        "If you are in Arlington, Alexandria or the surrounding Fairfax suburbs, the closest in-person option this directory lists is not in Virginia at all — it is the Silver Spring buyer on the Maryland side. Whether crossing the river for that is worth your time depends entirely on how much you are carrying and how you feel about traffic, and neither of those is a question we can answer for you.",
        "The northern counties are also the low-prevalence end of Virginia. Arlington reads 7.3% for diagnosed diabetes among adults, the lowest of the state's ten cities, and Alexandria 9.2%. That is well under the state figure of 12.5% and the national 12.1%.",
        "For most northern Virginia sellers the sensible route is still the post. A prepaid tracked label costs nothing and removes the drive, and the quote is settled before anything moves either way.",
      ],
    },
    {
      heading: "Hampton Roads and the southside look south",
      paragraphs: [
        "The southeast is the other Virginia. Portsmouth reads 16.1%, Hampton 15.0%, Newport News 13.5%, Norfolk 12.4% and Chesapeake 12.9% — Portsmouth and Arlington are 8.8 points apart, which is the widest spread inside the state and one of the wider ones anywhere.",
        "There is no listing in Hampton Roads and none between there and the state line. The nearest in-person options are in North Carolina, which is a real drive rather than an errand. Unless you happen to be going anyway, posting is the better use of an afternoon.",
        "Roanoke, at 14.9%, and Richmond at 12.3% sit in the middle of the state with no listing in any convenient direction at all. From there, mail-in is not a fallback — it is simply what selling looks like.",
      ],
    },
    {
      heading: "What most guides get wrong about expiry dates",
      paragraphs: [
        "The article that ranks best in the country for this subject tells readers that expired supplies are worth very little or nothing. For test strips it is correct, and we would not buy them either: a degraded strip can produce an unreliable reading, which is a safety question rather than a pricing one.",
        "But two items break the rule. Expired Omnipod pods — 5, DASH and Classic — still pay. So do expired Dexcom G7 sensors. Both at a reduced rate rather than at full value, and both routinely thrown out by people following advice that was never written with them in mind.",
        "Expired Dexcom G6 sensors do not qualify. Nor does anything else past its date. Two exceptions, no more, but they are worth the thirty seconds it takes to read a label.",
      ],
    },
    {
      heading: "The rules that apply everywhere in the state",
      paragraphs: [
        "The box must be factory-sealed and unopened. An opened box is worth nothing, not less — once the seal is gone there is no way for the next holder to establish anything about it.",
        "Supplies obtained through Medicare or Medicaid cannot be resold, and no condition or date changes that. A pharmacy label with your name printed on it is a separate matter entirely and does not affect the sale.",
        "Test strips should have six months or more before expiry. Below that the value drops off sharply, because the next person needs time to actually use them.",
        "Around 8.7% of working-age Virginians are uninsured, a little below the national picture, and 17.8% of the state is 65 or over. Those two figures describe most of the people on both sides of this market.",
      ],
    },
    {
      heading: "What is bought",
      paragraphs: [
        "Test strips: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. Keep large boxes intact — one 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
        "CGM: Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 sensors. Libre has a restriction worth knowing before you post: US retail versions only, so sensors obtained abroad cannot be resold here.",
        "Pods and pumps: Omnipod 5, DASH and Classic pods, and some sealed Medtronic and Tandem components. Pods rather than controllers. Unusual components are a call to 518-779-9751 rather than a guess.",
      ],
    },
    {
      heading: "Selling by post without losing the argument",
      paragraphs: [
        "Agree the figure before the parcel is sealed, against the brands, counts and dates you actually hold. A quote produced after arrival is not a quote you agreed to, and by then the boxes are not in Virginia any more.",
        "Photograph the sealed boxes with the expiry dates visible. Do not open anything to demonstrate what is inside, because opening it is precisely what removes the value. Keep the photographs until the money has cleared.",
        "Use a prepaid tracked label and keep the tracking number. Payment follows within 24 hours of the parcel being received and verified, and the tracking record is what fixes when that clock started.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there really no buyer in Richmond or Virginia Beach?",
      a: "None listed, in either, or anywhere else in Virginia. The nearest in-person options are in Maryland for the northern suburbs and in North Carolina for the south, and for most people neither is worth the journey when a prepaid label is free.",
    },
    {
      q: "I live in Arlington. Should I go to the Maryland buyer?",
      a: "It is the closest listing to you, so it is a reasonable option if you are carrying a large lot and the trip suits you. For a handful of boxes, posting is simpler and costs you nothing.",
    },
    {
      q: "Do expired Omnipod pods really still pay?",
      a: "Yes, at a reduced rate, across the 5, DASH and Classic versions. Expired Dexcom G7 sensors are the only other exception. Everything else past its date, including expired G6 sensors and all test strips, is not worth selling.",
    },
    {
      q: "What if a box has been opened but nothing was used?",
      a: "It cannot be sold. The seal is what allows anyone downstream to trust the contents, and there is no way to restore that once it is broken. This is the most common reason a parcel is returned.",
    },
    {
      q: "Can I include Libre sensors a relative brought back from abroad?",
      a: "No. Only US retail versions can be resold here, regardless of how new or well kept the sensors are. Sensors from your own US prescription are fine.",
    },
    {
      q: "How much does posting cost me from Virginia?",
      a: "Nothing. The label is prepaid from any of the state's 903 ZIP codes. If you are asked to pay for shipping on a sale like this, that is a reason to stop and ask why.",
    },
  ],
}
