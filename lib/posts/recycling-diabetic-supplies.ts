import type { RegistryPost } from "./types"

/**
 * "Recycling diabetic supplies" — informational answer post.
 *
 * Target query: "recycling diabetic supplies" (13 impressions at position 35
 * on cash4teststripsusa.com per the 2026-09-05 GSC pull). No dedicated page
 * exists for it on either site. Category: answer/informational.
 *
 * Published Wednesday 2026-09-10 per the cadence: USA site national answer
 * post alternate weeks.
 */
export const recyclingDiabeticSupplies: RegistryPost = {
  slug: "recycling-diabetic-supplies",
  title: "Can You Recycle Diabetic Supplies? What Happens to Each Type",
  description:
    "Most diabetic supplies cannot go in the blue bin — but sealed, unexpired boxes have a better option. What is recyclable, what should be sold, and how to dispose of the rest safely.",
  datePublished: "2026-09-10",
  dateModified: "2026-09-10",
  bodyHtml: `
<p>Most diabetic supplies end up in the trash — not because they are worthless,
but because people are not sure what else to do with them. Recycling is the
first instinct, but the rules are more complicated than a blue bin and a wishful
toss.</p>

<p>Here is what can actually be done with each type.</p>

<h2>Test strips and lancets</h2>

<p>Lancets are sharps and should go into a sharps container, not loose recycling
or trash. Many pharmacies offer sharps drop-off for free; the FDA also has a
list of approved mail-back programs.</p>

<p>Test strip containers are generally plastic, but the strips themselves contain
a small enzyme coating that disqualifies them from curbside recycling in most
municipalities. If the boxes are sealed and unexpired, selling them is a better
outcome: the strips stay in use rather than going to landfill, and you get paid
for something you were not going to use anyway.</p>

<h2>CGM sensors and transmitters</h2>

<p>Sensors contain small amounts of adhesive and hydrogel that put them outside
standard plastic recycling. Some manufacturers run their own take-back programs —
Dexcom, for example, has offered a recycling mailer for used transmitters in
some markets. Check the manufacturer's website for current availability.</p>

<p>Sealed, unexpired sensors in original packaging — Dexcom G6, G7, FreeStyle
Libre 1/2/3 and similar — are worth considerably more than their scrap value.
Buyers on this directory purchase them directly, and payment is typically made
the same day you make contact.</p>

<h2>Insulin pods (Omnipod and similar)</h2>

<p>Used pods contain residual insulin and are treated as pharmaceutical waste in
most states — they should not go in household recycling or regular trash. Insulet
(the maker of Omnipod) has historically offered a pod recycling program; check
their current offerings before disposal.</p>

<p>Sealed, unused pods are a different matter. Omnipod 5, DASH and Classic pods
in original packaging still have resale value even past the printed expiration
date (expired pods are one of the few items buyers still accept after the date
has passed). If you have a supply of unused pods, contacting a buyer before
discarding them is worth the five-minute text.</p>

<h2>Glucose meters</h2>

<p>Meters are small electronics and fall under e-waste rules in most states.
Many pharmacies and electronics retailers accept them for recycling. Some
manufacturers also have take-back programs. Check Earth911 or your state's
e-waste locator for the nearest drop-off.</p>

<p>Used meters have very little resale value; new meters are often free with a
prescription. Unless you have a sealed, in-box unit with all accessories, a
meter is more likely to end up at an e-waste drop-off than sold.</p>

<h2>Insulin pens and vials</h2>

<p>Insulin is a pharmaceutical and should not go into curbside recycling. Sealed,
unexpired vials may be accepted by certain pharmaceutical take-back programs.
The DEA's National Prescription Drug Take Back Day happens twice a year and
covers insulin; many pharmacies also run year-round collection.</p>

<p>We do not currently purchase insulin pens or vials — only test strips, CGM
sensors and pods.</p>

<h2>The short version</h2>

<p>If your supplies are sealed and unexpired, sell them — that keeps them in use
and puts money in your pocket. If they are opened or expired (with the exception
of Omnipod pods and Dexcom G7 sensors, which we still buy past expiry), follow
the disposal path that matches their category: sharps container for lancets,
e-waste for meters, pharmaceutical take-back for insulin, and manufacturer
take-back programs where they exist for sensors and pods.</p>
  `.trim(),

  faqs: [
    {
      q: "Can I put diabetic test strips in the recycling bin?",
      a: "No. Test strip packaging is plastic but the strips contain an enzyme coating that disqualifies them from curbside recycling in most areas. If the boxes are sealed and unexpired, selling them keeps them in use and out of the waste stream.",
    },
    {
      q: "What do I do with used lancets?",
      a: "Lancets are sharps and must go in a puncture-resistant sharps container — not loose recycling or household trash. Many pharmacies offer free drop-off, and the FDA maintains a list of approved sharps mail-back programs.",
    },
    {
      q: "Can I recycle CGM sensors?",
      a: "Used sensors cannot go in curbside recycling. Some manufacturers offer take-back programs for used devices. Sealed, unexpired sensors in original packaging can be sold — buyers on this directory purchase Dexcom G6/G7, FreeStyle Libre 1/2/3 and similar items.",
    },
    {
      q: "Where do I dispose of an old glucose meter?",
      a: "Glucose meters are small electronics and fall under e-waste rules. Many pharmacies and electronics retailers accept them for recycling. Check Earth911 or your state e-waste locator for the nearest drop-off.",
    },
    {
      q: "Is it legal to sell sealed, unused diabetic supplies?",
      a: "Reselling sealed, unexpired supplies you own is generally permitted, and no federal law specifically bans it. Supplies covered by a government program cannot be resold. See our guide to the rules for more detail — this is general information, not legal advice.",
    },
  ],
}
