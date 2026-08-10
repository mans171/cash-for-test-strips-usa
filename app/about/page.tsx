// app/about/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Cash For Test Strips USA — Our Buyer Network',
  description:
    "Cash For Test Strips USA connects sellers of unused diabetic supplies with vetted local buyers nationwide. Learn how the network works.",
  alternates: { canonical: 'https://cash4teststripsusa.com/about' },
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-gray">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About Cash For Test Strips USA</h1>

      <p className="text-gray-600 leading-relaxed mb-6">
        Cash For Test Strips USA is a national directory connecting people who have unused diabetic
        supplies with local cash buyers. We operate the network, maintain the listings, and make it
        easy to find a buyer anywhere in the country — or to reach us directly at{' '}
        <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a>.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">The problem we solve</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Every year, millions of people end up with extra boxes of unused diabetic test strips. A
        prescription change. A switch from finger-sticks to a CGM. A family member who passed away.
        Whatever the reason, those boxes have real dollar value — and most people have no idea what
        to do with them.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        Finding a buyer used to mean posting on Craigslist or Facebook Marketplace and hoping someone
        responded. We built a better option: a searchable directory of vetted buyers organized by
        state, brand, and payment method, with pricing guides and state-by-state legal information so
        sellers know exactly what they're getting into before they make a call.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">How the buyer network works</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        We list companies that buy unused diabetic supplies across the United States. Sellers can
        search by state, see which brands each buyer accepts, and reach out directly. Most buyers
        respond within a few hours. Payment is typically sent via PayPal, Zelle, check, or cash within
        24 hours of receiving and verifying the supplies.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        For sellers who want a single point of contact, we also buy directly. Call or text{' '}
        <a href="tel:5187799751" className="text-emerald-600 hover:underline">518-779-9751</a> and
        we'll quote you on the spot — single boxes or bulk lots.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Who uses the site</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Our sellers fall into a few consistent categories: people with diabetes who switched meters or
        moved to a CGM and have leftover strips, caregivers who managed a family member's supplies,
        estate liquidators dealing with diabetic inventory after a loss, and pharmacies or medical
        supply businesses with excess stock they can't otherwise move. We handle all of them, from one
        box to several hundred.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">What qualifies</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        We accept sealed, unexpired, U.S. retail diabetic supplies in original packaging. That
        includes test strips from OneTouch, FreeStyle, Accu-Chek, Contour, and True Metrix; CGM
        sensors and supplies from Dexcom, FreeStyle Libre, and Omnipod; and infusion sets, lancets, and
        other supplies. We do not accept supplies purchased through Medicare or Medicaid, which cannot
        legally be resold.
      </p>
      <p className="text-gray-600 leading-relaxed mb-6">
        There are a few exceptions: we accept expired Omnipod pods (DASH, 5, and Classic versions) and
        expired Dexcom G7 sensors. For everything else, supplies need to be unexpired and sealed.
      </p>

      <h2 className="text-xl font-bold text-gray-900 mt-10 mb-3">Operating across all 50 states</h2>
      <p className="text-gray-600 leading-relaxed mb-6">
        Our <Link href="/blog" className="text-emerald-600 hover:underline">blog</Link> covers the
        legal and practical details of selling in every state. Whether you're in a major metro or a
        rural county, the process is the same: find a buyer, describe what you have, and get paid
        fast. If you're not sure whether your supplies qualify, call us and we'll tell you.
      </p>

      <div className="bg-emerald-50 rounded-xl p-6 text-center mt-10">
        <a
          href="tel:5187799751"
          className="inline-block bg-emerald-600 text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-emerald-700 transition-colors"
        >
          Call or text 518-779-9751 →
        </a>
        <p className="text-sm text-gray-500 mt-3">We respond within hours.</p>
      </div>
    </div>
  )
}
