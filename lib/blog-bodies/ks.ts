import type { PostBody } from "./types"

/**
 * Kansas — one buyer, Kansas City, and it sits in the far north-east corner of
 * the state. The distinguishing fact is not the corner, though. It is that the
 * sharpest divide in Kansas is not east against west or city against country:
 * it is inside one metropolitan area. Kansas City reads 14.6%, the highest in
 * the state. Overland Park, Lenexa, Olathe and Shawnee — the same commuter
 * belt — read between 9.2% and 9.7%. The state's widest gap runs through a
 * handful of suburbs, and the only listed buyer sits in the middle of it.
 *
 * Colorado shares the generated angle and is a neighbouring state of similar
 * profile, so it is built on the Front Range corridor instead. This post keeps
 * brand detail late and short, and leads on the metro split and on bulk lots,
 * which is what a 704-ZIP-code state with one listing actually needs.
 */
export const KS: PostBody = {
  label: "One metro, two Kansases",
  title: "Selling Diabetic Test Strips in Kansas: One Buyer, and It Sits in the Corner",
  heading: "Selling Diabetic Test Strips in Kansas",
  metaDescription:
    "Kansas has one in-person buyer, in Kansas City — which is also the city with the state's highest diabetes rate at 14.6%. What that means if you live west of Topeka, and what sealed supplies need to qualify.",

  lead: [
    "Kansas has one buyer listed, in Kansas City. That is the north-east corner of the state, and it means the practical answer to \"can I sell these in person\" depends almost entirely on which side of Kansas you live on.",
    "Two facts make this state worth reading about carefully rather than skimming. The first is that Kansas City has the highest diagnosed diabetes rate of any city in Kansas, at 14.6%. The second is that the lowest-rate suburbs in the whole state are a few miles away from it.",
  ],

  sections: [
    {
      heading: "The widest gap in Kansas runs through one metro area",
      paragraphs: [
        "Statewide, 11.4% of Kansas adults have diagnosed diabetes, a little under the national rate of 12.1%. That figure describes very little of what is actually going on.",
        "Kansas City reads 14.6%. Overland Park, in the same metropolitan area, reads 9.2%. Lenexa is 9.4%, Olathe 9.5%, Shawnee 9.7%. Five cities in one commuter belt, and a spread of more than five points between the highest and the lowest.",
        "The formal widest gap in the state is Kansas City at 14.6% against Manhattan at 7.1%, which is 7.5 points. But Manhattan is a university town most of the way across the state, and the gap being that wide surprises nobody. The suburbs one drive from Kansas City reading five points lower is the finding that ought to.",
        "Elsewhere, Topeka sits at 13.1%, Wichita at 12.6% and Salina at 12.1% — all above the state figure. Lawrence reads 7.9%. The pattern is consistent: the older working cities are high, the university towns and the newer suburbs are low.",
      ],
    },
    {
      heading: "If you are on the Kansas City side of the state",
      paragraphs: [
        "You have the option most Kansans do not, which is to hand supplies over, count the cash and go home the same afternoon. From the Johnson County suburbs it is a short drive. From Lawrence and Topeka it is a reasonable one.",
        "Ring first and agree a figure before you set off. Describe what you have exactly: the brand printed on the box, the strip count, how many boxes, and the expiry dates as written on them. A number quoted against a vague description will move when someone sees the actual boxes, and you will be standing in a car park when it does.",
        "There is a border quirk here worth knowing. Missouri has no buyer listed anywhere in the state, so for people on the Missouri side of the same metro, the Kansas City listing is the nearest in-person option they have. It is one of the few places in the middle of the country where a state line makes that little practical difference.",
      ],
    },
    {
      heading: "If you are west of Topeka, this is a postal transaction",
      paragraphs: [
        "Kansas spreads under three million people across 704 ZIP codes. That is a lot of postcodes for the population, and it is exactly the density problem that stops a second buyer setting up. Wichita is the largest city in the state and has no listing of its own. Neither does Salina, and neither does anywhere further west.",
        "The prepaid label reaches all 704 of them and costs you nothing regardless of which one you are posting from. Payment is made within 24 hours of the parcel arriving and being verified, so from western Kansas the realistic timeline is a few days in transit and then a day.",
        "Because distance makes repeat trips to a post office pointless, this is the state where it pays to gather everything before sending anything. Ten or more boxes earns a better per-box rate than the same boxes sent in dribs and drabs, and a mixed lot — different brands, strips alongside sensors alongside pods — is quoted as one lot rather than picked apart item by item. There is no advantage to separating anything out.",
      ],
    },
    {
      heading: "Two things survive their expiry date",
      paragraphs: [
        "The best-read article in the country on selling diabetic supplies tells people that expired stock is worth very little or nothing. It is right about test strips. A strip past its date can return a false reading, and a false blood glucose reading is a hazard, not a discount — those genuinely should be thrown away.",
        "It is wrong about two named items, and both of them get binned constantly. Expired Omnipod pods, whether 5, DASH or Classic, are still bought, at a reduced rate. Expired Dexcom G7 sensors are too.",
        "The exception does not stretch. Expired Dexcom G6 sensors are not bought, expired Libre sensors are not bought, and no test strip past its date is bought at any rate at all. Two items, both named, nothing else.",
      ],
    },
    {
      heading: "Sensors and pods, not only strips",
      paragraphs: [
        "People clearing a cupboard tend to think of this as a test strip transaction, and increasingly it is not. Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 sensors are all bought, and a single sealed box of sensors is often the most valuable thing in the pile.",
        "Libre carries a condition that is easy to trip over: US retail versions only. Sensors bought abroad cannot be resold here, regardless of how new or how sealed they are.",
        "Omnipod 5, DASH and Classic pods are bought, pods rather than controllers. Some sealed Medtronic and Tandem components are as well, though those are worth a phone call rather than a guess. On the strip side the names are FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, and True Metrix — and a 100-count box beats two 50-count boxes of the same strip.",
      ],
    },
    {
      heading: "What will get a box turned down",
      paragraphs: [
        "Three things, and all three are pass or fail rather than negotiable. The seal has to be factory-intact in the original packaging. An opened box is worth nothing to anybody, because nobody downstream can verify what happened to it while it was open, and this is the single most common reason a parcel gets returned.",
        "The supplies cannot have come through Medicare or Medicaid. Those cannot be resold. Retail purchases and private insurance are a different matter, and a pharmacy label with your own name on it makes no difference — you are not being asked to account for how you came to have them.",
        "And in-date test strips should have six months or more left before expiry. Under six months the tier falls away quickly, because the person who eventually uses them needs a usable window in which to do it.",
      ],
    },
  ],

  faqs: [
    {
      q: "I live in Wichita. Is there anywhere closer than Kansas City?",
      a: "Not on this directory. Kansas City is the only Kansas listing, and there is nothing listed in Wichita, Salina, Topeka or anywhere west. Posting is the route from there, and the prepaid label means the distance costs you nothing beyond a few days of transit time.",
    },
    {
      q: "I'm on the Missouri side of Kansas City. Does that matter?",
      a: "Not practically. Missouri has no buyer listed anywhere in the state, so the Kansas City listing is the nearest in-person option for people on either side of the line. Ring ahead and agree a figure before driving over, the same as anyone else would.",
    },
    {
      q: "How many boxes do I need before bulk rates apply?",
      a: "Ten or more is the point at which the per-box rate improves. Below that it is still worth sending, but if you are within a box or two of ten and there is more in the house, it is worth finding the rest before you post anything.",
    },
    {
      q: "Do I need to sort my boxes by brand before sending?",
      a: "No. A mixed lot is quoted as a single lot, so strips, sensors and pods can go in the same parcel and different brands can go in together. Sorting them costs you time and gains you nothing.",
    },
    {
      q: "My strips expire in four months. Still worth sending?",
      a: "It is worth asking, but expect a lower tier. The threshold that matters is six months of remaining shelf life, and below that value drops off sharply because whoever ends up using them needs time to get through the box.",
    },
    {
      q: "How fast does payment actually happen?",
      a: "Within 24 hours of the parcel being received and verified. Verification means someone has opened the outer packaging and checked the boxes against what you described. From western Kansas, budget a few days in the post and then a day, rather than counting from the moment you drop the parcel off.",
    },
  ],
}
