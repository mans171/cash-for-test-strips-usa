import type { PostBody } from "./types"

/**
 * South Dakota — built on an inverted geography.
 *
 * In most states the largest city carries the highest diabetes rate and the
 * small towns sit below it. South Dakota runs the other way: Sioux Falls reads
 * 10.5%, below Rapid City at 11.8%, below Watertown, Mitchell and Yankton at
 * 11.6% each, and well below Huron at 13.6% — which is above the national
 * figure of 12.1%. The state also sits closer to the national rate than any
 * other northern-plains state in this set, and has the largest 65-plus share
 * of the five written together. So the spine here is that the surplus supplies
 * are held in the small towns, not the metro, and there is nowhere in state to
 * take them: 428 miles to the nearest buyer.
 *
 * Six sections and five FAQs, deliberately a different shape from the Alaska,
 * Idaho, Minnesota and North Dakota posts written alongside it.
 *
 * Figures from lib/state-health-data.ts and lib/blog-angles.ts. No prices.
 */
export const SD: PostBody = {
  label: "Huron reads higher than Sioux Falls — and no buyer in state",
  title: "Selling Diabetic Test Strips in South Dakota: Huron, Not Sioux Falls",
  heading: "Selling Diabetic Test Strips in South Dakota",
  metaDescription:
    "South Dakota inverts the usual pattern: Huron reads 13.6% and Sioux Falls 10.5%. The demand sits in the small towns, there is no buyer in state, and the nearest is about 428 miles out.",

  lead: [
    "Almost every state in this directory follows the same shape. The largest city carries the highest diabetes rate, the wealthy suburb next to it carries the lowest, and the small towns fall somewhere between. South Dakota does not do that.",
    "Sioux Falls, the biggest city in the state, reads 10.5%. Huron reads 13.6%, above the national figure of 12.1%. Rapid City is 11.8%, and Watertown, Mitchell and Yankton all sit at 11.6% — every one of them above the state's largest city. If you are holding unused supplies in South Dakota, statistically you are more likely to be doing it in a town of a few thousand people than in Sioux Falls, and that changes what practical advice is worth giving.",
  ],

  sections: [
    {
      heading: "The state reads bottom-up rather than top-down",
      paragraphs: [
        "Statewide, 11.7% of adults have diagnosed diabetes on the CDC's 2023 BRFSS estimates. That is the closest to the national 12.1% of any of the northern plains states, and noticeably higher than North Dakota or Minnesota.",
        "The spread is 5.8 points, from Huron at 13.6% down to Brookings at 7.8%, and the interesting part is where the two ends sit. Brookings, the low end, is a university town, and youth suppresses a diabetes rate more reliably than almost any other factor. The high end is Huron, a small town, with Aberdeen at 10.7%, Pierre at 10.5% and Spearfish at 9.6% filling in behind.",
        "So the reading is not urban versus rural in the way it is in Michigan or Ohio. It is older, smaller towns above the line and younger places below it, with the metro sitting unremarkably in the middle. Across the state as a whole, 18.9% of the 921,481 residents are aged 65 or over, and 8.8% of working-age adults have no health insurance.",
      ],
    },
    {
      heading: "What that means if you are the person with the cupboard",
      paragraphs: [
        "Unused supplies do not usually come from someone who set out to acquire them. They come from a prescription that changed, a switch from strips to continuous monitoring, a move into care, or a family clearing a house and finding sealed boxes nobody knew were there. All of those track age and diagnosis rates, which is why South Dakota's surplus is disproportionately sitting in its smaller towns.",
        "The consequence is unglamorous but worth stating: most people reading this are a long way from anywhere that would take the boxes off them in person, and would still be a long way from one even if they lived in Sioux Falls.",
      ],
    },
    {
      heading: "There is no buyer in South Dakota, and the nearest is 428 miles out",
      paragraphs: [
        "Nothing is listed anywhere in the state. The nearest buyer to the centre of South Dakota is roughly 428 miles away, which is shorter than the equivalent figure from North Dakota or Montana and still an entirely impractical drive for a box of test strips.",
        "That is the honest position, and it is worth saying plainly because plenty of pages on this subject imply a local presence they do not have. With 375 ZIP codes across the state and no concentrated urban demand, there has never been much of a commercial case for a shop here.",
        "What is left is post, which works perfectly well from Watertown or Spearfish and costs the seller nothing, provided the sale is set up properly at the start rather than after the parcel has gone.",
      ],
    },
    {
      heading: "What is on the buy list, and what has to be true about it",
      paragraphs: [
        "Test strips: FreeStyle Lite, Contour Next in all versions, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. Continuous monitoring: Dexcom G6 sensors and transmitters, G7 sensors and receivers, FreeStyle Libre 1, 2 and 3. Omnipod pods in the 5, DASH and Classic versions. Some sealed Medtronic and Tandem components as well, though those warrant a call rather than an assumption.",
        "Every one of those has to be factory-sealed and unopened in the original packaging. An opened box is worth nothing whatever is inside it, because nobody further along the chain can establish how it was stored. That is the most common reason a shipment is turned down.",
        "None of it can have been obtained through Medicare or Medicaid — supplies paid for by those programmes cannot be resold. A pharmacy label carrying your name is fine and is not what the question is about.",
        "Test strips want six months or more before their expiry date, and box size is worth checking before you decide what to send: a 100-count box is worth meaningfully more than two 50-count boxes of the same brand. FreeStyle Libre has one extra condition — US retail versions only, so sensors bought abroad cannot be resold here.",
      ],
    },
    {
      heading: "The advice that costs South Dakotan sellers the most",
      paragraphs: [
        "The best-ranked article in the country on this subject tells its readers that expired supplies carry very low or no resale value. That sentence has almost certainly emptied more cupboards into more bins than any other piece of writing on the topic.",
        "It is right about strips, and for a serious reason. A strip past its date can return an inaccurate reading, and an inaccurate blood glucose reading is a safety issue rather than a discount. Those should be thrown away, not sold.",
        "It is wrong about two categories, and they happen to be the two the advice damages most. Expired Omnipod pods — 5, DASH and Classic — are still bought, at a reduced rate. So are expired Dexcom G7 sensors. Neither is scrap.",
        "The exception list ends there. Expired Dexcom G6 sensors are not included and nothing else is either. But if you are working through a relative's supplies in Aberdeen or Yankton and the dates have passed, those two go in the keep pile before anything else does.",
      ],
    },
    {
      heading: "Making sure the number you are told is the number you get",
      paragraphs: [
        "Ask for the figure in writing before the parcel leaves, based on what you actually have — brand, count, dates — rather than a range or a published average. This is the single protection that matters, and it costs nothing but a few minutes at the start.",
        "Photograph the sealed boxes with dates and lot numbers showing, and keep the photographs until payment arrives. Do not open a box to photograph the contents; opening it removes the reason it had value in the first place.",
        "The label is prepaid, so posting from anywhere in South Dakota costs you nothing. A buyer asking you to cover postage on a sale of this kind has told you something worth knowing about them.",
        "Payment lands within 24 hours of the parcel being received and verified, with verification meaning the contents have been checked against your description. If the figure moves at that point, ask for the specific reason and for photographs of what arrived — and if the reason is vague rather than concrete, ask for the supplies back instead.",
      ],
    },
  ],

  faqs: [
    {
      q: "Can I sell in person anywhere in South Dakota?",
      a: "No. There is no buyer listed in the state, and the nearest to the middle of it is about 428 miles away. Post is the accurate answer from Sioux Falls, Rapid City or anywhere else here, and any page suggesting otherwise is worth reading sceptically.",
    },
    {
      q: "Why does Huron read higher than Sioux Falls?",
      a: "Diagnosed diabetes tracks age closely, and small towns with older populations tend to sit above larger cities with younger ones. Huron reads 13.6% against Sioux Falls at 10.5%, with Brookings lowest at 7.8% — the pattern in South Dakota runs by age profile rather than by city size.",
    },
    {
      q: "Do you buy expired Dexcom G7 sensors?",
      a: "Yes, at a reduced rate, and the same applies to expired Omnipod 5, DASH and Classic pods. Expired G6 sensors do not qualify, and neither do expired test strips, which are genuinely not worth sending regardless of brand or quantity.",
    },
    {
      q: "My supplies came through Medicare. Does that stop the sale?",
      a: "Yes. Supplies obtained through Medicare or Medicaid cannot be resold, and condition does not change that. If the boxes were filled under private insurance or bought retail, that is a different situation, and the name on the pharmacy label makes no difference either way.",
    },
    {
      q: "How long does the whole thing take from South Dakota?",
      a: "Transit plus a short verification step, then payment within 24 hours of the parcel being received and checked against your description. The clock starts on arrival rather than on the day you posted it, which is worth knowing when you are planning around it.",
    },
  ],
}
