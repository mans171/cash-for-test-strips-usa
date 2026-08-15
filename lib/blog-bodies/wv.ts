import type { PostBody } from "./types"

/**
 * West Virginia — assigned the estate angle on the strength of 21.9% of
 * residents being 65 or over, but the fact that actually defines this state is
 * different and much stronger: 15.9% of adults have diagnosed diabetes, the
 * highest rate of any state in the country.
 *
 * So this post is built on destination rather than on clearing a house. It is
 * the only one of the older-population states with an in-state buyer (Charleston
 * area), and the only one where the honest answer to "does any of this actually
 * help anyone nearby" is unambiguous. That gives it a spine none of Delaware,
 * Hawaii, Maine or Vermont can share, and it lets the expired-supplies
 * correction be framed as waste rather than as a missed payout.
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
    "15.9% of West Virginia adults have diagnosed diabetes — the highest rate of any state. There is a buyer in the Charleston area, an 11.2-point gap between Beckley and Morgantown, and two expired items worth keeping.",

  lead: [
    "15.9% of adults in West Virginia have diagnosed diabetes. That is the highest rate of any state in the country, against a national figure of 12.1%, and it is the fact that shapes everything on this page.",
    "It changes the usual answer to the question people ask when they find sealed supplies in a relative's house, which is whether any of this is actually needed by anyone. In most states that answer requires some qualification. Here it does not. Roughly one adult in six is managing this condition, and West Virginia is also one of the few older-population states with a buyer operating inside it.",
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
      heading: "Charleston is the one place in the state with a buyer",
      paragraphs: [
        "There is a buyer listed in the Charleston area who will take supplies in person. That is the only in-state option, and it is worth being precise about what it does and does not cover.",
        "Huntington, Beckley, Parkersburg, Wheeling, Weirton, Martinsburg, Fairmont and Clarksburg have no listed buyer of their own. Whether the trip to Charleston is worth making from any of them depends entirely on how much you have — for two or three boxes it plainly is not, and for a large lot out of a house clear-out it can be, since you settle in one visit rather than waiting on a parcel.",
        "The panhandles are a separate case. Weirton and Wheeling sit at the northern tip and Martinsburg at the eastern end, and neither is meaningfully connected to Charleston by geography. If you are in the eastern panhandle it is worth checking the Maryland page as well as this one before assuming Charleston is your nearest option.",
        "For everywhere else, mail-in is the sensible default. The label is prepaid and costs nothing from any of West Virginia's 738 ZIP codes, which is a lot of ZIP codes for 1,769,795 people and a fair indication of how rural most of the state is.",
      ],
    },
    {
      heading: "What has to be true for a box to be sellable",
      paragraphs: [
        "Factory-sealed and unopened, in original packaging. An opened box cannot be resold at any price, because nobody downstream can verify how it was stored. This is the most common reason a parcel is refused or a settled figure gets reopened.",
        "Not obtained through Medicare or Medicaid — supplies paid for through those programmes cannot be resold. Private insurance or paid at retail is fine, and a pharmacy label with a name on it is irrelevant and does not need removing. Nobody will ask you to explain how the supplies came to be in the house.",
        "For test strips, at least six months before the expiry date. The qualifying brands are FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, and True Metrix. On the CGM side it is Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 in US retail versions only.",
        "Count matters more than people expect. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand, and ten or more boxes earns a better per-box rate. A mixed lot is quoted as one lot and does not need sorting by brand.",
      ],
    },
    {
      heading: "Doing the handover or the parcel properly",
      paragraphs: [
        "If you are driving to Charleston, settle the figure on the phone first. Brand, count, expiry dates. The meeting should be a handover rather than a negotiation, and a number that moves once you have arrived is one to walk away from, particularly after a drive across the state.",
        "Meet somewhere public and busy in daylight, bring everything sealed, and bring the quantity you described. Turning up with a different count is the quickest way to reopen a price that was already agreed.",
        "If you are posting instead, get the figure in writing before the parcel leaves, use the prepaid label and keep the tracking number. Photograph each sealed box with the expiry date and lot number visible, and hold onto those photographs until payment lands.",
        "Payment follows within 24 hours of the parcel being received and verified. Verification means somebody has checked the boxes against your description, which is a step rather than a stall — and it is why an accurate description at the start is in your own interest.",
      ],
    },
  ],

  faqs: [
    {
      q: "Can I sell in person anywhere in West Virginia?",
      a: "In the Charleston area, yes — that is the only listed in-state buyer. Huntington, Beckley, Morgantown, Parkersburg, Wheeling, Weirton, Martinsburg, Fairmont and Clarksburg have no buyer of their own, so from those places it is either the drive or a prepaid parcel.",
    },
    {
      q: "I'm in Martinsburg. Is Charleston really my nearest option?",
      a: "Not necessarily. The eastern panhandle is not naturally connected to Charleston, so it is worth checking the Maryland page alongside this one. Mail-in also costs you nothing from anywhere in the state, which for a small quantity is usually the sensible answer.",
    },
    {
      q: "Which expired supplies are actually worth keeping?",
      a: "Two: Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors, both at a reduced rate. Expired test strips and expired Dexcom G6 sensors are not worth selling, and expired strips should not be resold by anyone because degraded strips give inaccurate readings.",
    },
    {
      q: "My father's supplies came through Medicare. Can I still sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold. Anything covered by private insurance or paid for at retail is fine. If you cannot tell which it was, the pharmacy that filled the prescription can usually confirm it.",
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
