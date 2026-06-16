import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "Cash For Test Strips USA — Sell Diabetic Test Strips Near You",
    template: "%s | Cash For Test Strips USA",
  },
  description:
    "Find local cash buyers for unused diabetic test strips. Get paid fast via PayPal, Zelle, or check. Serving buyers in all 50 states.",
  metadataBase: new URL("https://cashforteststripsusa.com"),
  openGraph: {
    siteName: "Cash For Test Strips USA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased bg-white text-gray-900">
        <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
          <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg text-emerald-700 tracking-tight">
              CashForTestStrips<span className="text-gray-900">USA</span>
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/directory" className="hover:text-emerald-700 transition-colors">
                Find a Buyer
              </Link>
              <Link href="/" className="hover:text-emerald-700 transition-colors">
                How It Works
              </Link>
              <Link
                href="/directory"
                className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition-colors"
              >
                Get Cash Now
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-100 mt-16 py-10 text-sm text-gray-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between gap-4">
            <p className="font-medium text-gray-700">Cash For Test Strips USA</p>
            <div className="flex gap-6">
              <Link href="/directory" className="hover:text-emerald-700 transition-colors">
                Directory
              </Link>
              <a href="mailto:feldon.richards@gmail.com" className="hover:text-emerald-700 transition-colors">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
