import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import SiteNav from "./SiteNav";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "Cash For Test Strips USA — Sell Diabetic Test Strips Near You",
    template: "%s | Cash For Test Strips USA",
  },
  description:
    "Find local cash buyers for unused diabetic test strips. Get paid fast via PayPal, Zelle, or check. Serving buyers in all 50 states.",
  metadataBase: new URL("https://cash4teststripsusa.com"),
  openGraph: {
    siteName: "Cash For Test Strips USA",
    type: "website",
  },
  verification: {
    google: "Or0aVFN_Z8IubP3wQVvGSB3NKGqw-t-JdrjQfyElikA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased bg-ground text-gray-900">
        <header className="bg-ink sticky top-0 z-50">
          <SiteNav />
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-ink mt-16 py-12 text-sm text-white/60">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between gap-8">
            <div className="font-black text-white">
              Cash For Test Strips <span className="text-electric">USA</span>
            </div>
            <div className="flex flex-wrap gap-6">
              <Link href="/directory" className="hover:text-white transition-colors">
                Directory
              </Link>
              <Link href="/how-much-are-diabetic-test-strips-worth" className="hover:text-white transition-colors">
                Price Guide
              </Link>
              <Link href="/is-it-legal-to-sell-diabetic-test-strips" className="hover:text-white transition-colors">
                Is It Legal?
              </Link>
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
              <Link href="/buyer" className="hover:text-white transition-colors">
                Manage Your Listing
              </Link>
              <a href="mailto:feldon.richards@gmail.com" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
