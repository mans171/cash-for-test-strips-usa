import type { PostBody } from "./types"

/**
 * Colorado — two in-state buyers, the Denver area and Colorado Springs, and
 * both of them sit on the same north-south line. Every one of the ten Colorado
 * cities we hold prevalence figures for is on that same Front Range corridor.
 *
 * So the spine here is shape rather than presence: Colorado's coverage is a
 * line, not a map, and the honest thing to tell a reader in the mountains or
 * west of the Divide is that the two listings do not help them at all.
 *
 * Kansas carries the same generated angle and is a neighbouring state with a
 * similar profile, so it is deliberately built on something else entirely —
 * the split inside a single metro area. This one is built on geography.
 *
 * Figures are from lib/state-health-data.ts. No dollar amounts anywhere: this
 * site publishes payout tiers, not prices.
 */
export const CO: PostBody = {
  label: "Two buyers, one corridor",
  title: "Selling Diabetic Test Strips in Colorado: Two Buyers, One Corridor",
  heading: "Selling Diabetic Test Strips in Colorado",
  metaDescription:
    "Colorado has in-person buyers in the Denver area and Colorado Springs — both on the Front Range. Pueblo reads 13.5% for diabetes against Fort Collins at 6.2%. What sealed supplies need to qualify.",

  lead: [
    "Colorado is one of the better-covered states on this directory. There are two in-person buyers listed: one serving the Denver area, one in Colorado Springs. For a state of just under six million people, that is more than most places get.",
    "The catch is where they are. Both sit on the Front Range, the strip of cities running north to south along the eastern edge of the mountains. If you are on that line, you have options. If you are west of the Divide, the two listings do not do anything for you, and it is better to say that than to leave you guessing.",
  ],

  sections: [
    {
      heading: "Coverage in Colorado is a line, not a map",
      paragraphs: [
        "Look at where Coloradans actually live and the reason for this becomes obvious. Every one of the ten Colorado cities we hold diabetes figures for — Denver, Colorado Springs, Aurora, Fort Collins, Lakewood, Thornton, Arvada, Westminster, Pueblo and Greeley — sits on the Front Range corridor. Not one of them is in the mountains or on the Western Slope.",
        "A buyer needs enough people within a reasonable drive to make in-person collection worth doing at all, and in Colorado that means the corridor. The Denver-area listing covers the middle of it and reaches the northern suburbs comfortably. Colorado Springs covers the southern end.",
        "Between the two of them, the majority of the state's population is within a manageable drive of somebody. That is genuinely unusual. It is also the whole of the story — there is no third listing hiding somewhere west, and there is unlikely to be one.",
      ],
    },
    {
      heading: "Which meter you own changes what a box is worth",
      paragraphs: [
        "Test strips are not interchangeable, and the brand on the box does more to set the payout tier than anything else about it. The strips bought in volume are FreeStyle Lite, Contour Next in all its versions, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, and True Metrix. Those are the names worth checking your cupboard for first.",
        "Count matters nearly as much and almost nobody expects it to. A single 100-count box is worth meaningfully more than two 50-count boxes of exactly the same strip. It is the same number of strips, but one box is one saleable unit and two boxes are two smaller ones, and the market prices them accordingly. If you have a choice about which to send, send the larger boxes.",
        "Beyond strips, the same list covers Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 sensors. Libre carries one condition that catches people out: US retail versions only. Sensors bought overseas cannot be resold here whatever state you are in.",
        "Omnipod 5, DASH and Classic pods are bought as well, though pods only rather than the controllers. Sealed Medtronic and Tandem components are sometimes taken and are worth asking about rather than assuming either way.",
      ],
    },
    {
      heading: "Pueblo, Fort Collins, and 7.3 points",
      paragraphs: [
        "Statewide, 8.6% of Colorado adults have diagnosed diabetes against a national figure of 12.1%. Only one state in the country reads lower. On the face of it that suggests there is not much of a local market here at all.",
        "The state average hides the thing that actually matters. Pueblo reads 13.5%, well above the national rate. Fort Collins reads 6.2%, barely half of it. That is a 7.3-point spread between two cities in the same state, and it is the difference between an old steel town and a university town rather than anything about Colorado's climate or altitude.",
        "Greeley sits at 10.5% and Aurora at 9.5%, both above the state figure. Denver itself reads 7.1%, which is low. Colorado Springs is 9.0%.",
        "There is a useful coincidence in that. Pueblo, the city with the highest rate in the state, sits at the southern end of the same corridor as the Colorado Springs buyer. For once, the coverage and the need are in roughly the same place.",
      ],
    },
    {
      heading: "West of the Divide, it is post",
      paragraphs: [
        "If you are in the mountain towns, on the Western Slope, or anywhere in the San Luis Valley, neither listing is a realistic drive and you should not treat it as one. Mail-in is the route, and it is not a consolation prize.",
        "The label is prepaid and reaches all 527 of Colorado's ZIP codes at the same cost to you, which is nothing. Payment is made within 24 hours of the parcel arriving and being verified. In practice that means a couple of days in transit and then a day, which for most people is faster than arranging a drive over a pass in winter would be.",
        "Get the number in writing before anything leaves your house. Not a range and not an \"up to\" figure — the actual number for the brands, counts and dates you actually have. A buyer who will not commit before you post is one who plans to revise downwards once your box is in their building, and by then you have no leverage at all.",
      ],
    },
    {
      heading: "The expiry rule that costs Colorado sellers money",
      paragraphs: [
        "The most widely read guide on this subject tells readers that expired supplies have very low or no resale value. For test strips that is correct, and for a serious reason: a degraded strip returns a wrong reading, and a wrong blood glucose reading is a safety problem rather than a bargain. Nobody should buy those and we do not.",
        "It is wrong about two specific things, and they are the two people bin most readily. Expired Omnipod pods — 5, DASH and Classic alike — still carry value. So do expired Dexcom G7 sensors. Both are bought at a reduced rate rather than refused.",
        "Expired Dexcom G6 sensors do not qualify, so this is not a general rule about sensors, and it is not a general rule about anything else either. It is two named exceptions. Before you empty a cupboard into a bin because the dates have passed, check whether what you are holding is one of them.",
        "Strips that are still in date should have at least six months left on them. Below that the tier drops sharply, because whoever ends up using them needs time to do it.",
      ],
    },
    {
      heading: "If you are handing supplies over in person",
      paragraphs: [
        "Agree the figure on the phone before you drive anywhere. Describe what you have precisely — brand, box count, quantity, and the expiry dates as printed. The number you are quoted is only as good as the description it was based on, and a vague description produces a number that changes when someone sees the actual boxes.",
        "Take everything in its original packaging and do not open anything to show what is inside. An opened box cannot be resold at any price, because the next person in the chain has no way to know what happened to it while it was open. Photographing a sealed box with the date and lot number visible does the same job without destroying the value.",
        "Meet somewhere public and in daylight, count the boxes together, and take the cash on the spot. A same-day in-person sale is the one route with no parcel, no tracking number and no waiting on verification, which is the main argument for making the drive when you live near enough to do it.",
      ],
    },
  ],

  faqs: [
    {
      q: "Where exactly in Colorado can I sell in person?",
      a: "Two listings: one covering the Denver area and one in Colorado Springs. Both are on the Front Range. There is no in-person buyer listed in the mountains, on the Western Slope or in the San Luis Valley, and mail-in with a prepaid label is the honest answer for anyone in those parts of the state.",
    },
    {
      q: "Is it worth driving over from the Western Slope?",
      a: "Almost never for a few boxes, because the postal route costs you nothing and takes the drive out of it entirely. For a large lot — an estate clear-out, or ten or more boxes — the arithmetic changes, because larger quantities earn a better per-box rate and a same-day cash handover removes the wait.",
    },
    {
      q: "Does it matter whether I have 100-count or 50-count boxes?",
      a: "Yes, more than most people expect. A 100-count box is worth meaningfully more than two 50-count boxes of the same strip, even though the strip count is identical. If you are choosing what to send, the larger boxes are the ones to prioritise.",
    },
    {
      q: "My Omnipod pods expired last year. Bin them?",
      a: "No. Expired Omnipod pods, in the 5, DASH and Classic versions, are one of only two things bought past their date, at a reduced rate. Expired Dexcom G7 sensors are the other. Everything else past date, including all test strips and expired G6 sensors, genuinely is not saleable.",
    },
    {
      q: "My supplies came through Medicaid. Can I still sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold, and that applies in Colorado as it does everywhere else. If you bought them retail or they came through private insurance, that is a different situation — and a pharmacy label with your own name printed on it does not affect anything either way.",
    },
  ],
}
