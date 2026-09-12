import type { Metadata } from 'next'
import Link from 'next/link'
import { buildFaqPageSchema } from '@/lib/schema'
import { JsonLd } from '@/app/components/JsonLd'
import { OWNER_PHONE } from '@/lib/owner'

export const metadata: Metadata = {
  title: 'Is It Legal to Sell Diabetic Test Strips? US Guide',
  description:
    'Yes — selling unopened diabetic test strips you own is legal in all 50 states. The rules on sealed boxes, expiration, and how supplies were paid for.',
  alternates: { canonical: 'https://cash4teststripsusa.com/is-it-legal-to-sell-diabetic-test-strips' },
}

const FAQS = [
  {
    q: 'Is it legal to sell diabetic test strips?',
    a: 'Yes. Selling unopened, unexpired diabetic test strips you personally own is legal in the United States. The supplies must be sealed in their original boxes and must not have been paid for by a government-covered program.',
  },
  {
    q: 'Is selling diabetic test strips legal in all 50 states?',
    a: 'Yes. No state prohibits the private sale of sealed, personally owned diabetic test strips. The requirement is the same nationwide: the boxes are yours, they are unopened, and they were not supplied through a government-covered program.',
  },
  {
    q: 'Can you sell diabetic test strips that private insurance paid for?',
    a: 'Yes. Supplies obtained through a private or employer-sponsored plan are your property once they are dispensed to you, so you can sell what you no longer need. The restriction applies only to supplies paid for by a government-covered program.',
  },
  {
    q: 'What if I am not sure how my supplies were paid for?',
    a: 'Check the Explanation of Benefits from your plan or ask the pharmacy that filled the order. If any part of the cost was covered by a government-covered program, those boxes cannot be resold. When you are unsure, ask before you sell.',
  },
  {
    q: 'Can I sell opened boxes of test strips?',
    a: 'No. Buyers require original, sealed packaging. There is no way to verify the count, storage, or expiration of strips from a box that has been opened, so opened boxes are not accepted.',
  },
  {
    q: 'Can I sell expired test strips?',
    a: `Usually no. Expired test strips have no buyer market, and most buyers want at least six months of shelf life left. The exceptions are sealed expired Omnipod pods and sealed expired Dexcom G7 sensors, which do have buyers. If you are holding either one, text a photo of the boxes to ${OWNER_PHONE} and you will get a straight answer.`,
  },
  {
    q: 'Can you sell diabetic test strips on eBay?',
    a: 'Usually not. eBay restricts listings for medical test strips, and listings are often removed after they go up. The usual route is a direct buyer who takes sealed boxes without a public listing, which is also faster than waiting on an auction.',
  },
  {
    q: 'Can a caregiver or estate executor sell on behalf of someone else?',
    a: 'Yes. Caregivers, family members, and executors clearing an estate can sell supplies left behind, provided the boxes are sealed and were not supplied through a government-covered program.',
  },
]

export default function IsItLegalPage() {
  const faqSchema = buildFaqPageSchema(FAQS.map((f) => ({ question: f.q, answer: f.a })))
  const phoneHref = `tel:${OWNER_PHONE.replace(/[^0-9]/g, '')}`

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
      <JsonLd data={faqSchema} />

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Is It Legal to Sell Diabetic Test Strips?</h1>

      <p className="text-gray-600 leading-relaxed mb-6">
        Yes. Selling unopened, unexpired diabetic test strips you personally own is legal in all 50
        states. The supplies must be your own property, sealed in their original boxes, and not paid
        for by a government-covered program. Meet those three conditions and a private sale is a
        normal, lawful transaction.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 not-prose">
        <p className="text-sm text-amber-900 leading-relaxed">
          <strong>General Information, Not Legal Advice:</strong> This page provides general information only. Laws can vary and change — if you have specific concerns about your situation, consult a licensed attorney in your state.
        </p>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Is it illegal to sell diabetic test strips?</h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        No, not when the boxes are yours. A sale crosses the line in three situations, and each one
        is easy to check before you contact anyone.
      </p>
      <p className="text-gray-600 leading-relaxed mb-4">
        The box has been opened. Once a seal is broken, the strips inside cannot be resold, because
        nobody can verify the count, the storage conditions, or the expiration of loose strips. Leave
        every box sealed until the sale is finished.
      </p>
      <p className="text-gray-600 leading-relaxed mb-4">
        The supplies were paid for by a government-covered program. This is the line that matters
        most. If a government-covered program paid for the boxes — directly or through a drug plan —
        they cannot be resold, and reselling them is treated as fraud. If you are not certain how the
        supplies were paid for, check your plan paperwork or ask your pharmacy first.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        The boxes are expired. Most buyers want at least six months of shelf life left on test
        strips, with narrow exceptions covered below.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Can you sell diabetic test strips that insurance paid for?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Yes, when the plan was a private one. Supplies dispensed to you under a private or
        employer-sponsored plan are your property, and extra boxes you will never use are yours to
        sell. The restriction is about how the supplies were paid for, not about whether you paid the
        full price yourself. Some buyers will ask you to confirm in writing that the boxes did not
        come through a government-covered program. That is standard and it protects both sides.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Can I sell expired test strips?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Usually no. Expired test strips have no real buyer market, so a box past its date is normally
        not worth shipping. There are two exceptions worth checking: sealed expired Omnipod pods and
        sealed expired Dexcom G7 sensors both have buyers. If that is what you are holding, text a
        photo of the boxes to {OWNER_PHONE} and you will get a straight yes or no before you pack
        anything.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Can you sell diabetic test strips on eBay?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        You can try, but eBay restricts listings for medical test strips and routinely removes them,
        so a listing can disappear after you have already packed the boxes. The usual route is a
        direct buyer: you describe what you have, the buyer confirms the brand and dates, and the
        sealed boxes change hands without a public listing or a waiting auction.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Does the reason you have the strips matter?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        No. The usual reasons are ordinary ones: switching to a different meter or a CGM, a
        prescription change, testing less often than the refill schedule assumed, or clearing out the
        home of a family member who has passed away. In each case the boxes belong to you, and
        selling them is your decision.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Is selling diabetic test strips legal in every state?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Yes. The federal rules above apply everywhere. A few states add resale or consumer protection
        statutes that touch medical supplies, but no state bans the private sale of sealed,
        personally owned diabetic test strips. See{' '}
        <Link href="/blog" className="text-emerald-600 hover:underline">your state&apos;s guide</Link>{' '}
        for local context.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-6 not-prose">
        {FAQS.map(({ q, a }) => (
          <div key={q}>
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">{q}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-10 not-prose">
        <p className="text-xs text-gray-500 mb-4">Not legal advice — consult an attorney with specific questions about your situation.</p>
        <div className="bg-emerald-50 rounded-xl p-6">
          <a
            href={phoneHref}
            className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
          >
            Call {OWNER_PHONE} with questions →
          </a>
        </div>
      </div>
    </div>
  )
}
