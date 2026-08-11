const TINTS = [
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-amber-100 text-amber-800',
  'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800',
]

export function monogramFromName(name: string): { initials: string; tintClass: string } {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const initials = (
    words.length >= 2 ? words[0][0] + words[1][0] : (words[0] ?? '??').slice(0, 2)
  ).toUpperCase()
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return { initials, tintClass: TINTS[Math.abs(hash) % TINTS.length] }
}
