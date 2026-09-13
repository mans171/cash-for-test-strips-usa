import type { RegistryPost } from "./types"

/**
 * "A relative has died and there are supplies in the house" — the estate
 * moment, nationally. The 50 state posts use this angle state by state; this
 * is the national answer page for the query itself, which is asked without a
 * state attached far more often than with one.
 *
 * Tone matters more here than on any other post in the series. The reader is
 * clearing a house, not shopping. The page earns the sale by being useful and
 * unhurried about it.
 */
export const deceasedRelativeDiabeticSupplies: RegistryPost = {
  slug: "deceased-relative-diabetic-supplies",
  title: "A Relative Has Died and There Are Diabetic Supplies in the House",
  shortTitle: "Diabetic Supplies Left After a Death: What to Do",
  description:
    "What to do with sealed diabetic supplies during a clear-out: what has value, what does not, who in the family should handle it, and the one deadline that decides it.",
  datePublished: "2026-10-08",
  dateModified: "2026-10-08",
  bodyHtml: `
<p>This is usually the last thing anyone thinks about, and it is usually the
reason it never gets done. The furniture is spoken for, the paperwork is with a
solicitor, and a cupboard of sealed diabetic supplies sits there until somebody
with a van clears the room in an afternoon.</p>

<p>There is no urgency to any of this on the day. But there is one deadline, and
it is worth knowing what it is.</p>

<h2>The deadline is not probate</h2>

<p>It is whichever comes first of the skip arriving, a clearance company being
booked, or the sale of the house completing. Once any of those happens the
supplies are gone and there is nothing left to decide.</p>

<p>So the useful thing to do early is not to sort anything. It is to move the
boxes out of the room being cleared and into a bag or a corner nobody will
touch. That takes two minutes and buys you the rest of the process.</p>

<h2>Who should handle it</h2>

<p>Whoever is already handling the estate. Not because there is a form to fill
in — there is not, and nobody will ask you to prove your relationship — but
because this is a small transaction attached to a much larger set of decisions,
and it goes badly when two siblings each assume the other is dealing with it.</p>

<h2>What has value and what does not</h2>

<p>Sealed, unexpired, in the original packaging. That is the whole test for test
strips and CGM sensors alike. Opened boxes cannot be sold at any price, because
nobody downstream can verify how they were stored once the seal was broken.</p>

<p>On dates, the standard advice is that anything expired is worthless. It is
right about strips and wrong about two things. <strong>Expired Omnipod pods</strong>
— 5, DASH and Classic — and <strong>expired Dexcom G7 sensors</strong> still have
value at a reduced rate. Expired Dexcom G6 sensors do not. Those two get thrown
away constantly during clear-outs on the strength of advice about something
else, so pull them out of the bag before anything goes in the skip.</p>

<p>One rule does apply regardless of who is selling. Supplies obtained through
a government-covered programme cannot be resold. That is about the funding route rather
than about the person holding them, and a great many older people's supplies
came through exactly those programmes.</p>

<h2>Do not open anything</h2>

<p>The instinct during a clear-out is to open a box and look inside. Do not.
Opening it destroys the only thing that made it sellable. Photograph the sealed
boxes with the expiry dates and lot numbers visible instead, and keep those
photographs until any payment lands.</p>

<h2>How much is usually there</h2>

<p>More than families expect. A person who tested several times a day, or who
was on a CGM, accumulates months of stock — and prescriptions often kept
arriving after they stopped being used. It is common for a cupboard to hold a
few hundred pieces rather than a few boxes.</p>

<p>For a normal amount, the <a href="/sell-test-strips">state pages</a> show who
is nearest and whether meeting someone locally is realistic. For a large
clear-out, and a hundred pieces or more counts, the
<a href="/sell-test-strips-in-bulk">bulk page</a> is the better route — mixed
brands and mixed dates are expected there and nothing needs sorting first.</p>
`,
  faqs: [
    {
      q: "Do I need to prove I am entitled to sell these?",
      a: "No. Nobody is asked to produce estate paperwork or prove a relationship. The practical advice is simply that one person in the family handles it, agreed in advance, so it does not fall between two people who each assumed the other was dealing with it.",
    },
    {
      q: "The house sale completes next week. Is there time?",
      a: "Usually yes, but do the phone call rather than the sorting. Move the boxes somewhere they will not be cleared, get a figure, and send them whenever suits — the supplies do not have to leave before the house does.",
    },
    {
      q: "Everything in the cupboard is expired. Is any of it worth keeping?",
      a: "Two things are: Omnipod pods, including 5, DASH and Classic, and Dexcom G7 sensors, both at a reduced rate. Expired test strips and expired Dexcom G6 sensors are not. Separate those two out before the rest goes.",
    },
    {
      q: "These came through a government programme. Does that matter?",
      a: "Yes. Supplies obtained through a government-covered programme cannot be resold. It is worth checking before going further, because it is the condition most likely to apply to an older relative's stock.",
    },
    {
      q: "There is a lot of it. Is that handled differently?",
      a: "A hundred pieces or more is a bulk enquiry rather than an individual sale. Mixed brands and dates are normal at that size and nothing needs separating beforehand.",
    },
  ],
}
