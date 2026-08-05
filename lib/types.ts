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
