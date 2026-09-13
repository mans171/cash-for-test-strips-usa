import type { PostBody } from "./types"

/**
 * West Virginia — assigned the estate angle on the strength of 21.9% of
 * residents being 65 or over, but the fact that actually defines this state is
 * different and much stronger: 15.9% of adults have diagnosed diabetes, the
 * highest rate of any state in the country.
 *
 * So this post is built on need rather than on clearing a house: the honest
 * answer to "does any of this actually help anyone" is unambiguous here in a
 * way it is not elsewhere, which lets the expired-supplies correction be framed
 * as waste rather than as a missed payout.
 *
 * NOTE (2026-09-06): the state's one in-person buyer was removed from the
 * network, so West Virginia is now a mail-in state. Every claim about a
 * Charleston-area buyer was rewritten out on that date.
 *
 * Structure is deliberately front-light and FAQ-heavy, because a state with
 * partial coverage generates logistics questions rather than reassurance
 * questions.
 *
 * All figures from lib/state-health-data.ts. No dollar amounts.
 */
export const WV: PostBody = {
  label: "Highest rate in the country",
  title: "Selling Diabetic Test Strips in West Virginia: The Highest Rate in the Country",
  heading: "Selling Diabetic Test Strips in West Virginia",
  metaDescription:
    "15.9% of West Virginia adults have diagnosed diabetes — the highest rate of any state. An 11.2-point gap between Beckley and Morgantown, how mail-in works from a rural state, and two expired items worth keeping.",

  lead: [
    "15.9% of adults in West Virginia have diagnosed diabetes. That is the highest rate of any state in the country, against a national figure of 12.1%, and it is the fact that shapes everything on this page.",
    "It changes the usual answer to the question people ask when they find sealed supplies in a relative's house, which is whether any of this is actually needed by anyone. In most states that answer requires some qualification. Here it does not. Roughly one adult in six in this state is managing the condition these supplies are for.",
  ],

  sections: [
    {
      heading: "Beckley reads 19.2% and Morgantown reads 8.0%",
      paragraphs: [
        "The statewide number is high, but the internal spread is wider than the statewide number suggests, and it is one of the widest in the country: 11.2 points between Beckley at 19.2% and Morgantown at 8.0%.",
        "Almost everywhere else in the state sits at the Beckley end. Parkersburg reads 18.6%, Clarksburg 17.1%, Martinsburg 17.0%, Wheeling 16.6%, Weirton 16.3%, Huntington 15.7%, Charleston 15.6% and Fairmont 14.6%. Morgantown is the outlier rather than the counterweight.",
        "That pattern — one university town well below a state where every other place runs high — is the same shape you see elsewhere, but the base is much higher here, so the practical meaning is different. In most of West Virginia, unused supplies are not a curiosity looking for a market.",
        "21.9% of residents are 65 or over, one of the larger shares in the country, which is why so much of what surfaces comes from a house being cleared or a prescription changing rather than from anyone setting out to sell.",
      ],
    },
    {
      heading: "The two items it is genuinely wasteful to throw away",
      paragraphs: [
        "The best-read guide on this subject tells readers that expired supplies have very low or no resale value. For test strips it is correct and should be followed — a degraded strip returns an inaccurate reading, and in a state with this much diabetes that is not a hypothetical risk.",
        "It is wrong twice over, and both errors cost West Virginia households something. Expired Omnipod pods, in the 5, DASH and Classic forms, still hold value at a reduced rate. So do expired Dexcom G7 sensors, also at a reduced rate.",
        "Expired Dexcom G6 sensors do not qualify, and nor does anything else past its date. But those two exceptions are worth knowing before a bin bag gets filled, because they are the items people discard first, on the strength of advice that happens to be wrong about them.",
      ],
    },
    {
      heading: "There is no in-state buyer, and that matters less than it sounds",
      paragraphs: [
        "No buyer is listed anywhere in West Virginia, so this is a postal transaction wherever you are. That is worth being precise about, because the alternative advice — drive somewhere and hand them over — does not apply here.",
        "Charleston, Huntington, Beckley, Morgantown, Parkersburg, Wheeling, Weirton, Martinsburg, Fairmont and Clarksburg are all in the same position. There is no drive that shortens this for anyone, which at least removes a decision: the question is not whether the trip is worth making, only whether the boxes are worth posting.",
        "The panhandles are still a separate case, for a different reason. Weirton and Wheeling sit at the northern tip and Martinsburg at the eastern end, and both are closer to another state's buyers than to anything in West Virginia. If you are in the eastern panhandle, the Maryland page is worth reading alongside this one.",
        "The label is prepaid and costs nothing from any of West Virginia's 738 ZIP codes, which is a lot of ZIP codes for 1,769,795 people and a fair indication of how rural most of the state is. In a state shaped like this one, posting was usually the better answer even when there was somewhere to drive to.",
      ],
    },
    {
      heading: "What has to be true for a box to be sellable",
      paragraphs: [
        "Factory-sealed and unopened, in original packaging. An opened box cannot be resold at any price, because nobody downstream can verify how it was stored. This is the most common reason a parcel is refused or a settled figure gets reopened.",
        "Not obtained through a government-covered program — supplies paid for that way cannot be resold. Private insurance or paid at retail is fine, and a pharmacy label with a name on it is irrelevant and does not need removing. Nobody will ask you to explain how the supplies came to be in the house.",
        "For test strips, at least six months before the expiry date. The qualifying brands are FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, and True Metrix. On the CGM side it is Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 in US retail versions only.",
        "Count matters more than people expect. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand, and ten or more boxes earns a better per-box rate. A mixed lot is quoted as one lot and does not need sorting by brand.",
      ],
    },
    {
      heading: "Doing the parcel properly",
      paragraphs: [
        "Settle the figure before the parcel leaves, and get it in writing. Brand, count, expiry dates. A buyer who will not commit to a number before shipping intends to revise it afterwards, and once the box is in their building you have no leverage left.",
        "Use the prepaid label and keep the tracking number. Photograph each sealed box with the expiry date and lot number visible, and hold onto those photographs until payment lands. Do not open anything to photograph the contents — opening a box destroys the only thing that made it sellable.",
        "Payment follows within 24 hours of the parcel being received and verified. Verification means somebody has checked the boxes against your description, which is a step rather than a stall — and it is why an accurate description at the start is in your own interest.",
      ],
    },
  ],

  faqs: [
    {
      q: "Can I sell in person anywhere in West Virginia?",
      a: "Not at present. No buyer is listed anywhere in the state, so from Charleston, Huntington, Beckley, Morgantown, Parkersburg, Wheeling, Weirton, Martinsburg, Fairmont or Clarksburg alike, a prepaid parcel is the route. It costs you nothing from any ZIP code in West Virginia.",
    },
    {
      q: "I'm in Martinsburg. Is there anywhere nearer than posting them?",
      a: "The eastern panhandle sits closer to Maryland than to anywhere in West Virginia, so the Maryland page is worth reading alongside this one. Mail-in costs you nothing from anywhere in the state either way, and for a small quantity that is usually the sensible answer.",
    },
    {
      q: "Which expired supplies are actually worth keeping?",
      a: "Two: Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors, both at a reduced rate. Expired test strips and expired Dexcom G6 sensors are not worth selling, and expired strips should not be resold by anyone because degraded strips give inaccurate readings.",
    },
    {
      q: "My father's supplies came through a government program. Can I still sell them?",
      a: "No. Supplies obtained through a government-covered program cannot be resold. Anything covered by private insurance or paid for at retail is fine. If you cannot tell which it was, the pharmacy that filled the prescription can usually confirm it.",
    },
    {
      q: "How much do I need before it is worth a phone call?",
      a: "Less than most people assume, and the counts matter more than the number of boxes — a 100-count box is worth meaningfully more than two 50-count boxes. Ten or more boxes earns a better per-box rate, but a small sealed lot is still worth describing over the phone.",
    },
    {
      q: "How quickly do I get paid if I post it?",
      a: "Within 24 hours of the parcel being received and verified, rather than from the day you posted it. Keep the tracking number, since that is what establishes when the parcel arrived and when that clock started.",
    },
    {
      q: "Does any of what I send stay in West Virginia?",
      a: "Some of it will find its way back to a state where 15.9% of adults have diagnosed diabetes — the highest rate in the country. What can be said plainly is that sealed supplies which would otherwise be thrown away go back into circulation rather than into landfill.",
    },
  ],
}
