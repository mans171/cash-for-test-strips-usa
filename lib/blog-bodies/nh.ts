import type { PostBody } from "./types"

/**
 * New Hampshire — no in-state buyer, low prevalence (9.4%), very high older
 * share (21.5%), and the narrowest city spread in this batch after Nebraska
 * at 2.9 points. Small, old, evenly low.
 *
 * The spine is a decision the bulk angle implies but nobody writes about:
 * whether to hold supplies back until you have enough boxes to earn the better
 * rate, or send what you have now. In a low-prevalence state a household
 * rarely reaches ten boxes quickly, so the question is real here, and the
 * six-month expiry rule is what settles it. That gives the page a genuinely
 * different structure from Louisiana (assembling a lot) and South Carolina
 * (in-person versus post), which share the generated angle.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts.
 */
export const NH: PostBody = {
  label: "Wait for a bigger lot, or send now? The clock decides",
  title: "Selling Diabetic Test Strips in New Hampshire: Wait or Send Now?",
  heading: "Selling Diabetic Test Strips in New Hampshire",
  metaDescription:
    "Larger lots of diabetic supplies earn a better rate, but expiry dates run against you while you wait. How a New Hampshire seller should decide, and what qualifies in a state with no local buyer.",

  lead: [
    "Ten or more boxes earns a better per-box rate than a small send. That single fact creates a question in New Hampshire that barely arises in higher-prevalence states: should you hold what you have and wait until the pile is big enough, or send it now and take the smaller rate?",
    "It is a real question here because New Hampshire is small and its diabetes rate is low. About 9.4% of adults have diagnosed diabetes against a national 12.1%, across a population of 1.4 million, and the state is remarkably level — Laconia reads 10.8% and Dover 7.9%, a spread of under three points, with Manchester, Nashua and Concord all clustered near nine. A household here does not accumulate ten boxes in a hurry. There is also no listed buyer anywhere in the state, so the sale itself is a prepaid parcel either way.",
  ],

  sections: [
    {
      heading: "What waiting costs you",
      paragraphs: [
        "Test strips want at least six months before their expiry date. Below that the value drops away quickly, and the reason is straightforward — whoever ends up using them needs a realistic window in which to do it.",
        "So the clock is the thing that decides. If your earliest-expiring box has a year on it and you expect two or three more boxes in the next few months, waiting is sensible and will pay better. If the earliest date is inside eight or nine months, waiting to build a bigger lot risks pushing that box below the line, at which point you have traded a better rate for a box worth less than it was.",
        "Work it out from the earliest date in the pile, not the latest. One box crossing the line does not spoil the lot, but it is the box you were counting on to reach the threshold.",
      ],
    },
    {
      heading: "What does not deteriorate while you wait",
      paragraphs: [
        "Sealed Omnipod pods, in the 5, DASH and Classic versions, hold value past their expiry date at a reduced rate. So do Dexcom G7 sensors. Those two are the only items with any value once the date has passed, and they are the ones you can afford to be relaxed about while a lot builds.",
        "Everything else runs on the same clock as the strips. Expired Dexcom G6 sensors do not qualify. Expired test strips do not, and should not — a strip past date can give an unreliable reading, and that is a safety question rather than a matter of price.",
        "It is worth knowing this before you clear anything out, because the most widely read guide to selling diabetic supplies tells readers that expired stock has very low or no resale value without naming those two exceptions. In a state where 21.5% of the population is 65 or over and house clear-outs are common, that omission throws away a great deal.",
      ],
    },
    {
      heading: "Where New Hampshire's surplus actually comes from",
      paragraphs: [
        "Not, for the most part, from people who set out to sell. From prescriptions that changed, from a move onto a sensor that made a drawer of strips redundant overnight, and from families clearing a house and finding boxes nobody knew were there.",
        "The age profile is the driver. New Hampshire's 21.5% share of residents aged 65 or over is among the higher figures in the country, and it sits alongside one of the lower uninsured rates — 6.8% of working-age adults have no coverage. The state generates surplus supplies through age and prescription churn rather than through the sheer prevalence of diabetes.",
        "That is also why nobody has set up a buying counter here. Across 247 ZIP codes and 1.4 million people, the volume is steady but thin, and it does not concentrate anywhere in particular.",
      ],
    },
    {
      heading: "The checks that decide whether a box counts at all",
      paragraphs: [
        "Sealed and unopened, in original packaging. An opened box has no value whatsoever, because the seal is the only thing that lets the next person establish what has happened to the contents. If you are photographing boxes for a quote, photograph the outside with the date visible and leave them shut.",
        "Not obtained through Medicare or Medicaid, since supplies paid for by those programmes cannot be resold. A pharmacy label carrying your own name is normal and irrelevant to the sale — the question is who paid, not what is printed on the box.",
        "And for FreeStyle Libre specifically, US retail versions only. Sensors bought abroad cannot be resold here at any date or condition.",
      ],
    },
    {
      heading: "The list, and how the sale runs",
      paragraphs: [
        "Accepted: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra and True Metrix strips; Dexcom G6 sensors and transmitters; Dexcom G7 sensors and receivers; FreeStyle Libre 1, 2 and 3; Omnipod 5, DASH and Classic pods; and some sealed Medtronic and Tandem components. A 100-count box of strips is worth meaningfully more than two 50-count boxes.",
        "When you do send, get the figure agreed in writing first, against the brands, counts and dates you hold. Mixed brands and types go as one lot and do not need separating. The label is prepaid and tracked and costs you nothing.",
        "Payment lands within 24 hours of the parcel being received and verified. If anything is queried, ask for the specific reason and for photographs of what arrived, and keep your own photographs until the money is in.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is it worth waiting until I have ten boxes?",
      a: "Only if the earliest expiry date in the pile allows it. Ten or more boxes earns a better per-box rate, but test strips want six months or more remaining, so waiting can cost more than the improved rate gains.",
    },
    {
      q: "Can I sell anywhere in New Hampshire in person?",
      a: "No buyer is listed in the state, so an in-person sale is not something this directory can offer. Mail-in with a prepaid label is the route from all 247 ZIP codes.",
    },
    {
      q: "Do expired supplies have any value at all?",
      a: "Omnipod pods in the 5, DASH and Classic versions and Dexcom G7 sensors do, at a reduced rate. Expired test strips and expired Dexcom G6 sensors do not, and are not worth sending.",
    },
    {
      q: "I am clearing a relative's house. Where do I start?",
      a: "Separate anything opened, which cannot be sold, and set aside anything you know came through Medicare or Medicaid. Then list what is left by brand, count and expiry date, and check pods and G7 sensors before discarding anything on date alone.",
    },
    {
      q: "Does mixing brands in one parcel reduce what I get?",
      a: "No. Mixed lots are quoted as a single lot rather than sorted item by item, so there is nothing to gain from separating them or sending them apart.",
    },
  ],
}
