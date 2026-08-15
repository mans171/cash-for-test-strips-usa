import type { PostBody } from "./types"

/**
 * Illinois — no in-state buyer at all, and it is the largest completely
 * uncovered market in the country. Chicago alone is bigger than most states.
 *
 * This page cannot lean on proximity, because there is none. It earns its place
 * by being straight about the gap and genuinely useful about the alternative,
 * which is what nobody else writing about Illinois does.
 */
export const IL: PostBody = {
  label: "No local buyer",
  title: "Selling Diabetic Test Strips in Illinois: No Local Buyer, and What to Do",
  heading: "Selling Diabetic Test Strips in Illinois",
  metaDescription:
    "There is no test strip buyer anywhere in Illinois, Chicago included. How to sell by post without getting burned, what sealed supplies are worth, and the two expired items worth keeping.",

  lead: [
    "There is no buyer listed anywhere in Illinois. Not in Chicago, not in Springfield, nowhere. Illinois is the largest completely uncovered market in the country — Chicago on its own has more people than twenty-odd states, and none of them has anyone taking supplies in person.",
    "That is an unusual thing for a directory to lead with. It is also the most useful thing this page can tell you, because it means every site promising you a local Chicago buyer is either describing a mail-in service or describing nothing at all.",
  ],

  sections: [
    {
      heading: "What \"no local buyer\" actually changes",
      paragraphs: [
        "Less than you would think. Mail-in with a prepaid label costs you nothing, reaches every one of the state's 1,396 ZIP codes, and pays within 24 hours of the parcel being received and verified. For most people the difference between that and an in-person handover is a few days.",
        "What it does change is where the risk sits. In person, you both look at the boxes and money changes hands on the spot. By post, there is a window where your supplies are in someone else's building and the price has not been paid yet. That window is where things go wrong, and it is worth knowing how to close it.",
        "The rest of this page is mostly about closing that window: what to settle before anything ships, what to photograph, and what to do if the number moves after your parcel arrives.",
      ],
    },
    {
      heading: "Getting the quote right before anything ships",
      paragraphs: [
        "Get the number in writing first. Not a range, not \"up to\" a figure, not a per-box estimate — the actual total for what you actually have, based on the brand, the count and the expiry dates. Anyone unwilling to commit to a figure before your parcel leaves intends to revise it once it has arrived, and at that point your negotiating position is gone.",
        "Describe what you have accurately when you ask. Count the boxes, read the dates, note whether they are 50-count or 100-count. An accurate description is what makes the quote binding in any meaningful sense — a figure based on a vague description is not worth much.",
        "Photograph the sealed boxes with the expiry dates and lot numbers visible before they go anywhere. Do not open a box to photograph what is inside it. Opening it destroys the thing that gave it value in the first place.",
      ],
    },
    {
      heading: "And after it ships",
      paragraphs: [
        "Use the prepaid label, and keep the tracking number. Payment runs from when the parcel is received and verified rather than from when you posted it, so the tracking is what puts a date on the clock starting. From Illinois, budget two to three days in transit.",
        "Verification is a real step, not a stalling tactic — someone opens the outer packaging and checks the boxes against your description. But it is also the point at which a bad buyer would revise a price, so it is the point to pay attention to.",
        "If the number changes, ask for the specific reason and for photographs of what arrived. A legitimate revision has a concrete cause: a seal broken in transit, a date misread, a count different from what was described. A vague revision is a renegotiation, and you are entitled to ask for the supplies back instead of accepting it.",
        "Keep your photographs until the money has landed. Not because most sales go wrong — most do not — but because if one does, the entire dispute comes down to what condition the boxes were in when they left, and photographs are the only record of that anyone can check afterwards.",
      ],
    },
    {
      heading: "The two expired things worth keeping",
      paragraphs: [
        "Almost every guide on this subject says expired supplies have little or no value. For test strips, that is right — a strip that has degraded gives an inaccurate reading, and an inaccurate glucose reading is a safety problem rather than a bargain.",
        "Two exceptions, and they are the two most often thrown out. Expired Omnipod pods — 5, DASH and Classic — still have value. So do expired Dexcom G7 sensors. Both pay at a reduced rate rather than nothing.",
        "Expired Dexcom G6 sensors do not qualify, and neither does anything else. But if you are working through a cupboard in Illinois and the dates have passed, separate out the pods and the G7 sensors before the rest goes in the bin.",
      ],
    },
    {
      heading: "What makes a box sellable at all",
      paragraphs: [
        "Factory-sealed and unopened, in original packaging. An opened box cannot be resold at any price, because nobody downstream can verify how it was stored. This is comfortably the most common reason a parcel is refused.",
        "Not obtained through Medicare or Medicaid. Supplies paid for by those programmes cannot legally be resold. Private insurance or out of pocket is fine, and a pharmacy label with your name on it makes no difference.",
        "For test strips, at least six months before the expiry date. Under that, value drops quickly, because whoever ends up using them needs time to work through the box.",
        "Check the count before writing off a small stack. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
      ],
    },
    {
      heading: "Illinois by the numbers",
      paragraphs: [
        "11.7% of Illinois adults have diagnosed diabetes, according to the CDC's 2023 BRFSS estimates — a shade below the national rate of 12.1%.",
        "Chicago sits at 12.0%, but the state's high figures are elsewhere: Rockford at 15.4%, Waukegan at 14.4% and Peoria at 13.5%, against 8.7% in Naperville and 8.2% in Champaign. That is a seven-point spread between towns in the same state, and it follows income and insurance far more closely than geography.",
        "9.9% of working-age Illinoisans have no health insurance, and 17.9% of the state is 65 or over. The second of those is where most unused supplies actually originate — a prescription changed, a move into care, a house being cleared.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there really no buyer in Chicago?",
      a: "Not on this directory — there is no in-person buyer listed anywhere in Illinois. Any site advertising a local Chicago buyer is describing a mail-in service. If that changes, the buyer will appear on the Illinois page.",
    },
    {
      q: "How long does the whole thing take from Illinois?",
      a: "Two to three days in transit, then payment within 24 hours of the parcel being received and verified. Shipping costs you nothing, and the label is prepaid regardless of where in the state you post from.",
    },
    {
      q: "What do I do if the price changes after they receive it?",
      a: "Ask for the specific reason and for photographs of what arrived. Legitimate revisions have concrete causes — a broken seal, a misread date, a count that differs from your description. If the reason is vague, ask for the supplies to be returned rather than accepting a figure you did not agree to.",
    },
    {
      q: "Are expired supplies worth anything?",
      a: "Two things are: Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors, both at a reduced rate. Expired test strips and expired Dexcom G6 sensors are not worth selling.",
    },
    {
      q: "My supplies came through Medicaid. Can I sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold. Anything received through private insurance or paid for yourself is fine, and a pharmacy label with your name on it does not matter.",
    },
    {
      q: "I have a large mixed lot. Is that harder to sell by post?",
      a: "Easier, if anything. Large lots are quoted as a whole rather than item by item, mixed brands do not need separating, and ten or more boxes typically earns a better per-box rate than the same boxes sold piecemeal.",
    },
  ],
}
