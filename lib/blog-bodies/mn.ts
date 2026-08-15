import type { PostBody } from "./types"

/**
 * Minnesota — built on provenance, because Minnesota is unusually well insured.
 *
 * Only 7.5% of working-age Minnesotans are uninsured, one of the lowest rates
 * in the country. Nearly everything in a Minnesotan medicine cupboard therefore
 * arrived through a plan of some kind, which makes the single disqualifying
 * question — was this Medicare or Medicaid — the one that actually decides most
 * sales here. Every other state post treats that as one bullet in a checklist.
 * This one makes it the spine and gives it the space to be answered properly.
 *
 * Secondary material: the state's scale (5.79m people, 881 ZIP codes, no buyer
 * at all, 446 miles to the nearest) and its flatness — a 3.5-point spread, with
 * Minneapolis reading lower than several small towns.
 *
 * Figures from lib/state-health-data.ts and lib/blog-angles.ts. No prices, and
 * no pronouncements on law — the conditions are stated, not adjudicated.
 */
export const MN: PostBody = {
  label: "The Medicare and Medicaid question decides most Minnesota sales",
  title: "Selling Diabetic Test Strips in Minnesota: The Question That Decides It",
  heading: "Selling Diabetic Test Strips in Minnesota",
  metaDescription:
    "Minnesota is one of the best-insured states, with 7.5% of working-age adults uninsured — which makes where your supplies came from the question that decides most sales. Plus what to do with no buyer in state.",

  lead: [
    "Minnesota is the largest state in this directory with no buyer anywhere inside it. Nearly 5.8 million people, 881 ZIP codes, and not one listed place to hand a box over. The nearest buyer to the centre of the state is about 446 miles away, which settles the in-person question without much discussion.",
    "But the more useful Minnesotan fact is a different one. Only 7.5% of working-age adults here are uninsured, among the lowest rates in the country. Almost everything sitting unused in a Minnesotan cupboard arrived through a plan of some kind — and which plan it was is the question that decides whether it can be sold at all. Most guides give that one line. It deserves more than one line here.",
  ],

  sections: [
    {
      heading: "Where the supplies came from matters more than what they are",
      paragraphs: [
        "Supplies obtained through Medicare or Medicaid cannot be resold. That is the rule, it has no exceptions, and it applies regardless of how new the boxes are, how many you have or how perfect their condition is. Everything else on this page is secondary to it.",
        "What does not matter, and worries people far more than it should, is the pharmacy label. A label with your own name on it is fine. Nobody is asking you to explain how you came to have supplies, and a printed label is not evidence of anything in itself. The question is about who paid, not whose name is on the box.",
        "In a state where the great majority of people are covered, that distinction does real work. Supplies bought retail, or filled through employer or private insurance, are in a different category from supplies filled under Medicare or Medicaid, and only you can tell which of those you are holding.",
      ],
    },
    {
      heading: "How to work out which it was",
      paragraphs: [
        "If you filled the prescription yourself, you usually already know, and the pharmacy receipt or the explanation of benefits from the time will say which plan paid. That is the cleanest answer and takes a minute to check.",
        "If you cannot find the paperwork, the pharmacy that filled it can tell you which plan was billed. You do not need to explain why you are asking, and it is a routine question for them.",
        "The awkward version is inherited supplies — a parent's cupboard cleared after a move into care or after a death. If the person was on Medicare, that is very likely how the supplies were filled, and the honest answer is usually that those boxes cannot be sold. It is worth checking rather than assuming in either direction, but do not talk yourself into a conclusion you would not want tested.",
        "If you genuinely cannot establish it, say so when you ask for a figure rather than after the parcel has arrived. That conversation is much easier had at the start.",
      ],
    },
    {
      heading: "The expiry claim worth ignoring, twice",
      paragraphs: [
        "The article that ranks above everything else on this subject tells readers expired supplies have very low or no resale value. It is right about test strips. A strip past its date can return an inaccurate reading, and inaccurate glucose readings are a safety matter rather than a discount opportunity.",
        "It is wrong twice, and both times about items people throw out on its advice. Expired Omnipod pods — the 5, DASH and Classic versions — hold value. Expired Dexcom G7 sensors hold value. Both are paid at a reduced rate rather than treated as scrap.",
        "The exceptions stop there. Expired Dexcom G6 sensors do not qualify, and nothing else past its date does. If you are working through a cupboard in Duluth or Rochester with a bin bag open, those two are the ones to pull back out.",
      ],
    },
    {
      heading: "Minnesota is flatter than most states, including inside the Twin Cities",
      paragraphs: [
        "Statewide, 10.1% of adults have diagnosed diabetes on the CDC's 2023 BRFSS estimates, against 12.1% nationally, with 18.3% of the population aged 65 or over.",
        "The internal spread is narrow. St. Paul reads 10.5% and Plymouth 7.0% — 3.5 points between the state's highest and lowest cities, where a comparable state might run to eight or ten. Minneapolis is 7.4%, lower than Duluth at 10.0%, lower than Blaine at 10.3%, and lower than Brooklyn Park at 9.7%. Rochester sits at 9.2%, Bloomington 8.9%, Woodbury 9.4%, Maple Grove 7.2%.",
        "Two Minnesotan cities differ by less than the margin you would find between neighbouring suburbs in Michigan or Connecticut. There is no concentrated pocket of demand for a buyer to build a shop around, which is a large part of why nobody has, despite the population.",
      ],
    },
    {
      heading: "Posting it, and the part to settle first",
      paragraphs: [
        "With no in-state option, everything from Minnesota goes by post. The label is prepaid and costs you nothing wherever in the state you are sending from. A buyer who wants you to pay postage on a sale of this kind is telling you something useful about themselves.",
        "Agree the actual number before anything leaves. The figure for what you specifically have — brand, count, expiry dates — rather than a range or a published average. A buyer unwilling to commit before the parcel ships is one who intends to revise afterwards, when the boxes are 446 miles away and you have nothing left to hold.",
        "Photograph the sealed boxes with the dates and lot numbers showing, and keep those photographs until you have been paid. Do not open a box to photograph what is inside it. An opened box cannot be resold at any price, so that single act destroys the value you were trying to document.",
        "Payment follows within 24 hours of the parcel being received and verified. Verification is someone checking the boxes against your description, which is why the clock runs from arrival rather than from the day you posted it.",
      ],
    },
  ],

  faqs: [
    {
      q: "My insurance paid for these, but it was not Medicare or Medicaid. Is that fine?",
      a: "Yes. The restriction is specific to supplies obtained through Medicare or Medicaid. Private or employer coverage, or paying retail yourself, does not create the same problem, and in a state as well insured as Minnesota that covers most sellers.",
    },
    {
      q: "How do I find out which plan actually paid?",
      a: "The pharmacy receipt or the explanation of benefits from the time will say. If neither is to hand, the pharmacy that filled the prescription can tell you which plan was billed — it is a routine question and you do not need to give a reason for asking.",
    },
    {
      q: "The boxes have my late mother's name on the pharmacy label. Does that stop the sale?",
      a: "The name on the label is not the issue. What matters is whether the supplies were obtained through Medicare or Medicaid, and if she was on Medicare that is the likely answer. It is worth establishing before you send anything rather than after it arrives.",
    },
    {
      q: "Is there really no buyer in Minneapolis or St. Paul?",
      a: "None listed, in either city or anywhere else in the state, which is unusual for a state of this size. The nearest is roughly 446 miles from the centre of Minnesota. If that changes, the buyer will appear on the Minnesota page rather than being hinted at here.",
    },
    {
      q: "Do you buy expired Omnipod pods?",
      a: "Yes, at a reduced rate — the 5, DASH and Classic pods. Expired Dexcom G7 sensors as well, on the same basis. Expired test strips and expired Dexcom G6 sensors are the ones genuinely not worth sending.",
    },
    {
      q: "One of my boxes was opened but nothing was used from it. Can I include it?",
      a: "No. Once the manufacturer's seal is broken the box cannot be resold, because nobody further down the line has any way to verify how it was handled or stored. Send the sealed boxes and leave the opened one out of the count entirely.",
    },
  ],
}
