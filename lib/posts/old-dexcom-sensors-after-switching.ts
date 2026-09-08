import type { RegistryPost } from "./types"

/**
 * "Old Dexcom sensors after switching to G7" — informational answer post.
 *
 * Category: the moment-of-acquisition angle. Feldon's framing 2026-09-07:
 * educational content that brings it back to selling. The distinction that
 * makes it work is WHO it educates — not someone managing diabetes (they
 * consume supplies and will never sell), but someone who has just been left
 * holding stock they cannot use. A CGM switch is the single most common way
 * that happens, and the leftovers are sensors rather than strips.
 *
 * Our edge on this query: the expiry rule. Expired G7 sensors are still
 * bought at a reduced rate and expired G6 sensors are not — a distinction
 * general "expired supplies are worthless" advice gets wrong, and one this
 * business states correctly on every state page.
 *
 * Product facts checked against lib/product-catalog.ts on 2026-09-07: the
 * catalogue lists G6 receivers, G6 sensors, G6 transmitters, G7 10-day
 * sensors, G7 15-day sensors and G7 receivers. Nothing here claims a line
 * that is not in it.
 *
 * No dollar figures, no unqualified legality claims, no donation guidance
 * (declined by Feldon 2026-09-07).
 */
export const oldDexcomSensorsAfterSwitching: RegistryPost = {
  slug: "old-dexcom-sensors-after-switching",
  title: "Switched to the Dexcom G7? What to Do With Your Old G6 Sensors",
  description:
    "Moving from G6 to G7 leaves most people with sealed sensors they can never use. What they are still worth, the expiry rule almost everyone gets wrong, and what to check first.",
  datePublished: "2026-09-17",
  dateModified: "2026-09-17",
  bodyHtml: `
<p>Almost nobody switches CGM systems on an empty cupboard. The prescription
changes, the pharmacy sends the new one, and a few boxes of the old sensors are
simply left over. They were paid for, they are sealed, and they are now
completely useless to the person holding them.</p>

<p>That is worth being blunt about, because it is the whole problem. A G6 sensor
does not work with a G7 setup. They are different systems, not different
versions of the same one, so there is no adapter, no workaround, and no reason
to keep the box "just in case". The same is true in the other direction, and it
is now true again for anyone moved from the 10-day G7 sensor to the 15-day one.</p>

<h2>What you are actually holding</h2>

<p>Open the bag properly before deciding anything, because a CGM changeover
usually leaves three different things behind and they are not the same:</p>

<ul>
<li><strong>Sensors.</strong> The boxed, single-use part. This is almost always
the bulk of what is left and the part with real value.</li>
<li><strong>Transmitters.</strong> G6 used a separate reusable transmitter. G7
builds it into the sensor, so a G6 transmitter has no home in the new system.</li>
<li><strong>Receivers.</strong> The handheld display. Many people never used one
because they read the sensor on a phone, so these often turn up unopened.</li>
</ul>

<p>All three are things a buyer will look at. People routinely throw away the
transmitter and the receiver while carefully keeping the sensors, which is the
wrong way round more often than you would expect.</p>

<h2>The expiry rule almost everyone gets wrong</h2>

<p>The standard advice online is that once the date has passed, diabetic
supplies are worthless. For test strips that is correct and you should follow
it — a degraded strip gives an inaccurate reading, and an inaccurate glucose
reading is a safety problem rather than a bargain.</p>

<p>It is wrong about CGM sensors, and specifically it is wrong in one direction
only. <strong>Expired Dexcom G7 sensors still have value</strong>, at a reduced
rate rather than nothing at all. <strong>Expired Dexcom G6 sensors do not.</strong></p>

<p>That single distinction is why this page exists. Boxes get binned every week
on the strength of advice written about something else. Check which generation
you are holding and what the date says before anything goes in the trash.</p>

<h2>What makes a box sellable</h2>

<p>Four things, and they are easy to check in a couple of minutes:</p>

<ol>
<li><strong>Factory sealed.</strong> Unopened, in the original packaging. Once a
box has been opened nobody downstream can verify what happened to it while it
was open, so an opened box cannot be resold at any price.</li>
<li><strong>In date</strong>, with the G7 exception above.</li>
<li><strong>Not funded through Medicare or Medicaid.</strong> Supplies obtained
through those programmes cannot be resold. This is about the funding route, not
about you, and nobody is asked to prove how a box came into their possession.</li>
<li><strong>Described accurately.</strong> Generation, box count, and the dates
as printed. A figure quoted against a rough description is a figure that changes
when someone sees the boxes.</li>
</ol>

<p>Photograph the sealed boxes with the expiry date and lot number visible before
they go anywhere, and keep those photographs until you have been paid. Do not
open one to photograph the contents — opening it destroys the only thing that
made it sellable.</p>

<h2>Where it goes from here</h2>

<p>For a handful of boxes, the <a href="/sell-test-strips">state pages</a> show
who is nearest to you and whether an in-person handover is realistic where you
live. Mail-in works from anywhere and the label costs you nothing.</p>

<p>If the switch left you with a lot — a pharmacy changing its stocked line, a
supply company clearing a discontinued product, or a reseller holding a hundred
pieces or more — that is a different conversation, and the
<a href="/sell-test-strips-in-bulk">bulk page</a> is the right starting point.
Mixed generations and mixed dates are normal in a lot that size and do not need
sorting before you get a number.</p>
`,
  faqs: [
    {
      q: "I have switched to the G7. Are my old G6 sensors worth anything?",
      a: "Yes, if they are factory sealed, unopened and still in date. They are useless to you because the two systems do not work together, but they are not useless in general.",
    },
    {
      q: "My leftover G6 sensors are past their date. Is that the end of it?",
      a: "For G6 sensors, yes — expired G6 is not bought. Expired G7 sensors are a different matter and are still bought at a reduced rate. It is worth checking which generation you actually have before deciding.",
    },
    {
      q: "What about the transmitter and the receiver?",
      a: "Both are worth asking about. G6 used a separate reusable transmitter that has no place in a G7 setup, and receivers often turn up unopened because the user read their sensor on a phone. They are frequently thrown away while the sensors are kept.",
    },
    {
      q: "Some of my boxes have been opened. Does that matter?",
      a: "It does. An opened box cannot be resold, because nobody downstream can verify how it was stored once the seal was broken. Set those aside rather than sending them.",
    },
    {
      q: "I have a hundred or more pieces. Is that handled differently?",
      a: "Yes. A lot that size is a bulk enquiry rather than an individual sale, mixed generations and dates are expected, and nothing needs sorting first. Start on the bulk page.",
    },
  ],
}
