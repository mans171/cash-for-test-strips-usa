import type { PostBody } from "./types"

/**
 * Montana — no in-state buyer, nearest is 566 miles from the state centroid.
 *
 * Written against what actually ranks for this query, not against the old
 * template. Page 1 is national homepages plus MoneyPantry's ~3,500-word
 * listicle. None of them say anything specific about Montana, and the listicle
 * tells readers expired supplies have "very low or no resale value" — which is
 * wrong about Omnipod pods and Dexcom G7 sensors, and costs Montana sellers
 * real money. That correction is the spine of this post.
 *
 * Every figure quoted here is in lib/state-health-data.ts. No dollar amounts:
 * this site quotes payout tiers, not prices, and that is deliberate.
 */
export const MT: PostBody = {
  title: "Selling Diabetic Test Strips in Montana: What Actually Works From Here",
  heading: "Selling Diabetic Test Strips in Montana",
  metaDescription:
    "No test strip buyer operates in Montana — the nearest is 566 miles out. Here's how to sell from here without getting burned, and the two expired items most guides wrongly tell you to throw away.",

  lead: [
    "Montana is one of the states where none of this is convenient. There is no test strip buyer operating anywhere in Montana, and the nearest one to the middle of the state is about 566 miles away. Nobody is driving that to buy a box of strips, and you should be suspicious of any site that implies otherwise.",
    "So the real question here is not \"who buys locally\" — nobody does. It is how to sell by post from a state with 369 ZIP codes and a lot of distance in between, without losing money to a bad buyer or throwing away the things that are worth the most.",
  ],

  sections: [
    {
      heading: "Start by not throwing away the two things worth the most",
      paragraphs: [
        "Almost every guide you will read on this says the same thing about expiry dates: once supplies are past date, they are worthless. The most-read article on this subject in the country puts it exactly that way — expired strips have \"very low or no resale value.\"",
        "For test strips, that is true, and for a good reason. A strip that has degraded gives a bad reading, and a bad reading on a blood glucose test is not a small problem. Nobody should be buying or selling those, and we do not.",
        "But it is not true across the board, and the two exceptions are the ones people bin most often. Expired Omnipod pods — 5, DASH and Classic — still have value. So do expired Dexcom G7 sensors. Both pay at a reduced rate rather than nothing.",
        "If you are clearing out a cupboard in Montana and you are about to throw away a box because the date has passed, check which of those two it is first. That single check is worth more than everything else on this page.",
      ],
    },
    {
      heading: "What decides whether a box is worth anything at all",
      paragraphs: [
        "Setting the two expiry exceptions aside, three things decide it, and all three are pass/fail rather than negotiable.",
        "The seal has to be intact. Factory-sealed, unopened, original packaging. A box that has been opened cannot be resold at any price, because there is no way for the next person to know what happened to it. This is also the most common reason a parcel gets sent back.",
        "It cannot have been bought through Medicare or Medicaid. Supplies paid for by those programmes cannot legally be resold. If yours came through your own insurance or you paid retail, that is fine — and a pharmacy label with your name on it does not affect anything.",
        "And for test strips specifically, there should be at least six months before the expiry date. Less than that and the value drops sharply, because whoever buys them next needs time to actually use them.",
      ],
    },
    {
      heading: "Shipping from Montana without getting burned",
      paragraphs: [
        "Because mail-in is the only realistic route from here, the protections matter more than they would in a state where you could hand something over in person and count the cash.",
        "Get the number in writing before anything leaves your house. Not a range, not \"up to\" a figure — the actual number for what you actually have, based on the brand, the count and the dates. A buyer who will not commit to a figure before you ship is one who intends to revise it downward after your box is already in their building, and at that point your leverage is gone.",
        "Use a prepaid label with tracking, and keep the tracking number. A prepaid label should cost you nothing; if someone asks you to pay shipping on a sale like this, that is a bad sign on its own. Tracking matters because it puts a date on when the parcel arrived, which is what the payment clock runs from.",
        "Do not open anything to photograph the contents. Photograph the sealed box, with the expiry date and the lot number visible. Opening a box to prove what is inside it destroys the thing that gave it value.",
        "Keep the photos until you have been paid. Not because most sales go wrong — most do not — but because the whole dispute, if there is one, comes down to what condition the boxes were in when they left, and photographs are the only version of that anyone can check afterwards.",
      ],
    },
    {
      heading: "How long it should take, and what to do if it doesn't",
      paragraphs: [
        "From Montana, budget two to four days in transit depending on where you are, then payment within 24 hours of the parcel being received and verified. Verification means someone has opened the outer packaging and checked the boxes against what you described — it is not a delay tactic, but it is a step, and it is why payment is quoted from receipt rather than from when you posted it.",
        "If the quote changes after arrival, ask for the specific reason and for photographs of what they received. A legitimate revision has a concrete cause: a seal was broken in transit, a date was misread, the count was different from what was described. A vague revision is not a revision, it is a renegotiation, and you are entitled to have the supplies sent back instead.",
        "This is the part where having the original quote in writing does the work. It is worth the extra five minutes at the start.",
      ],
    },
    {
      heading: "Who ends up selling supplies in Montana",
      paragraphs: [
        "About 9.9% of adults in Montana have diagnosed diabetes, according to the CDC's 2023 BRFSS estimates — below the national rate of 12.1%, and 42nd of any state. That is the lowest-diabetes end of the country, and it is part of why no buyer has set up here.",
        "But the state average buries a lot. In Anaconda-Deer Lodge County the rate is 13%, and in Butte-Silver Bow it is 10.9%, against 5.2% in Bozeman and 7.7% in Missoula. That is a spread of nearly eight points between towns in the same state, and it tracks the difference between an old industrial county and a university town more than anything about Montana as a whole.",
        "The other number that matters is age: 21.1% of Montanans are 65 or over. That is where most of what gets sold actually comes from — a prescription changes, someone moves into care, or a family is clearing a house and finds a cupboard of sealed boxes nobody knew about. It is rarely someone who set out to sell diabetic supplies.",
      ],
    },
    {
      heading: "What we buy, and what we don't",
      paragraphs: [
        "Test strips: FreeStyle Lite, Contour Next in all versions, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. Box count matters more than people expect — a 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
        "CGM: Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 sensors. Libre has one qualifier that catches people out — US retail versions only. Sensors bought abroad cannot be resold here regardless of condition.",
        "Pods and pumps: Omnipod 5, DASH and Classic pods. Pods only, not the controllers. Some sealed Medtronic and Tandem components as well, though those are worth a call rather than an assumption.",
        "We do not buy opened boxes, anything bought through Medicare or Medicaid, or expired supplies other than the two exceptions above. If you are unsure which category yours falls into, that is a phone call, not a guess.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there anywhere in Montana I can sell test strips in person?",
      a: "Not through this directory — there is no buyer listed anywhere in Montana, and the nearest is roughly 566 miles from the centre of the state. Mail-in is the honest answer here. If that changes and a buyer sets up in Billings or Missoula, they will appear on the Montana page.",
    },
    {
      q: "Are expired supplies really worth anything?",
      a: "Two things are: Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors, both at a reduced rate. Everything else past its date, including all test strips and Dexcom G6 sensors, is not worth selling — a degraded strip gives a bad reading, which is a safety problem rather than a bargain.",
    },
    {
      q: "What if my box has a pharmacy label with my name on it?",
      a: "That is fine and does not affect the sale. What matters is that the box is sealed and that the supplies were not obtained through Medicare or Medicaid. You are not asked to explain how you came to have them.",
    },
    {
      q: "How much does shipping cost me from Montana?",
      a: "Nothing. The label is prepaid regardless of where in the state you are posting from. If a buyer asks you to cover shipping on a sale like this, treat it as a warning sign.",
    },
    {
      q: "Can I sell a mix of brands and types in one go?",
      a: "Yes, and it is usually better to. A mixed lot gets quoted as one lot rather than item by item, and quantity improves the per-box rate — ten or more boxes typically does better than the same boxes sold separately.",
    },
    {
      q: "What happens if some of what I send gets rejected?",
      a: "Ask for the specific reason and for photographs of what arrived. Legitimate rejections have concrete causes — a broken seal, a misread date, a count that differs from what was described. You can ask for rejected items to be returned rather than accepting a revised figure you did not agree to.",
    },
  ],
}
