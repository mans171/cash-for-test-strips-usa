import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { loadSellerView } from '@/lib/kit-lookup'
import { SELLER_STEPS, sellerStepIndex, totalBoxes } from '@/lib/mail-in'
import { checkRateLimit, clientIp, RATE_LIMIT_MESSAGE } from '@/lib/rate-limit'
import { OWNER_PHONE } from '@/lib/owner'

// The seller's private status page. Server-rendered on every request; the
// lookup happens here, on the server, and ONLY the seller-safe projection
// (lib/mail-in toSellerView) is ever rendered. No amounts, no payout handle,
// no notes of ours, no reason text for a problem.
//
// noindex + nofollow here, disallowed in robots.ts, absent from the sitemap.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your Mail-In Kit',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

// Its own bucket, and roomier than the forms': a seller reloads this page.
const LOOKUPS_PER_WINDOW = 30
const OWNER_DIGITS = OWNER_PHONE.replace(/\D/g, '')

const CHECKLIST = [
  'Keep every box sealed.',
  'Pad the gaps so nothing rattles.',
  'Tape all the seams.',
  'One kit per shipment.',
  'Drop it at any post office, or hand it to your carrier.',
]

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
}

type Props = { params: Promise<{ token: string }> }

export default async function KitStatusPage({ params }: Props) {
  const { token } = await params

  const limit = checkRateLimit(`kit:${clientIp(await headers())}`, { max: LOOKUPS_PER_WINDOW })
  if (!limit.allowed) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-700">{RATE_LIMIT_MESSAGE}</p>
      </main>
    )
  }

  const kit = await loadSellerView(token)
  if (!kit) notFound()

  const current = sellerStepIndex(kit.status)
  const smsBody = encodeURIComponent(`Hi, this is about mail-in kit ${kit.order_number}.`)
  const stepDates: Array<string | null> = [
    formatDate(kit.created_at),
    null,
    formatDate(kit.label_created_at),
    formatDate(kit.first_scan_at),
    formatDate(kit.delivered_at),
    formatDate(kit.checked_in_at),
    formatDate(kit.paid_at),
  ]

  return (
    <main className="max-w-xl mx-auto px-4 py-10 flex flex-col gap-6">
      <header>
        <p className="text-xs font-extrabold text-cash uppercase tracking-wider">Mail-in kit {kit.order_number}</p>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mt-1">
          {kit.first_name ? `Hi ${kit.first_name}, here` : 'Here'} is where your kit stands
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Status: <strong className="text-gray-900">{kit.status_label}</strong>
        </p>
      </header>

      {kit.label_is_test && (
        <p className="border-2 border-dashed border-red-500 bg-red-50 text-red-700 font-black text-center rounded-lg px-3 py-3 text-sm">
          TEST LABEL — not valid postage
        </p>
      )}

      {kit.needs_contact ? (
        <section className="border border-amber-300 bg-amber-50 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900">We need to talk about this kit — text us</h2>
          <p className="text-sm text-gray-700 mt-1">Nothing is lost. Send us a text or give us a call and we will sort it out together.</p>
        </section>
      ) : (
        <section className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">
          <ol className="flex flex-col gap-3">
            {SELLER_STEPS.map((step, i) => {
              const done = i < current
              const active = i === current
              return (
                <li key={step.label} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black ${done || active ? 'bg-ink text-electric' : 'bg-gray-200 text-gray-500'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={`text-sm flex-1 min-w-0 ${active ? 'font-bold text-gray-900' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                    {step.label}
                    {i === SELLER_STEPS.length - 1 && kit.paid && ' ✓'}
                  </span>
                  {(done || active) && stepDates[i] && <span className="text-xs text-gray-400 shrink-0">{stepDates[i]}</span>}
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <section className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-gray-900">Your prepaid label</h2>
        {kit.label_pdf_url ? (
          <>
            <a href={kit.label_pdf_url} target="_blank" rel="noopener noreferrer" className="bg-cash text-white font-semibold px-6 py-3 rounded-lg text-center hover:bg-cash-hover transition-colors">
              Print your label
            </a>
            <p className="text-xs text-gray-500">No printer? Show this label on your phone at the post office counter and ask them to print it.</p>
          </>
        ) : current >= 3 ? (
          <p className="text-sm text-gray-600">Your box is already with the carrier, so the label is no longer needed.</p>
        ) : (
          <p className="text-sm text-gray-600">
            Your label is sent after you approve our quote. Text us to get your quote, and once you say yes it will appear right here.
          </p>
        )}
        {kit.tracking_code && (
          <p className="text-sm text-gray-700 break-words">
            {[kit.carrier, kit.service].filter(Boolean).join(' ')} tracking:{' '}
            {kit.tracking_url ? (
              <a href={kit.tracking_url} target="_blank" rel="noopener noreferrer" className="text-cash font-semibold underline break-all">{kit.tracking_code}</a>
            ) : (
              <span className="font-semibold break-all">{kit.tracking_code}</span>
            )}
          </p>
        )}
      </section>

      <section className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">
        <h2 className="font-semibold text-gray-900">What you told us you are sending</h2>
        {kit.expected_items.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">Nothing listed yet.</p>
        ) : (
          <ul className="mt-2 text-sm text-gray-700 flex flex-col gap-1">
            {kit.expected_items.map((item, i) => (
              <li key={`${item.product}-${i}`} className="flex justify-between gap-3">
                <span className="min-w-0 break-words">{item.product}</span>
                <span className="font-semibold shrink-0">× {item.boxes}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 border-t border-gray-100 pt-1 font-semibold">
              <span>Total boxes</span>
              <span>{totalBoxes(kit.expected_items)}</span>
            </li>
          </ul>
        )}
      </section>

      <section className="bg-white border border-gray-100 shadow-sm rounded-xl p-5">
        <h2 className="font-semibold text-gray-900">Packing checklist</h2>
        <ul className="mt-2 text-sm text-gray-700 flex flex-col gap-1.5">
          {CHECKLIST.map((line) => (
            <li key={line} className="flex gap-2"><span className="text-cash font-black">✓</span><span>{line}</span></li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col sm:flex-row gap-2">
        <a href={`sms:${OWNER_DIGITS}?&body=${smsBody}`} className="flex-1 bg-ink text-white font-semibold px-6 py-3 rounded-lg text-center">Text us</a>
        <a href={`tel:${OWNER_DIGITS}`} className="flex-1 border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-lg text-center">Call {OWNER_PHONE}</a>
      </section>
    </main>
  )
}
