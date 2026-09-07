import type { Metadata } from 'next'
import Link from 'next/link'
import { BulkEnquiryForm } from './BulkEnquiryForm'
import { OWNER_PHONE, BULK_MIN_PIECES } from '@/lib/owner'

// Written for a RESELLER, not a consumer. Every other page on this site
// assumes someone found a relative's cupboard; this one assumes a business
// with stock it needs to move. Different worry, different search, different
// page. No dollar figures anywhere - a standing rule, and also what every
// competitor with a bulk page does (they promise a rate and make you ask).

const PAGE_URL = 'https://cash4teststripsusa.com/sell-test-strips-in-bulk'

export const metadata: Metadata = {
  title: 'Sell Diabetic Test Strips in Bulk | Cash For Test Strips USA',
  description:
    'We buy sealed diabetic test strips and CGM supplies in bulk from resellers, pharmacies and medical supply businesses. ' +
    BULK_MIN_PIECES +
    '+ pieces, mixed lots welcome, paid fast. Tell us what you have.',
  alternates: { canonical: PAGE_URL },
}

const FAQS = [
  {
    q: 'What counts as bulk?',
    a: BULK_MIN_PIECES + ' pieces or more in a single lot. There is no upper limit, and there is no requirement to hit that number every month.',
  },
  {
    q: 'Do you take mixed lots?',
    a: 'Yes. Mixed brands, mixed box sizes and mixed expiry dates are normal in a reseller lot and do not need separating before you get a number.',
  },
  {
    q: 'What condition do they need to be in?',
    a: 'Factory sealed, unopened, in original packaging, and unexpired. Opened boxes cannot be resold at any price. Supplies obtained through Medicare or Medicaid cannot be resold at all.',
  },
  {
    q: 'How fast do you pay?',
    a: 'Payment follows verification rather than arrival, so an accurate description up front is what makes it quick. We agree the number before anything ships.',
  },
  {
    q: 'Do you buy regularly, or one-off?',
    a: 'Both. If you are clearing stock once, that is fine. If you have steady volume, say so on the form and we will set up something ongoing.',
  },
]

export default function BulkPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      <h1 className="text-3xl font-bold text-gray-900">Selling diabetic test strips in bulk</h1>

      <div className="mt-4 flex flex-col gap-4 text-gray-700">
        <p>
          This page is for businesses, not for someone with a few boxes at home. If you are a
          reseller sitting on stock, a pharmacy with overstock, a medical supply company winding
          down a line, or a liquidator holding diabetic supplies you cannot move, we buy the whole
          lot.
        </p>
        <p>
          <strong>{BULK_MIN_PIECES} pieces or more</strong> in a single lot. Mixed brands and mixed
          expiry dates are fine and do not need sorting first. Sealed and unexpired only.
        </p>
        <p>
          We quote per lot rather than off a list, because a lot of four hundred assorted boxes is
          not the same trade as four hundred of one thing. Tell us what you have and you get a real
          number, not a range. Call <strong>{OWNER_PHONE}</strong> or use the form.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Tell us what you have</h2>
        <BulkEnquiryForm />
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">Where we are buying right now</h2>
        <p className="mt-2 text-gray-700">
          We buy nationally and shipping is arranged for you on a lot this size, so where you are
          does not decide whether we are interested. We are actively looking for volume in{' '}
          <strong>Ohio</strong> at the moment, particularly around Columbus, Cleveland and
          Cincinnati.
        </p>
        <p className="mt-2 text-gray-700">
          If you would rather hand a lot over in person, our{' '}
          <Link href="/directory" className="underline">buyer directory</Link> lists who is where,
          and the{' '}
          <Link href="/sell-test-strips" className="underline">state pages</Link> show the nearest
          option to you.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900">Questions resellers actually ask</h2>
        <dl className="mt-3 flex flex-col gap-4">
          {FAQS.map((f) => (
            <div key={f.q} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <dt className="font-semibold text-gray-900">{f.q}</dt>
              <dd className="mt-1 text-gray-700 text-sm">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}
