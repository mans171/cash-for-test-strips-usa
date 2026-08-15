import type { PostBody } from "./types"

/**
 * Indiana — this is the one post in the batch built on the expired-Omnipod
 * correction as its spine. It earns it because Indiana has an in-state buyer
 * (Goshen), which turns an abstract "keep your expired pods" point into a
 * concrete "and there is a town in this state where you can hand them over".
 * No other state in this batch can close the loop that way.
 *
 * The second idea is the coverage inversion: the only listed buyer sits in the
 * far north, near Hammond (16.2%) and South Bend (15.2%), the two highest-rate
 * cities in the state — while Indianapolis, the capital and by far the largest
 * city, has nothing listed at all.
 *
 * Figures from lib/state-health-data.ts. No prices, no legal pronouncements.
 */
export const IN: PostBody = {
  label: "Keep the expired pods",
  title: "Selling Diabetic Test Strips in Indiana: Don't Bin the Expired Pods",
  heading: "Selling Diabetic Test Strips in Indiana",
  metaDescription:
    "Most guides tell Indiana readers that expired supplies are worthless. Expired Omnipod pods and Dexcom G7 sensors are the exception — and Goshen is a real in-person option in this state.",

  lead: [
    "If you are clearing a cupboard in Indiana and you have already put the out-of-date boxes in a separate pile to throw away, stop before you do it. Two of the things in that pile are almost certainly still worth money, and the most-read guide on this subject in the country is the reason people bin them.",
    "That guide tells readers plainly that expired diabetic supplies have very little or no resale value. For test strips that is correct and it is correct for a good reason. Applied to everything, it is wrong, and it is costing Indiana sellers the most valuable items they own.",
  ],

  sections: [
    {
      heading: "The two items a printed date does not finish off",
      paragraphs: [
        "Expired Omnipod pods still sell. All three generations — Omnipod 5, DASH and the Classic pods — are bought past their date at a reduced rate rather than at nothing. Pods, not controllers, but a box of pods that has gone out of date is not rubbish and should not be treated as rubbish.",
        "Expired Dexcom G7 sensors also still sell, again at a reduced rate. This one catches people out because the sibling product does not qualify: expired Dexcom G6 sensors are not bought. G7 yes, G6 no, and the boxes look similar enough that it is worth reading the front carefully rather than assuming.",
        "That is the whole exception list. Two items. Everything else past its date, including every brand of test strip, is not worth selling and should not be sold. A strip that has degraded gives a wrong reading, and a wrong reading on a blood glucose test is a safety problem, not a discount.",
        "It is worth being specific about why this matters here. A pod box represents far more value than a strip box, so the item people are most likely to throw away on bad advice happens to be the item with the most in it. One check of your discard pile is worth more than everything else on this page.",
      ],
    },
    {
      heading: "Goshen, and what having a buyer in the state actually means",
      paragraphs: [
        "There is one buyer listed in Indiana, and it is in Goshen, in the north of the state. That puts an in-person handover genuinely within reach for anyone in Elkhart County, South Bend, Mishawaka, Elkhart itself, and across the north-eastern corner towards Fort Wayne.",
        "It is worth noticing where that sits relative to need. South Bend reads 15.2% for diagnosed diabetes and Hammond reads 16.2% — the two highest rates of any city in the state, both in the northern tier. The one place you can hand supplies over is in the same part of Indiana as the highest concentration of people who use them. That is not the usual pattern; in most states coverage has followed money rather than need.",
        "The flip side is that Indianapolis, at 13.0% and by a wide margin the largest city in the state, has nothing listed. Neither does Evansville at 13.8%, down at the Ohio River, or Bloomington, or Lafayette. If you are anywhere in the southern two thirds of Indiana, Goshen is not a casual trip and posting is the sensible option.",
        "For a couple of boxes, posting is the sensible option anyway. The label costs you nothing, so the drive only starts to make sense with a large lot — typically an estate clear-out or a cupboard that has been accumulating for years.",
      ],
    },
    {
      heading: "Everything that is still in date: what has to be true",
      paragraphs: [
        "The box has to be factory-sealed and unopened, in its original packaging. An opened box cannot be resold at any price, because nobody downstream can establish what happened to it once the seal went. This is the single most common reason a parcel gets returned.",
        "The supplies cannot have been obtained through Medicare or Medicaid — those cannot be resold. A pharmacy label carrying your own name is not a problem and does not need removing; what matters is who paid, not whose name is on the sticker.",
        "Test strips want six months or more before the expiry date. Under that, value falls away sharply. The brands bought are FreeStyle Lite, Contour Next in all versions, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, and True Metrix. A 100-count box is worth meaningfully more than two 50-count boxes of the same strip, which is worth knowing before you split anything up.",
        "On the CGM side: Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 in US retail versions only — sensors bought abroad cannot be resold here. Some sealed Medtronic and Tandem components as well, though those are worth a call rather than an assumption.",
      ],
    },
    {
      heading: "Posting from the rest of Indiana",
      paragraphs: [
        "Indiana has 807 ZIP codes and the prepaid label reaches all of them at no cost to you. Whether you are in Fort Wayne, Evansville, Terre Haute or a village nobody outside the county has heard of, the mechanics are identical.",
        "Get the figure in writing before the parcel leaves. Not a range and not an upper bound, but the number for the boxes you actually have, based on brand, count and dates. A buyer unwilling to commit before you ship is one who intends to revise afterwards, and by then your supplies are in their building and you have no leverage left.",
        "Photograph the sealed boxes with expiry dates and lot numbers visible, and do not open anything to get a better picture. Keep the photographs until you have been paid. Payment runs within 24 hours of the parcel being received and verified, so the clock starts on delivery rather than on posting.",
        "Send everything in one parcel. Mixed lots are quoted as a single lot, ten or more boxes earns a better rate per box, and there is nothing gained by separating brands or splitting a cupboard across two shipments.",
      ],
    },
    {
      heading: "Who is usually doing this in Indiana",
      paragraphs: [
        "Indiana reads 13.0% for diagnosed diabetes against a national rate of 12.1%, and 17.5% of the state is 65 or over. Both figures point the same way: a fair number of Indiana households have supplies in them, and a fair number of those households will at some point have supplies they no longer need.",
        "The internal spread is wide. Hammond at 16.2% against Bloomington at 8.0% is a gap of 8.2 points inside one state, and it maps neatly onto old industrial Lake County versus a university town. Fort Wayne and Evansville both read 13.8%, Carmel 9.6% and Fishers 8.9%.",
        "Almost nobody arrives at this having planned it. A prescription changes, a pump replaces injections, someone moves into care, or a family clearing a house finds a cupboard full of sealed boxes nobody knew about. That last case is where the expired pods usually turn up, and it is why the first section of this page is the first section.",
      ],
    },
  ],

  faqs: [
    {
      q: "How far past the date can Omnipod pods be and still be worth something?",
      a: "There is no clean cut-off worth quoting, because it depends on the generation and the condition of the packaging. What is certain is that past-date is not the same as worthless for pods, so the right move is to ask about the specific boxes rather than assume either way. Call 518-779-9751 with the dates in front of you.",
    },
    {
      q: "Do you buy the Omnipod controller or PDM as well?",
      a: "Pods are the item. Controllers and PDMs are not part of what gets bought, so if you are clearing out a full kit, the pods are the part that carries the value. Send the sealed pod boxes and keep or dispose of the hardware separately.",
    },
    {
      q: "Can I drive to Goshen instead of posting?",
      a: "Yes, if you are near enough for that to make sense — the northern tier of the state, broadly. For two or three boxes it is not worth the fuel, since the postage costs you nothing either way. For a large lot it is a reasonable trip and gets you paid on the day rather than after transit.",
    },
    {
      q: "Is there a buyer in Indianapolis?",
      a: "No. Goshen is the only listing in Indiana, and Indianapolis has nothing despite being the largest city in the state. Anyone advertising an Indianapolis in-person buyer is describing a mail-in service in different words.",
    },
    {
      q: "I opened one box to check what was inside. Can I still sell it?",
      a: "Not that box. Once the factory seal is broken there is no way for the next person to verify the contents, so an opened box has no resale value regardless of what is in it. The rest of the sealed boxes are unaffected — just leave that one out of the parcel.",
    },
  ],
}
