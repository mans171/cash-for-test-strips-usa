import type { PostBody } from "./types"

/**
 * North Dakota — written as a sequenced procedure rather than an essay.
 *
 * Two facts drive the shape. The nearest buyer is 600 miles from the state's
 * centre, the longest gap of any state in the contiguous run of no-buyer
 * states here. And North Dakota is extraordinarily dispersed: 388 ZIP codes
 * for 789,463 people, roughly one ZIP for every two thousand residents. Put
 * together, a second attempt at a shipment is genuinely costly from here, so
 * this post is built as an ordered walkthrough — separate, rescue, describe,
 * pack, post — instead of the topic-by-topic structure the other states use.
 * The expired-supplies correction is step two, where a seller is standing over
 * a bin bag and about to make the mistake.
 *
 * Figures from lib/state-health-data.ts and lib/blog-angles.ts. No prices.
 */
export const ND: PostBody = {
  label: "One shipment, done once — the order to do it in from North Dakota",
  title: "Selling Diabetic Test Strips in North Dakota: Getting One Shipment Right",
  heading: "Selling Diabetic Test Strips in North Dakota",
  metaDescription:
    "The nearest buyer is about 600 miles from the middle of North Dakota, so a second attempt costs you weeks. The order to work in: what to set aside, what to rescue from the bin, and what to agree before posting.",

  lead: [
    "There is no buyer in North Dakota. The nearest one to the centre of the state is roughly 600 miles out, which is the longest run of any state covered here outside Alaska. That is not a distance anyone drives for a bag of boxes, and nobody should suggest otherwise.",
    "So the whole exercise is one parcel, and the useful thing is to get that parcel right the first time. A rejected shipment from a state this spread out — 388 ZIP codes serving 789,463 people — costs you the journey twice over. What follows is the order to work in, because the order genuinely matters.",
  ],

  sections: [
    {
      heading: "Step one: pull out what cannot be sold at all",
      paragraphs: [
        "Start by subtracting rather than counting. Anything with a broken seal comes out first. Factory-sealed, unopened, original manufacturer's packaging is the standard, and an opened box has no value at any tier because nobody downstream can verify how it was handled. This is the most common single reason a parcel is refused, and it is entirely avoidable at the kitchen table.",
        "Next, anything obtained through Medicare or Medicaid. Supplies paid for by those programmes cannot be resold, and no amount of good condition changes that. A pharmacy label with your own name printed on it is not a problem and never has been — the question is about which plan paid, not whose name is on the box.",
        "Then FreeStyle Libre sensors bought outside the United States. US retail versions only, and this catches out more people than you would expect. If the packaging is not the American version, it comes out of the pile.",
        "Lastly, test strips with less than six months before expiry. They are not disqualified outright, but the value falls away sharply below that mark because whoever uses them next needs time to work through the box.",
      ],
    },
    {
      heading: "Step two: put two things back",
      paragraphs: [
        "This is the step that pays for the rest of the page. The most widely read guide on selling diabetic supplies tells its readers that expired stock has very low or no resale value, and a great many people have binned perfectly saleable items on that sentence.",
        "It is correct about test strips. A degraded strip can give an inaccurate reading, and an inaccurate glucose reading is a safety problem rather than a bargain, so expired strips belong in the bin regardless of brand.",
        "It is wrong about Omnipod pods and wrong about Dexcom G7 sensors. Expired Omnipod 5, DASH and Classic pods retain value. Expired Dexcom G7 sensors retain value. Both pay at a reduced rate, but a reduced rate is not nothing, and pods in particular are the item most often thrown away by someone who has just read that they are worthless.",
        "Expired Dexcom G6 sensors are not in the exception. Neither is anything else. Two items go back on the table, and the rest of the expired pile stays where it is.",
      ],
    },
    {
      heading: "Step three: describe what is left, then get a figure for it",
      paragraphs: [
        "Now count what survived. Brand, product, box count and the expiry date on each. Count is worth attention rather than a rough total: a 100-count box is worth meaningfully more than two 50-count boxes of the same brand, so a list that says \"about four hundred strips\" is less useful than one that says how they are packaged.",
        "You do not need to separate brands or supply types for shipping. A mixed lot is quoted as one lot rather than item by item, and quantity works in your favour — ten or more boxes earns a better per-box rate than the same boxes dribbled out over several months. If more is likely to accumulate soon, waiting is often the better call from a state where every parcel is a long journey.",
        "With that list, get an actual number in writing before anything moves. The figure for what you specifically have, not a range and not an \"up to\". A buyer who will not commit before the parcel leaves Bismarck intends to revise the number once it has arrived, and by then it is 600 miles away and the conversation has changed.",
      ],
    },
    {
      heading: "Step four: photograph it, pack it, post it",
      paragraphs: [
        "Photograph each sealed box with the expiry date and lot number visible, then the packed parcel before it is closed. Keep those images until the payment has landed. Most shipments are uneventful, but if one is not, photographs of the boxes as they left are the only version of events anybody can check afterwards.",
        "Do not open a box to photograph its contents. Opening it destroys precisely the thing that gave it value, and it is a surprisingly common instinct in someone trying to be thorough.",
        "The label is prepaid and costs you nothing from any ZIP code in the state. If a buyer asks you to pay postage on a sale like this, that is a signal on its own and worth acting on.",
        "Payment follows within 24 hours of the parcel being received and verified. Verification means someone has checked the boxes against your description. If the figure changes at that point, ask for the specific cause and for photographs of what arrived — a broken seal, a misread date, a count that differs from your list are all concrete and checkable. A vague reduction is not, and you can ask for the supplies back instead.",
      ],
    },
    {
      heading: "What North Dakota's numbers actually say",
      paragraphs: [
        "About 9.8% of North Dakotan adults have diagnosed diabetes on the CDC's 2023 BRFSS estimates, comfortably below the national 12.1%, with 17.5% of the population aged 65 or over and just 7.3% of working-age adults uninsured.",
        "The state is also flat. Jamestown reads 10.8% and West Fargo 7.3% — a 3.5-point spread between the highest and lowest cities, where many states run to eight or ten points between a struggling city and a wealthy suburb. Fargo is 8.1%, Bismarck 9.4%, Grand Forks 8.9%, Minot 8.7%, Wahpeton 10.6%.",
        "A low rate, a small population and no concentrated pocket of demand together explain why no buyer has ever set up here. It is a commercial fact rather than an oversight, and it is why the honest advice from North Dakota is a well-prepared parcel rather than a drive to somewhere that does not exist.",
      ],
    },
  ],

  faqs: [
    {
      q: "I only have three or four boxes. Is it worth doing at all?",
      a: "It can be, since the prepaid label costs you nothing. But ten or more boxes earns a better per-box rate, so if more is likely to come out of a repeat prescription in the next few months, holding and sending once is usually the stronger move from North Dakota.",
    },
    {
      q: "Do I have to list every box before I ask for a figure?",
      a: "You need enough detail for the figure to be real: brand, product, how each box is packaged, and the expiry dates. That is what makes a quote something you can hold someone to rather than an estimate that quietly moves after the parcel arrives.",
    },
    {
      q: "Are the pods really worth keeping once they have expired?",
      a: "Yes. Omnipod 5, DASH and Classic pods are bought after expiry at a reduced rate, as are Dexcom G7 sensors. It is the correction most worth making before you tie the bin bag, because pods are exactly what people throw out on the strength of general advice about expiry dates.",
    },
    {
      q: "What happens if part of the shipment is rejected after it arrives?",
      a: "Ask for the specific reason and for photographs of what was received. Legitimate rejections have concrete causes — a seal broken in transit, a date misread, a count that does not match your list. You can ask for rejected items to be returned rather than accepting a revised total you never agreed to.",
    },
    {
      q: "Can different brands and product types travel in the same parcel?",
      a: "Yes, and it is normal. A mixed lot is quoted as one lot, so strips, sensors and pods can all go together. Sorting them helps you write an accurate description, but it is not a requirement of the shipment itself.",
    },
    {
      q: "Is there any chance of a buyer opening in Fargo or Bismarck?",
      a: "Nothing is listed, and with a statewide rate of 9.8% across 789,463 people there is not much of a commercial case for one. If that changes, a buyer will appear on the North Dakota page. Until then, treating post as the only route is the accurate way to plan.",
    },
  ],
}
