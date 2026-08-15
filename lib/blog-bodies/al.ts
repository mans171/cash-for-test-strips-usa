import type { PostBody } from "./types"

/**
 * Alabama — no in-state buyer, and one of the highest state diabetes rates in
 * the country at 14.8%. The spine is breadth rather than the usual gap story:
 * six of the ten Alabama cities we hold figures for sit above the national
 * rate, so the supply of unused boxes is spread across the whole state rather
 * than pooled in one metro. A seller here is normal, not unusual, and there is
 * still nowhere to walk into.
 *
 * Deliberately NOT built on the Birmingham-versus-Auburn spread. That gap is
 * real and gets one paragraph, but New Mexico shares this generated angle and
 * Michigan, Georgia and Connecticut already own the intra-state-gap frame.
 * Alabama's page is about volume and mail logistics; New Mexico's is about
 * uninsurance and age.
 *
 * Figures: CDC BRFSS 2023 via lib/state-health-data.ts. No dollar amounts.
 */
export const AL: PostBody = {
  label: "High prevalence statewide, no buyer in Alabama",
  title: "Selling Diabetic Test Strips in Alabama: Common Supply, No Local Buyer",
  heading: "Selling Diabetic Test Strips in Alabama",
  metaDescription:
    "Alabama has one of the highest diabetes rates in the country at 14.8% and no test strip buyer anywhere in the state. Here is how mail-in actually works from here, and the expired items most guides tell you to bin.",

  lead: [
    "Alabama is not a state where unused diabetic supplies are a rare thing sitting in one household's cupboard. About 14.8% of adults here have diagnosed diabetes against a national rate of 12.1%, and the elevation is not confined to one city — of the ten Alabama cities we hold figures for, six sit above the national line.",
    "What Alabama does not have is a buyer. There is no listing anywhere in the state, in any direction, so every honest answer on this page runs through the post office. That is worth saying at the top rather than three screens down, because plenty of pages you will find on this subject are written to imply local coverage that does not exist.",
  ],

  sections: [
    {
      heading: "What being an uncovered state actually changes",
      paragraphs: [
        "It changes two things and leaves the rest alone. You cannot hand a box across a counter and count cash, and you cannot look someone in the eye before you commit. Everything else — what qualifies, what it is worth, how quickly you are paid — works the same whether you are in Mobile or somewhere with three buyers down the road.",
        "The practical consequence is that the written quote does more work here than it would elsewhere. You want the figure agreed before the parcel leaves your hands, based on the actual brands, counts and dates you have, and you want it in a form you can point back to. That is your entire negotiating position once the box is in someone else's building.",
        "The second consequence is that the label has to be prepaid and tracked. Prepaid because a sale of this kind should cost you nothing to complete, and tracked because the payment clock runs from the parcel being received and verified — you need a date you can prove, not one you are told.",
      ],
    },
    {
      heading: "Two things you may be about to throw away",
      paragraphs: [
        "The most-read article in the country on selling diabetic supplies tells readers that expired stock has very low or no resale value. Applied to test strips, that is sound advice and we would give it ourselves — a degraded strip returns an unreliable reading, and an unreliable blood glucose reading is a safety matter rather than a bargain.",
        "Applied across the board, it is wrong, and it is wrong about the two items people bin most readily. Expired Omnipod pods — 5, DASH and Classic — still carry value. So do expired Dexcom G7 sensors. Both pay at a reduced rate rather than at nothing.",
        "Expired Dexcom G6 sensors do not qualify, and neither does anything else past its date. It is a short list with hard edges, which is exactly why it is worth checking a box's label before it goes in the bin rather than after.",
      ],
    },
    {
      heading: "Who ends up with boxes to sell in Alabama",
      paragraphs: [
        "Rarely someone who set out to sell diabetic supplies. Far more often a prescription changed and the old kit was already in the house, or someone moved onto a pump or a sensor and the strips became surplus overnight, or a family is clearing a relative's home and finds a cupboard nobody had opened.",
        "Alabama's age profile feeds that last one: 18.6% of the state is 65 or over, and that cohort is where prescription changes and house clearances concentrate. Around 9.9% of working-age adults here have no health insurance, which is the other half of the picture — it is part of why sealed supplies find a second buyer at all.",
        "The spread between towns is wide. Birmingham reads 19.2% against Auburn at 8.5%, a 10.7-point difference inside one state, with Montgomery at 16.7%, Mobile at 17.0% and Dothan at 16.5% clustered up near the top end. But unlike states where one poor metro carries the whole average, Alabama's elevation is broad, and that is the more useful fact for anyone wondering whether their situation is unusual. It is not.",
      ],
    },
    {
      heading: "The three pass-or-fail checks",
      paragraphs: [
        "Seal first. Factory-sealed, unopened, in the original box. An opened box cannot be resold at any price, because nobody downstream can verify what happened to it after it was opened. This is the most common reason a parcel comes back.",
        "Source second. Supplies obtained through Medicare or Medicaid cannot be resold, and no amount of condition changes that. A pharmacy label with your own name printed on it is not a problem and never has been — that is a different question from who paid.",
        "Dates third. For test strips, aim for at least six months of life left. Below that the value falls away quickly, because whoever uses them next needs a realistic window in which to do it.",
      ],
    },
    {
      heading: "What is on the list",
      paragraphs: [
        "Test strips: FreeStyle Lite, Contour Next, Accu-Chek Guide, Aviva and SmartView, OneTouch Verio and Ultra, and True Metrix. Count matters more than most people expect — a single 100-count box is worth meaningfully more than two 50-count boxes of the same product.",
        "Continuous monitoring: Dexcom G6 sensors and transmitters, G7 sensors and receivers, and FreeStyle Libre 1, 2 and 3 sensors. Libre carries one qualifier worth knowing before you post anything — US retail versions only, so sensors bought overseas cannot be resold here whatever condition they are in.",
        "Pods and pump parts: Omnipod 5, DASH and Classic pods, and some sealed Medtronic and Tandem components. Pods rather than controllers. If yours is an unusual pump part, that is a call to 518-779-9751 rather than a guess.",
      ],
    },
  ],

  faqs: [
    {
      q: "Is there anyone in Alabama I can sell to in person?",
      a: "Not through this directory. There is no buyer listed in Birmingham, Mobile, Montgomery, Huntsville or anywhere else in the state, so mail-in is the honest answer. If that changes, the Alabama page is where it will show up first.",
    },
    {
      q: "Does it cost me anything to send supplies from Alabama?",
      a: "No. The shipping label is prepaid wherever in the state you are posting from, and across 656 ZIP codes that is the same answer everywhere. If a buyer asks you to pay for postage on a sale like this, treat it as a reason to stop.",
    },
    {
      q: "How quickly am I paid?",
      a: "Within 24 hours of the parcel being received and verified. Verification means someone has checked the boxes against what you described; it is a real step rather than a stalling tactic, which is why the clock starts on arrival rather than on posting.",
    },
    {
      q: "My supplies came on a prescription with my name on the label. Is that a problem?",
      a: "The label is not the issue. What matters is whether Medicare or Medicaid paid for them, because supplies obtained that way cannot be resold. A pharmacy label with your name on it is ordinary and expected.",
    },
    {
      q: "Can I send different brands together?",
      a: "Yes, and it is usually the better move. Mixed lots are quoted as one lot rather than sorted item by item, and ten or more boxes earns a better per-box rate than the same boxes broken up into small sends.",
    },
  ],
}
