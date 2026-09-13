import type { RegistryPost } from "./types"

/**
 * "Insurance changed brands" — informational answer post, moment-of-acquisition
 * angle. Second in the series Feldon approved on 2026-09-07, after the CGM
 * switch post.
 *
 * The moment: a plan year turns over, an employer changes carrier, or a
 * formulary moves, and the new plan covers a different meter. Test strips are
 * locked to their meter, so the remaining boxes become unusable overnight
 * through no decision of the person holding them.
 *
 * Our edge on this query is the funding distinction, which is the single most
 * common misconception in this whole category: supplies bought through PRIVATE
 * insurance can be sold; supplies obtained through a government-covered programme cannot.
 * People assume "insurance paid, so it isn't mine to sell" and bin the lot.
 * The site already states this correctly on the state pages — this post makes
 * it the headline answer, because on an insurance-change query it IS the
 * question being asked.
 *
 * No dollar figures, no unqualified legality claims, no personal byline, no
 * donation guidance.
 */
export const insuranceChangedBrands: RegistryPost = {
  slug: "insurance-changed-what-to-do-with-old-supplies",
  title: "Your Insurance Changed Brands. What to Do With the Old Supplies",
  shortTitle: "Insurance Changed Brands? What to Do With Old Supplies",
  description:
    "A new plan year can leave you holding sealed boxes for a meter you no longer use. Whether you can sell supplies insurance paid for, and the one funding rule that decides it.",
  datePublished: "2026-09-24",
  dateModified: "2026-09-24",
  bodyHtml: `
<p>This one is never anybody's decision. A plan year turns over, an employer
switches carrier, or a formulary quietly moves, and the letter arrives saying
the new plan covers a different meter. The supplies you already have do not stop
existing. They just stop being useful, overnight, through nothing you did.</p>

<h2>Why the old boxes cannot simply be used up</h2>

<p>Test strips are not a generic product. Each strip is calibrated to its own
meter, so a OneTouch strip does not work in a Contour meter and a FreeStyle
strip does not work in an Accu-Chek. There is no adapter and no setting to
change. If the plan moved you to a different brand, the remaining boxes of the
old one have no use to you at all.</p>

<p>The same applies on the CGM side, where a plan switching between Dexcom and
FreeStyle Libre leaves sealed sensors that belong to a system you no longer
have.</p>

<p>The pharmacy generally cannot take them back either. Once a prescription item
has been dispensed it usually cannot be returned to stock, which is why people
end up holding these rather than simply reversing the order.</p>

<h2>The question everyone actually asks</h2>

<p><strong>Can you sell supplies that insurance paid for?</strong> This is the
part that gets people wrong, and it is worth being exact about, because the
answer depends entirely on which kind of insurance.</p>

<p>Supplies obtained through a government program <strong>cannot be resold</strong>.
That is a firm line and it applies no matter how they came to be sitting in your
cupboard.</p>

<p>Supplies that came through <strong>private insurance</strong>, an employer
plan, or that you paid for yourself, are a different situation. So are supplies
handed on by a relative who paid for them privately. In those cases the boxes are
ordinary property.</p>

<p>The distinction is about the funding route, not about you, and nobody is asked
to prove how a box came into their possession. It matters because a great many
perfectly sellable boxes get thrown away by people who assumed that anything an
insurer touched was off limits.</p>

<h2>What to check before you do anything</h2>

<ul>
<li><strong>The seal.</strong> Factory sealed and unopened, in the original box.
Once a box has been opened nobody downstream can verify how it was stored, so an
opened box cannot be resold at any price.</li>
<li><strong>The date.</strong> Unexpired for strips, without exception — a
degraded strip returns an inaccurate reading, which is a safety problem rather
than a bargain. Two exceptions exist on the CGM side: expired Omnipod pods and
expired Dexcom G7 sensors still have value, at a reduced rate. Expired Dexcom G6
sensors do not.</li>
<li><strong>The whole cupboard.</strong> A brand change usually leaves more than
strips behind — lancets, control solution, unopened meters and, on the CGM side,
transmitters and receivers. People carefully keep the strips and bin the rest.</li>
</ul>

<p>Photograph the sealed boxes with the expiry dates and lot numbers visible
before they go anywhere, and keep the photographs until you have been paid. Do
not open a box to photograph what is inside — opening it destroys the only thing
that made it sellable.</p>

<h2>Where it goes from here</h2>

<p>For a few boxes, the <a href="/sell-test-strips">state pages</a> show who is
nearest to you and whether meeting someone in person is realistic where you live.
Mail-in works from anywhere and the label costs you nothing.</p>

<p>Brand changes do not only happen to individuals. When a plan moves a whole
population, pharmacies and supply companies are left holding the discontinued
line in quantity. If that is the situation, or you are a reseller with a hundred
pieces or more, the <a href="/sell-test-strips-in-bulk">bulk page</a> is the
right starting point — mixed brands and mixed dates are expected in a lot that
size and do not need sorting first.</p>
`,
  faqs: [
    {
      q: "My insurance paid for these. Can I still sell them?",
      a: "If they came through private insurance, an employer plan, or you paid yourself, yes. Supplies obtained through a government-covered programme cannot be resold. The rule is about the funding route rather than about you, and nobody asks you to prove how a box came into your possession.",
    },
    {
      q: "Can I just use the old strips in my new meter?",
      a: "No. Strips are calibrated to their own meter, so a strip from one brand will not work in another. There is no adapter and no setting that changes it, which is why a brand switch leaves the old boxes genuinely unusable.",
    },
    {
      q: "Will the pharmacy take them back?",
      a: "Usually not. Once a prescription item has been dispensed it generally cannot be returned to stock, which is exactly why these end up sitting in a cupboard rather than being reversed at the counter.",
    },
    {
      q: "What about everything else the change left behind?",
      a: "Worth asking about. Lancets, control solution, unopened meters, and on the CGM side transmitters and receivers all come up. They are thrown away far more often than the strips are.",
    },
    {
      q: "A plan change left my pharmacy with a lot of the old line. Is that different?",
      a: "Yes, that is a bulk enquiry rather than an individual sale. Mixed brands and mixed dates are normal at that size and nothing needs sorting beforehand. Start on the bulk page.",
    },
  ],
}
