import type { RegistryPost } from "./types"
import { OWNER_PHONE } from "../owner"

/**
 * "Pharmacy label on the box — should you remove it before selling?"
 *
 * Seller question: there is a sticker with my name on it; does it need to
 * come off before I text for a quote, photograph the box, or ship?
 *
 * Site stance (do not contradict anywhere in body or FAQs):
 *  - Leave the label on. Peeling it risks tearing the packaging, which is
 *    what has value.
 *  - A label is ordinary and rarely an issue. When the seller texts, the
 *    buyer will let them know if they need anything further.
 *  - Photographing with the label visible is fine.
 *
 * Hard content rules in effect:
 *  - No dollar figures or prices anywhere.
 *  - No expiration / date-condition language.
 *  - No description of what buyers look at, check, evaluate, or verify —
 *    seller logistics only (see PR feedback from 2026-09-20).
 *  - No government program names.
 *  - No "insulin", "prescription", "Rx" as selling terms.
 *  - American spelling throughout.
 *  - No personal-name byline.
 *
 * Internal links: /blog/how-to-photograph-diabetic-supply-boxes-for-a-quote,
 *   /mail-in-kit, /sell-test-strips.
 */
export const pharmacyLabelOnBox: RegistryPost = {
  slug: "pharmacy-label-on-diabetic-supply-box",
  title: "Pharmacy Label on the Box — Should You Remove It Before Selling?",
  description:
    "Leave it on. Peeling a pharmacy label risks tearing the packaging that gives the box its value. Here is what sellers need to know before texting a photo for a quote.",
  datePublished: "2026-10-01",
  dateModified: "2026-10-01",
  bodyHtml: `
<p>If you have sealed boxes of diabetic supplies and there is a pharmacy
sticker on the side — your name, your address, a string of codes — you may
be wondering whether you need to deal with it before you sell or photograph
the box. You do not. Leave it on.</p>

<h2>What is actually on that label</h2>

<p>A pharmacy label typically carries your name, your address, the dispensing
date, the pharmacy's name and phone number, directions for use, and the
pharmacy's internal reference number for the transaction. None of that
information is secret in any formal sense — it is the same kind of
information you would find on any pharmacy bag — but it is understandably
personal.</p>

<p>The label is an ordinary feature of almost every box that changes hands.
Nearly every box that goes through a resale comes with one. It does not need
to be treated as a problem to solve before you reach out for a quote.</p>

<h2>Why peeling it is the wrong move</h2>

<p>The instinct to remove the label is understandable, but the risk is real.
Pharmacy labels are designed to adhere well — that is the point. When you
try to peel one off a cardboard box, you are as likely to pull up a layer of
the box surface as you are to get a clean peel. Once that happens, the
packaging is visibly damaged.</p>

<p>A box in good original condition is what has value. A box with a torn or
scuffed surface — even if the packaging underneath is undamaged — raises
questions about handling. The same goes for adhesive residue left behind by a
partial peel. None of that makes a box worthless, but it is an unnecessary
complication you create by trying to fix something that was not a problem.</p>

<p>Leave the label on. It is part of the box now, and that is fine.</p>

<h2>Photographing the box with the label showing</h2>

<p>When you send photos for a quote, photograph the box as-is. You do not need
to hide or cover the label. The
<a href="/blog/how-to-photograph-diabetic-supply-boxes-for-a-quote">photo
guide</a> walks through the six shots you need — front of every box, the side
panel, the whole lot together, and any stickers or damage — and explains what
each one needs to show. It takes under two minutes.</p>

<p>If you genuinely prefer that your name not appear in the photo, fold a
small piece of paper over just the label area before you shoot. Do not cover
the printed panels of the box itself, and do not hold your thumb over the
sticker — you will obscure more than you intend.</p>

<p>For mail-in sales, there is no photograph step after you have packed the
box. The label travels with it. That is expected and normal.</p>

<h2>The privacy concern in context</h2>

<p>It is worth being honest about what the label actually exposes. Your name
and address are on it — but they appear on a lot of things that leave your
house: return labels, packages, junk mail. A buyer receiving sealed boxes is
not building a profile on you.</p>

<p>If you are using a reputable buyer — one who quotes before you ship and has
a clear process — the label is the least of your concerns. The things worth
checking are whether the quote is confirmed before anything ships, whether the
payment method works for you, and whether the packaging arrives undamaged.
The <a href="/mail-in-kit">mail-in guide</a> covers those steps.</p>

<p>If you would like to know how a specific buyer handles labels and personal
information after a sale, that is a reasonable question to ask. A
straightforward buyer will give you a straightforward answer.</p>

<h2>What if the label is already half-peeled?</h2>

<p>Stop where you are and do not pull it the rest of the way. Describe the
situation when you text and send your photos as-is: the label started to come
off, here is the brand, sending photos now. A buyer who has been doing this
for any length of time has seen it before and will let you know what it means
for the quote.</p>

<h2>Sending photos for a quote</h2>

<p>Text a photo of the boxes to <strong>${OWNER_PHONE}</strong> and you will
get a quote back by text. You do not need to mention the label separately —
just photograph the box as-is and the sticker will be visible in the shot.
The
<a href="/blog/how-to-photograph-diabetic-supply-boxes-for-a-quote">photo
guide</a> shows exactly what to capture and how to frame each shot.</p>

<p>If you are outside a local pickup area, the
<a href="/mail-in-kit">mail-in kit</a> covers what happens after you receive
a quote — prepaid label, packing, and payment terms before anything ships.</p>

<h2>The label has someone else's name on it</h2>

<p>This comes up often when a family member is clearing out a home after a
death, or after a parent moves into a care facility. The boxes have a
relative's name on the label, and there is an understandable worry that this
creates some kind of complication.</p>

<p>In most cases it does not — a label with another person's name is ordinary
and rarely an issue. When you text for a quote, the person you reach will let
you know if they need anything further. You do not need to explain how you
came to have the supplies, and you will not be asked to.</p>
`,
  faqs: [
    {
      q: "Do I need to remove the pharmacy label before I sell my diabetic supplies?",
      a: "No. Leave the label on. Peeling it risks tearing the packaging, and a box with damaged outer packaging is a complication you create unnecessarily. The label is an ordinary feature of almost every box that changes hands.",
    },
    {
      q: "Can a buyer see my name and address on the label?",
      a: "Yes, if they look. If you would rather they not see your name, ask when you text how labels are handled after a sale. But do not peel the label off before shipping — the risk of tearing the box is real, and the label itself is not the problem.",
    },
    {
      q: "Will the pharmacy's reference number on the label cause a problem?",
      a: "No. That number identifies the dispensing transaction on the pharmacy's side. It does not follow the box in any way that matters for a private sale, and you are not asked about it.",
    },
    {
      q: "What if the label is already half-peeled?",
      a: "Stop, and do not pull it the rest of the way. Describe the situation when you text — the label started coming off — and send your photos as-is. A buyer who has done this for any length of time has seen partial labels before.",
    },
    {
      q: "Can I photograph the box with the label showing?",
      a: "Yes. Photograph the box as-is. If you would rather your name not appear in the photo, fold a small piece of paper over just the label area before you shoot — but do not cover the box's printed panels. The photo guide walks through all six shots.",
    },
    {
      q: "Can I cover my name with a marker or tape before I ship?",
      a: "Do not write on the box or tape over it. Writing can raise questions about the box's handling; tape can damage the surface when removed. If privacy is the concern, ask the buyer when you text how labels are handled after a purchase — that is the right question, not something to solve by altering the box.",
    },
    {
      q: "The label has a relative's name on it and that person has passed away. Does that create a problem?",
      a: "In most cases, no — a label with a relative's name is ordinary and rarely an issue. When you text for a quote, the person you reach will let you know if they need anything further. You will not be asked to explain how you came to have the supplies.",
    },
  ],
}
