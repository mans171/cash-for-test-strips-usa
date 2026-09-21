import type { Metadata } from 'next'
import Link from 'next/link'
import { OWNER_PHONE, PUBLIC_EMAIL } from '@/lib/owner'

export const metadata: Metadata = {
  title: 'Privacy Policy | Cash For Test Strips USA',
  description:
    'What Cash For Test Strips USA collects when you list supplies, start a mail-in kit or contact a buyer, who sees it, and how to have it removed.',
  alternates: { canonical: 'https://cash4teststripsusa.com/privacy' },
}

// Every statement on this page describes what the site actually does today.
// If a form starts collecting something new, or a tracking script is ever
// added, this page changes in the SAME pull request.
const LAST_UPDATED = 'September 20, 2026'

const H2 = 'text-xl font-bold text-gray-900 mt-10 mb-3'
const P = 'text-gray-700 leading-relaxed mb-4'
const UL = 'list-disc pl-6 text-gray-700 leading-relaxed mb-4 space-y-2'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated {LAST_UPDATED}</p>

      <p className={P}>
        Cash For Test Strips USA helps people sell sealed diabetic supplies they no longer need, by
        mail or to a buyer near them. This page explains what we collect when you use the site, what
        we do with it, and how to have it removed. We do not sell your information, and the site
        runs no advertising trackers.
      </p>

      <h2 className={H2}>What we collect, and when</h2>
      <ul className={UL}>
        <li>
          <strong>When you start listing supplies.</strong> The mobile number you enter, your first
          name if you give it, your state, and the items you listed. We save this when you move past
          the first step, even if you do not finish, so we can follow up with you about that sale.
        </li>
        <li>
          <strong>When you send your order to a buyer.</strong> Your name, phone number, email
          address if you give one, your state, the items you listed, and which buyer you chose.
        </li>
        <li>
          <strong>When you start a mail-in kit.</strong> Your name, phone number, email address if
          you give one, the address you are shipping from, the items you are sending, any note you
          add, and how you want to be paid, including the payout detail you enter for that method.
          We do not ask for bank account numbers through the site.
        </li>
        <li>
          <strong>When you send a bulk inquiry or a message.</strong> Whatever you type into the
          form, plus the contact details you provide.
        </li>
        <li>
          <strong>When you create an account.</strong> Your email address and a password, which is
          stored in encrypted form by our sign-in provider and is never visible to us, plus any name
          and phone number you save to your profile.
        </li>
        <li>
          <strong>When you list or claim a buyer business.</strong> The business details you submit
          for the public directory, and your contact details so we can verify the listing.
        </li>
        <li>
          <strong>When you tap a buyer listing.</strong> We record which listing was tapped and the
          page it was tapped from. This is not tied to your name.
        </li>
      </ul>

      <h2 className={H2}>How we use it</h2>
      <ul className={UL}>
        <li>To give you a quote and arrange the sale you asked about.</li>
        <li>To create a prepaid shipping label for a mail-in kit and track that shipment.</li>
        <li>To pay you by the method you chose.</li>
        <li>To contact you about that sale by text, phone call or email.</li>
        <li>To keep the directory accurate and to keep spam and abuse off the forms.</li>
      </ul>

      <h2 className={H2}>Text messages</h2>
      <p className={P}>
        If you give us a mobile number, we may text you about the sale you started or asked about.
        We do not send marketing blasts. Message and data rates may apply. Reply STOP at any time
        and we will stop texting you.
      </p>

      <h2 className={H2}>Who sees your information</h2>
      <ul className={UL}>
        <li>
          <strong>The buyer you choose.</strong> When you send your order to a buyer listed in the
          directory, that buyer receives the details in your message. Independent buyers handle
          what you send them under their own practices.
        </li>
        <li>
          <strong>Shipping carriers.</strong> To make a prepaid label we share your name and
          shipping address with our label provider and with the carrier, such as USPS.
        </li>
        <li>
          <strong>The services that run this site.</strong> Our hosting, database, sign-in and email
          delivery providers process information on our behalf so the site can work.
        </li>
        <li>
          <strong>When the law requires it.</strong> We may disclose information to comply with a
          valid legal request or to protect against fraud.
        </li>
      </ul>
      <p className={P}>We do not sell or rent your information to anyone.</p>

      <h2 className={H2}>Cookies</h2>
      <p className={P}>
        The site uses a small number of cookies that it needs to work: one remembers the last ZIP
        code you searched for 30 days so forms can fill in your state, and one keeps you signed in
        if you have an account. We do not use advertising or cross-site tracking cookies.
      </p>

      <h2 className={H2}>How long we keep it</h2>
      <p className={P}>
        We keep sale and shipping records for as long as we need them to complete the sale, answer
        questions about it and meet our record-keeping obligations. Listings that were started and
        never finished are removed from our follow-up list once they have been handled, and you can
        ask us to delete them sooner.
      </p>

      <h2 className={H2}>Your choices</h2>
      <p className={P}>
        You can ask us what we hold about you, ask us to correct it, or ask us to delete it. Email{' '}
        <a href={`mailto:${PUBLIC_EMAIL}`} className="text-cash font-semibold underline">
          {PUBLIC_EMAIL}
        </a>{' '}
        or call or text {OWNER_PHONE}, and tell us the phone number or email address you used on the
        site so we can find your records. We will confirm once it is done.
      </p>

      <h2 className={H2}>Children</h2>
      <p className={P}>
        This site is for adults. It is not directed to anyone under 18, and we do not knowingly
        collect information from children.
      </p>

      <h2 className={H2}>Changes to this page</h2>
      <p className={P}>
        If what we collect or how we use it changes, we will update this page and the date at the
        top before the change takes effect.
      </p>

      <p className={P}>
        Questions? Email{' '}
        <a href={`mailto:${PUBLIC_EMAIL}`} className="text-cash font-semibold underline">
          {PUBLIC_EMAIL}
        </a>{' '}
        or head back to the <Link href="/" className="text-cash font-semibold underline">home page</Link>.
      </p>
    </div>
  )
}
