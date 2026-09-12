import type { Metadata } from "next"

// Account pages exist for buyers managing a listing. They carry no content for
// search and were being indexed under the site's default title.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
