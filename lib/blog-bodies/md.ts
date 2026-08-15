import type { PostBody } from "./types"

/**
 * Maryland — one listed buyer, Silver Spring, inside the DC commuter belt.
 * Built on the Dexcom angle properly: the G6/G7 split is the single most
 * expensive thing a seller gets wrong, because the two generations have
 * different accepted components AND opposite treatment once expired. That is
 * a mechanical, checkable subject and no competitor page covers it.
 *
 * Distinct from Alabama and New Mexico, which share the generated angle:
 * Alabama is about statewide prevalence and mail logistics, New Mexico about
 * uninsurance and where boxes go, this one about telling your CGM hardware
 * apart. The Baltimore/Bethesda spread is a single paragraph, not the spine.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts.
 */
export const MD: PostBody = {
  label: "Dexcom G6 vs G7 — the split that decides what your box is worth",
  title: "Selling Dexcom and Test Strips in Maryland: G6, G7 and What Counts",
  heading: "Selling Diabetic Test Strips and Dexcom Supplies in Maryland",
  metaDescription:
    "Maryland has a listed buyer in Silver Spring. This covers what Dexcom G6 and G7 supplies are accepted, why expired G7 sensors still pay and expired G6 does not, and how the rest of the state sells by post.",

  lead: [
    "If you have Dexcom supplies to sell in Maryland, one detail decides more than everything else on this page combined: which generation they are. G6 and G7 are not interchangeable here. The accepted components differ, and once a box is past its expiry date the two are treated in opposite ways.",
    "Maryland is also one of the states with an in-person option. There is a listed buyer in Silver Spring, which puts a real counter within reach of the Washington side of the state. Baltimore, the Eastern Shore and western Maryland are a post office job, and this page treats those as two genuinely different situations rather than pretending one answer fits.",
  ],

  sections: [
    {
      heading: "The G6 and G7 split, stated plainly",
      paragraphs: [
        "For Dexcom G6, sealed sensors and transmitters are both accepted. For G7, it is sealed sensors and receivers. Those are different component lists, and sending the wrong part on the assumption that Dexcom is Dexcom is a common way to have items returned unpaid.",
        "The expiry rule is where the two generations part company completely. An expired G7 sensor still has value and is paid at a reduced rate. An expired G6 sensor does not qualify at all. Same manufacturer, same shelf, opposite outcome.",
        "That asymmetry runs directly against what the most widely read guide on this subject tells people, which is that expired supplies are worth very little or nothing. For test strips that advice holds — a degraded strip gives an unreliable reading, and that is a safety issue rather than a haggling point. For G7 sensors and for Omnipod pods in the 5, DASH and Classic versions, it is simply wrong, and following it costs Maryland sellers money every week.",
        "So before anything gets binned, read the generation off the box rather than off memory. It takes seconds and it is the highest-value check on this page.",
      ],
    },
    {
      heading: "Silver Spring, and who it actually serves",
      paragraphs: [
        "The Silver Spring listing is the only in-person option in Maryland. It sits in the dense southern end of the state, which means it is genuinely convenient for Montgomery County and the Washington commuter belt and steadily less so the further north and east you go.",
        "Silver Spring itself reads 10.0% for diagnosed diabetes among adults. Nearby Gaithersburg is 10.5%, Germantown 10.5%, Bethesda 8.0% — the lowest figure in the state's ten cities. The buyer is therefore located in the part of Maryland with the least diabetes, which is a pattern repeated across the country: coverage follows population density and commercial logic rather than need.",
        "Baltimore, at 14.4%, is the highest of the ten and is not a short trip from Silver Spring in traffic. If you are in Baltimore, Glen Burnie at 11.5%, or anywhere on the Eastern Shore, mail-in is usually the better use of your afternoon even though an in-person option technically exists in the state.",
      ],
    },
    {
      heading: "Everything that is not a Dexcom box",
      paragraphs: [
        "Test strips: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. They need at least six months before expiry, and box count is worth watching — a 100-count box is worth meaningfully more than two 50-count boxes of the same product, so keep the large boxes together rather than splitting a lot.",
        "FreeStyle Libre 1, 2 and 3 sensors are accepted, with one restriction that catches a surprising number of people: US retail versions only. A sensor bought abroad cannot be resold here whatever its condition or date.",
        "Omnipod 5, DASH and Classic pods are accepted, including past their expiry date at a reduced rate. Pods rather than controllers. Some sealed Medtronic and Tandem components qualify as well; those are worth a call on 518-779-9751 rather than an assumption either way.",
      ],
    },
    {
      heading: "What disqualifies a box regardless of what is in it",
      paragraphs: [
        "An opened box. Factory seal intact, original packaging, no exceptions. Once a carton has been opened there is no way for anyone downstream to verify what happened to it, and its value goes to zero rather than merely dropping.",
        "Supplies obtained through Medicare or Medicaid, which cannot be resold. This is about who paid, not about what is printed on the label — a pharmacy label carrying your own name is entirely normal and does not affect anything.",
        "Test strips with less than six months of life left, and any expired item other than Omnipod pods and Dexcom G7 sensors. Those two exceptions are the whole list; nothing else past its date is worth posting.",
      ],
    },
    {
      heading: "If you are posting rather than driving",
      paragraphs: [
        "Agree the figure in writing first, against the actual brands, counts and dates in front of you. A quote given after your parcel has arrived somewhere is not a quote, it is a position, and you have nothing left to push back with at that stage.",
        "Use the prepaid tracked label. It costs you nothing from any of Maryland's 477 ZIP codes, and the tracking is what fixes the date the parcel was received — which is when the payment clock starts. Payment follows within 24 hours of receipt and verification.",
        "Photograph the sealed boxes with dates visible before they go in the parcel, and keep the photographs until the money lands. Most sales are uneventful; the photographs exist for the small number that are not.",
      ],
    },
  ],

  faqs: [
    {
      q: "I have an expired Dexcom sensor. Is it worth anything?",
      a: "If it is a G7 sensor, yes, at a reduced rate. If it is a G6 sensor, no. The generation is printed on the box, and this is the one detail worth checking before you throw anything away.",
    },
    {
      q: "Can I sell a Dexcom transmitter?",
      a: "Sealed G6 transmitters are accepted. For G7 the accepted components are sensors and receivers rather than transmitters. If you are not sure which generation you are holding, the box will say.",
    },
    {
      q: "Is Silver Spring the only place in Maryland I can sell in person?",
      a: "It is the only listing in the state. For much of Montgomery County and the Washington side it is genuinely convenient. From Baltimore, Frederick or the Eastern Shore, mail-in with a prepaid label is usually the more sensible route.",
    },
    {
      q: "Does a pharmacy label with my name on it stop the sale?",
      a: "No. The only source question that matters is whether Medicare or Medicaid paid for the supplies, because those cannot be resold. Ordinary prescription labelling is expected and changes nothing.",
    },
    {
      q: "Should I split a large lot into several parcels?",
      a: "No. Ten or more boxes earns a better per-box rate, and mixed brands and types are quoted as a single lot rather than separated out. Splitting a lot works against you twice over.",
    },
    {
      q: "How long before I am paid?",
      a: "Within 24 hours of the parcel being received and verified. Verification is someone checking the boxes against what you described, so the clock starts on arrival rather than on the day you posted it.",
    },
  ],
}
