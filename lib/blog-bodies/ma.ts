import type { PostBody } from "./types"

/**
 * Massachusetts — one listed buyer, Boston, and the lowest uninsured rate in
 * this batch at 5.2% of working-age adults, among the lowest in the country.
 *
 * That is the spine. In a state where almost everyone is covered, almost every
 * box in a Massachusetts cupboard was paid for by somebody other than the
 * person holding it — which makes the who-paid question the decisive one here,
 * and it is the question most guides skate over. Private insurance and retail
 * purchases are fine; Medicare and Medicaid supplies cannot be resold. Getting
 * that distinction straight is worth more to a Massachusetts reader than any
 * amount of general advice about packing parcels.
 *
 * Tennessee shares the generated "worth" angle and is built on valuation
 * mechanics instead, with no overlap in structure or argument.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts.
 */
export const MA: PostBody = {
  label: "Nearly everyone here is insured — so who paid is the decisive question",
  title: "Selling Diabetic Test Strips in Massachusetts: Who Paid Decides It",
  heading: "Selling Diabetic Test Strips in Massachusetts",
  metaDescription:
    "Massachusetts has one of the lowest uninsured rates in the country, so almost every box was paid for by a plan. Which plans allow resale, which do not, and how the Boston buyer fits in.",

  lead: [
    "Massachusetts has one of the lowest uninsured rates in the country: 5.2% of working-age adults have no health coverage. That is a good thing in every respect except one relevant to this page — it means that almost every box of diabetic supplies sitting in a Massachusetts cupboard was paid for by somebody other than the person holding it.",
    "Which makes one question decisive here in a way it is not everywhere else. Not what condition the box is in, not what brand it is, but who paid for it. Get that wrong and nothing else matters. There is a listed buyer in Boston, and the rest of the state posts.",
  ],

  sections: [
    {
      heading: "The distinction that matters most in this state",
      paragraphs: [
        "Supplies obtained through Medicare or Medicaid cannot be resold. That is a hard line and no condition, date or brand changes it. If a public programme paid for the box, it is out.",
        "Supplies that came through private or employer health insurance are a different matter and are not excluded. Neither are supplies you paid for retail at a pharmacy counter. The vast majority of what changes hands in Massachusetts falls into those categories, which is why the state's coverage rate is a feature of this market rather than an obstacle to it.",
        "The thing that trips people up is the pharmacy label. A sticker with your name, your prescriber and a fill date on it looks official and looks like it might be a problem. It is not. It is completely ordinary, it appears on nearly every box anyone sells, and it tells you nothing about which programme paid. If you are unsure which applies to you, that is a five-minute call to 518-779-9751 rather than a reason to bin anything.",
      ],
    },
    {
      heading: "Boston, Springfield, and the distance between them",
      paragraphs: [
        "The Boston listing is the only in-person option in Massachusetts. For the metro area and the inner suburbs that is a genuine convenience, and an in-person sale settles everything in one visit rather than across a week.",
        "Western Massachusetts is a different proposition. Springfield reads 14.8% for diagnosed diabetes among adults, the highest in the state and nearly nine points above Cambridge at 5.9%, which is the lowest. The state as a whole sits at 9.8% against a national 12.1% — Massachusetts is a low-prevalence state with one high-prevalence city in it.",
        "Springfield is not a short trip to Boston for the sake of a parcel of boxes, and neither are New Bedford at 13.2%, Fall River at 12.5% or Worcester at 11.4% in any convenient sense. From those, posting is the sensible answer. The prepaid tracked label costs nothing from any of the state's 539 ZIP codes.",
      ],
    },
    {
      heading: "What Massachusetts sellers most often throw away by mistake",
      paragraphs: [
        "The article that ranks highest nationally for this subject tells its readers that expired supplies have very low or no resale value. That is right about test strips — a strip past date can give an unreliable reading, and no responsible buyer wants them in circulation.",
        "It is wrong about expired Omnipod pods, in the 5, DASH and Classic versions, and about expired Dexcom G7 sensors. Both still pay, at a reduced rate. Expired Dexcom G6 sensors do not, which is a real distinction rather than a technicality, and nothing else past its date qualifies.",
        "With 18.7% of the state aged 65 or over, a large share of what gets sold in Massachusetts comes out of a house clear-out. That is precisely the setting where boxes are sorted quickly by date and the two exceptions go out with everything else.",
      ],
    },
    {
      heading: "The other two hard checks",
      paragraphs: [
        "The seal. Factory-sealed, unopened, original packaging. An opened box is worth nothing at all, because the seal is what allows anyone downstream to establish what has happened to the contents. There is no partial value for a box that was opened but untouched, and no way to restore it.",
        "The dates, for strips specifically. At least six months before expiry. Below that the value falls sharply, since whoever uses them next needs a realistic window to do it in.",
        "One more, narrow but absolute: FreeStyle Libre sensors must be US retail versions. Sensors bought outside the country cannot be resold here whatever their condition or date.",
      ],
    },
    {
      heading: "What is bought, and how the sale runs",
      paragraphs: [
        "Test strips: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, True Metrix. A 100-count box is worth meaningfully more than two 50-count boxes of the same brand. CGM: Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3. Pods: Omnipod 5, DASH and Classic, plus some sealed Medtronic and Tandem components.",
        "Whichever route you take, get the figure agreed in writing first, quoted against the brands, counts and dates you actually hold. Mixed brands go as one lot and do not need separating, and ten or more boxes earns a better per-box rate.",
        "By post, payment follows within 24 hours of the parcel being received and verified. Photograph the sealed boxes with dates visible before packing, keep the tracking number, and keep the photographs until the money has arrived.",
      ],
    },
  ],

  faqs: [
    {
      q: "My supplies came through my employer's health plan. Can I sell them?",
      a: "Private and employer insurance are not the exclusion. Medicare and Medicaid are — supplies obtained through those programmes cannot be resold. Retail purchases are fine as well.",
    },
    {
      q: "There is a pharmacy label with my name on it. Does that stop the sale?",
      a: "No, and it never has. Ordinary prescription labelling appears on almost every box that gets sold. The only source question that matters is which programme paid.",
    },
    {
      q: "Is the Boston buyer worth travelling to from Springfield?",
      a: "For most lots, no. That is across the state, and the prepaid label costs nothing. The in-person option is genuinely useful for the Boston area and less so the further west you are.",
    },
    {
      q: "Do expired supplies pay anything?",
      a: "Omnipod pods in the 5, DASH and Classic versions and Dexcom G7 sensors do, at a reduced rate. Expired test strips and expired Dexcom G6 sensors do not.",
    },
    {
      q: "I am clearing a parent's flat and do not know how anything was paid for.",
      a: "Set aside anything you know came through Medicare or Medicaid, and ring 518-779-9751 about the rest rather than guessing in either direction. Keep every box sealed while you work through it.",
    },
  ],
}
