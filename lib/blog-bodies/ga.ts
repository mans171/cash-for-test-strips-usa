import type { PostBody } from "./types"

/**
 * Georgia — no in-state buyer. The story here is the Atlanta-versus-everywhere
 * else split: Sandy Springs 7.9% and Atlanta 10.6% against Macon-Bibb 17.3%,
 * Augusta-Richmond 16.7% and Columbus 15.5%. Nearly ten points inside one
 * state, and the metro that has the money has the lowest rate.
 */
export const GA: PostBody = {
  label: "Atlanta and the rest",
  title: "Selling Diabetic Test Strips in Georgia: Atlanta Is Not the Whole State",
  heading: "Selling Diabetic Test Strips in Georgia",
  metaDescription:
    "Georgia has no in-state buyer. Macon reads 17.3% for diabetes against Sandy Springs at 7.9%. How to sell by post from anywhere in Georgia, and the two expired items worth keeping.",

  lead: [
    "There is no test strip buyer listed anywhere in Georgia — not in Atlanta, not in Savannah, nowhere. Mail-in is the honest answer here, and a prepaid label costs you nothing across all 751 of the state's ZIP codes.",
    "The more interesting thing about Georgia is how differently the condition sits across it. Macon-Bibb County reads 17.3% for diagnosed diabetes and Augusta-Richmond 16.7%, against 7.9% in Sandy Springs and 10.1% in Athens-Clarke County. That is a spread of more than nine points, and the wealthiest part of metro Atlanta has less than half the rate of middle Georgia.",
  ],

  sections: [
    {
      heading: "Georgia is two states for this",
      paragraphs: [
        "Statewide the figure is 13.3%, above the national rate of 12.1%. As with most states, that average describes very few actual places.",
        "Inside metro Atlanta the numbers are low — Atlanta itself 10.6%, Sandy Springs 7.9%. Outside it they climb sharply: Macon-Bibb 17.3%, Augusta-Richmond 16.7%, Columbus 15.5%, South Fulton 14.3%, Savannah 13.6%.",
        "13.1% of working-age Georgians have no health insurance, well above the national middle, and that gap is concentrated in the same places. Retail is the only price for a lot of people in middle and south Georgia, and retail on test strips is punishing.",
        "It is the clearest answer to the question of whether reselling sealed supplies actually helps anyone. In a state shaped like this one, it does, and quickly.",
      ],
    },
    {
      heading: "Selling by post from Georgia",
      paragraphs: [
        "With no in-state buyer, everything here runs through the post, so the protections matter more than they would somewhere you could hand a box over and count the cash.",
        "Get the number in writing before anything ships. The actual total for what you actually have — brand, count, expiry dates — not a range and not an \"up to\" figure. A buyer who will not commit before the parcel leaves intends to revise once it has arrived, and at that point you have no leverage left.",
        "Use the prepaid label and keep the tracking number. Payment runs from when the parcel is received and verified rather than from when you posted it, so tracking is what puts a date on the clock starting. From Georgia, budget two to three days in transit.",
        "Photograph the sealed boxes with the dates and lot numbers visible before they go, and hold onto those photographs until the money lands. Do not open a box to photograph what is inside — opening it destroys the thing that gave it value.",
      ],
    },
    {
      heading: "If the quote changes after it arrives",
      paragraphs: [
        "Ask for the specific reason, and ask for photographs of what was received. A legitimate revision has a concrete cause: a seal broken in transit, a date misread, a count that differs from what you described.",
        "A vague revision is not a revision, it is a renegotiation. You are entitled to have the supplies returned rather than accept a figure you did not agree to, and a buyer worth dealing with will offer that without being pushed.",
        "This is why the original quote in writing does the real work. It costs five minutes at the start and it is the whole of your position if anything goes sideways.",
      ],
    },
    {
      heading: "The two expired things worth keeping",
      paragraphs: [
        "Almost every guide on this subject says expired supplies have little or no value. For test strips that is correct — a strip that has degraded gives an inaccurate reading, and an inaccurate glucose reading is a safety problem rather than a bargain.",
        "Two exceptions, and they are the ones binned most often. Expired Omnipod pods — 5, DASH and Classic — still have value. So do expired Dexcom G7 sensors. Both at a reduced rate rather than nothing at all.",
        "Expired Dexcom G6 sensors do not qualify, and nor does anything else. But if you are clearing a cupboard in Georgia and the dates have passed, separate those two out before the rest goes in the bin.",
      ],
    },
    {
      heading: "What makes a box sellable",
      paragraphs: [
        "Factory-sealed and unopened, in original packaging. An opened box cannot be resold at any price, because nobody downstream can verify how it was stored. This is the most common reason a parcel is refused.",
        "Not obtained through Medicare or Medicaid. Supplies paid for by those programmes cannot legally be resold. Private insurance or paid for yourself is fine, and a pharmacy label carrying your name changes nothing.",
        "For test strips, at least six months before the expiry date. Under that, value drops off quickly because whoever ends up using them needs time to get through the box.",
        "Check the count before deciding a small stack is not worth a call. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
      ],
    },
    {
      heading: "Who tends to be selling in Georgia",
      paragraphs: [
        "15.8% of Georgians are 65 or over — a lower share than most states, since Georgia skews younger than the national average.",
        "Even so, that group is where most unused supplies originate: a prescription changed, someone moved into care, or a family clearing a house finds sealed boxes nobody knew were there. It is rarely somebody who set out to sell diabetic supplies.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there a buyer in Atlanta?",
      a: "Not on this directory — there is no in-person buyer listed anywhere in Georgia. Mail-in with a prepaid label is the route from anywhere in the state, and it costs you nothing.",
    },
    {
      q: "Why is the diabetes rate so different across Georgia?",
      a: "Macon-Bibb County reads 17.3% and Augusta-Richmond 16.7%, against 7.9% in Sandy Springs — a spread of more than nine points. It follows income and insurance coverage rather than geography, and 13.1% of working-age Georgians have no health insurance.",
    },
    {
      q: "How long does it take to get paid?",
      a: "Two to three days in transit from Georgia, then payment within 24 hours of the parcel being received and verified. Shipping is free regardless of where in the state you post from.",
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
      q: "What if part of my shipment gets rejected?",
      a: "Ask for the specific reason and for photographs of what arrived. Legitimate rejections have concrete causes — a broken seal, a misread date, a count that differs from your description. You can ask for rejected items to be returned rather than accepting a revised figure.",
    },
  ],
}
