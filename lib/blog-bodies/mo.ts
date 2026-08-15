import type { PostBody } from "./types"

/**
 * Missouri — built on the state line running through Kansas City. There is no
 * buyer listed anywhere in Missouri, but the Kansas listing is in Kansas City,
 * which means a Missourian on the western edge of the state has an in-person
 * option a few minutes' drive away in another state. Nobody at the St. Louis
 * end has anything comparable, and St. Louis is the highest-rate city in the
 * state at 13.2%.
 *
 * This is deliberately the opposite construction to Oklahoma, which shares the
 * same generated angle and is built on the state being unusually even. Missouri
 * is about a state that is lopsided and split at exactly the wrong point.
 *
 * Omnipod is the generated angle and appears here as one short section, not as
 * the spine. Figures from lib/state-health-data.ts.
 */
export const MO: PostBody = {
  label: "The line through Kansas City",
  title: "Selling Diabetic Test Strips in Missouri: Your Nearest Buyer Is in Kansas",
  heading: "Selling Diabetic Test Strips in Missouri",
  metaDescription:
    "No buyer operates anywhere in Missouri. But Kansas City is cut in half by a state line and there is a listed buyer on the Kansas side, which changes the answer depending on which end of Missouri you are.",

  lead: [
    "Missouri has no buyer listed anywhere inside it. That is the plain answer and it does not change no matter how the question is phrased. What does change is what follows from it, and in Missouri it depends entirely on which end of the state you are standing at.",
    "Kansas City is not one city. The state line runs straight through the middle of the metro, and the buyer listed in this directory for Kansas is in Kansas City on the Kansas side. If you live in Missouri anywhere near the western edge, an in-person handover is a short local drive that happens to cross a border.",
    "If you live at the other end — St. Louis, St. Charles, anywhere across the eastern half — there is no equivalent, and posting is the route. Same state, two completely different answers.",
  ],

  sections: [
    {
      heading: "The western edge: a border that is easier to cross than most",
      paragraphs: [
        "Kansas City, Missouri reads 12.0% for diagnosed diabetes, near enough exactly the national figure of 12.1%. Independence next door reads 12.9%, Blue Springs 9.9%, Lee's Summit 9.5%. It is a metro of well over a million people and a large share of them are within an ordinary commute of the Kansas side of the line.",
        "That matters more than it sounds. Most of the states with no listed buyer have no realistic in-person option at all, and this directory says so on those pages rather than dressing it up. Missouri is one of the few where the honest answer is that your nearest buyer is real, reachable, and simply in a different state.",
        "Whether it is worth doing is a question of volume. For two or three boxes it is not — the prepaid label costs you nothing and takes the driving out of it entirely. For a substantial lot, especially a house clear-out, an in-person handover means being paid on the day rather than after transit and verification, and at that size the trip pays for itself.",
      ],
    },
    {
      heading: "St. Louis has nothing comparable, and reads highest in the state",
      paragraphs: [
        "St. Louis is at 13.2%, the highest of any city in Missouri and above both the state figure of 12.1% and the national one. St. Joseph reads 13.0%. Against that, Columbia reads 8.5% — a spread of 4.7 points between the state's highest and lowest cities.",
        "Missouri's spread is narrower than most states manage, which tells you something useful: this is not a state with one distressed pocket and an otherwise comfortable remainder. Springfield at 11.1%, St. Charles at 10.4%, O'Fallon at 9.8% — the whole distribution sits in a fairly tight band around a national-average state.",
        "For an eastern-Missouri seller none of that changes the practical position. There is no listed buyer within reach on that side, no Illinois option either, and posting is not a compromise so much as the normal way this works for most of the country.",
      ],
    },
    {
      heading: "The 1,035 ZIP codes in between",
      paragraphs: [
        "Missouri has 1,035 ZIP codes, which is a very high count for a state of six and a quarter million people, and it is the clearest single indicator of how much of Missouri is small towns rather than metro. Between the two big ends there is a great deal of state.",
        "If you are in that middle — Sedalia, Rolla, Kirksville, Poplar Bluff, anywhere off the two interstates — neither end is a casual drive and the prepaid label is the only sensible answer. It reaches every one of those ZIP codes and costs you nothing to use.",
        "It is also worth saying that rural Missouri is where the largest lots tend to come from. Households further from a pharmacy order in bigger quantities and keep deeper stock, so a cupboard cleared in a small town is often worth considerably more than one cleared in a city flat.",
      ],
    },
    {
      heading: "What has to be true before any of it is sellable",
      paragraphs: [
        "Sealed. Factory-sealed, unopened, original packaging. An opened box has no value to anyone, because there is no way for the next person to establish what happened to it after the seal went. Opening a box to check the contents destroys the thing that made it worth checking.",
        "Not Medicare or Medicaid. Supplies obtained through those programmes cannot be resold, and no buyer can make an exception for you. A pharmacy label with your own name on it is a different matter entirely and is not an obstacle — what counts is who paid, not what the sticker says.",
        "In date, with room to spare. Test strips want at least six months before expiry, because whoever ends up with them needs time to actually get through the box. And the counts matter: one 100-count box is worth meaningfully more than two 50-count boxes of the same strip, so do not break lots up.",
        "The brands: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. Dexcom G6 sensors and transmitters, G7 sensors and receivers. FreeStyle Libre 1, 2 and 3 in US retail versions only. Omnipod 5, DASH and Classic pods, pods rather than controllers. Some sealed Medtronic and Tandem components.",
      ],
    },
    {
      heading: "Two things the printed date does not kill",
      paragraphs: [
        "Strips past their date are finished, and that is not a commercial judgement. A degraded strip returns a wrong reading, and a wrong blood glucose reading is a safety matter. Nobody should buy or sell those and we do not.",
        "The widely quoted advice extends that verdict to everything expired. It should not. Out-of-date Omnipod pods — 5, DASH and Classic — are still bought at a reduced rate, and so are out-of-date Dexcom G7 sensors. Expired G6 sensors are not, and nothing else past date qualifies.",
        "So when you are sorting a Missouri cupboard into keep and discard, those two categories come back out of the discard pile. It takes a minute and it is frequently the most valuable minute of the whole exercise.",
      ],
    },
    {
      heading: "The order things should happen in",
      paragraphs: [
        "Settle the figure in writing first, before anything moves — whether it is going in a parcel or in the boot of your car. The number should be for the boxes you actually have, based on brand, count and dates, not a range and not a ceiling. A buyer who will not commit before the handover is one who plans to revise afterwards.",
        "Then photograph the sealed boxes with dates and lot numbers showing, and keep those photographs until the money has landed. If anything is disputed later, the photographs are the only record of what condition the boxes were in when they left you.",
        "Then send it, in one parcel, on a prepaid tracked label. Payment runs within 24 hours of the parcel being received and verified. If you are driving to the Kansas side instead, the same first two steps apply and the payment step collapses to the same day.",
        "If the number moves after arrival, ask for the specific cause and for photographs of what was received. Seals break in transit and counts occasionally differ from what was described, and both are legitimate. A vague downward revision is not, and you can ask for the supplies to be returned rather than accept it.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there really no buyer anywhere in Missouri?",
      a: "None listed, in either metro or anywhere between them. The nearest listing to a western-Missouri seller is in Kansas City on the Kansas side of the line, which is a genuine in-person option for that part of the state. If a Missouri buyer appears, they will show on the Missouri page.",
    },
    {
      q: "Does it matter that I would be crossing a state line to sell?",
      a: "The conditions that decide a sale are about the supplies rather than the geography — sealed packaging, not obtained through Medicare or Medicaid, dates with room left. Our legality page covers the broader question in the detail it deserves, with the appropriate caveats.",
    },
    {
      q: "I am in St. Louis. Is anything closer than posting it?",
      a: "No. Nothing is listed on the eastern side of Missouri, and there is no in-person buyer in Illinois either — Illinois is the largest completely uncovered market in the country. The prepaid label is the practical answer from that end of the state.",
    },
    {
      q: "I have around fifteen boxes of mixed brands. Should I split them up?",
      a: "No. Mixed lots are quoted as a single lot and do not need separating, and ten or more boxes earns a better rate per box than the same boxes sold piecemeal. Fifteen mixed boxes in one parcel is the right way to send it.",
    },
    {
      q: "How long does the whole thing take from a small town in Missouri?",
      a: "Transit time plus 24 hours. Payment is made within a day of the parcel being received and verified, and verification means someone has opened the outer packaging and checked the sealed boxes against your description. The postal leg is the only variable part.",
    },
    {
      q: "The pharmacy label has my name and my address on it. Should I peel it off?",
      a: "No need. That label is not a problem and removing it is not expected. The question that decides eligibility is whether the supplies came through Medicare or Medicaid, and you are not asked to account for anything beyond that.",
    },
  ],
}
