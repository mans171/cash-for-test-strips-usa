export const EXPIRATION_MONTH_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Already expired / less than 1 month' },
  ...Array.from({ length: 24 }, (_, i) => ({ value: i + 1, label: `${i + 1} month${i === 0 ? '' : 's'}` })),
  { value: 25, label: '24+ months' },
]

export function isEffectivelyExpired(selectedMonths: number, today: Date): boolean {
  const cutoffAdjust = today.getDate() > 25 ? 1 : 0
  const effectiveMonthsRemaining = selectedMonths - cutoffAdjust
  return effectiveMonthsRemaining <= 0
}

export function monthsFromNowToYYYYMM(months: number, today: Date): string {
  const d = new Date(today.getFullYear(), today.getMonth() + months, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
