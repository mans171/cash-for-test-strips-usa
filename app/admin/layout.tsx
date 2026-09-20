import type { Metadata } from "next"

// The owner's back office: /admin, /admin/login, /admin/forgot-password and
// /admin/reset. None of it is content for search. robots.txt disallows the
// path, but a disallowed URL can still be listed if something links to it —
// this tag (and the X-Robots-Tag header in next.config.ts) is what says
// "do not index". Same pattern as app/(auth)/layout.tsx.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
