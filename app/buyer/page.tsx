import type { Metadata } from "next";
import { BuyerPortalClient } from "./BuyerPortalClient";

export const metadata: Metadata = {
  title: "Manage Your Buyer Listing — Cash4TestStripsUSA",
  description: "Claim or create your buyer listing on Cash4TestStripsUSA.",
  // Login-gated utility page with ~80 visible words. Google rejected an
  // indexing request for it on 2026-09-01. Explicitly noindex so it stops
  // entering the crawl queue, and exclude it from sitemap.ts.
  robots: { index: false, follow: false },
};

export default function BuyerPortalPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Your Listing</h1>
      <p className="text-gray-500 text-sm mb-8">
        Log in or create a buyer account to claim your existing listing or add a new one. Changes are reviewed before going live.
      </p>
      <BuyerPortalClient />
    </div>
  );
}
