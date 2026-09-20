import type { RegistryPost } from "./types"
import { OWNER_PHONE } from "../owner"

/**
 * "How to photograph your diabetic supply boxes for a quote" — the practical
 * how-to for anyone holding sealed boxes (switched CGM, insurance changed
 * brands, estate clear-out) who is about to text a buyer.
 *
 * Structured as answer-first (AEO opening) → six shots explained → FAQ.
 * Supports the live Messenger "snap a photo of the boxes and I'll price it"
 * flow by teaching sellers exactly what to capture.
 *
 * Hard content rules in effect:
 *  - No dollar figures or prices anywhere.
 *  - No expiration / date-condition language ("unexpired", "in date", etc.).
 *  - No medical wording, government program names, or medical advice.
 *  - No personal-name byline.
 *  - American spelling throughout.
 *
 * Internal links: /sell-test-strips, /directory,
 *   /blog/what-diabetic-supplies-buyers-do-not-buy,
 *   /blog/how-to-sell-diabetic-supplies-by-mail.
 */
export const howToPhotographDiabeticSupplyBoxes: RegistryPost = {
  slug: "how-to-photograph-diabetic-supply-boxes-for-a-quote",
  title: "How to Photograph Your Diabetic Supply Boxes for a Quote",
  description:
    "Six photos take under two minutes and give any buyer everything they need to quote your boxes fast — exactly what to shoot and how to send it.",
  datePublished: "2026-09-20",
  dateModified: "2026-09-20",
  bodyHtml: `
<p>A buyer can quote your sealed boxes from photos alone — no appointment,
no waiting around. You need six shots: the front of every box with the brand
name visible, the end or side panel where the lot number is printed, one wide
shot of everything together so the count is clear, and a close-up of any
pharmacy stickers or box damage. Natural light, no flash. Send everything in
one message thread. That is the entire ask, and a buyer who has it can come
back with a number fast.</p>

<p>Here is exactly what each shot needs to show.</p>

<h2>Front of every box</h2>

<p>The front panel carries the brand name and the box quantity. Both have to
be legible before a buyer can put a number on anything. Lay each box flat and
shoot it straight on — not angled where the edge is sharp and the label is
blurry. If you have a mixed lot, each brand gets its own front shot. Same
brand, same count? One photo covers the group.</p>

<p>Dexcom G6 and G7 are separate products that buyers treat differently.
If you have both, photograph each separately so the model is clear from the
front label, not just from memory.</p>

<h2>The side or end panel with the lot number</h2>

<p>The narrow end or side panel of every box carries a lot number and other
printed details that buyers need to verify the product. Flip the box and
photograph that panel so the text is readable. You do not need to know what
each line means — just make sure it is in focus and legible.</p>

<p>This is the shot most sellers skip. "Can you send me the lot number?" is
the follow-up message that turns a two-minute quote into a two-day
back-and-forth. One extra photo ends that loop before it starts.</p>

<h2>All boxes together in one frame</h2>

<p>Lay everything out on a flat surface and shoot the full lot at once. This
is the count shot. The buyer sees the whole picture — eight Libre 3 boxes,
four Omnipod 5, two OneTouch — without having to ask you to tally it up and
retype it. Arrange them so each box face is visible, not stacked where the
ones underneath disappear. One clear wide shot replaces a paragraph of
description.</p>

<h2>Box condition: show it, do not describe it</h2>

<p>If any box has a dent, a crushed corner, a tear, or a water stain,
photograph it. Do not write a description instead of showing it. Buyers work
with imperfect packaging regularly, and most minor damage does not move the
number. What matters is that they can see exactly what is there, not that you
filtered it out for them. A crease on an outer carton is usually nothing; a
torn window or a stain that reached the box art is a different conversation.
Show it and let the buyer make the call.</p>

<h2>Pharmacy labels and stickers</h2>

<p>If a box has a pharmacy sticker on it, photograph it as-is. Do not try to
peel it before you send the photos. Buyers work with labeled packaging all the
time, and what they are evaluating is specific: whether the label covers
printed details they need, whether it damages the box art if removed, and
where exactly it was applied. None of that is something you can judge from the
outside. Show the sticker. Let the buyer evaluate it. In most cases it is not
the problem you assume it is.</p>

<h2>Lighting: window light beats everything else</h2>

<p>Flash creates glare on glossy box panels and makes the printed text
unreadable. Take your shots near a window, outside, or in a well-lit room
with no direct flash. The goal is readable print — lot numbers, brand names,
any sticker detail. A photo a buyer cannot read is not a quote; it is a
follow-up request. If the light is washing out the print, move the boxes
closer to a window before you shoot again.</p>

<h2>Send everything in one message thread</h2>

<p>Once you have the shots, send them together in a single text or message
thread with a one-line note on what you have. Something like "I have 8 Libre 3
and 4 Omnipod 5 boxes, sending photos now" is enough context. The buyer
sees the complete picture at once rather than piecing it together from messages
spread over an hour.</p>

<p>If you are texting directly, <a href="/directory">the directory</a> lists
buyers by state with contact numbers. You can also text <strong>${OWNER_PHONE}</strong>
— that number handles in-person pickups in and around Albany, New York, and
mail-in quotes for sellers anywhere in the country. If you are mailing your
boxes, the <a href="/mail-in-kit">mail-in kit form</a> is the place to start. The
<a href="/sell-test-strips">sell page</a> walks through what happens after the
photos, from the quote to the handoff.</p>

<h2>What the buyer does with your photos</h2>

<p>A buyer who receives clear shots of sealed boxes can confirm a number
without additional back-and-forth. They are looking for brand, quantity, lot
number, and condition — which is exactly what the six shots above cover. Once
they have it, everything moves: in-person buyers confirm a time and place;
mail-in buyers send a prepaid label and confirm payment terms before anything
ships. The
<a href="/blog/how-to-sell-diabetic-supplies-by-mail">mail-in guide</a> covers
that side of the process in full if you are outside a buyer's local area.</p>

<p>If you are not sure whether your specific boxes qualify — opened packaging,
certain product types, or boxes that came through a program that puts them out
of play — the
<a href="/blog/what-diabetic-supplies-buyers-do-not-buy">guide on what buyers
do not buy</a> covers the short list before you spend time on photos.</p>
`,
  faqs: [
    {
      q: "Do I need to photograph every single box, or just one of each brand?",
      a: "One clear front shot covers all boxes of the same brand and quantity. Different brands, or the same brand in different box sizes or counts, each get their own front photo. The side or end panel shot follows the same rule — one per brand is enough unless the lot numbers vary significantly.",
    },
    {
      q: "Should I remove the pharmacy label before I take the photos?",
      a: "No. Photograph the sticker as-is and let the buyer evaluate it. Buyers work with labeled boxes regularly. What they are looking at is specific — whether the label covers a printed detail they need, whether it damages the box art if removed. Show it and they will tell you what it means for the quote.",
    },
    {
      q: "My photos are a little blurry. Does that matter?",
      a: "It depends on whether the key details are still readable. A buyer needs to read the lot number on the end panel and the brand name on the front. If those are legible, a slightly soft photo will not hold up the quote. If the text is genuinely unreadable, retake that specific shot near a window with natural light and no flash.",
    },
    {
      q: "Can I send a video instead of photos?",
      a: "Photos work better. A buyer needs to pause on specific panels — the front label, the lot number, any sticker — and still images give them that without scrubbing through footage. If a particular box has unusual damage you want to show from multiple angles, a few close-up photos still tell the story more cleanly than a video.",
    },
    {
      q: "I have 30-plus boxes. Do I really need a photo of each one?",
      a: "Not individually. Group same-brand, same-count boxes and shoot each group's front panel once. The wide group shot covers the total count. If specific boxes have damage or stickers, those get a close-up. For a large lot, the goal is that the buyer can identify every brand present, read a lot number for each, and see any condition issues — that does not require 30 individual front shots.",
    },
    {
      q: "I sent the photos. What happens next?",
      a: "A buyer who has clear photos of sealed boxes can usually respond with a number the same day, often in minutes. If they need something clarified — a better angle on a lot number, a close-up of one box — they will ask for it. Once the number is agreed on, the next step is logistics: in-person buyers confirm a time and place; mail-in buyers provide a prepaid label and confirm payment terms before anything ships.",
    },
  ],
}
