import type { RegistryPost } from "./types"

/**
 * "What diabetic supplies buyers do not buy" — the negative-space answer that
 * catches searches like "do you buy opened test strips", "do buyers take
 * expired test strips", "sell insulin", "sell lancets", "sell glucose meter".
 *
 * The structure is answer-first: a direct list of what is not bought and why,
 * then the two named exceptions to the expired rule, then what IS bought to
 * close positively.
 *
 * Product claims are grounded in what the existing posts and the legal page
 * already assert — no new product claims introduced.
 *
 * No dollar figures, no program names, no personal byline, American spelling.
 */
export const whatDiabeticSuppliesBuyersDoNotBuy: RegistryPost = {
  slug: "what-diabetic-supplies-buyers-do-not-buy",
  title: "What Diabetic Supplies Buyers Do Not Buy",
  description:
    "Opened boxes, expired test strips, insulin, lancets, and pharmacy-labeled packaging — a plain list of what is rejected and why, plus the two narrow exceptions.",
  datePublished: "2026-11-05",
  dateModified: "2026-11-05",
  bodyHtml: `
<p>Buyers in this category have a short list of things they will not take,
and knowing the list before you pack anything saves time on both sides. The
rejections fall into a few categories: condition problems, expiration,
specific product types with no resale market, and supplies that came through
a funding route that puts them out of play regardless of condition.</p>

<h2>Opened or unsealed boxes</h2>

<p>Not accepted at any price. Once the original seal on a box or vial is
broken, there is no way to verify the strip count, the storage conditions,
or how long the contents have been exposed. An opened box is a rejected box,
regardless of brand, date, or how recently the box was filled. Leave every
box sealed until the transaction is complete.</p>

<h2>Damaged, water-stained, or torn packaging</h2>

<p>The packaging is part of what is being sold. A box that is visibly wet,
crushed, or has a torn window or missing end panels is rejected on sight.
Normal wear on an outer shipping carton is fine; damage to the product box
itself is not. If there is any doubt, photograph the boxes before shipping
and ask.</p>

<h2>Short-dated stock</h2>

<p>Most buyers require at least six months of shelf life remaining on the
expiration date. A box that is technically in date but expires in a month
or two has a limited resale window, and many buyers will not take it or
will significantly discount it. Check the printed date before getting a
quote — a rough description without the date will not produce a reliable
number.</p>

<h2>Expired test strips</h2>

<p>Not accepted. The enzyme coating on test strips degrades after the
expiration date, which means a strip past its date produces an inaccurate
reading rather than simply a less precise one. There is no buyer market for
expired strips, and there should not be — the issue is accuracy, not
preference.</p>

<p>There are two named exceptions to the expired rule, and only two:</p>

<ul>
<li><strong>Sealed expired Omnipod pods</strong> — applies to Omnipod 5,
DASH, and Classic. These are bought at a reduced rate past their date.</li>
<li><strong>Sealed expired Dexcom G7 sensors</strong> — also bought at a
reduced rate past their date.</li>
</ul>

<p><strong>Expired Dexcom G6 sensors do not qualify.</strong> That
distinction is worth knowing precisely, because the G6 and G7 are often
treated as interchangeable when they are not. A box of G6 sensors with a
passed date has no buyer. A box of G7 sensors in the same situation does.
The <a href="/blog/do-diabetic-test-strips-expire">expiry guide</a> covers
this in full, including the storage and condition rules that still apply to
expired pods and G7 sensors.</p>

<h2>Supplies from a government-covered program</h2>

<p>Supplies obtained through a government-covered program cannot be resold.
The restriction is about how the supplies were funded, not about their
condition. A sealed, in-date box that arrived through a government-covered
program is out of play regardless of anything else. If you are unsure how
your supplies were paid for, check your plan documents or ask the dispensing
pharmacy before contacting a buyer. The
<a href="/is-it-legal-to-sell-diabetic-test-strips">legality guide</a>
covers this rule in full.</p>

<h2>Insulin and refrigerated medication</h2>

<p>Not bought. Insulin requires maintained cold-chain handling from
manufacture through dispensing, and there is no way for a private buyer to
verify that it has been stored correctly throughout its time in someone's
possession. The same applies to any medication requiring refrigeration. No
buyer in this space handles insulin — sealed, unexpired, or otherwise.
This is a firm line, not a negotiable one.</p>

<h2>Lancets</h2>

<p>Not bought. Lancets are inexpensive, single-use, and carry no resale
value. Do not include them in a lot or ship them alongside test strips —
they add weight without adding anything to the quote, and some buyers will
not accept a shipment that contains them.</p>

<h2>Glucose meters</h2>

<p>Usually not. A glucose meter is typically bundled with a starter kit for
a specific brand's test strips, and the meter itself is not what the buyer
market is paying for. Most opened meters have no value on the resale side.
If you have a meter that has never been opened — still in sealed
manufacturer packaging — it is worth asking about, but do not assume it
adds to the quote.</p>

<h2>Pharmacy labels and prescription stickers</h2>

<p>This one is case by case. A pharmacy label or prescription sticker that
peels cleanly without leaving adhesive residue or tearing the box may not
be a disqualifying problem. A sticker applied over the lot number or
expiration date, or one that tears the box art when removed, is harder to
work around. If a box has a label on it, describe the situation when you
ask for a quote rather than shipping it and finding out on the other end.</p>

<h2>What IS bought</h2>

<p>The active buyer market covers the major continuous glucose monitor
sensor lines and the leading blood glucose meter brands. Specifically:
<strong>Dexcom G6 and G7</strong>, <strong>Freestyle Libre 2 and
Libre 3</strong>, <strong>Omnipod 5 and DASH pods</strong>,
<strong>OneTouch</strong>, <strong>Contour</strong>,
<strong>Accu-Chek</strong>, and <strong>True Metrix</strong>. Sealed,
in-date boxes in any of those lines are worth a quote.</p>

<p>If you have boxes from that list and want to know whether they qualify,
the fastest route is to photograph the sealed boxes with the brand, lot
number, and expiration date visible and send them to
<a href="/sell-test-strips">a buyer near you</a>. Mixed brands and different
dates in a single lot are handled together rather than requiring separate
inquiries per brand. For larger lots, the
<a href="/">homepage</a> explains what the buying process looks like from
start to finish.</p>
`,
  faqs: [
    {
      q: "Do buyers take opened boxes of test strips?",
      a: "No. Once the original seal is broken there is no way to verify the count, the storage conditions, or how long the contents have been open. An opened box is not accepted at any price, regardless of brand or date.",
    },
    {
      q: "I have expired test strips. Are any of them worth something?",
      a: "Test strips themselves are not bought once expired. The two exceptions to the expired rule are sealed expired Omnipod pods — which applies to Omnipod 5, DASH, and Classic — and sealed expired Dexcom G7 sensors. Both are bought at a reduced rate. Expired Dexcom G6 sensors do not qualify.",
    },
    {
      q: "Can I sell leftover insulin?",
      a: "No. Insulin requires continuous cold-chain handling that a private buyer cannot verify, and no buyer in this category accepts insulin regardless of condition. This applies to any medication requiring refrigeration.",
    },
    {
      q: "What about lancets and glucose meters?",
      a: "Lancets are not bought — they have no resale value and should not be included in a shipment. Most opened glucose meters are in the same position. An unopened, sealed meter in its original manufacturer packaging may be worth asking about, but it is not a given.",
    },
    {
      q: "My boxes have pharmacy labels on them. Does that disqualify them?",
      a: "Not automatically. A label that peels cleanly without residue or tearing may not be a problem. A label placed over the lot number or expiration date, or one that damages the box when removed, is harder to accept. Describe the situation when you ask for a quote rather than assuming either way.",
    },
    {
      q: "What brands are actually bought?",
      a: "The main ones are Dexcom G6 and G7, Freestyle Libre 2 and 3, Omnipod 5 and DASH, OneTouch, Contour, Accu-Chek, and True Metrix. Sealed, in-date boxes in any of those lines qualify for a quote.",
    },
  ],
}
