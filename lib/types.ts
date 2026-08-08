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
  // Set only by /api/sell/match's stripContactInfo() for anonymous requests:
  // true when the underlying buyer has real email/phone on file, even though
  // those fields are nulled out here. Lets the client render the account-gate
  // prompt for logged-out visitors without leaking the actual contact info.
  hasContact?: boolean
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
