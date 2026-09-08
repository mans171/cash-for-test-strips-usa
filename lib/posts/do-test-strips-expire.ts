import type { RegistryPost } from "./types"

/**
 * "Do diabetic test strips expire?" — the highest-volume question in this
 * category, and the one where the standard internet answer is wrong in a way
 * that costs people money.
 *
 * The equivalent post is the second-most-shown page on albanyteststripsbuyer.com
 * (155 impressions in the 28 days to 2026-09-05, behind only the homepage), so
 * this is a measured pattern rather than a guess. The USA site had no version
 * of its own.
 */
export const doTestStripsExpire: RegistryPost = {
  slug: "do-diabetic-test-strips-expire",
  title: "Do Diabetic Test Strips Expire? What the Date Actually Means",
  description:
    "Expired test strips give inaccurate readings and should not be used. But the same advice is wrong about two CGM products, and that mistake gets thrown away every week.",
  datePublished: "2026-10-01",
  dateModified: "2026-10-01",
  bodyHtml: `
<p>Yes, and unlike a lot of printed dates, this one means something.</p>

<h2>What the date is doing on a box of strips</h2>

<p>A test strip is not inert. It carries a thin enzyme coating that reacts with
the glucose in a blood sample, and the meter reads the strength of that
reaction. The coating degrades over time, faster in heat and humidity. A
degraded strip still produces a number. It is simply the wrong number.</p>

<p>That is the whole reason the date matters more here than on, say, a tin of
beans. A stale reading does not look stale. Someone dosing insulin against a
figure that reads low when it is actually high has been given bad information by
a strip that appeared to work perfectly.</p>

<p>So the standard advice — once the date has passed, do not use them — is
correct, and this page is not going to argue with it.</p>

<h2>Where that advice is wrong</h2>

<p>It gets repeated as though it covers everything in the cupboard, and it does
not. Two products hold value past their date:</p>

<ul>
<li><strong>Expired Omnipod pods</strong> — 5, DASH and Classic.</li>
<li><strong>Expired Dexcom G7 sensors.</strong></li>
</ul>

<p>Both at a reduced rate rather than nothing at all. <strong>Expired Dexcom G6
sensors do not qualify</strong>, and nor does anything else. That is a narrow
list and it is worth knowing precisely, because those two get binned constantly
on the strength of guidance written about test strips.</p>

<p>If you are working through a cupboard and about to throw away everything with
a past date on it, separate the pods and the G7 sensors first. That single check
is worth more than the rest of this page.</p>

<h2>How long do unopened strips actually last?</h2>

<p>Read the box rather than a rule of thumb. Manufacturers set their own dating,
and the useful number is the one printed on the end of the carton, not a figure
from a forum. What matters more than people expect is where they have been
kept — a bathroom cabinet and a hot car are the two classic ways to age a box
faster than its date suggests.</p>

<p>Opened vials are a separate matter. Once the seal on a vial is broken the
strips begin reacting with ambient moisture, and many carry a shorter
in-use window from that point. An opened container also cannot be resold at any
price, because nobody downstream can verify how it was stored.</p>

<h2>If yours are still in date</h2>

<p>Then you have something. Sealed, unexpired boxes are worth selling rather
than storing, and the reason is simple: they get less valuable every month you
keep them, and at some point they cross the line and are worth nothing at all.
The most common way people lose money on this is not selling badly, it is
waiting.</p>

<p>The <a href="/sell-test-strips">state pages</a> show who is nearest to you.
If a clear-out has left you with a hundred pieces or more, the
<a href="/sell-test-strips-in-bulk">bulk page</a> is the right route and mixed
brands and dates are expected.</p>
`,
  faqs: [
    {
      q: "Can I use test strips a month after the date?",
      a: "It is not advisable. The enzyme coating degrades gradually rather than failing on a particular morning, so a strip past its date still gives a reading — it is the accuracy that has gone, and an inaccurate glucose reading is a safety problem rather than a small inconvenience.",
    },
    {
      q: "Are expired strips worth anything?",
      a: "No. Expired test strips are not bought, and should not be resold by anyone, for the reason above. The exceptions are on the CGM side: expired Omnipod pods and expired Dexcom G7 sensors, both at a reduced rate.",
    },
    {
      q: "What about expired Dexcom G6 sensors?",
      a: "Those are not bought. The distinction between G6 and G7 catches people out constantly, so it is worth checking which generation is actually in the box before deciding anything.",
    },
    {
      q: "Does an opened box still count?",
      a: "No. Once a box or vial has been opened it cannot be resold, because there is no way for anyone downstream to verify how it was stored while open. Set those aside rather than sending them.",
    },
    {
      q: "How should I store boxes I am keeping for now?",
      a: "Somewhere cool, dry and stable — not a bathroom, not a car, not a windowsill. Heat and humidity age strips faster than the date implies, and storage is the one part of this you control.",
    },
  ],
}
