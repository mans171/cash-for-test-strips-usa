import Link from "next/link";
import type { Metadata } from "next";
import { buildArticleSchema, buildBreadcrumbSchema, buildFaqPageSchema } from "@/lib/schema";
import { JsonLd } from "@/app/components/JsonLd";

/**
 * Standalone informational post answering the "pharmacy label" question sellers
 * ask before they send or photograph sealed diabetic supply boxes.
 *
 * This is a static segment and takes precedence over the sibling [slug] dynamic
 * route — it is intentionally NOT part of the STATE_BLOG_POSTS array.
 *
 * Settled site stance (do not contradict in body or FAQ):
 *  - Leave the label on. Peeling it can tear the packaging, which is what
 *    has value.
 *  - A label does not affect the sale or the quote process; sellers do not
 *    need to remove, cover, or hide it.
 *  - Photographing with the label visible is fine.
 */

const POST_URL =
  "https://cash4teststripsusa.com/blog/pharmacy-label-on-diabetic-supply-box";
const PUBLISHED = "2026-10-01";
const MODIFIED = "2026-10-01";

export const metadata: Metadata = {
  title:
    "Pharmacy Label on the Box — Should You Remove It Before Selling Diabetic Supplies?",
  description:
    "The short answer: leave it on. Here is what is actually on that label, why peeling it can damage the packaging, and what to do when you text for a quote.",
  alternates: { canonical: POST_URL },
  openGraph: {
    title:
      "Pharmacy Label on the Box — Should You Remove It Before Selling Diabetic Supplies?",
    description:
      "Leave it on. Peeling a pharmacy label can tear the packaging — the thing that gives the box its value. Here is what sellers actually need to know.",
    type: "article",
  },
};

const FAQS = [
  {
    q: "Do I need to remove the pharmacy label before I sell my diabetic supplies?",
    a: "No. Leave the label on. Peeling it risks tearing the packaging, and an intact seal is what makes a box resellable. Most boxes that change hands carry pharmacy labels — it is completely ordinary.",
  },
  {
    q: "Can a buyer see my name and address on the label?",
    a: "Yes, if they look. Most buyers do not scrutinize the label and are not interested in it. If you would rather they not see it, you can ask the buyer how they handle labels on arrival — but do not peel it off before shipping.",
  },
  {
    q: "Will the pharmacy's reference number on the label create a problem?",
    a: "No. That reference number identifies the dispensing transaction on the pharmacy's side. It does not travel with the box in any meaningful way for a private sale, and buyers are not checking it.",
  },
  {
    q: "What if the label is already half-peeled?",
    a: "Do not pull it the rest of the way off. Leave whatever remains and mention it when you text for a quote. Whether the partial peel affected the seal is the relevant question — the label itself is not.",
  },
  {
    q: "Can I photograph the box with the label showing?",
    a: "Yes. Photographing with the label visible is fine. The buyer is looking at the brand, the lot number, and the expiration date — not your personal information. If you prefer, you can fold a small piece of paper over your name before you photograph.",
  },
  {
    q: "What should I say when I text for a quote?",
    a: "Brand, quantity, and expiration date. You do not need to mention the label at all — it is not relevant to the quote. Text 518-278-6008 with those three things and you will get a number back.",
  },
  {
    q: "The label has a person's name on it, and that person has passed away. Is that a problem?",
    a: "Ordinarily, no — a label with a relative's name on it is normal and rarely an issue. The questions that matter are whether the packaging is sealed and whether the supplies were obtained through a government-funded program. When you text for a quote, the buyer will let you know if they need anything else. Text 518-278-6008.",
  },
  {
    q: "What actually matters about the box's condition?",
    a: "The factory seal must be intact and the box must be unopened. Expiration dates matter too — check the printed date on the box. The pharmacy label is a separate thing from the factory seal and does not determine the box's condition.",
  },
];

export default function PharmacyLabelPost() {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd
        data={buildArticleSchema({
          headline:
            "Pharmacy Label on the Box — Should You Remove It Before Selling Diabetic Supplies?",
          description:
            "The short answer: leave it on. Here is what is actually on that label, why peeling it can damage the packaging, and what to do when you text for a quote.",
          url: POST_URL,
          datePublished: PUBLISHED,
        })}
      />
      <JsonLd
        data={buildFaqPageSchema(FAQS.map((f) => ({ question: f.q, answer: f.a })))}
      />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: "https://cash4teststripsusa.com" },
          { name: "Blog", url: "https://cash4teststripsusa.com/blog" },
          {
            name: "Pharmacy Label on the Box",
            url: POST_URL,
          },
        ])}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-emerald-600">
          Home
        </Link>
        {" / "}
        <Link href="/blog" className="hover:text-emerald-600">
          Blog
        </Link>
        {" / "}
        <span className="text-gray-700">Pharmacy Label on the Box</span>
      </nav>

      {/* Hero */}
      <header className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-4 leading-tight">
          Pharmacy Label on the Box — Should You Remove It Before Selling?
        </h1>
        <p className="text-gray-500 text-sm mb-6">Published October 2026</p>
        <p className="text-lg text-gray-600 leading-relaxed">
          If you have sealed boxes of diabetic supplies sitting in a drawer — left over after
          switching devices, an insurance change, or clearing out a loved one&apos;s home — you
          have probably noticed the sticker on the side. It has a name, an address, and a string
          of pharmacy codes on it. And now you are wondering whether you need to deal with it
          before you sell.
        </p>
        <p className="text-lg text-gray-600 leading-relaxed mt-4">
          The short answer is: leave it alone.
        </p>
      </header>

      {/* Inline CTA */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Ready to get a quote?</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Text us the brand, quantity, and expiration date. No photos needed to start.
          </p>
        </div>
        <a
          href="sms:5182786008"
          className="shrink-0 bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full hover:bg-emerald-700 transition-colors text-sm"
        >
          Text 518-278-6008
        </a>
      </div>

      <div className="space-y-8 text-gray-700 leading-relaxed">

        {/* Section 1 */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
            What is actually on that label
          </h2>
          <p>
            A pharmacy label typically carries your name, your address, the dispensing date, the
            pharmacy&apos;s name and phone number, directions for use, and the pharmacy&apos;s
            internal reference number for the transaction. None of that information is secret in
            any formal sense — it is the same information on any prescription bag — but it is
            understandably personal.
          </p>
          <p className="mt-3">
            Here is the thing: buyers of sealed diabetic supplies are looking at the brand, the
            lot number, and the expiration date. They are not studying the sticker. The label is
            an ordinary feature of almost every box that changes hands. If it gave buyers pause,
            the whole secondary market would grind to a stop, because nearly every box carries one.
          </p>
        </section>

        {/* Section 2 */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
            Why peeling it is the wrong move
          </h2>
          <p>
            The instinct to remove the label is understandable, but the risk is real. Pharmacy
            labels are designed to adhere well — that is the point. When you try to peel one off
            a cardboard box, you are as likely to pull up a layer of the box surface as you are
            to get a clean peel. Once that happens, the packaging is visibly damaged.
          </p>
          <p className="mt-3">
            An intact, factory-sealed box in good condition is what has value. A box with a torn
            or scuffed surface — even if the seal underneath is still intact — raises questions
            about handling. The same goes for residue left by an adhesive. None of that makes
            a box worthless, but it is an unnecessary complication you introduce by trying to
            fix something that was not a problem.
          </p>
          <p className="mt-3">
            Leave the label on. It is part of the box now, and that is fine.
          </p>
        </section>

        {/* Section 3 */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
            Photographing the box with the label showing
          </h2>
          <p>
            When you are preparing to get a quote — whether you are using our{" "}
            <Link href="/sell" className="text-emerald-600 font-semibold hover:underline">
              quick sell form
            </Link>{" "}
            or just sending a text — you do not need to hide the label. The buyer is reading
            the brand name, the item description, and the expiration date. Photographing with
            the label visible is completely fine.
          </p>
          <p className="mt-3">
            If you genuinely prefer that your name not be visible in a photo, you can fold a
            small piece of paper over just that part before you take the picture. You do not
            need to cover the lot number or the expiration date — those are the fields the
            buyer needs to see. And do not hold your thumb over the label; it tends to obscure
            more than you intend.
          </p>
          <p className="mt-3">
            For mail-in sales, there is no photograph step after packing — the buyer receives
            the box as shipped. The label travels with it. That is expected and normal.
          </p>
        </section>

        {/* Section 4 */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
            The privacy concern in context
          </h2>
          <p>
            It is worth being honest about what the label actually exposes. Your name and address
            are on it — but your name and address appear on a lot of things that leave your house:
            return labels, packages, junk mail. A buyer receiving a box of sealed diabetic supplies
            is not building a profile on you.
          </p>
          <p className="mt-3">
            If you are using a reputable buyer — one who quotes in writing before you ship and
            has a clear process — the label on the box is the least of your concerns. The things
            worth checking are whether the quote is locked in before you ship, whether the
            payment method works for you, and whether the packaging stays sealed until it arrives.
            Our{" "}
            <Link href="/mail-in-kit" className="text-emerald-600 font-semibold hover:underline">
              mail-in guide
            </Link>{" "}
            covers those steps.
          </p>
          <p className="mt-3">
            If you would feel better asking a specific buyer how they handle labels and personal
            information after a sale, that is a reasonable question to ask. A straightforward
            buyer will give you a straightforward answer.
          </p>
        </section>

        {/* Section 5 */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
            What if the label is already half-peeled?
          </h2>
          <p>
            Stop where you are and do not pull it the rest of the way. The relevant question is
            not the label — it is whether the underlying seal is still intact. If the factory
            seal on the box is still closed, the supplies are still resellable, and the partial
            peel is a cosmetic issue you mention when you text for a quote. If the seal has been
            compromised, that is a different conversation.
          </p>
          <p className="mt-3">
            When you reach out, just describe the situation honestly: the label started to come
            off, the seal looks intact, here is the brand and date. A buyer who has been doing
            this for any length of time has seen it before.
          </p>
        </section>

        {/* Section 6 — What to send when texting */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
            What to say when you text for a quote
          </h2>
          <p>
            You do not need to mention the label at all. A quote comes down to three things:
          </p>
          <ol className="list-decimal pl-6 mt-3 space-y-2">
            <li>The brand (Dexcom, FreeStyle Libre, Contour Next, Omnipod, etc.)</li>
            <li>The quantity (how many boxes, and the count per box if it is a strip box)</li>
            <li>The expiration date printed on the box</li>
          </ol>
          <p className="mt-4">
            That is it. Text those three things to{" "}
            <a
              href="sms:5182786008"
              className="text-emerald-600 font-semibold hover:underline"
            >
              518-278-6008
            </a>{" "}
            and you will get a number back. The label never comes up unless the seal underneath
            it is in question — which, as covered above, is its own separate thing.
          </p>
        </section>

        {/* Section 7 — Estate / relative's name */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
            The label has someone else&apos;s name on it
          </h2>
          <p>
            This comes up often when a family member is clearing out a home after a death, or
            after a parent moves into a care facility. The boxes have a relative&apos;s name on
            the label, and there is an understandable worry that this creates some kind of
            complication.
          </p>
          <p className="mt-3">
            In most cases it does not — a label with another person&apos;s name on it is ordinary
            and rarely an issue. The questions buyers care about are whether the packaging is sealed
            and whether the supplies were obtained through a government-funded program — not whose
            name appears on the sticker. Those two questions are worth being clear on before you
            sell; the name on the label is not. When you text for a quote, the buyer will let you
            know if they need anything further.
          </p>
          <p className="mt-3">
            You do not need to explain how you came to have the supplies, and you will not be
            asked to.
          </p>
        </section>

        {/* Section 8 — The thing that actually matters */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
            The things that actually determine whether a box has value
          </h2>
          <p>
            To summarize what matters and what does not:
          </p>

          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
              <p className="font-bold text-gray-900 text-sm mb-2">What matters</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                  Factory seal is intact and the box is unopened
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                  Expiration date printed on the box
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                  Brand and item type (strips, CGM sensors, pods)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                  How the supplies were originally obtained
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
              <p className="font-bold text-gray-900 text-sm mb-2">What does not matter</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5 shrink-0">✕</span>
                  The pharmacy label
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5 shrink-0">✕</span>
                  Whose name is on the sticker
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5 shrink-0">✕</span>
                  The pharmacy&apos;s reference number
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5 shrink-0">✕</span>
                  How long you have had the boxes
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
            Questions we hear from sellers
          </h2>
          <div className="space-y-6">
            {FAQS.map((f) => (
              <div key={f.q}>
                <h3 className="font-bold text-gray-900 mb-1">{f.q}</h3>
                <p className="text-gray-600 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="mt-14 bg-emerald-700 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Ready to get a quote?</h2>
        <p className="text-emerald-100 text-sm mb-6">
          Text us the brand, quantity, and expiration date. Leave the label on.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="sms:5182786008"
            className="bg-white text-emerald-700 font-semibold px-8 py-3 rounded-full hover:bg-emerald-50 transition-colors"
          >
            Text 518-278-6008
          </a>
          <Link
            href="/sell"
            className="border border-emerald-400 text-white font-semibold px-8 py-3 rounded-full hover:bg-emerald-600 transition-colors"
          >
            Start a quote online
          </Link>
        </div>
      </div>

      {/* Footer links */}
      <div className="mt-10 pt-8 border-t border-gray-100">
        <p className="text-sm text-gray-500 mb-3">More from the blog</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/blog"
            className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
          >
            All guides →
          </Link>
          <Link
            href="/mail-in-kit"
            className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
          >
            Mail-in kit →
          </Link>
          <Link
            href="/is-it-legal-to-sell-diabetic-test-strips"
            className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors"
          >
            Is it legal? →
          </Link>
        </div>
      </div>
    </article>
  );
}
