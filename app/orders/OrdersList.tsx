import Link from 'next/link'
import { honorsBonus } from '@/lib/bonus'
import { hasProfilePage } from '@/lib/company-profile'
import { summarizeItems, orderKind } from '@/lib/orders-format'
import type { OrderItem } from '@/lib/types'

/** The matched buyer, as embedded by the /orders select. Typed by hand: the
 *  generated PostgREST types are not wired up in this project, and the embed
 *  shape (`companies:matched_company_id (...)`) infers badly. */
export type OrderBuyer = {
  name: string
  slug: string
  phone: string | null
  mail_in: boolean | null
}

export type OrderRow = {
  id: string
  created_at: string
  items: OrderItem[] | null
  channel: string | null
  source_page: string | null
  companies: OrderBuyer | null
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function channelLabel(channel: string | null): string | null {
  if (channel === 'sms') return 'Texted'
  if (channel === 'email') return 'Emailed'
  return null
}

export function OrdersList({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <p className="text-gray-600 text-sm">No orders yet.</p>
        <Link href="/sell" className="text-sm font-medium text-cash hover:underline mt-2 inline-block">
          Get a quote →
        </Link>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.map((order) => {
        const kind = orderKind(order)
        const buyer = order.companies
        const channel = channelLabel(order.channel)
        const showsBonus = buyer ? honorsBonus({ phone: buyer.phone, mail_in: !!buyer.mail_in, slug: buyer.slug }) : false
        const linkable = buyer ? hasProfilePage({ mail_in: !!buyer.mail_in }) && !!buyer.slug : false

        return (
          <li key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-medium text-gray-500">{formatDate(order.created_at)}</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">
                {kind === 'bulk' ? 'Bulk enquiry' : 'Quote request'}
              </span>
            </div>

            <p className="text-sm text-gray-900 font-medium">{summarizeItems(order.items)}</p>

            {buyer && (
              <p className="text-sm text-gray-600">
                Sent to{' '}
                {linkable ? (
                  <Link href={`/company/${buyer.slug}`} className="font-medium text-cash hover:underline">
                    {buyer.name}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-900">{buyer.name}</span>
                )}
                {channel ? ` · ${channel}` : ''}
              </p>
            )}

            {!buyer && channel && <p className="text-sm text-gray-600">{channel}</p>}

            {showsBonus && (
              <p className="text-xs text-gray-500">
                $10 bonus applies when you mention Cash For Test Strips USA.
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
