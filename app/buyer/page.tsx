import type { Metadata } from "next";
import { BuyerPortalClient } from "./BuyerPortalClient";

export const metadata: Metadata = {
  title: "Manage Your Buyer Listing — Cash4TestStripsUSA",
  description: "Claim or create your buyer listing on Cash4TestStripsUSA.",
};

export default function BuyerPortalPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Manage Your Listing</h1>
      <p className="text-gray-500 text-sm mb-8">
        Enter your phone number to edit your existing listing, or create a new one. Changes are reviewed before going live.
      </p>
      <BuyerPortalClient />
    </div>
  );
}
