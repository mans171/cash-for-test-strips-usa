import type { PostBody } from "./types"

/**
 * North Carolina — three listed buyers, second only to Pennsylvania's four.
 * Raleigh-Durham, the Raleigh-Greensboro area, and Charlotte.
 *
 * The honest observation worth building on: the three covered cities are the
 * three with the LOWEST diabetes rates in the state. Charlotte 10.1%, Raleigh
 * 9.1%, Durham 10.2%, against Winston-Salem 13.1% and Fayetteville 12.6%.
 * Coverage has followed population and wealth rather than need. Saying so is
 * more useful than pretending the map is optimal.
 */
export const NC: PostBody = {
  label: "Three buyers",
  title: "Selling Diabetic Test Strips in North Carolina: Three Buyers, One Blind Spot",
  heading: "Selling Diabetic Test Strips in North Carolina",
  metaDescription:
    "North Carolina has three in-person buyers — Charlotte, Raleigh-Durham and Greensboro. They also happen to be the state's lowest-diabetes cities. Where that leaves everyone else.",

  lead: [
    "North Carolina is one of the better-covered states on this directory. There are three in-person buyers listed here — Charlotte, the Raleigh-Durham area, and around Greensboro — against none at all in thirty-one states.",
    "There is also something worth noticing about where those three sit. Charlotte reads 10.1% for diagnosed diabetes, Raleigh 9.1% and Durham 10.2%. They are three of the lowest rates in the state. Coverage here has followed population and money, not need.",
  ],

  sections: [
    {
      heading: "Where the buyers are, and where the need is",
      paragraphs: [
        "The three buyers sit along the Charlotte-to-Raleigh corridor, which is where most of the state's population and nearly all of its recent growth is. If you are in the Triangle, the Triad or Mecklenburg County, in-person is a realistic option and a same-day handover is straightforward.",
        "Winston-Salem reads 13.1% and Fayetteville 12.6% — meaningfully higher than any of the covered cities. Wilmington is at 10.7%. The eastern half of the state, from Greenville out to the coast, has nothing listed at all and is where rural diabetes rates in North Carolina run highest.",
        "That is not a criticism of the buyers, who set up where they live. It is just worth knowing if you are in Rocky Mount or Elizabeth City and wondering why nothing shows up near you. Mail-in reaches all 853 of the state's ZIP codes and the label costs you nothing.",
      ],
    },
    {
      heading: "The two expired things worth keeping",
      paragraphs: [
        "Nearly every guide on this subject says expired supplies are worthless. For test strips that is right — a strip that has degraded gives an inaccurate reading, which is a safety problem rather than a discount.",
        "Two exceptions. Expired Omnipod pods — 5, DASH and Classic — still have value, and so do expired Dexcom G7 sensors. Both at a reduced rate rather than nothing.",
        "Expired Dexcom G6 sensors do not qualify, and nor does anything else. But those two get binned constantly on the strength of advice that does not apply to them.",
      ],
    },
    {
      heading: "What makes a box sellable",
      paragraphs: [
        "Factory-sealed and unopened, in the original packaging. An opened box cannot be resold at any price — nobody downstream can verify how it was stored, and this is comfortably the most common reason a parcel gets refused.",
        "Not obtained through Medicare or Medicaid. Supplies paid for by those programmes cannot legally be resold. Private insurance or out of pocket is fine, and a pharmacy label with your name on it makes no difference.",
        "For test strips, at least six months before the expiry date. Under that, value drops quickly.",
        "Box count is worth checking before you dismiss a small stack — a 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
      ],
    },
    {
      heading: "Meeting a buyer in person",
      paragraphs: [
        "Settle the number on the phone before you drive anywhere. Brand, count, expiry dates. The meeting should be a handover rather than a negotiation, and a figure that moves once you have arrived is a figure worth walking away from.",
        "Meet somewhere public and busy in daylight — a supermarket car park is normal for this and no reasonable buyer will object.",
        "Bring everything sealed and bring the quantity you described. Arriving with a different count is the quickest way to reopen a settled price.",
        "Count the cash before the boxes change hands. That is not suspicion, it is just how a cash transaction works.",
      ],
    },
    {
      heading: "North Carolina's numbers",
      paragraphs: [
        "12.0% of North Carolina adults have diagnosed diabetes, according to the CDC's 2023 BRFSS estimates — essentially level with the national rate of 12.1%.",
        "The spread inside the state runs from 8.6% in Cary up to 13.1% in Winston-Salem, which is narrower than in states like Michigan or Ohio but still follows the same pattern: the wealthier suburbs low, the older industrial and rural areas higher.",
        "10.4% of working-age North Carolinians have no health insurance, and 18.0% of the state is 65 or over. That second figure is where most unused supplies actually come from — a prescription changed, a move into care, a house being cleared after a death.",
      ],
    },
    {
      heading: "If you are shipping instead",
      paragraphs: [
        "Get the quote in writing before anything leaves. Use the prepaid label and keep the tracking number, since payment runs from when the parcel is received and verified rather than from when you posted it.",
        "Photograph the sealed boxes with dates and lot numbers visible, and keep those photographs until the money lands. Do not open anything to photograph the contents.",
        "If the number changes on arrival, ask for the specific reason and for photographs of what was received. A concrete reason is legitimate; a vague one is a renegotiation, and you can ask for the supplies back instead.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there a buyer in eastern North Carolina?",
      a: "Not on this directory. The three listed buyers are all along the Charlotte-to-Raleigh corridor. From Greenville, Rocky Mount or the coast, mail-in with a prepaid label is the practical route and costs you nothing.",
    },
    {
      q: "Which North Carolina city has the highest diabetes rate?",
      a: "Of the larger cities, Winston-Salem at 13.1%, followed by Fayetteville at 12.6% and Greensboro at 12.2%. The lowest are Cary at 8.6% and Raleigh at 9.1%.",
    },
    {
      q: "Do you buy expired Dexcom sensors?",
      a: "Expired G7 sensors, yes, at a reduced rate. Expired G6 sensors, no. Sealed in-date G6 sensors and transmitters are bought normally, as are G7 sensors and receivers.",
    },
    {
      q: "My supplies came through Medicaid. Can I sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold. Anything received through private insurance or paid for yourself is fine.",
    },
    {
      q: "Is in person better than posting?",
      a: "In person is faster and removes any argument about what condition the boxes were in on arrival, so if you are near one of the three buyers it is usually the better option. By post, payment goes out within 24 hours of receipt and verification and shipping costs you nothing.",
    },
    {
      q: "Can I sell a mixed lot of different brands?",
      a: "Yes, and it is usually better to. Mixed lots are quoted as a single lot rather than item by item, and ten or more boxes generally earns a better per-box rate than the same boxes sold separately.",
    },
  ],
}
