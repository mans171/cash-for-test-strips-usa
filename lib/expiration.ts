export const DEFAULT_EXPIRATION_MONTHS = 9

// Calendar-month labels depend on today's date, so this has to be a
// function rather than a static list — "9 months" means something
// different in January than it does in August.
export function getExpirationMonthOptions(today: Date = new Date()): { value: number; label: string }[] {
  return [
    { value: 0, label: 'Already expired / less than 1 month' },
    ...Array.from({ length: 24 }, (_, i) => {
      const months = i + 1
      const target = new Date(today.getFullYear(), today.getMonth() + months, 1)
      const monthName = target.toLocaleString('en-US', { month: 'short', year: 'numeric' })
      return { value: months, label: `${months} month${months === 1 ? '' : 's'} (${monthName})` }
    }),
    { value: 25, label: '24+ months' },
  ]
}

export function isEffectivelyExpired(selectedMonths: number, today: Date): boolean {
  const cutoffAdjust = today.getDate() > 25 ? 1 : 0
  const effectiveMonthsRemaining = selectedMonths - cutoffAdjust
  return effectiveMonthsRemaining <= 0
}

export function monthsFromNowToYYYYMM(months: number, today: Date): string {
  const d = new Date(today.getFullYear(), today.getMonth() + months, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
