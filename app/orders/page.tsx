import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { OrdersList, type OrderRow } from './OrdersList'

export const metadata: Metadata = {
  title: 'My orders | Cash For Test Strips USA',
  // Per-user content. Also disallowed in app/robots.ts.
  robots: { index: false, follow: false },
}

// Reads the signed-in user's own rows, so it can never be prerendered.
export const dynamic = 'force-dynamic'

const SELECT =
  'id, created_at, items, channel, source_page, companies:matched_company_id (name, slug, phone, mail_in)'

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <Shell>
        <p className="text-gray-600 text-sm mb-6">
          Sign in to see the quote requests and bulk enquiries you&apos;ve submitted.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login?next=/orders"
            className="bg-ink text-electric font-extrabold px-4 py-2 rounded-lg text-sm"
          >
            Sign in
          </Link>
          <Link
            href="/signup?next=/orders"
            className="border border-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm hover:border-gray-300"
          >
            Create a free account
          </Link>
        </div>
      </Shell>
    )
  }

  // RLS (leads_select_own) is what actually enforces ownership; the .eq is
  // belt-and-braces. The user_id column ships with that migration, so until it
  // is applied this select errors — degrade to a message, never throw.
  const { data, error } = await supabase
    .from('leads')
    .select(SELECT)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[orders] could not load leads', error)
    return (
      <Shell>
        <p className="text-gray-600 text-sm">We couldn&apos;t load your orders right now.</p>
      </Shell>
    )
  }

  const orders = (data ?? []) as unknown as OrderRow[]

  return (
    <Shell>
      <p className="text-gray-500 text-sm mb-6">
        Orders you submit while signed in show up here.
      </p>
      <OrdersList orders={orders} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My orders</h1>
      {children}
    </div>
  )
}
