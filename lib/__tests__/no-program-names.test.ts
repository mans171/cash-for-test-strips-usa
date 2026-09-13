import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
const ROOTS = ['lib/blog-bodies', 'lib/posts', 'lib/hub-page-content.ts', 'lib/blog-post-content.ts', 'lib/state-page-content.ts', 'app/about/page.tsx', 'app/blog/sell-test-strips-albany-ny/page.tsx', 'app/sell-test-strips-in-bulk/page.tsx', 'app/page.tsx', 'app/is-it-legal-to-sell-diabetic-test-strips/page.tsx']
function files(p: string): string[] { try { return readdirSync(p).filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).map(f => join(p, f)) } catch { return [p] } }
describe('site copy never names government programs', () => {
  for (const f of ROOTS.flatMap(files)) {
    it(f, () => { expect(readFileSync(f, 'utf8')).not.toMatch(/medicare|medicaid|medi-cal|ahcccs|tricare/i) })
  }
})
