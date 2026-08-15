import type { PostBody } from "./types"

/**
 * Arizona — built on the Medicare/Medicaid condition, because Arizona is the
 * state where it disqualifies the most cupboards. 19.7% of residents are 65 or
 * over, which is where retirement-state Arizona sits in the top handful
 * nationally, and 13.2% of working-age adults have no insurance at all — one of
 * the highest uninsured rates in the country. Those two figures are the whole
 * post: the people most likely to be holding supplies are the people least
 * likely to be able to sell them, and the people the resale market exists for
 * are on the other side of the same state.
 *
 * Deliberately not built on Omnipod pods, which is the generated angle. Pods
 * appear once, in the dates section, because they are worth knowing about
 * everywhere.
 *
 * No in-state buyer. Every figure is from lib/state-health-data.ts. No dollar
 * amounts and no pronouncement on law — the legality page carries that.
 */
export const AZ: PostBody = {
  label: "The Medicare question",
  title: "Selling Diabetic Test Strips in Arizona: The Question That Decides It",
  heading: "Selling Diabetic Test Strips in Arizona",
  metaDescription:
    "Nearly a fifth of Arizona is 65 or over, and supplies obtained through Medicare or Medicaid cannot be resold. That one condition settles more Arizona cupboards than anything else on this page.",

  lead: [
    "Arizona has two populations that matter here and they barely overlap. Just under a fifth of the state — 19.7% — is aged 65 or over, which is among the highest shares in the country and is a fair description of what Arizona has spent fifty years becoming. At the same time 13.2% of working-age Arizonans have no health insurance, which is well above the national picture.",
    "The first group is where nearly all unused diabetic supplies in this state physically are. The second group is the reason anyone wants to buy them. And the single condition that decides whether a box can move from one to the other is not the brand, the count or the date — it is how the supplies were paid for in the first place.",
    "So this page starts there rather than with a list of what we buy, because in Arizona more than most places that question comes first and settles it either way.",
  ],

  sections: [
    {
      heading: "How the supplies were paid for comes before everything else",
      paragraphs: [
        "Supplies obtained through Medicare or Medicaid cannot be resold. That is not a preference and it is not something a buyer can waive for you — it is a condition on the supplies themselves, and it applies no matter how sealed the box is or how good the dates are.",
        "In a state where 19.7% of residents are 65 or over, that rules out a large share of what is sitting in Arizona cupboards, and there is no point pretending otherwise. If a box came through a Medicare Part B or Part D benefit, or through AHCCCS, it stops there. A buyer who tells you differently is one to walk away from.",
        "What does not disqualify anything: a pharmacy label with your own name on it. People assume that label is a problem and it is not. A retail purchase, a commercial insurance plan, a cash purchase at a chemist, supplies bought for someone who has since changed treatment — all of those are fine, and the label just shows where the box came from.",
        "If you genuinely do not know how a box was paid for, that is a phone call rather than a guess. Guessing wrong in either direction costs you: guess too cautiously and you bin something that had value, guess too loosely and you post something that gets sent back.",
      ],
    },
    {
      heading: "Why anyone is buying, in a state with this many uninsured adults",
      paragraphs: [
        "The resale market for diabetic supplies is not an oddity. It exists because 13.2% of working-age Arizonans have no insurance to run these purchases through, and a person testing several times a day gets through strips at a rate that does not care about their coverage status.",
        "That is who ends up with your box. Not a warehouse and not a reseller of last resort — someone paying out of pocket who needs a sealed, in-date box of Contour Next or OneTouch Verio and cannot get it any cheaper another way.",
        "Arizona reads 11.3% for diagnosed diabetes overall, a little under the national 12.1%. That is not a low-need state. It is a state of seven and a half million people where roughly one adult in nine has a diagnosis and a meaningful fraction of them are paying retail.",
      ],
    },
    {
      heading: "Nobody takes supplies in person anywhere in Arizona",
      paragraphs: [
        "There is no buyer listed anywhere in this state. Not in Phoenix, not in Tucson, not in Scottsdale or Mesa. Any page suggesting you can drive across town and hand a bag over in Arizona is describing a mail-in service in different words, or describing nothing.",
        "It is worth saying why, because the reason is not that Arizona is too small. Arizona covers 7.5 million people across just 417 ZIP codes, which is one of the most concentrated ZIP geographies in the country — the Phoenix valley plus Tucson plus a great deal of desert. On paper that concentration should suit an in-person buyer. In practice nobody has set up, and the directory reflects what exists rather than what ought to.",
        "The practical consequence is simple. From anywhere in Arizona, posting it is the route, and the rest of this page is about doing that without losing money.",
      ],
    },
    {
      heading: "Dates: the general rule, and where it stops being true",
      paragraphs: [
        "Test strips want at least six months left before the expiry date. Under that the value drops away quickly, because whoever ends up with them has to actually get through the box before it turns. Past the date entirely, strips are worth nothing to anybody and should not be sold — a degraded strip returns a wrong reading, and a wrong reading is a safety problem rather than a bargain.",
        "The most widely read article on this subject extends that rule to everything and tells readers expired supplies have very little or no resale value. For strips it is right. Applied across the board it is wrong, and it is wrong about two specific items.",
        "Expired Omnipod pods — 5, DASH and Classic — are still bought, at a reduced rate. So are expired Dexcom G7 sensors. Expired Dexcom G6 sensors are not, and nothing else past date qualifies. That is the entire exception list, and it is short enough to check against your cupboard in a minute.",
      ],
    },
    {
      heading: "What a sealed box has to be",
      paragraphs: [
        "Factory-sealed and unopened, in the original packaging. An opened box has no resale value at all, because there is no way for the next person to establish what happened to it while it was open. This is also the most common reason a parcel comes back to a seller.",
        "Test strips: FreeStyle Lite, Contour Next in all its versions, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, and True Metrix. Count matters more than people expect — a single 100-count box is worth meaningfully more than two 50-count boxes of the same strip.",
        "CGM: Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3. Libre has a qualifier that catches Arizona sellers in particular, and it is covered in the questions below. Pods: Omnipod 5, DASH and Classic, pods rather than controllers. Some sealed Medtronic and Tandem components as well.",
        "Ten or more boxes earns a better rate per box, and a mixed lot is quoted as one lot. There is no advantage to sorting brands into separate parcels or separate sales.",
      ],
    },
    {
      heading: "Posting it from Arizona and getting paid",
      paragraphs: [
        "The label is prepaid and costs you nothing, from Yuma or from central Phoenix. If a buyer asks you to pay postage on a sale of this kind, that is a signal on its own and you should not send the parcel.",
        "Settle the number in writing before anything leaves the house. Not a range and not an upper bound — the actual figure for the actual boxes, based on brand, count and dates. A buyer who will not commit before you ship is one who plans to revise after your supplies are already in their building, at which point you have nothing to push back with.",
        "Photograph the sealed boxes with the expiry dates and lot numbers visible, and do not open anything to photograph what is inside. Keep the photographs until the money has arrived. Payment runs within 24 hours of the parcel being received and verified, so the clock starts on delivery rather than on posting.",
        "If the figure moves after arrival, ask for the concrete reason and for photographs of what was received. A real revision has a cause you can see — a seal broken in transit, a date misread, a count that differs. Anything vaguer than that is a renegotiation, and you can ask for the supplies back instead.",
      ],
    },
  ],

  faqs: [
    {
      q: "My box has a pharmacy label with my name and address on it. Is that a problem?",
      a: "No. The label is not what matters. What matters is whether the supplies were obtained through Medicare or Medicaid, which cannot be resold, and whether the box is still factory-sealed. Nobody asks you to account for how you came to have them beyond that.",
    },
    {
      q: "Some of what I have came through Medicare and some I bought outright. What then?",
      a: "Separate them and only offer the retail ones. Do not send a mixed parcel hoping it goes unnoticed — verification happens on arrival, the Medicare boxes come out, and you end up with a revised figure and a slower sale. Sorting first is faster for everyone.",
    },
    {
      q: "Is there anywhere in Phoenix or Tucson I can sell in person?",
      a: "Not through this directory. There is no buyer listed anywhere in Arizona, in either metro or outside them. Mail-in with a prepaid label is the route from here, and if a buyer does set up in the state they will appear on the Arizona page.",
    },
    {
      q: "I bought FreeStyle Libre sensors over the border in Mexico. Can I sell those?",
      a: "No. Libre sensors have to be US retail versions to be resold here, and sensors purchased abroad do not qualify regardless of how well sealed or how in-date they are. This comes up more in Arizona than almost anywhere else, so it is worth checking the packaging before you list anything.",
    },
    {
      q: "Do I have to sort my brands into separate lots?",
      a: "No. A mixed lot is quoted as a single lot, and quantity works in your favour — ten or more boxes earns a better per-box rate than the same boxes split up. Send it as it came out of the cupboard.",
    },
    {
      q: "How quickly does the money actually arrive?",
      a: "Within 24 hours of the parcel being received and verified. Verification means someone has opened the outer packaging and checked the sealed boxes against what you described. Add transit time from Arizona on top of that, which is the only part nobody controls.",
    },
  ],
}
