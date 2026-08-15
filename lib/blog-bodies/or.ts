import type { PostBody } from "./types"

/**
 * Oregon — no in-state buyer, but the Washington listing is in Vancouver,
 * which sits directly across the Columbia from Portland. For a Portland-metro
 * reader the nearest in-person buyer is minutes away and in another state.
 * That is a specific, checkable, genuinely useful thing to tell them, and no
 * competitor page will.
 *
 * Second Oregon fact worth building on: the state is unusually even. The
 * widest city gap is 4.1 points, Medford 11.9% against Corvallis 7.8%. Most
 * states run to seven, ten, thirteen. Oregon has no concentrated pocket, which
 * is the other reason nobody has set up inside the state.
 *
 * Rhode Island also has an out-of-state nearest buyer, so the two are kept
 * apart deliberately: RI is a drive between metros, this is a river crossing
 * inside one metro that helps roughly the northern third of the state and
 * nobody else.
 */
export const OR: PostBody = {
  label: "The buyer is across the river",
  title: "Selling Diabetic Test Strips in Oregon: Your Nearest Buyer Is Across the River",
  heading: "Selling Diabetic Test Strips in Oregon",
  metaDescription:
    "Oregon has no in-state buyer — but the Washington listing is in Vancouver, across the Columbia from Portland. What that's worth, what it isn't, and the two expired items most guides tell you to bin.",

  lead: [
    "There is no diabetic supply buyer listed anywhere in Oregon. That sounds worse than it is, because of where the nearest one happens to sit.",
    "The Washington listing is in Vancouver. Vancouver is on the north bank of the Columbia, directly across the river from Portland. If you live in the Portland metro, your nearest in-person buyer is a bridge away — in a different state, but not a different journey.",
  ],

  sections: [
    {
      heading: "A state line that is not a distance",
      paragraphs: [
        "\"No buyer in your state\" usually means a long drive or no drive at all. In Oregon it means crossing a river inside one metropolitan area, which is a trip a large number of Portlanders already make regularly for entirely ordinary reasons.",
        "Nothing about selling supplies changes when you cross into Washington. The same conditions apply on either bank: the boxes have to be factory-sealed, they cannot have come through Medicare or Medicaid, and in-date strips want at least six months left on them. You are not doing anything different by driving over the bridge.",
        "Ring first and agree a number before you go. Describe what you have accurately — brand, box count, quantity, expiry dates as printed — because a figure quoted against a rough description is a figure that moves when someone sees the boxes.",
      ],
    },
    {
      heading: "Who that actually helps, and who it does not",
      paragraphs: [
        "Portland reads 8.9% for diagnosed diabetes. Gresham, on the eastern edge of the metro, reads 11.3%. Beaverton is 9.6% and Hillsboro 9.1%, both west of the city. All four are within reasonable reach of the Vancouver listing, and between them they account for a large share of Oregon's population.",
        "Salem is further south at 11.7%. Eugene at 9.4% and Springfield at 11.0% are further still, and Medford at 11.9% is at the opposite end of the state entirely. Bend, at 8.9%, is over the mountains.",
        "For all of those, the bridge is irrelevant and the postal route is the real one. That is most of Oregon geographically, even if it is not most of Oregon by headcount. Nobody should read \"there's a buyer across the river\" as coverage of the state, because it is not.",
      ],
    },
    {
      heading: "Oregon is unusually even",
      paragraphs: [
        "Statewide, 11.2% of Oregon adults have diagnosed diabetes against a national rate of 12.1%. What is interesting is not the average but how little the state departs from it.",
        "The widest gap between any two Oregon cities we hold figures for is 4.1 points: Medford at 11.9% against Corvallis at 7.8%. Compare that with Michigan, where Detroit and Ann Arbor are 12.8 points apart, or Mississippi, where the spread runs to nearly eleven. Oregon simply does not have a city that is dramatically worse off than the rest.",
        "That evenness is part of why no buyer has set up here. In-person buying depends on a dense pocket of demand worth driving to, and Oregon's demand is spread thinly and fairly consistently across a state with 428 ZIP codes.",
        "The one figure that stands out is age: 19.9% of Oregonians are 65 or over. That is where most sellable supplies come from — a prescription changes, someone moves into care, or a family clearing a house finds a cupboard of sealed boxes nobody knew about.",
      ],
    },
    {
      heading: "Three checks before you drive anywhere",
      paragraphs: [
        "The seal first. Factory-sealed, unopened, in original packaging. An opened box has no resale value at all, because nobody downstream can verify what happened to it while it was open. Do not open one to photograph the contents — photograph the sealed box with the date and lot number visible instead.",
        "The funding route second. Supplies obtained through Medicare or Medicaid cannot be resold. Retail purchases and private insurance are fine. A pharmacy label with your own name on it changes nothing and is not something anyone will query.",
        "The dates third. In-date test strips should have six months or more of shelf life left. Below six months the tier drops sharply, because whoever ends up using them needs a usable window to get through the box.",
      ],
    },
    {
      heading: "The expiry exceptions worth knowing before the bin bag",
      paragraphs: [
        "The most widely read guide to selling diabetic supplies says expired stock has very low or no resale value. As a general statement it holds, and for strips it is correct for safety reasons rather than commercial ones — a degraded strip can return a wrong reading, which is not a risk worth taking to save a few boxes.",
        "There are exactly two exceptions and they are the ones most likely to be in your cupboard already past date. Expired Omnipod pods — 5, DASH and Classic — are bought at a reduced rate. So are expired Dexcom G7 sensors.",
        "The line does not extend. Expired Dexcom G6 sensors are not bought, and neither is any expired strip or expired Libre sensor. Two items, named, and nothing beyond them.",
        "While you are checking sensors: FreeStyle Libre 1, 2 and 3 are all bought, but US retail versions only. Sensors bought abroad cannot be resold here however sealed they are, and that is a condition worth checking if anything in the pile was brought back from a trip.",
      ],
    },
    {
      heading: "Posting from the coast, the valley and the south",
      paragraphs: [
        "If the bridge is not on your map, the postal route costs you nothing. A prepaid label reaches every one of Oregon's 428 ZIP codes at the same price to you, and payment is made within 24 hours of the parcel arriving and being verified.",
        "Get the figure in writing before anything leaves the house — the specific number for what you have, not a range. A buyer unwilling to commit before you post intends to reconsider once the box is in their possession, and at that point the negotiation is entirely theirs.",
        "If you have a large quantity, gather it before you send anything. Ten or more boxes earns a better per-box rate, and a mixed lot of strips, sensors and pods is quoted as one lot rather than picked over item by item. There is no reason to separate anything, and no advantage to sending three parcels where one would do.",
      ],
    },
  ],

  faqs: [
    {
      q: "Can I really sell to a buyer in another state?",
      a: "Yes, and for Portland-area readers it is the most practical option available. The Vancouver listing is across the Columbia from Portland. The conditions are identical to those anywhere else: sealed boxes, not obtained through Medicare or Medicaid, and enough shelf life left on any strips.",
    },
    {
      q: "Is the drive over the bridge worth it for a couple of boxes?",
      a: "Probably not, because the postal route costs you nothing and removes the trip. It becomes worth it for a large lot, particularly a house clear-out, where a same-day in-person handover means cash on the spot instead of waiting on transit and verification.",
    },
    {
      q: "I'm in Eugene or Medford. What's my realistic option?",
      a: "Post. The Vancouver buyer is not a sensible drive from the southern half of the state, and there is nothing listed in Oregon itself. The prepaid label costs the same from Medford as from Portland, which is nothing.",
    },
    {
      q: "I bought Libre sensors while travelling. Can I sell those?",
      a: "No. FreeStyle Libre 1, 2 and 3 are bought, but US retail versions only — sensors purchased abroad cannot be resold here regardless of their condition or expiry date. Check the packaging before including them in a lot.",
    },
    {
      q: "What if the quote changes after my parcel arrives?",
      a: "Ask for the specific reason and for photographs of what was received. A legitimate revision has a concrete cause — a seal broken in transit, a misread date, a count that differs from the description. A vague revision is a renegotiation, and you are entitled to ask for the supplies back instead.",
    },
    {
      q: "How long from posting to being paid?",
      a: "Payment is within 24 hours of the parcel being received and verified, so the transit time is the variable. Verification means someone has opened the outer packaging and checked the boxes against your description. Keep the tracking number, because the payment clock runs from arrival rather than from posting.",
    },
  ],
}
