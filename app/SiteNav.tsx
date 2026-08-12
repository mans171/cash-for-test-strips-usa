"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, signOut } from "@/lib/auth-client";

const NAV_LINKS = [
  { href: "/directory", label: "Find a Buyer" },
  { href: "/how-much-are-diabetic-test-strips-worth", label: "Price Guide" },
  { href: "/blog", label: "Blog" },
  { href: "/#how-it-works", label: "How It Works" },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    setOpen(false);
    router.push("/");
  }

  return (
    <nav className="max-w-6xl mx-auto px-4 relative">
      <div className="h-16 flex items-center justify-between">
        <Link href="/" className="font-black text-lg tracking-tight text-white">
          Cash For Test Strips <span className="text-electric">USA</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40">{user.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-white/70 hover:text-white transition-colors">
                Login
              </Link>
            )
          )}
          <Link
            href="/sell"
            className="bg-electric text-ink-deep font-extrabold px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            Get Cash Now
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <Link
            href="/sell"
            className="bg-electric text-ink-deep font-extrabold px-4 py-2 rounded-lg text-sm hover:bg-white transition-colors"
          >
            Get Cash Now
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="p-2 -mr-2 text-white"
          >
            {open ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden absolute left-0 right-0 top-16 bg-ink border-b border-white/10 shadow-lg flex flex-col px-4 py-3 gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {!loading && (
            user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="py-2 text-sm font-medium text-white/80 hover:text-white transition-colors text-left"
              >
                Log out ({user.email})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                Login
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  );
}
