export type Company = {
  id: string
  name: string
  slug: string
  url: string | null
  email: string | null
  city: string | null
  owner_name: string | null
  states: string[]
  payment_methods: string[]
  accepted_brands: string[]
  rating: number | null
  description: string | null
  featured: boolean
  phone: string | null
  lat: number | null
  lng: number | null
  verified: boolean
  transaction_modes: string[]
  response_time: string | null
  est_year: number | null
  // True for the national mail-in buyer. It is a filter field, but the public
  // cards need it too: mail-in buyers have no /company/[slug] page, so a card
  // must not render a "View profile" link for one. See lib/company-profile.ts.
  mail_in?: boolean
}

export type OrderItem = {
  brand: string
  count: number
  expiration: string
  condition: 'sealed' | 'unsealed'
}

export type SubmissionPayload = {
  name: string
  phone?: string | null
  email?: string | null
  url?: string | null
  city?: string | null
  owner_name?: string | null
  states: string[]
  payment_methods?: string[]
  accepted_brands?: string[]
  description?: string | null
}
