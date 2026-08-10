import type { Metadata } from 'next'
import { buildFaqPageSchema } from '@/lib/schema'
import { JsonLd } from '@/app/components/JsonLd'

export const metadata: Metadata = {
  title: 'How Much Are Diabetic Test Strips Worth? 2026 Guide',
  description:
    'Brand-by-brand cash prices for diabetic test strips and CGM supplies in 2026. See what OneTouch, FreeStyle, Accu-Chek, Contour, Dexcom, and more pay.',
  alternates: { canonical: 'https://cash4teststripsusa.com/how-much-are-diabetic-test-strips-worth' },
}

const FAQS = [
  {
    q: "What's the highest-paying brand of test strips?",
    a: 'OneTouch Verio and Ultra typically pay the most per box among standard test strips, ranging from $15 to $30. FreeStyle Lite runs close behind at $10 to $25. CGM sensors (Libre, Dexcom, Omnipod) pay more per box but serve a narrower buyer market.',
  },
  {
    q: 'Do I get more for buying a larger quantity?',
    a: 'Yes. Bulk lots of 10 or more boxes typically receive a better per-box rate than individual-box sales. Very large lots (50+ boxes) are priced on a call — buyers prefer to negotiate those directly.',
  },
  {
    q: 'What if I have multiple brands?',
    a: 'Mixed lots are accepted. When you call, list all the brands, quantities, and expiration dates you have. Buyers will give you a combined offer or quote by brand — whichever works best for your situation.',
  },
  {
    q: 'Are CGM sensors worth more than test strips?',
    a: 'Generally yes. Dexcom G7, FreeStyle Libre 3, and Omnipod pods are higher-value per box than traditional test strips. They also move through a smaller buyer pool, so pricing varies more — always call for a quote on CGM supplies.',
  },
  {
    q: 'Do expired strips have any value?',
    a: 'Most expired test strips have no buyer market. The exceptions are expired Omnipod pods and expired Dexcom G7 sensors, which some buyers do purchase. Call 518-779-9751 for pricing on expired stock.',
  },
]

const TEST_STRIP_PRICES = [
  { brand: 'OneTouch Verio / Ultra', price: '$15 – $30 per box', note: 'One of the most widely accepted brands, consistently at the higher end.' },
  { brand: 'FreeStyle Lite', price: '$10 – $25 per box', note: 'Large, consistent buyer base.' },
  { brand: 'Accu-Chek Guide / Aviva / SmartView', price: '$10 – $20 per box', note: 'Widely accepted; box condition and count matter.' },
  { brand: 'Contour Next (all versions)', price: '$8 – $18 per box', note: 'Lower end of major brands but moves well in bulk.' },
  { brand: 'True Metrix', price: 'Call for a quote', note: 'Accepted by select buyers — pricing varies by region.' },
]

const CGM_PRICES = [
  { brand: 'Dexcom G6 Sensors', price: 'Starting at $30 per box', note: 'High-demand product — call for a current quote.' },
  { brand: 'Dexcom G7 Sensors (10-Day and 15-Day)', price: 'Starting at $30 per box', note: 'Expired G7 sensors are also accepted by some buyers.' },
  { brand: 'FreeStyle Libre Sensors (1, 2, 2 Plus, 3, 3 Plus)', price: '$30 – $60 per box', note: 'Libre 3 commands the upper end. U.S. retail versions only.' },
  { brand: 'Omnipod Pods (5, DASH, Classic)', price: 'Starting at $50 per box', note: 'Expired pods also accepted — call for pricing.' },
]

export default function PriceGuidePage() {
  const faqSchema = buildFaqPageSchema(FAQS.map((f) => ({ question: f.q, answer: f.a })))

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
      <JsonLd data={faqSchema} />

      <h1 className="text-3xl font-bold text-gray-900 mb-6">How Much Are Diabetic Test Strips Worth? A 2026 Price Guide</h1>

      <p className="text-gray-600 leading-relaxed mb-6">
        What you get for unused diabetic test strips depends on the brand, the quantity, how much time
        is left before expiration, and whether the box is sealed. The price ranges below reflect what
        buyers in our network are currently paying for standard retail boxes in good condition. Bulk
        lots of 10 or more boxes typically receive a higher per-box rate than individual boxes.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Test Strips — Price by Brand</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Brand</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Price</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Notes</th>
            </tr>
          </thead>
          <tbody>
            {TEST_STRIP_PRICES.map((row) => (
              <tr key={row.brand} className="border border-gray-100">
                <td className="px-4 py-2 text-gray-600">{row.brand}</td>
                <td className="px-4 py-2 text-gray-600">{row.price}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">CGM Sensors and Supplies — Price by Product</h2>
      <div className="not-prose overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Product</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Price</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700 border border-gray-100">Notes</th>
            </tr>
          </thead>
          <tbody>
            {CGM_PRICES.map((row) => (
              <tr key={row.brand} className="border border-gray-100">
                <td className="px-4 py-2 text-gray-600">{row.brand}</td>
                <td className="px-4 py-2 text-gray-600">{row.price}</td>
                <td className="px-4 py-2 text-gray-500 text-xs">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">What affects the price?</h2>
      <p className="text-gray-600 leading-relaxed mb-4">
        <strong>Box count.</strong> A 100-count box pays more than two 50-count boxes of the same
        brand in most cases, because buyers prefer to handle fewer transactions for equivalent volume.
      </p>
      <p className="text-gray-600 leading-relaxed mb-4">
        <strong>Time to expiration.</strong> Most buyers require at least six months of remaining
        shelf life on test strips. Strips with 12 or more months remaining command better pricing.
      </p>
      <p className="text-gray-600 leading-relaxed mb-4">
        <strong>Sealed vs. opened.</strong> Only sealed, original-packaging boxes are accepted. An
        opened box has no resale value regardless of brand or quantity.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        <strong>Bulk quantity.</strong> Ten or more boxes of the same brand in a single lot is
        considered a bulk transaction by most buyers, which typically improves the per-box rate. Large
        lots (50 boxes or more) are priced individually — call for a quote.
      </p>

      <p className="text-gray-600 leading-relaxed mb-6">
        The ranges above are what buyers in our network pay for standard-condition, single-box
        transactions. Your actual offer may be higher or lower depending on lot size, expiration
        dates, and demand. Call{' '}
        <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> — we'll
        give you a number on the spot.
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

      <div className="bg-emerald-50 rounded-xl p-6 text-center mt-10 not-prose">
        <a
          href="tel:5187799751"
          className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
        >
          Call 518-779-9751 for a quote →
        </a>
      </div>
    </div>
  )
}
