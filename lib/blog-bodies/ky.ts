import type { PostBody } from "./types"

/**
 * Kentucky — no in-state buyer. Structured as a triage: bin it, sell it, or
 * ring first. The expiry question is the organising principle rather than one
 * section of six, because the sorting decision is what a Kentucky reader is
 * actually standing in front of when they search this.
 *
 * Note the vintage. Kentucky is one of only two states absent from the 2025
 * CDC PLACES release (Pennsylvania is the other), so every figure here is
 * BRFSS 2022 rather than 2023 and is cited as such in the body. Do not
 * "correct" those citations to 2023.
 *
 * Distinct from Nebraska and Wyoming, which share the generated expired
 * angle: Nebraska is built on how evenly spread the state is, Wyoming on
 * population arithmetic. This one is a sorting guide.
 *
 * No dollar amounts.
 */
export const KY: PostBody = {
  label: "A sorting guide: bin it, sell it, or ring first",
  title: "Expired Diabetic Supplies in Kentucky: What to Bin and What to Keep",
  heading: "Selling Diabetic Test Strips and Expired Supplies in Kentucky",
  metaDescription:
    "Most guides tell Kentucky readers that expired diabetic supplies are worthless. Two items are the exception. This sorts a cupboard into bin, sell and ring-first, and explains how mail-in works from here.",

  lead: [
    "This page is written for someone standing in front of an open cupboard with a pile of boxes and no idea which of them are worth anything. That is the common situation in Kentucky, and the advice most readily available online will make you throw away the wrong things.",
    "There is no diabetic supply buyer listed anywhere in Kentucky — not in Louisville, not in Lexington, not in Bowling Green — so the sale itself happens by post. But the sorting comes first, and it is where the money is won or lost.",
  ],

  sections: [
    {
      heading: "Pile one: bin it",
      paragraphs: [
        "Anything that has been opened. The factory seal is the whole basis on which a box can be resold, because it is the only thing that lets the next person establish what has and has not happened to the contents. An opened box is worth nothing rather than a reduced amount, and no story about why it was opened changes that.",
        "Expired test strips. This is the one place where the standard advice is correct — a strip past its date can return an unreliable reading, and an unreliable blood glucose reading is a safety matter. We will not buy them and nobody responsible should.",
        "Expired Dexcom G6 sensors. G6 is specifically excluded from the expiry exceptions below, which surprises people who assume all Dexcom stock behaves the same way.",
        "Anything obtained through Medicare or Medicaid, whatever its condition. Supplies paid for by those programmes cannot be resold. This is about who paid rather than what is on the label; ordinary pharmacy labelling with your own name on it is not a problem at all.",
      ],
    },
    {
      heading: "Pile two: sell it",
      paragraphs: [
        "Sealed test strips with at least six months left before expiry: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. Keep large boxes as they are — one 100-count box is worth meaningfully more than two 50-count boxes of the same brand, so there is nothing to gain from splitting them.",
        "Sealed CGM stock: Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 sensors. Libre carries one restriction — US retail versions only, so anything bought outside the country is out however new it is.",
        "And the two items that go against everything you will read elsewhere: expired Omnipod pods, in the 5, DASH and Classic versions, and expired Dexcom G7 sensors. Both still pay, at a reduced rate. The most-read guide on this subject in the country tells its readers that expired supplies have very low or no resale value, full stop, and Kentucky households act on that every week by throwing out the two things the sentence does not cover.",
      ],
    },
    {
      heading: "Pile three: ring first",
      paragraphs: [
        "Sealed Medtronic and Tandem components. Some qualify and some do not, and the answer depends on the specific part rather than on the brand. This is a call to 518-779-9751 rather than a coin toss.",
        "Omnipod controllers as opposed to pods. Pods are on the list; the controller is a different item and should not be assumed in.",
        "Anything where you cannot read the date, cannot identify the generation, or cannot tell whether the packaging is a US retail version. Ask before you post it. A five-minute call is cheaper than a parcel that comes back.",
      ],
    },
    {
      heading: "Why Kentucky's figures carry an older date",
      paragraphs: [
        "One point of housekeeping, because it is the sort of thing that looks like an error if nobody explains it. Kentucky is one of only two states missing from the 2025 CDC PLACES release — Pennsylvania is the other. Every figure on this page therefore comes from the 2022 BRFSS rather than the 2023 round used for the other 48 states.",
        "On those 2022 figures, 13.7% of Kentucky adults have diagnosed diabetes against a national 12.1%. Louisville reads 15.0% and Lexington-Fayette 11.4%, with Owensboro at 13.8%, Covington at 13.3% and Richmond at 10.2% — a 4.8-point spread between the highest and lowest, which is narrow compared with much of the South.",
        "Two other 2022 figures are worth knowing. Only 5.4% of working-age Kentuckians are uninsured, one of the lowest rates in the country, and 18.1% of the state is 65 or over. Kentucky has high diabetes prevalence and unusually high insurance coverage at the same time, which is not a common combination.",
      ],
    },
    {
      heading: "Getting the sale done from Kentucky",
      paragraphs: [
        "Get the figure in writing before anything is packed, quoted against the brands, counts and dates in your sell pile. Once the parcel is in another state, a revised number is not something you can meaningfully dispute from Elizabethtown.",
        "Photograph the sealed boxes with the expiry dates readable, and do not open anything to prove what is inside. Keep the photographs until the payment has arrived — most sales pass without incident, and the pictures exist for the ones that do not.",
        "The label is prepaid and tracked and costs you nothing from any of Kentucky's 780 ZIP codes. Payment follows within 24 hours of the parcel being received and verified against your description.",
      ],
    },
  ],

  faqs: [
    {
      q: "Why do Kentucky's numbers say 2022 when other states say 2023?",
      a: "Because Kentucky is one of two states left out of the 2025 CDC PLACES release, alongside Pennsylvania. Rather than quote a figure we cannot source, this page uses the 2022 BRFSS round and says so.",
    },
    {
      q: "Can I sell in person anywhere in Kentucky?",
      a: "No buyer is listed in the state, so this directory cannot point you to a counter in Louisville or anywhere else. Mail-in with a prepaid label is the realistic route from all 780 ZIP codes.",
    },
    {
      q: "Are expired Omnipod pods genuinely worth sending?",
      a: "Yes. The 5, DASH and Classic pods all pay past expiry, at a reduced rate rather than at nothing. Along with expired Dexcom G7 sensors, they are the only two exceptions to the expiry rule.",
    },
    {
      q: "How do I tell a G6 sensor from a G7?",
      a: "The generation is printed on the box. It matters because the accepted components differ, and because an expired G7 sensor still pays while an expired G6 sensor does not.",
    },
    {
      q: "Does it matter which of my boxes go in the same parcel?",
      a: "No. Mixed brands and types are quoted as a single lot rather than sorted item by item, and ten or more boxes earns a better per-box rate than several small sends.",
    },
  ],
}
