import type { PostBody } from "./types"

/**
 * Hawaii — estate angle, earned: 22.1% of residents are 65 or over, among the
 * largest shares of any state. No in-state buyer, and no realistic prospect of
 * one.
 *
 * The spine here is distance and the calendar, which is Hawaii's alone. Every
 * other uncovered state's mail-in advice assumes a parcel crosses the country
 * in a few days. From here it does not, and that single fact changes something
 * real: the six-months-before-expiry rule bites harder, because transit eats
 * the margin. Building the post on the interaction between shipping time and
 * expiry dates gives it an argument no mainland page can copy.
 *
 * The Libre US-retail-only rule also lands harder here than anywhere, and is
 * used as a section rather than a footnote.
 *
 * All figures from lib/state-health-data.ts. No dollar amounts, and no invented
 * transit times — the shipping guidance is deliberately qualitative.
 */
export const HI: PostBody = {
  label: "Distance and the calendar",
  title: "Selling Diabetic Supplies From Hawaii: Everything Ships, and It Ships Slowly",
  heading: "Selling Diabetic Supplies From Hawaii",
  metaDescription:
    "No buyer operates in Hawaii and shipping to the mainland is genuinely slower. Why expiry dates matter more from here, the Libre rule that catches Hawaii sellers, and what sealed supplies need to qualify.",

  lead: [
    "There is no test strip buyer in Hawaii, and unlike most uncovered states there is no nearby one either. There is no version of this where you drive an hour and hand the boxes over. Everything goes by post to the mainland, and it takes longer to get there than a parcel from anywhere else in the country.",
    "That is not a complaint, it is a planning fact, and it changes the order you should do things in. On the mainland you sort the boxes and then think about shipping. From here you check the dates first, because the calendar is the constraint.",
  ],

  sections: [
    {
      heading: "Check the expiry dates before you do anything else",
      paragraphs: [
        "Test strips need at least six months left before their expiry date to be worth selling. That is not an arbitrary threshold — whoever uses them next needs enough runway to actually get through the box, and value falls off sharply below it.",
        "From Hawaii, transit consumes part of that runway before anyone has even opened the parcel. A box that would comfortably clear the threshold if posted from a mainland address can be marginal by the time it lands. Nothing about the rule changes, but the buffer you want is larger.",
        "So the practical advice is to look at dates first and act on the short-dated boxes soonest. If a stack has seven or eight months on it, that is a this-month job rather than a next-quarter one. If it has a year or more, there is no urgency at all.",
        "Sensors and pods do not carry the same six-month rule, which means an estate with a lot of Dexcom or Omnipod stock is under much less time pressure than one with strips.",
      ],
    },
    {
      heading: "There is no buyer here, and it would be dishonest to pretend otherwise",
      paragraphs: [
        "Nobody is listed anywhere in the state — not Urban Honolulu, not Hilo, not Kahului. Hawaii's population is 1,406,187 spread over 98 ZIP codes and several islands, and an in-person buying operation needs both density and a drivable catchment. Hawaii offers one and not the other.",
        "Be sceptical of any site that suggests otherwise, or that shows you a map with a pin somewhere near Honolulu. The absence of a local option is the single most useful thing to know before you start, because it determines everything else you do.",
        "If you are on Hawaii Island, Maui or Kauai there is an additional leg: the parcel travels between islands before it begins the journey that actually matters. Build that into the timing rather than being surprised by it.",
      ],
    },
    {
      heading: "The FreeStyle Libre rule that catches people here",
      paragraphs: [
        "FreeStyle Libre sensors qualify only in their US retail versions. Sensors bought overseas cannot be resold here, regardless of condition, packaging or how recently they were purchased.",
        "This matters more in Hawaii than almost anywhere. Supplies picked up abroad during travel, or sent by family living outside the country, turn up in Hawaii households more often than the rule's authors probably had in mind. The packaging is the tell — foreign-market boxes carry different labelling and different regulatory marks.",
        "If you are unsure which version you are holding, that is a phone call rather than a guess. Sending a foreign-market sensor across the Pacific and having it declined is the most avoidable disappointment in this whole process.",
      ],
    },
    {
      heading: "What else has to be true for a box to qualify",
      paragraphs: [
        "It has to be factory-sealed and unopened, in its original packaging. An opened box cannot be resold at any price, because nobody downstream has any way to know how it was stored. This is the most common reason a parcel is refused anywhere in the country.",
        "It cannot have been obtained through Medicare or Medicaid. Those supplies cannot be resold. Anything covered by private insurance or paid for at retail is fine, and a pharmacy label with a name on it makes no difference and does not need removing.",
        "Box count is worth checking before you decide a small stack is not worth the effort. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand, so what looks like an equivalent pile often is not.",
        "Quantity helps. Ten or more boxes earns a better per-box rate, and a mixed lot of different brands and types is quoted as one lot rather than item by item. Given the shipping distance, one larger consignment is much better than three small ones.",
      ],
    },
    {
      heading: "Two expired items that most guides tell you to throw away",
      paragraphs: [
        "The most-read guide on this subject in the country tells readers expired supplies have very low or no resale value. For test strips it is correct, and for a serious reason: a degraded strip produces an inaccurate reading, and an inaccurate glucose reading is a safety issue, not a discount.",
        "It is wrong on two counts. Expired Omnipod pods, in the 5, DASH and Classic forms, still hold value. So do expired Dexcom G7 sensors. Both are bought at a reduced rate rather than being written off.",
        "Expired Dexcom G6 sensors do not qualify and neither does anything else past its date. The distinction between a G6 and a G7 sensor is therefore worth thirty seconds with the box in your hand, particularly if the alternative is a bin bag.",
      ],
    },
    {
      heading: "What Hawaii's numbers actually say",
      paragraphs: [
        "12.4% of Hawaii adults have diagnosed diabetes, marginally above the national rate of 12.1%. Waipahu reads highest among the larger places at 14.6%, with Pearl City at 13.4% and Urban Honolulu at 13.2%, against Kailua and Ewa Gentry both at 9.8% — a spread of 4.8 points, narrower than most states manage.",
        "The number that shapes what actually gets sold is age: 22.1% of residents are 65 or over, one of the largest shares in the country. Supplies surface when a prescription changes, when someone moves into care, or when a family home is being cleared — rarely because anyone set out to sell diabetic supplies.",
        "Only 5.6% of working-age residents in Hawaii have no health insurance, which is well below the national picture. So the honest framing here is not that resale plugs a local access gap the way it does in less-insured states. What surfaces in Hawaii is genuine surplus, and it goes to where the need is greater.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there really no buyer anywhere in Hawaii?",
      a: "Not on this directory, on any island. Mail-in to the mainland is the only route, and the prepaid label costs you nothing from any of the state's 98 ZIP codes. If that changes, the Hawaii page is where it would appear.",
    },
    {
      q: "Does the longer shipping time cost me anything?",
      a: "Not in money — the label is prepaid regardless of distance. It costs you calendar. Payment runs within 24 hours of the parcel being received and verified rather than from when you posted it, so allow appreciably longer end to end than a mainland seller would.",
    },
    {
      q: "My mother's Libre sensors came from relatives overseas. Can I sell them?",
      a: "No. Only US retail versions of FreeStyle Libre qualify, and sensors bought abroad cannot be resold here whatever their condition. Check the packaging before shipping, or ring and describe it if you are not certain.",
    },
    {
      q: "The strips expire in about five months. Worth sending?",
      a: "Probably not on their own. Test strips want at least six months remaining, and transit from Hawaii eats into that. Short-dated strips are the thing to act on quickly if you are going to act at all — sensors and pods are far less time-sensitive.",
    },
    {
      q: "I'm on Maui. Does that change anything?",
      a: "Only the timing. The parcel makes an inter-island leg before it starts the mainland journey, so add that to your planning. The process, the prepaid label and the payment terms are identical wherever in the state you post from.",
    },
  ],
}
