import type { Metadata } from 'next'
import Link from 'next/link'
import { MailInKitForm } from './MailInKitForm'
import { OWNER_PHONE } from '@/lib/owner'
import { pageTitle } from '@/lib/title'

// The seller does all the form work here; contacting us is their LAST step.
// We make the label, after a price is agreed by text — the seller never can.
// No dollar figures on this page, ever: the quote lives in the text thread.

const PAGE_URL = 'https://cash4teststripsusa.com/mail-in-kit'

export const metadata: Metadata = {
  title: pageTitle('Mail-In Kit: Sell Diabetic Supplies by Mail'),
  description:
    'Mail your sealed diabetic test strips, sensors and pods from anywhere in the US. Tell us what you have, approve our quote by text, and we send a prepaid label. Paid after check-in.',
  alternates: { canonical: PAGE_URL },
}

const STEPS = [
  { title: 'Fill in the kit form', body: 'What you have, where you are shipping from, and how you want to be paid. It takes a few minutes.' },
  { title: 'Text us for your quote', body: 'Your last step. We reply with a quote by text. Nothing ships until you have approved it.' },
  { title: 'We send a prepaid label', body: 'Once you approve the quote we make your label. Print it, tape it on, and drop the box off.' },
  { title: 'Paid after check-in', body: 'When your box arrives we check it in against your list and pay you the way you chose.' },
]

export default function MailInKitPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-gray-900">Sell your diabetic supplies by mail</h1>
      <div className="mt-4 flex flex-col gap-3 text-gray-700">
        <p>
          We buy sealed diabetic test strips, CGM sensors and pods, and you can mail them to us from
          anywhere in the US. Shipping is on us: you get a prepaid label once you have approved our
          quote, and you are paid after your box is checked in.
        </p>
        <p className="text-sm text-gray-500">
          Prefer to talk first? Call or text{' '}
          <a href={`tel:${OWNER_PHONE.replace(/\D/g, '')}`} className="text-cash font-semibold hover:underline">{OWNER_PHONE}</a>.
        </p>
      </div>

      <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-extrabold text-cash uppercase tracking-wider">Step {i + 1}</p>
            <p className="font-semibold text-gray-900 mt-1">{step.title}</p>
            <p className="text-sm text-gray-600 mt-1">{step.body}</p>
          </li>
        ))}
      </ol>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Start your mail-in kit</h2>
        <MailInKitForm />
      </section>

      <section className="mt-10 text-sm text-gray-600 flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-gray-900">Good to know</h2>
        <p>Keep every box sealed and in its original packaging. Opened boxes cannot be bought.</p>
        <p>Supplies obtained through a government program cannot be sold, by mail or in person.</p>
        <p>
          New to selling by mail? Read{' '}
          <Link href="/blog/how-to-sell-diabetic-supplies-by-mail" className="underline">how to sell diabetic supplies by mail</Link>, or find a{' '}
          <Link href="/directory" className="underline">local buyer</Link> if you would rather hand them over in person.
        </p>
      </section>
    </main>
  )
}
