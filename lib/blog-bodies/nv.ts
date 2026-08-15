import type { PostBody } from "./types"

/**
 * Nevada — one listed buyer, Las Vegas, and effectively nothing else. The
 * spine is the contrast: the Las Vegas valley holds the state's population,
 * its highest rates (Sunrise Manor 14.5%, Paradise 13.2%) and the only
 * in-person option, while Reno, Sparks and Carson City are a different market
 * entirely and are not near it in any useful sense.
 *
 * Nevada also has only 181 ZIP codes for 3.26 million people — the fewest of
 * any state in this batch — which is a clean way of saying the same thing:
 * the population sits in a small number of places and the rest is distance.
 *
 * Deliberately not a wealth-gap page and not a Libre page despite the
 * generated angle; Arkansas takes Libre.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts.
 */
export const NV: PostBody = {
  label: "One buyer in Las Vegas, and a long way to it from anywhere else",
  title: "Selling Diabetic Test Strips in Nevada: Las Vegas Has a Buyer, Reno Does Not",
  heading: "Selling Diabetic Test Strips in Nevada",
  metaDescription:
    "Nevada's only listed test strip buyer is in Las Vegas. If you are in Reno, Sparks or Carson City, that is not a local option. Here is what qualifies, what expired supplies still pay, and how mail-in works.",

  lead: [
    "Nevada has one listed buyer and it is in Las Vegas. For a large share of the state's population that is genuinely useful, because a large share of the state's population lives within the same valley — Las Vegas, North Las Vegas, Henderson, Paradise, Spring Valley, Sunrise Manor and Enterprise are all part of one continuous urban area.",
    "For everyone else it is close to meaningless. Reno, Sparks and Carson City are at the other end of the state, and no listing exists up there. Nevada has only 181 ZIP codes for 3.26 million people, which is a tidy way of saying that the population sits in two clusters with a great deal of desert in between. This page splits along that line, because the honest advice is different on each side of it.",
  ],

  sections: [
    {
      heading: "If you are in the Las Vegas valley",
      paragraphs: [
        "You have the option most states do not: an in-person sale, where the boxes are inspected in front of you and the figure is settled on the spot. That removes the single most awkward part of a mail-in sale, which is the gap between the parcel leaving your hands and the money arriving.",
        "Take the same preparation you would take to a postal sale anyway. Know what you have before you go — brands, counts, expiry dates — and have it written down. Sealed boxes only. A quote given over the phone in advance should hold when the boxes match the description, and if it does not, ask which specific item caused the change.",
        "The valley is also where the state's highest rates sit. Sunrise Manor reads 14.5% for diagnosed diabetes among adults and Paradise 13.2%, against a statewide 12.0% and a national 12.1%. Las Vegas itself is 12.5% and North Las Vegas 12.2%. Nevada as a whole sits almost exactly on the national line, but the valley carries the weight of it.",
      ],
    },
    {
      heading: "If you are in Reno, Sparks or Carson City",
      paragraphs: [
        "There is no buyer at your end of the state, and the Las Vegas listing is not a reasonable errand from northern Nevada. Nobody should be told to drive that, and we are not going to imply it is convenient because a listing happens to share a state line with you.",
        "Post instead. The prepaid tracked label costs you nothing, the quote is agreed before anything is packed, and payment lands within 24 hours of the parcel being received and verified. From the north of the state that is straightforwardly the better option, not a consolation prize.",
        "The northern figures also run lower: Reno 9.5%, Sparks 9.8%, Carson City 12.3%. The gap between Sunrise Manor and Reno is five points, which is modest by national standards but tracks a real difference between the two halves of Nevada.",
      ],
    },
    {
      heading: "The two expired items worth checking before you bin anything",
      paragraphs: [
        "The advice you will find repeated everywhere is that expired supplies are worth nothing. That is right about test strips — a strip past its date can give an unreliable reading, and no honest buyer wants those in circulation.",
        "It is wrong about Omnipod pods, in the 5, DASH and Classic versions, and about Dexcom G7 sensors. Both still pay past expiry, at a reduced rate. Expired Dexcom G6 sensors do not, and nothing else past date does either.",
        "It is a two-item exception rather than a general rule, but those two items turn up constantly in clear-outs, and following the standard advice throws them away.",
      ],
    },
    {
      heading: "What decides whether a box qualifies",
      paragraphs: [
        "The seal. Factory-sealed and unopened, in its original packaging. An opened box has no value at all, because nothing about it can be verified by whoever holds it next.",
        "Who paid. Supplies obtained through Medicare or Medicaid cannot be resold. A pharmacy label with your own name on it is ordinary and has no bearing on anything — that is a different question.",
        "The date. Test strips want at least six months of life remaining. Beyond the two expiry exceptions above, an out-of-date box is not worth posting.",
        "Nevada also has one of the higher uninsured rates in the country, with 14.5% of working-age adults uncovered, which is a large part of why sealed supplies find a second buyer at all.",
      ],
    },
    {
      heading: "The accepted list",
      paragraphs: [
        "Strips: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
        "Sensors: Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 — US retail versions only, so anything bought outside the country is out regardless of condition.",
        "Pods and pump parts: Omnipod 5, DASH and Classic pods, plus some sealed Medtronic and Tandem components. Anything unusual is worth a call to 518-779-9751 before you pack it.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is the Las Vegas buyer worth driving to from Reno?",
      a: "No. That is the wrong end of a very large state, and mail-in gets you the same outcome without the drive. The prepaid label costs nothing and payment follows within 24 hours of the parcel being received and verified.",
    },
    {
      q: "Can I sell in person in Henderson or North Las Vegas?",
      a: "The listing is in Las Vegas and serves the valley, which those cities are part of. Bring sealed boxes and a written note of brands, counts and dates so the quote you were given holds.",
    },
    {
      q: "Do expired supplies pay anything in Nevada?",
      a: "Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors do, at a reduced rate. Expired test strips and expired Dexcom G6 sensors do not, wherever in the state you are.",
    },
    {
      q: "What if my boxes were paid for by Medicaid?",
      a: "Then they cannot be resold. That applies to Medicare as well, and it is about who paid rather than what is written on the pharmacy label. Supplies you bought retail or that came through private insurance are fine.",
    },
    {
      q: "Is it better to send everything at once?",
      a: "Usually yes. Ten or more boxes earns a better per-box rate, and mixed brands are quoted as a single lot rather than separated out, so there is no advantage in sorting or splitting them.",
    },
  ],
}
