import type { RegistryPost } from "./types"

/**
 * "Started on a pump or a CGM and stopped fingersticking" — the therapy-change
 * moment. Distinct from the insurance post (nobody changed the plan) and from
 * the CGM-switch post (this is strips being left behind, not sensors).
 */
export const switchedToInsulinPump: RegistryPost = {
  slug: "started-a-pump-or-cgm-leftover-test-strips",
  title: "Started a Pump or CGM? What to Do With the Leftover Test Strips",
  description:
    "Moving to a pump or continuous monitor usually leaves months of unopened strips behind. What is still worth something, what is not, and what to check first.",
  datePublished: "2026-10-15",
  dateModified: "2026-10-15",
  bodyHtml: `
<p>Nobody starts a pump or a continuous monitor with an empty cupboard. The
prescriptions were arriving on a schedule, that schedule did not stop the moment
the new device arrived, and fingersticking drops away sharply once a sensor is
doing the work.</p>

<p>What is left is usually months of unopened strips, and unlike most things in
this category they are still perfectly good. They are simply not needed any
more.</p>

<h2>Check before you clear the lot</h2>

<p>Most people on a CGM still keep some strips for confirming a reading that
looks wrong, for calibration where the system asks for it, and for the days a
sensor fails early. Keep a box or two back. Clearing every strip in the house on
day one is the one version of this people regret.</p>

<h2>What is worth selling</h2>

<p>Sealed, unopened and in date. That is the test, and strips are unusual in
this category in that the value drops steadily as the date approaches rather
than at a cliff edge — so the boxes are worth more now than they will be in six
months, and worth nothing at all once the date passes.</p>

<p>Which is the practical argument for not leaving them in a drawer "in case".
If a genuine reason to go back to fingersticking arrives in a year, the boxes in
the drawer will have expired anyway.</p>

<h2>The parts people forget</h2>

<p>A therapy change leaves more than strips behind, and the rest is thrown away
far more often:</p>

<ul>
<li><strong>Unopened meters and starter kits.</strong> Frequently still boxed,
because they arrived free with a prescription.</li>
<li><strong>Lancets and lancing devices</strong>, unopened.</li>
<li><strong>Control solution</strong>, if unopened and in date.</li>
<li>On the CGM side, <strong>transmitters and receivers</strong> from an older
system — G6 used a separate transmitter, and receivers often stay boxed because
people read their sensor on a phone.</li>
</ul>

<h2>What will not be bought</h2>

<p>Anything opened, for the same reason as always: once a seal is broken nobody
downstream can verify how it was stored. Expired strips, which give inaccurate
readings and should not be resold by anybody. And supplies obtained through
Medicare or Medicaid, which cannot be resold regardless of condition — a rule
about the funding route rather than about you.</p>

<p>The two exceptions on dates are worth repeating because they come up in
exactly this situation: expired Omnipod pods and expired Dexcom G7 sensors still
hold value at a reduced rate. Expired Dexcom G6 sensors do not.</p>

<h2>Where to take it</h2>

<p>Photograph the sealed boxes with the dates and lot numbers visible first, and
keep the photographs until payment lands. Do not open a box to photograph what
is inside.</p>

<p>The <a href="/sell-test-strips">state pages</a> show who is nearest to you.
A long-running prescription can leave a surprising amount behind, and if it
comes to a hundred pieces or more the
<a href="/sell-test-strips-in-bulk">bulk page</a> is the better route.</p>
`,
  faqs: [
    {
      q: "I still test occasionally. Should I sell everything?",
      a: "No. Keep a box or two for confirming an odd reading, for calibration if your system asks for it, and for a sensor that fails early. Sell the surplus rather than the lot.",
    },
    {
      q: "Is it worth holding onto them in case I go back to fingersticking?",
      a: "Rarely. Strips lose value steadily as the date approaches and are worth nothing once it passes, so a box kept for a hypothetical year from now will most likely expire in the drawer.",
    },
    {
      q: "What about the meter itself?",
      a: "An unopened meter or starter kit is worth asking about. Ones that have been used are not, but they arrive free with prescriptions often enough that plenty are still boxed.",
    },
    {
      q: "My supplies came through Medicare. Can I sell them?",
      a: "No. Supplies obtained through Medicare or Medicaid cannot be resold. The rule is about how they were funded rather than about you, and nobody is asked to prove how a box came into their possession.",
    },
    {
      q: "Does it matter that the boxes are different brands?",
      a: "Not at all. A long prescription history usually produces a mixed cupboard, and mixed brands are normal. Nothing needs sorting by brand before you get a figure.",
    },
  ],
}
