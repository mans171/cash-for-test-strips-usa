import type { RegistryPost } from "./types"

/**
 * "Leftover Omnipod pods" — the pump-side mirror of the Dexcom post. Included
 * because Omnipod is the one product where the expired-still-has-value rule
 * applies and is most often not known, and because pod users hold stock in
 * quantity rather than in ones and twos.
 *
 * Product lines checked against lib/product-catalog.ts: Omnipod 5, DASH and
 * Classic all appear. Nothing here claims a line that is not in it.
 */
export const leftoverOmnipodPods: RegistryPost = {
  slug: "leftover-omnipod-pods",
  title: "Leftover Omnipod Pods: What They Are Worth, Expired or Not",
  description:
    "Switching pumps or changing therapy leaves boxes of pods behind. Omnipod is the one product where expired stock still has value, and most people never find out.",
  datePublished: "2026-10-22",
  dateModified: "2026-10-22",
  bodyHtml: `
<p>Pods are bought and delivered in quantity, on a schedule, and they stop being
needed all at once — a switch to a tubed pump, a change of therapy, a plan
moving to a different system, or a cupboard cleared after a bereavement. What is
left is rarely one or two boxes.</p>

<h2>The rule almost nobody knows</h2>

<p>The advice everywhere is that expired diabetic supplies are worthless. For
test strips that is correct, and it should be followed — a degraded strip
returns an inaccurate reading, which is a safety problem rather than a bargain.</p>

<p>It is wrong about pods. <strong>Expired Omnipod pods still have value</strong>,
at a reduced rate rather than nothing at all, and that applies across
<strong>Omnipod 5, DASH and Classic</strong>.</p>

<p>The other product in the same position is the Dexcom G7 sensor. Expired G7
sensors are bought; expired Dexcom G6 sensors are not. Those two exceptions are
the entire list, and between them they account for an enormous amount of stock
thrown away every week by people following advice written about something
else.</p>

<p>So if there are pods in the house and the dates have passed, do not bin them
on that basis alone.</p>

<h2>What still needs to be true</h2>

<ul>
<li><strong>Sealed and unopened</strong>, in the original packaging. This is not
negotiable and it is not about the pods being expired — an opened box cannot be
sold at any price, because nobody downstream can verify how it was stored.</li>
<li><strong>Not funded through Medicare or Medicaid.</strong> Supplies obtained
through those programmes cannot be resold. It is about the funding route, not
about you.</li>
<li><strong>Described accurately.</strong> Which system, how many boxes, and the
dates as printed. A figure quoted against a rough description is a figure that
moves when someone sees the boxes.</li>
</ul>

<h2>The rest of the kit</h2>

<p>A pod user's cupboard usually holds more than pods. Controllers, and on
Omnipod 5 the phone-based setup means a controller may never have been opened.
If a CGM was running alongside, there will be sensors too, and the same expiry
distinction applies there — G7 yes, G6 no.</p>

<p>Photograph sealed boxes with the dates and lot numbers visible before
anything moves, and keep the photographs until payment lands. Do not open a box
to photograph the contents.</p>

<h2>Where to take it</h2>

<p>The <a href="/sell-test-strips">state pages</a> show who is nearest to you
and whether an in-person handover is realistic. Because pods come in volume, a
switch often leaves a hundred pieces or more behind — that is a
<a href="/sell-test-strips-in-bulk">bulk enquiry</a> rather than an individual
sale, and mixed generations and mixed dates are expected.</p>
`,
  faqs: [
    {
      q: "My pods are expired. Are they really still worth something?",
      a: "Yes, at a reduced rate rather than the full one. It holds for Omnipod 5, DASH and Classic. It is one of only two exceptions to the expired-is-worthless rule, the other being Dexcom G7 sensors.",
    },
    {
      q: "Does it matter which generation they are?",
      a: "For pods, all three are bought. It matters a great deal on the CGM side, where expired G7 sensors are bought and expired G6 sensors are not, so check the box rather than assuming.",
    },
    {
      q: "The outer box is opened but the pods inside are still sealed.",
      a: "Worth asking about rather than assuming either way — describe exactly what is sealed and what is not. What cannot be sold is an individually opened item.",
    },
    {
      q: "Can I sell the controller?",
      a: "Worth asking, particularly if it was never opened. Omnipod 5 runs from a phone for many users, so controllers turn up boxed more often than you would expect.",
    },
    {
      q: "I have several months of pods. Is that a bulk sale?",
      a: "Probably. A hundred pieces or more counts as bulk, mixed generations and dates are expected, and nothing needs sorting before you get a number.",
    },
  ],
}
