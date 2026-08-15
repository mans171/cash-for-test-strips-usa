import type { PostBody } from "./types"

/**
 * Vermont — estate angle, earned: 22.8% of residents are 65 or over, among the
 * largest shares in the country.
 *
 * Maine shares the angle and the age profile, and the two used to read as the
 * same post. The distinguishing fact here is the other half of Vermont's
 * numbers: at 8.8% it has one of the lowest diagnosed-diabetes rates of any
 * state, with Burlington at 5.4%. Old, but not especially diabetic, and only
 * 648,358 people in total. The consequence is that almost nobody in Vermont
 * has done this before or knows anyone who has — there is no local word of
 * mouth to lean on. So this post is built as a vetting guide for a one-time
 * seller assessing a stranger, with the expired-supplies correction used as
 * one of the tests rather than as a standalone pitch.
 *
 * All figures from lib/state-health-data.ts. No dollar amounts.
 */
export const VT: PostBody = {
  label: "Vetting a buyer you'll use once",
  title: "Selling Diabetic Supplies in Vermont: How to Vet a Buyer You'll Only Use Once",
  heading: "Selling Diabetic Supplies in Vermont",
  metaDescription:
    "Vermont has no in-state buyer and one of the lowest diabetes rates in the country, so nobody here has done this before. How to judge a buyer you found online, and the claim that tells you they know their trade.",

  lead: [
    "Vermont is an unusual case in this market. 22.8% of residents are 65 or over, one of the largest shares anywhere, so sealed supplies do turn up when a house is cleared. But only 8.8% of Vermont adults have diagnosed diabetes, well below the national rate of 12.1%, and there are 648,358 people in the state in total.",
    "Put those together and you get a particular problem. This is not something Vermonters do routinely. There is no neighbour who has sold before, no local shop with a reputation to protect, and no buyer anywhere in the state. You are almost certainly assessing a company you found on the internet, once, with nothing to compare it against.",
    "So this page is mostly about how to judge that, rather than about how to package a box.",
  ],

  sections: [
    {
      heading: "What a straight buyer does before your parcel leaves",
      paragraphs: [
        "They give you a specific figure, in writing, for what you actually have. Not a range, not an \"up to\", not a per-box headline rate lifted from a table. The number should be built from the brands, the counts and the expiry dates you described, and it should arrive before anything is posted.",
        "This is the single most useful test, and it works because of where the leverage sits. Once your boxes are inside somebody else's building, a revised figure is not a negotiation — you either accept it or ask for the supplies back and wait. A buyer who avoids committing beforehand is reserving that position deliberately.",
        "They also send a prepaid label. Shipping should cost you nothing. If you are asked to pay postage on a sale like this, that is enough on its own to stop.",
        "And they will decline things. A buyer who accepts absolutely everything you describe, sight unseen, is not applying the conditions that make this trade work, which should worry you more than being told no.",
      ],
    },
    {
      heading: "The claim that tells you whether they know the trade",
      paragraphs: [
        "Ask about expired supplies. The answer separates the people who know this market from the people repeating what they read.",
        "The most widely read guide on the subject states that expired supplies have very low or no resale value. For test strips that is exactly right, and for a serious reason — a strip that has degraded gives an inaccurate reading, and an inaccurate glucose reading is a safety problem rather than a bargain. Anyone who offers to buy your expired strips is either careless or worse.",
        "But there are precisely two exceptions, and a buyer who knows the trade will name them without prompting. Expired Omnipod pods, in the 5, DASH and Classic forms, still carry value at a reduced rate. So do expired Dexcom G7 sensors. Expired Dexcom G6 sensors do not, and nothing else does.",
        "So there are two wrong answers and one right one. \"Everything expired is worthless\" costs you money. \"We'll take anything expired\" tells you they are not checking. The correct answer is two named items, at a reduced rate.",
      ],
    },
    {
      heading: "The conditions that apply wherever you sell",
      paragraphs: [
        "Boxes must be factory-sealed and unopened, in original packaging. An opened box has no resale value at any price, because nobody downstream can establish how it was stored. This is the most common reason a parcel comes back.",
        "Supplies obtained through Medicare or Medicaid cannot be resold. Anything covered by private insurance or bought at retail is fine, and a pharmacy label with someone's name on it makes no difference and does not need peeling off — a buyer who tells you to remove it is telling you something about themselves.",
        "Test strips want at least six months before their expiry date, and the qualifying brands are FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, and True Metrix. FreeStyle Libre sensors qualify in US retail versions only.",
        "Two details that work in your favour: a 100-count box is worth meaningfully more than two 50-count boxes of the same brand, and ten or more boxes earns a better per-box rate. A mixed lot is quoted as one lot and does not need separating by type.",
      ],
    },
    {
      heading: "Making the shipment itself defensible",
      paragraphs: [
        "Photograph every sealed box before it goes, with the expiry date and lot number legible. This is the part first-time sellers skip and it is the only part that matters if something goes wrong, because the entire question in any dispute is what condition the boxes were in when they left your hands.",
        "Do not open anything to photograph the contents. Opening a box destroys the exact property that made it sellable, and it cannot be undone.",
        "Keep the tracking number. Payment runs within 24 hours of the parcel being received and verified rather than from when you posted it, so tracking is what establishes when that clock started. Transit from Vermont is short, so this is a matter of days end to end.",
        "If a figure is revised after arrival, ask for the specific reason and for photographs of what was received. Legitimate revisions have concrete causes — a seal broken in transit, a misread date, a count that differs from the description. A vague revision is not a revision, and you are entitled to ask for the supplies back instead.",
      ],
    },
    {
      heading: "Why no buyer will ever set up in Vermont",
      paragraphs: [
        "The state figure of 8.8% is low, and the internal picture is lower still in the places with the most people. Burlington reads 5.4%, South Burlington and Essex Junction 6.6%, Winooski 6.0% and Middlebury 6.3%. Rutland at 10.8%, Brattleboro at 10.1% and Barre at 11.1% run well above that, but Barre and Burlington are 5.7 points apart and neither is large.",
        "An in-person buying operation needs concentration to justify the driving, and Vermont offers the opposite: 648,358 people across 265 ZIP codes, with the lowest rates in the largest towns. That is why there is no buyer here and why it would be misleading to suggest one is coming.",
        "Only 6.0% of working-age Vermonters are without health insurance, one of the lower figures in the country. What that adds up to is a state where supplies rarely come up for sale, and when they do it is almost always a clear-out rather than someone economising — which is the other reason so few people here have done this before.",
      ],
    },
  ],

  faqs: [
    {
      q: "I've never done this and I don't know who's legitimate. What should I check?",
      a: "Three things. A specific written figure before you post, a prepaid label that costs you nothing, and payment terms tied to the parcel being received and verified. If a buyer will not commit to a number in advance, that is the one to walk away from.",
    },
    {
      q: "Someone quoted for expired test strips. Is that a good sign?",
      a: "No, it is a bad one. Expired strips give inaccurate readings and should not be resold by anyone. Only two expired items genuinely hold value — Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors, both at a reduced rate. A buyer who takes anything expired is not checking.",
    },
    {
      q: "What if the offer changes once the parcel arrives?",
      a: "Ask for the specific reason and for photographs of what was received. A real revision names a cause — a broken seal, a misread date, a different count. If there is no concrete reason, you can ask for the supplies to be returned rather than accepting a figure you never agreed to.",
    },
    {
      q: "Is there anyone in Burlington or Rutland who buys in person?",
      a: "No. There is no listed buyer anywhere in Vermont and, given the state's size and its low diabetes rate, that is unlikely to change. Mail-in with a prepaid label is the route and costs you nothing from any of the state's 265 ZIP codes.",
    },
    {
      q: "It's only a few boxes. Is it worth the trouble at all?",
      a: "Check the counts before deciding. A 100-count box is worth meaningfully more than two 50-count boxes, and sealed sensors or pods can be worth more than a small stack of strips. One phone call with brands and counts settles it either way.",
    },
  ],
}
