import type { Metadata } from "next";
import { SellFlowClient } from "./SellFlowClient";

export const metadata: Metadata = {
  title: "Sell Your Test Strips — Cash4TestStripsUSA",
  description: "Build your order and get connected to a local cash buyer.",
  alternates: { canonical: 'https://cash4teststripsusa.com/sell' },
};

export default function SellPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-2">Sell Your Test Strips</h1>
      <p className="text-gray-500 text-sm mb-8">Tell us what you have — we&apos;ll connect you to a local buyer.</p>
      <SellFlowClient />
    </div>
  );
}
