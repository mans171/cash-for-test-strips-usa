import type { Metadata } from 'next'
import Link from 'next/link'
import { OWNER_PHONE, PUBLIC_EMAIL } from '@/lib/owner'
import { OptOutControl } from './OptOutControl'

export const metadata: Metadata = {
  title: 'Privacy Policy | Cash For Test Strips USA',
  description:
    'What Cash For Test Strips USA collects when you list supplies, start a mail-in kit or contact a buyer, the analytics and ad measurement the site uses, and how to opt out or have it removed.',
  alternates: { canonical: 'https://cash4teststripsusa.com/privacy' },
}

// Every statement on this page describes what the site actually does today.
// If a form starts collecting something new, or a tracking script is ever
// added, this page changes in the SAME pull request.
const LAST_UPDATED = 'September 25, 2026'

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
        we do with it, and how to have it removed. We never sell your information for money. The site
        does use Google Analytics and the Meta pixel to measure visits and our ads, which is explained
        below along with{' '}
        <a href="#do-not-sell" className="text-cash font-semibold underline">
          how to opt out
        </a>
        .
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
        <li>
          To see which pages and ads bring sellers to the site and where our forms lose people, and
          to measure and improve our ads on Facebook and Instagram. See Analytics and advertising
          below.
        </li>
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
          <strong>Google and Meta.</strong> For analytics and ad measurement, as described in the
          next section.
        </li>
        <li>
          <strong>When the law requires it.</strong> We may disclose information to comply with a
          valid legal request or to protect against fraud.
        </li>
      </ul>
      <p className={P}>
        We do not sell or rent your information to anyone for money. Sharing information with Meta
        for ad measurement, described below, can count as &ldquo;selling&rdquo; or
        &ldquo;sharing&rdquo; under some state privacy laws, including California&apos;s, so you
        can turn it off.
      </p>

      <h2 className={H2}>Analytics and advertising</h2>
      <p className={P}>
        The site loads Google Tag Manager, which runs two tools for us: Google Analytics and the Meta
        pixel. Our server also uses the Meta Conversions API. Here is what each one collects.
      </p>
      <ul className={UL}>
        <li>
          <strong>Google Analytics.</strong> The pages you visit, how you arrived (for example from a
          search, a link or an ad), your device and browser type, your approximate location based on
          your IP address, which steps of our forms you reached, such as starting a listing or
          sending it, and the general type of product you pick there (for example test strips),
          never the brand or how many. A tap on a call, text, email or website link is counted as a tap, without the
          number or address. We use this to see which pages help sellers and where our forms lose
          people.
        </li>
        <li>
          <strong>The Meta pixel.</strong> A small piece of code from Meta, the company behind
          Facebook and Instagram. It records that your browser visited, and that a request was sent
          when you finish a listing, a bulk inquiry or a mail-in kit, so we can tell whether our
          Facebook and Instagram ads bring sellers. If you are signed in to Facebook or Instagram in
          the same browser, Meta may connect this to your account.
        </li>
        <li>
          <strong>The Meta Conversions API.</strong> When you send your order to a buyer, send a bulk
          inquiry or start a mail-in kit, our server tells Meta that a request was made. It sends your
          email address and phone number in hashed form (scrambled with a one-way code, so the
          original cannot be read back, which Meta uses only to match the request to an ad you may
          have seen), your IP address and browser type, the page you sent it from, and the Meta
          cookie IDs described below if your browser has them.
        </li>
      </ul>
      <p className={P}>
        None of these tools receive your name, your street address, the brands or amounts you
        listed, the notes or messages you write, or your payout details, and Meta receives no
        product information at all. We do not use them to single out individual visitors.
      </p>
      <p className={P}>
        Google and Meta handle this information under their own privacy policies. Besides the switch
        below, you can control ads from Meta in your{' '}
        <a href="https://www.facebook.com/adpreferences" className="text-cash font-semibold underline" rel="noopener noreferrer">
          Facebook ad preferences
        </a>
        , and Google offers a{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" className="text-cash font-semibold underline" rel="noopener noreferrer">
          browser add-on that turns off Google Analytics
        </a>{' '}
        on every site.
      </p>

      <h2 id="do-not-sell" className={H2}>Do Not Sell or Share My Personal Information</h2>
      <p className={P}>
        You can opt out of the Meta pixel, the Meta Conversions API and Google Analytics on this site
        with the switch below. It works for everyone, wherever you live. We also honor Global Privacy
        Control: if your browser sends that signal, you are opted out automatically and do not need
        to do anything here.
      </p>
      <OptOutControl />
      <p className={P}>
        Opting out does not stop the site from working, and it does not change how we handle a sale
        you have asked about. To opt out of anything else, or to ask what we hold about you, see Your
        choices below.
      </p>

      <h2 className={H2}>Cookies</h2>
      <p className={P}>
        The site uses a few cookies that it needs to work: one remembers the last ZIP code you
        searched for 30 days so forms can fill in your state, one keeps you signed in if you have an
        account, and one remembers for a year that you opted out, if you did.
      </p>
      <p className={P}>
        Unless you opt out, the analytics and advertising tools above also set cookies on this site:
        Google Analytics sets cookies whose names start with <code>_ga</code> to tell one visit from
        the next, and the Meta pixel sets <code>_fbp</code>, plus <code>_fbc</code> when you arrive
        from a Meta ad, so a request can be matched to the ad. Opting out stops these tools from
        loading, so they stop setting or reading these cookies. You can also delete cookies in your
        browser settings.
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
