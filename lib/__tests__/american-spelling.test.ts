import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Feldon, 2026-09-12: the whole site reads American. The state guides were
// written in British English and swept the same day; this keeps them there.
const BRITISH = /(?<![A-Za-z])(programme|centre|colour|organis(e|ation)|neighbour|honour|catalogue|travelling|realis(e|ed|ing)|behaviour|enquir(y|ies)|labelled|whilst|favourite|licence\b|cheque\b)/i
const SKIP = /BulkEnquiryForm/g // a component name, not copy

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return name === '__tests__' ? [] : walk(p)
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : []
  })
}

describe('site copy uses American spelling', () => {
  for (const f of [...walk('app'), ...walk('lib')]) {
    it(f, () => {
      const text = readFileSync(f, 'utf8').replace(SKIP, '')
      const m = text.match(BRITISH)
      expect(m, m ? `found "${m[0]}"` : undefined).toBeNull()
    })
  }
})
