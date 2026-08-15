import type { PostBody } from "./types"

/**
 * Pennsylvania — four listed buyers, more than any other state: Philadelphia,
 * Pittsburgh, Hazleton and Greencastle. That is the story here, and it is the
 * one state where "there is probably someone near you" is actually true.
 *
 * Note the vintage: Pennsylvania is one of two states absent from the 2025 CDC
 * PLACES release, so its figures are BRFSS 2022 rather than 2023. Every number
 * quoted below is cited as 2022 accordingly. Do not "correct" that to 2023.
 */
export const PA: PostBody = {
  label: "Best coverage",
  title: "Selling Diabetic Test Strips in Pennsylvania: Four Buyers, Most of the State",
  heading: "Selling Diabetic Test Strips in Pennsylvania",
  metaDescription:
    "Pennsylvania has more listed in-person buyers than any other state — Philadelphia, Pittsburgh, Hazleton and Greencastle. Where each one reaches, and the two expired items worth keeping.",

  lead: [
    "Pennsylvania is the best-covered state on this directory. There are four in-person buyers listed here — Philadelphia, Pittsburgh, Hazleton and Greencastle — against one or two in most states that have any at all, and none in thirty-one of them.",
    "Practically, that means most Pennsylvanians are within a sensible drive of somebody, and an in-person handover with cash the same day is a realistic option rather than a theoretical one.",
  ],

  sections: [
    {
      heading: "Which buyer covers where",
      paragraphs: [
        "Philadelphia covers the southeast — the city itself, the surrounding counties, and out toward Levittown and the Lehigh Valley. This is the densest part of the state and the easiest handover to arrange.",
        "Pittsburgh covers the southwest and the western half generally. If you are anywhere from Washington County up toward Butler, that is your nearest.",
        "Hazleton sits in the northeast and reaches Scranton, Wilkes-Barre and the coal region — an area that would otherwise be a long way from either of the big cities.",
        "Greencastle is in the south-central strip near the Maryland line, covering Chambersburg, Waynesboro and down toward Hagerstown.",
        "Between them that is genuinely broad coverage. The thinner parts are the northern tier and the north-west — Erie is roughly 130 miles from Pittsburgh, which is a real drive. From there, mail-in with a prepaid label costs nothing and is usually the sensible call.",
      ],
    },
    {
      heading: "The two expired things worth keeping",
      paragraphs: [
        "Nearly every guide on this subject says expired supplies are worthless. For test strips that is right, and for a good reason — a degraded strip gives an inaccurate reading, and an inaccurate glucose reading is a safety problem rather than a bargain.",
        "Two exceptions, and they are the two that get binned most. Expired Omnipod pods — 5, DASH and Classic — still have value. So do expired Dexcom G7 sensors. Both at a reduced rate rather than nothing.",
        "Expired Dexcom G6 sensors do not qualify, and nor does anything else. But before a clear-out goes into a bin bag, those two are worth separating out.",
      ],
    },
    {
      heading: "What makes a box sellable",
      paragraphs: [
        "Factory-sealed and unopened, in the original packaging. An opened box cannot be resold at any price — nobody downstream can verify how it was stored, and this is the most common reason a parcel is refused or a price is reopened.",
        "Not obtained through Medicare or Medicaid. Supplies paid for by those programmes cannot legally be resold. Private insurance or out of pocket is fine, and a pharmacy label with your name on it makes no difference at all.",
        "For test strips, at least six months before the expiry date. Under that, value drops away quickly, because whoever ends up using them needs time to get through the box.",
        "Check the box count before you decide a small stack is not worth the call. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
      ],
    },
    {
      heading: "Where the need actually sits in Pennsylvania",
      paragraphs: [
        "11.6% of Pennsylvania adults have diagnosed diabetes, according to the CDC's 2022 BRFSS estimates — a little under the national rate. Pennsylvania is one of two states absent from the newer 2023 data, which is why these figures carry an earlier date than most of this site.",
        "The state average hides a familiar pattern. Reading reads 15.9% and Harrisburg 15.4%, with Philadelphia and Allentown both at 14.0%, against 10.1% in Pittsburgh and 10.5% in Levittown. The older industrial cities carry a much heavier burden than the suburbs around them.",
        "Only 5.8% of working-age Pennsylvanians have no health insurance — one of the lowest rates in the country. That changes the character of the market here. It is driven less by uninsured people paying retail and more by straightforward surplus: prescriptions that changed, equipment that was switched, and households being cleared. 20.4% of the state is 65 or over, and that last category is where most of it comes from.",
      ],
    },
    {
      heading: "Doing the handover properly",
      paragraphs: [
        "Settle the number on the phone before you drive anywhere. Brand, count, expiry dates — the meeting should be a handover, not a negotiation, and a figure that moves once you have arrived is a figure worth walking away from.",
        "Meet somewhere public and busy in daylight. A supermarket car park or a bank forecourt is entirely normal for this and no reasonable buyer will object.",
        "Bring everything sealed, and bring the quantity you quoted. Arriving with a different count than described is the quickest way to reopen a settled price.",
        "Count the cash before the boxes change hands. That is not suspicion, it is how any cash transaction should work, and nobody who does this regularly will blink at it.",
      ],
    },
    {
      heading: "If posting is easier",
      paragraphs: [
        "Four buyers is good coverage, not universal coverage, and mail-in remains free from anywhere in the state's 1,833 ZIP codes.",
        "Get the quote in writing first. Use the prepaid label and keep the tracking number, since payment runs from when the parcel is received and verified rather than from when you posted it.",
        "Photograph the sealed boxes with dates and lot numbers visible before they go, and keep those photographs until the money lands. Do not open a box to photograph what is inside — that destroys the thing that gave it value.",
      ],
    },
  ],

  faqs: [
    {
      q: "Which of the four Pennsylvania buyers is nearest to me?",
      a: "Philadelphia covers the southeast, Pittsburgh the west, Hazleton the northeast and coal region, and Greencastle the south-central strip near the Maryland line. If you are in the northern tier or near Erie you are a fair distance from all four, and mail-in is likely easier.",
    },
    {
      q: "Why do Pennsylvania's figures cite 2022 when other states say 2023?",
      a: "Pennsylvania and Kentucky are both absent from the CDC's 2025 PLACES release, so their prevalence figures come from the previous release, which uses 2022 BRFSS data. Everywhere else on this site uses 2023.",
    },
    {
      q: "Do you buy expired Omnipod pods in Pennsylvania?",
      a: "Yes, at a reduced rate — Omnipod 5, DASH and Classic. Expired Dexcom G7 sensors too. Those are the only two exceptions; everything else must be in date, and test strips should have at least six months left.",
    },
    {
      q: "My supplies came through Medicare. Can I sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold. Anything received through private insurance or paid for yourself is fine.",
    },
    {
      q: "Is it worth driving from Erie to Pittsburgh?",
      a: "For a few boxes, no — that is about 130 miles each way and mail-in costs you nothing. For a large lot the numbers change. Get the quote first and decide from the actual figure rather than in advance.",
    },
    {
      q: "Can I sell a mix of brands and supply types together?",
      a: "Yes, and it is usually better. A mixed lot is quoted as one lot rather than item by item, and quantity improves the per-box rate — ten or more boxes generally does better than the same boxes sold separately.",
    },
  ],
}
