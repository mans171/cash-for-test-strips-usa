import type { PostBody } from "./types"

/**
 * Wisconsin — no in-state buyer, and Minnesota next door has none either, so
 * this is a regional gap rather than a state one. There is no coverage story
 * to tell and no border trick to exploit, which rules out the shapes used for
 * Colorado, Kansas and Oregon.
 *
 * So this post is built differently on purpose: it is a sequence rather than a
 * survey. Five checks in the order you would actually make them with a box in
 * your hand — seal, date, funding route, count, parcel — and the Wisconsin
 * numbers come last rather than first. Milwaukee at 14.7% against Madison at
 * 7.4% is the state's real internal split and it closes the post instead of
 * opening it.
 *
 * The expiry exception lands inside step two, where a reader checking dates is
 * actually standing, rather than in a section of its own.
 */
export const WI: PostBody = {
  label: "Five checks, in order",
  title: "Selling Diabetic Test Strips in Wisconsin: Five Checks Before You Post",
  heading: "Selling Diabetic Test Strips in Wisconsin",
  metaDescription:
    "No buyer operates in Wisconsin, and none in Minnesota either. Here are the five checks that decide whether a box is worth sending, in the order you'd make them, plus what Milwaukee's 14.7% means.",

  lead: [
    "There is no diabetic supply buyer listed anywhere in Wisconsin. There is none in Minnesota either, so this is not a case of driving one state over — the whole of this corner of the upper Midwest is uncovered, and mail-in is the route from Superior to Kenosha.",
    "That makes the useful version of this page a practical one rather than a map. You have a box in your hand and you want to know whether it is worth sending. Here are the five things that decide it, in the order you would actually check them.",
  ],

  sections: [
    {
      heading: "One: is the seal intact",
      paragraphs: [
        "This is first because it is the fastest to check and the most common reason a parcel comes back. The box has to be factory-sealed and unopened, in its original packaging. If somebody has already broken into it to take out a strip or a sensor, it is finished — not worth less, worth nothing.",
        "The reason is verification. Once a box has been opened, nobody further down the chain can establish what happened to it, how it was stored, or whether the count inside is still what the label says. That uncertainty cannot be priced, so it is not.",
        "This also means you should never open a box to photograph what is inside it. If you want a record of what you sent, photograph the sealed box with the expiry date and lot number readable on the outside. Opening it to prove its contents destroys the thing that made it worth proving.",
      ],
    },
    {
      heading: "Two: what does the date say",
      paragraphs: [
        "For test strips, the date is close to everything. In date with six months or more remaining is what you want. Under six months and the tier falls away quickly, because the person who eventually uses the box needs enough time to get through it. Past date, a strip is not saleable at all.",
        "That last point is not a commercial judgement. A strip that has degraded can return a false blood glucose reading, and acting on a false reading is dangerous in a way that saving a box is not worth. Those genuinely belong in the bin.",
        "Here is where the most-read guide on this subject gets it wrong, and where Wisconsin sellers clearing out a cupboard lose money without knowing it. That article states flatly that expired supplies have very low or no resale value. Two named items are exceptions, both bought past date at a reduced rate: Omnipod pods in the 5, DASH and Classic versions, and Dexcom G7 sensors.",
        "Do not stretch that further than it goes. Expired Dexcom G6 sensors are not bought. Expired Libre sensors are not bought. No expired strip is bought. It is two items, and if either of them is sitting in your pile past date, pull it out before the rest goes.",
      ],
    },
    {
      heading: "Three: how did the supplies get to you",
      paragraphs: [
        "Supplies obtained through Medicare or Medicaid cannot be resold. This is the check that disqualifies a box even when everything else about it is perfect, so it is worth doing before you go to the trouble of packing anything.",
        "It is about the funding route and nothing else. If the supplies were bought retail, or came through private insurance, or were passed on by a relative who paid for them privately, the sale is straightforward. Nobody will ask you to justify how you came to have them.",
        "A pharmacy label with a name printed on it is not a problem and does not need removing. People assume it is the giveaway that stops a sale. It is not — it says nothing about which programme paid for the prescription.",
        "If you are clearing a house and genuinely cannot tell how a particular box was funded, ring 518-779-9751 and ask rather than sending it and finding out afterwards.",
      ],
    },
    {
      heading: "Four: what have you got, and how much of it",
      paragraphs: [
        "The brand on the box sets the tier. On the strip side that means FreeStyle Lite, Contour Next in all versions, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, and True Metrix. On the sensor side, Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 — Libre in US retail versions only, since sensors bought abroad cannot be resold here.",
        "Omnipod 5, DASH and Classic pods are bought as well, pods rather than controllers. Some sealed Medtronic and Tandem components are too, and those are worth a call rather than an assumption in either direction.",
        "Two things about quantity that people consistently get wrong. A 100-count box is worth meaningfully more than two 50-count boxes of the same strip, even though the strip count is identical — so if you are choosing what to send, send the larger boxes. And ten or more boxes earns a better per-box rate than the same boxes sent piecemeal.",
        "You do not need to sort anything. A mixed lot of different brands, strips alongside sensors alongside pods, is quoted as a single lot. Separating it out costs you an evening and gains you nothing.",
      ],
    },
    {
      heading: "Five: agree the number, then post it",
      paragraphs: [
        "Get the figure in writing before the parcel leaves your house. Not a range, not an \"up to\" number — the actual figure for the brands, counts and dates you have described. A buyer who will not commit before you post is one who plans to revise it downwards once your boxes are in their building, and at that point you have no leverage left at all.",
        "The label is prepaid, which means the postage costs you nothing from any of Wisconsin's 783 ZIP codes. Keep the tracking number. Payment follows within 24 hours of the parcel being received and verified, and verification is simply someone opening the outer packaging and checking the boxes against your description.",
        "If the quote changes on arrival, ask for the specific reason and for photographs of what was received. Legitimate revisions have concrete causes — a seal broken in transit, a misread date, a count that differs from what you described. A vague revision is a renegotiation, and asking for the supplies to be returned instead is a reasonable response.",
      ],
    },
    {
      heading: "Where in Wisconsin this actually bites",
      paragraphs: [
        "Statewide, 11.4% of Wisconsin adults have diagnosed diabetes, marginally under the national rate of 12.1%. As usual, the average describes almost nobody.",
        "Milwaukee reads 14.7%. Madison, the state capital and a university city, reads 7.4%. That is a 7.3-point gap between two of the state's largest cities — roughly one adult in seven against one in fourteen. Racine, on the lakefront south of Milwaukee, is 13.9%, which puts the whole of that southern industrial belt well above the state figure.",
        "The rest of Wisconsin sits in between and does so fairly tightly: Janesville 11.8%, Kenosha 11.7%, Green Bay 11.5%, Oshkosh 10.6%, Waukesha 10.1%, Appleton 10.0%, Eau Claire 8.5%. It is a state of mid-sized cities and the figures behave like one.",
        "The number that explains where sellable supplies come from is a different one: 19.6% of Wisconsinites are 65 or over. Most of what gets sent for sale is not bought to be sold. A prescription changes, a pump replaces a meter, somebody moves into care, or a family clearing a house finds a cupboard of sealed boxes nobody knew were there.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there anywhere in Wisconsin I can sell in person?",
      a: "No. There is no buyer listed anywhere in the state, and Minnesota has none either, so driving west does not help. Mail-in with a prepaid label is the honest answer from anywhere in Wisconsin, and it costs you nothing to use.",
    },
    {
      q: "Milwaukee has the highest rate in the state. Why is there no buyer there?",
      a: "High prevalence and a local resale trade are not the same thing. The people managing the condition are consuming supplies rather than holding spares, and an in-person buyer needs a concentration of surplus stock within a short drive to justify the driving. Wisconsin's surplus is spread across a lot of mid-sized cities.",
    },
    {
      q: "Are CGM sensors worth sending, or only strips?",
      a: "Both, and a sealed box of sensors is often the most valuable item in a pile. Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 in US retail versions are all bought. Sensors bought abroad are not, whatever condition they are in.",
    },
    {
      q: "Somebody opened one box out of a set of six. What happens to it?",
      a: "The opened one is not saleable and the other five are unaffected. Send the five sealed boxes and leave the opened one out. Do not tape it shut or repackage it — an opened box cannot be made sealed again, and including it only slows the verification of everything else.",
    },
    {
      q: "How long does the whole thing take from Wisconsin?",
      a: "Budget a few days in the post and then payment within 24 hours of the parcel being received and verified. The clock runs from arrival rather than from when you posted it, which is why the tracking number is worth keeping.",
    },
  ],
}
