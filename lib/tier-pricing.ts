export type Tier = "top" | "mid" | "lower";

export interface TierRow {
  brand: string;
  tier: Tier;
  note: string;
}

export const TEST_STRIP_TIERS: TierRow[] = [
  { brand: "Accu-Chek Aviva / SmartView", tier: "top", note: "Our best-paying Accu-Chek line — consistently outperforms the standard Guide line." },
  { brand: "FreeStyle Lite", tier: "top", note: "Large, consistent buyer base." },
  { brand: "OneTouch Verio / Ultra", tier: "top", note: "Widely accepted; competitive with other top-tier brands when sold fresh." },
  { brand: "True Metrix", tier: "top", note: "Strong buyer demand once matched to the right buyer — call to confirm your specific SKU." },
  { brand: "Contour Next (all versions)", tier: "mid", note: "Solid mid-tier brand; moves well in bulk." },
  { brand: "Accu-Chek Guide", tier: "mid", note: "The line most orders default to when a specific model isn't named; solid demand, standard pricing." },
  { brand: "Lancets (all brands)", tier: "lower", note: "Accepted alongside strip orders, but the lowest per-box value of anything we buy." },
];

export const CGM_TIERS: TierRow[] = [
  { brand: "Omnipod Pods (5, DASH, Classic)", tier: "top", note: "Expired pods also accepted — call for pricing." },
  { brand: "Dexcom G6 Sensors", tier: "top", note: "High-demand product — call for a current quote." },
  { brand: "Dexcom G7 Sensors (10-Day and 15-Day)", tier: "mid", note: "Expired G7 sensors are also accepted by some buyers." },
  { brand: "FreeStyle Libre Sensors (1, 2, 2 Plus, 3, 3 Plus)", tier: "mid", note: "Libre 3 is the strongest-performing Libre generation. U.S. retail versions only." },
];
