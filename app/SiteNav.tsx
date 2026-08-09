"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, signOut } from "@/lib/auth-client";

const NAV_LINKS = [
  { href: "/directory", label: "Find a Buyer" },
  { href: "/blog", label: "Blog" },
  { href: "/", label: "How It Works" },
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
        <Link href="/" className="font-bold text-lg text-emerald-700 tracking-tight">
          CashForTestStrips<span className="text-gray-900">USA</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-emerald-700 transition-colors">
              {link.label}
            </Link>
          ))}
          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{user.email}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hover:text-emerald-700 transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link href="/login" className="hover:text-emerald-700 transition-colors">
                Login
              </Link>
            )
          )}
          <Link
            href="/sell"
            className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors"
          >
            Get Cash Now
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-3">
          <Link
            href="/sell"
            className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Get Cash Now
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="p-2 -mr-2 text-gray-700"
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
        <div className="md:hidden absolute left-0 right-0 top-16 bg-white border-b border-gray-100 shadow-lg flex flex-col px-4 py-3 gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {!loading && (
            user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="py-2 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors text-left"
              >
                Log out ({user.email})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors"
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
