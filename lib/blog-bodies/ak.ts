import type { PostBody } from "./types"

/**
 * Alaska — built on distance and time, not on a demand gap.
 *
 * Alaska is the outlier on two axes at once. The nearest buyer is 1,642 miles
 * from the state's centre, which is by a wide margin the longest gap on this
 * site and settles the in-person question before it is asked. And the state is
 * unusually *flat*: 1.9 points between its highest and lowest city, the
 * narrowest spread of any state in the data. Most state posts can be built on
 * an internal divide. Alaska has almost none, so this one is built on the
 * mechanics of shipping from a place where post takes real time — the clock,
 * what "received and verified" means, and what to settle before a parcel
 * leaves. The expired-supplies correction is carried inside that, because from
 * Alaska a wasted shipment costs you weeks, not an afternoon.
 *
 * Figures from lib/state-health-data.ts and lib/blog-angles.ts. No prices.
 */
export const AK: PostBody = {
  label: "No buyer within 1,642 miles — how to sell by post from Alaska",
  title: "Selling Diabetic Test Strips in Alaska: 1,642 Miles to the Nearest Buyer",
  heading: "Selling Diabetic Test Strips in Alaska",
  metaDescription:
    "The nearest test strip buyer is about 1,642 miles from the middle of Alaska, so post is the only route. What that changes about timing, verification and the two expired items most guides tell you to bin.",

  lead: [
    "There is no test strip buyer operating anywhere in Alaska, and the nearest one to the centre of the state is roughly 1,642 miles away. That is not a drive anyone is making, in either direction, and no amount of rewording changes it. Alaska is the furthest any state on this site sits from an in-person option.",
    "Which means the whole of this comes down to posting a parcel and getting paid for it. That is a smaller subject than it sounds, but it has more moving parts from here than it does from Ohio, mostly because of time. This page is about those parts: when the clock starts, what has to be agreed before anything leaves your house, and the one sorting mistake that is expensive everywhere and worse here.",
  ],

  sections: [
    {
      heading: "The clock does not start when you post it",
      paragraphs: [
        "Payment is made within 24 hours of a parcel being received and verified. Both halves of that matter, and the first one is the one that surprises people posting from Alaska. The 24 hours runs from arrival, not from the moment you hand the parcel over, so however long transit takes from where you are sits outside the payment window entirely.",
        "Verification is the second half. Someone opens the outer packaging and checks the boxes against what you described — brand, count, dates, seals. It is a real step rather than a stalling tactic, but it is a step, and it is the reason payment is quoted from receipt rather than from posting.",
        "The practical consequence is that you should not treat this as a same-week transaction from Alaska, and you should be wary of anyone who tells you it is. Plan for the parcel to travel, then for the fast part to happen at the other end.",
      ],
    },
    {
      heading: "Settle the number before the parcel leaves",
      paragraphs: [
        "This is the single most important thing on the page, and it is more important from Alaska than from anywhere else, because the cost of getting it wrong is measured in weeks of transit rather than an afternoon.",
        "Get an actual figure in writing for what you actually have, based on brand, count and expiry dates. Not a range, not an \"up to\" number, not a per-box average taken from a table. A buyer who will not commit to a number before you ship is a buyer who intends to adjust it once your boxes are in their building and the return journey is 1,642 miles long.",
        "If a quote does change after arrival, ask for the specific cause and for photographs of what was received. A seal broken in transit, a misread date, a count that differs from what you described — those are real reasons and they can be checked. A vague downward revision is not a revision at all, and you can ask for the supplies to be sent back rather than accept it.",
        "Photograph everything before it goes. The sealed boxes, the expiry dates, the lot numbers, the packed parcel. Do not open a box to photograph what is inside it; opening it destroys the thing that made it worth sending.",
      ],
    },
    {
      heading: "Do not post the two things most guides tell you to throw away",
      paragraphs: [
        "The most widely read article on selling diabetic supplies tells readers that expired stock has very low or no resale value. For test strips that is correct, and for a sound reason: a degraded strip returns a bad reading, and a bad blood glucose reading is a safety problem rather than a bargain. Nobody should be trading those.",
        "It is wrong about two things, and they are the two people bin most readily. Expired Omnipod pods — 5, DASH and Classic — still carry value. So do expired Dexcom G7 sensors. Both pay at a reduced rate rather than nothing at all.",
        "Expired Dexcom G6 sensors do not qualify, and neither does anything else past its date. Those two exceptions are the whole list. Before you clear a cupboard in Anchorage or Juneau and drive a bag to the tip, check whether what you are holding is one of them.",
      ],
    },
    {
      heading: "What has to be true before a box is worth sending at all",
      paragraphs: [
        "The seal has to be intact — factory-sealed, unopened, original packaging. An opened box cannot be resold at any price, because nobody downstream can know how it was stored. This is the most common reason a parcel comes back, and from Alaska it is the most expensive mistake in the list.",
        "The supplies cannot have come through Medicare or Medicaid. Stock paid for by those programmes cannot be resold. If yours came through your own insurance, or you bought it retail, that is a different matter, and a pharmacy label with your name printed on it does not affect anything either way.",
        "Test strips should have at least six months left before expiry. Below that the value falls away sharply, because whoever uses them next needs time to actually get through the box. And a 100-count box is worth meaningfully more than two 50-count boxes of the same brand, which is worth knowing before you decide what is worth the postage.",
        "FreeStyle Libre has one further condition that catches people out: US retail versions only. Sensors bought outside the country cannot be resold here regardless of how perfect their condition is.",
      ],
    },
    {
      heading: "Alaska is remarkably even, and that is unusual",
      paragraphs: [
        "About 9.4% of Alaskan adults have diagnosed diabetes on the CDC's 2023 BRFSS estimates, against 12.1% nationally. That is a low rate, and it is part of why no buyer has ever set up in the state.",
        "The more interesting number is how little it moves. Wasilla sits at 9.6% and Badger at 7.7% — a spread of 1.9 points between the highest and lowest cities in the state, which is the narrowest gap anywhere in this data. Anchorage is 9.0%, Fairbanks 7.9%, Juneau 8.6%, Meadow Lakes 9.4%. In most states there is a ten-point canyon between the wealthiest suburb and the poorest city. Alaska does not have one.",
        "So there is no concentration to point you at, and no local pocket of demand. With 718,543 people spread across 245 ZIP codes, and 15.2% of them aged 65 or over, what actually reaches the market here is thin, occasional and scattered — a prescription change, a house being cleared, a cupboard nobody had opened in two years.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there a buyer in Anchorage or Fairbanks?",
      a: "No. There is no buyer listed anywhere in Alaska, and the nearest one is about 1,642 miles from the centre of the state. Post is the only honest answer from here. If a buyer ever sets up in state, they will appear on the Alaska page rather than being implied on this one.",
    },
    {
      q: "How long will the whole thing take from Alaska?",
      a: "Longer than from most places, and almost all of the extra time is transit. Payment is made within 24 hours of the parcel arriving and being verified, so the part that is under anyone's control is quick. The part that is not is the journey, and that varies enormously depending on where in the state you are posting from.",
    },
    {
      q: "Do you buy the meter or the pump itself, or only the supplies?",
      a: "Supplies. Test strips, Dexcom and Libre sensors and their transmitters and receivers, and Omnipod pods rather than the controllers. Some sealed Medtronic and Tandem components are bought as well, but those are worth a call before you pack them rather than an assumption made at the kitchen table.",
    },
    {
      q: "Does the prepaid label really cost me nothing from Alaska?",
      a: "Yes. The label is prepaid regardless of where in the state it is posted from. If a buyer asks you to cover postage on a sale like this, treat that as a warning on its own, and treat it as a serious one at Alaskan distances.",
    },
    {
      q: "Are expired supplies worth anything at all?",
      a: "Two things are: Omnipod pods in the 5, DASH and Classic versions, and Dexcom G7 sensors, both at a reduced rate. Expired test strips are not, and neither are expired Dexcom G6 sensors. That is the complete list of exceptions.",
    },
    {
      q: "The outer shipping box got damaged in transit. Does that ruin it?",
      a: "Not in itself. What matters is the condition of the manufacturer's sealed boxes inside, not the carton they travelled in. If one of the inner seals was broken along the way, that item cannot be resold, which is why photographing the sealed boxes before packing them is worth the five minutes it takes.",
    },
  ],
}
