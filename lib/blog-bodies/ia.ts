import type { PostBody } from "./types"

/**
 * Iowa — no in-state buyer, 970 ZIP codes across a very rural state, and a
 * 7.2-point spread between Waterloo at 13.6% and Ames at 6.4%. The page is
 * built around rural distance and the pharmacy-town reality, which is a
 * different frame from the metro-coverage pages.
 */
export const IA: PostBody = {
  label: "Rural distances",
  title: "Selling Diabetic Test Strips in Iowa: 970 ZIP Codes, No Local Buyer",
  heading: "Selling Diabetic Test Strips in Iowa",
  metaDescription:
    "No test strip buyer operates in Iowa. Waterloo reads 13.6% for diabetes against Ames at 6.4%. How to sell by post from a rural state, and the two expired items worth keeping.",

  lead: [
    "There is no test strip buyer listed anywhere in Iowa. There is also not much prospect of one, and it is worth explaining why rather than leaving it as a gap on a map: Iowa spreads three million people across 970 ZIP codes, and an in-person buyer needs population density to make the driving worthwhile.",
    "So this is a mail-in state, which is fine. The label is prepaid and costs you nothing whether you are posting from Des Moines or from a town of four hundred people.",
  ],

  sections: [
    {
      heading: "Iowa is not evenly affected",
      paragraphs: [
        "Statewide, 11.2% of Iowa adults have diagnosed diabetes, a little under the national rate of 12.1%.",
        "Waterloo reads 13.6% and Sioux City and Davenport sit above the state figure too. Ames reads 6.4% — less than half Waterloo's rate. That is a 7.2-point spread inside one state, and it is the familiar pattern of an old meatpacking and manufacturing city against a university town.",
        "Des Moines and Cedar Rapids fall in between. If you are wondering whether what you are holding is actually needed nearby, the answer across most of Iowa is yes.",
      ],
    },
    {
      heading: "The rural pharmacy question",
      paragraphs: [
        "In a lot of small Iowa towns the pharmacy is the only healthcare in walking distance, and people often ask whether the local pharmacy will simply take unused supplies back.",
        "Generally they will not buy them. Pharmacies cannot resell returned medication or supplies once they have left the premises, which is the same rule that makes an opened box worthless in this market. Some will take sharps and expired stock for safe disposal, which is genuinely useful and worth asking about — but that is disposal, not a sale.",
        "That leaves posting them, which is why the rest of this page is about doing that properly.",
      ],
    },
    {
      heading: "The two expired things worth keeping",
      paragraphs: [
        "Nearly every guide on this subject says expired supplies have no value. For test strips that is correct — a degraded strip gives an inaccurate reading, and an inaccurate glucose reading is a safety problem rather than a discount.",
        "Two exceptions, and they are the ones binned most often. Expired Omnipod pods — 5, DASH and Classic — still have value. So do expired Dexcom G7 sensors. Both at a reduced rate rather than nothing.",
        "Expired Dexcom G6 sensors do not qualify, and nor does anything else. But if a cupboard clear-out is heading for the bin, those two are worth separating out first.",
      ],
    },
    {
      heading: "What makes a box sellable",
      paragraphs: [
        "Factory-sealed and unopened, in the original packaging. An opened box cannot be resold at any price, because nobody downstream can verify how it was stored. This is by far the most common reason a parcel gets refused.",
        "Not obtained through Medicare or Medicaid. Supplies paid for by those programmes cannot legally be resold. Private insurance or out of pocket is fine, and a pharmacy label with your name on it makes no difference at all.",
        "For test strips, at least six months before the expiry date. Under that, value falls off quickly.",
        "Check the box count before deciding a small stack is not worth a phone call — a 100-count box is worth meaningfully more than two 50-count boxes of the same brand.",
      ],
    },
    {
      heading: "Posting from a rural address",
      paragraphs: [
        "Get the number in writing before anything ships — the actual figure for what you actually have, not a range and not an \"up to\". A buyer who will not commit before your parcel leaves intends to revise once it has arrived, and by then you have no leverage.",
        "Use the prepaid label and keep the tracking number. Payment runs from when the parcel is received and verified rather than from when you posted it, so the tracking is what starts that clock. From rural Iowa, allow an extra day compared with a metro address.",
        "Photograph the sealed boxes with the expiry dates and lot numbers visible before they go. Do not open a box to photograph what is inside it — opening it destroys the thing that gave it value.",
        "Keep the photographs until the money lands. Most sales go through without incident, but if one does not, the whole question is what condition the boxes were in when they left, and photographs are the only record of that anyone can check.",
      ],
    },
    {
      heading: "Who tends to be selling in Iowa",
      paragraphs: [
        "18.9% of Iowans are 65 or over, a little above the national picture, and only 7.3% of working-age Iowans have no health insurance — one of the lower uninsured rates in the country.",
        "That combination shapes what comes up for sale here. It is driven less by uninsured people paying retail and more by ordinary surplus: a prescription that changed, a device that was switched, or a farmhouse being cleared after a death and a cupboard nobody had opened in years.",
      ],
    },
  ],

  faqs: [
    {
      q: "Will my local pharmacy buy unused test strips?",
      a: "Almost certainly not. Pharmacies cannot resell supplies once they have left the premises. Many will accept sharps and expired stock for safe disposal, which is worth asking about, but that is disposal rather than a sale.",
    },
    {
      q: "Is there any buyer in Iowa at all?",
      a: "Not on this directory. Iowa's population is spread across 970 ZIP codes, which makes in-person buying impractical. Mail-in with a prepaid label is the route and costs you nothing from anywhere in the state.",
    },
    {
      q: "Are expired supplies worth anything?",
      a: "Two things are: Omnipod pods (5, DASH and Classic) and Dexcom G7 sensors, both at a reduced rate. Expired test strips and expired Dexcom G6 sensors are not worth selling.",
    },
    {
      q: "My supplies came through Medicare. Can I sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold. Anything received through private insurance or paid for yourself is fine, and a pharmacy label with a name on it does not matter.",
    },
    {
      q: "How long does it take from rural Iowa?",
      a: "Allow an extra day in transit compared with a metro address, then payment within 24 hours of the parcel being received and verified. Shipping is free regardless of where you post from.",
    },
    {
      q: "I'm clearing a relative's house and found a lot of it. Is that harder?",
      a: "Easier, if anything. Large lots are quoted as a whole rather than item by item, mixed brands do not need separating, and ten or more boxes generally earns a better per-box rate.",
    },
  ],
}
