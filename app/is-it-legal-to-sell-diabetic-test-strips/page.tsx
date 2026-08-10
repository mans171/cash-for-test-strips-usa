import type { Metadata } from 'next'
import Link from 'next/link'
import { buildFaqPageSchema } from '@/lib/schema'
import { JsonLd } from '@/app/components/JsonLd'

export const metadata: Metadata = {
  title: 'Is It Legal to Sell Diabetic Test Strips? US Guide',
  description:
    'Yes — selling personally owned, unopened diabetic test strips is legal across the US. Learn the rules: packaging, expiration, and Medicare/Medicaid.',
  alternates: { canonical: 'https://cash4teststripsusa.com/is-it-legal-to-sell-diabetic-test-strips' },
}

const FAQS = [
  {
    q: 'Is selling diabetic test strips legal in all 50 states?',
    a: 'Yes. Selling unused, sealed, personally owned diabetic test strips is legal in every state. The core legal requirement is the same nationwide: the supplies must not have been purchased through Medicare or Medicaid.',
  },
  {
    q: 'Can I sell strips that were paid for by private insurance?',
    a: 'Private insurance is different from Medicare or Medicaid. Strips purchased through private insurance — including employer-sponsored plans — are your property. You can sell them. Only government program purchases (Medicare Part B, Part D, Medicaid) are off-limits.',
  },
  {
    q: "What if I'm not sure whether my strips were Medicare-purchased?",
    a: 'Contact your pharmacy or check your insurance Explanation of Benefits (EOB). If any portion of the purchase was covered by Medicare or Medicaid, those strips cannot be resold. When in doubt, do not sell — ask first.',
  },
  {
    q: 'Can I sell opened boxes?',
    a: 'No. Buyers require original, sealed packaging. Opened boxes are not accepted under any circumstances.',
  },
  {
    q: 'What if my strips are close to expiring?',
    a: 'Most buyers require at least six months of remaining shelf life on test strips. Exceptions exist for certain CGM products (expired Omnipod pods and expired Dexcom G7 sensors have buyers). For test strips specifically, close-to-expired boxes significantly reduce value and may not be accepted. Call a buyer to confirm before shipping.',
  },
  {
    q: 'Can a caregiver or estate executor sell on behalf of a deceased person?',
    a: 'Yes. Estate liquidators, caregivers, and family members handling a deceased person\'s supplies can legally sell them, provided the Medicare/Medicaid rule is met and the supplies are in the required condition.',
  },
]

export default function IsItLegalPage() {
  const faqSchema = buildFaqPageSchema(FAQS.map((f) => ({ question: f.q, answer: f.a })))

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
      <JsonLd data={faqSchema} />

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Is It Legal to Sell Diabetic Test Strips?</h1>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 not-prose">
        <p className="text-sm text-amber-900 leading-relaxed">
          <strong>General Information, Not Legal Advice:</strong> This page provides general information only. Laws can vary and change — if you have specific concerns about your situation, consult a licensed attorney in your state.
        </p>
      </div>

      <p className="text-gray-600 leading-relaxed mb-6">
        Yes. Selling unused, personally owned, unopened diabetic test strips is legal throughout the
        United States. It is not a Medicare or Medicaid fraud issue when the strips are legitimately
        yours — that is, when they were not purchased using government insurance. What you do with
        your own property is your decision, and selling unused medical supplies you no longer need
        has a clear, established market in every state.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        That said, there are rules. Getting them right is straightforward.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">What makes a sale legal</h2>
      <p className="text-gray-600 leading-relaxed mb-4">Three conditions determine whether a sale is clean:</p>
      <p className="text-gray-600 leading-relaxed mb-4">
        The strips must be in their original, sealed packaging. Once a box has been opened, the
        strips inside cannot be resold. Buyers have no way to verify the condition, count, or
        expiration of individual strips from an opened box, and no legitimate buyer will accept them.
        Keep the box sealed until the transaction is complete.
      </p>
      <p className="text-gray-600 leading-relaxed mb-4">
        The strips must not have been purchased through Medicare or Medicaid. This is the critical
        legal line. If Medicare or Medicaid paid for the supplies — directly or through a Part D plan
        — those supplies cannot legally be resold. Selling government-purchased medical supplies is
        considered fraud. If you&apos;re not certain how your strips were paid for, check your insurance
        documentation or ask your pharmacy before trying to sell.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        The strips should not be expired. Most buyers require at least six months of remaining shelf
        life. There are exceptions — certain products like expired Omnipod pods and expired Dexcom G7
        sensors do have a secondary market — but expired test strips generally do not. Check the
        expiration date on your boxes before reaching out to a buyer.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Does the reason you have the strips matter?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        No. Common, completely legitimate reasons people sell include: switching to a different meter
        or CGM, a doctor changing a prescription, a diabetes management routine that required fewer
        strips than expected, and handling the estate of a family member who has passed away. In all
        of these cases, the strips belong to you, and selling them is your right.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Is there a legal gray area?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        The Medicare/Medicaid rule is where sellers most often run into problems, and it is the area
        where you should be careful. &quot;I didn&apos;t know they were Medicare-paid&quot; is not a defense. The
        rest of the transaction — the actual exchange of sealed, personally owned supplies for cash —
        is a standard private-party sale with no unusual legal complexity. Some buyers will ask you to
        confirm, in writing, that the strips were not obtained through Medicare or Medicaid. This is
        standard practice and protects both parties.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Do laws differ by state?</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        The federal rules above apply everywhere. Some states have additional resale or consumer
        protection statutes that apply to medical supplies, but no state prohibits the private sale of
        personally owned, unused diabetic test strips. See{' '}
        <Link href="/blog" className="text-emerald-600 hover:underline">your state&apos;s guide</Link>{' '}
        for any relevant local context.
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
            href="tel:5187799751"
            className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
          >
            Call 518-779-9751 with questions →
          </a>
        </div>
      </div>
    </div>
  )
}
