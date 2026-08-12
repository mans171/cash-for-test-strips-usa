import { monogramFromName } from "@/lib/monogram"
import type { Tier } from "@/lib/tier-pricing"

export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 bg-cash text-white font-bold text-sm px-5 py-3 rounded-lg hover:bg-cash-hover transition-colors"
export const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 border border-gray-300 text-gray-700 font-semibold text-sm px-5 py-3 rounded-lg hover:border-ink hover:text-ink transition-colors"
export const btnOnDark =
  "inline-flex items-center justify-center gap-1.5 bg-electric text-ink-deep font-extrabold text-sm px-5 py-3 rounded-lg hover:bg-white transition-colors"

export function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs bg-gray-100 text-gray-700 font-medium px-2 py-0.5 rounded-md">
      {children}
    </span>
  )
}

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-green-800 bg-green-100 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
      ✓ Verified
    </span>
  )
}

export function FeaturedBadge() {
  return (
    <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
      Featured
    </span>
  )
}

export function TierBadge({ tier }: { tier: Tier }) {
  const styles: Record<Tier, string> = {
    top: "text-green-800 bg-green-100",
    mid: "text-amber-700 bg-amber-50",
    lower: "text-gray-600 bg-gray-100",
  };
  const labels: Record<Tier, string> = { top: "Top Tier", mid: "Mid Tier", lower: "Lower Tier" };
  return (
    <span className={`inline-flex text-[11px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide ${styles[tier]}`}>
      {labels[tier]}
    </span>
  );
}

export function MonogramAvatar({ name }: { name: string }) {
  const { initials, tintClass } = monogramFromName(name)
  return (
    <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-sm font-extrabold ${tintClass}`}>
      {initials}
    </div>
  )
}

export function LockIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function PinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
