import { describe, it, expect, vi, afterEach } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { dirname, join, relative, resolve } from 'path'
import { FORBIDDEN_IDS, readTrackingConfig } from '@/lib/tracking-config'

/**
 * Cash For Test Strips USA shares an owner with the Albany diabetic-supplies
 * business (DTS) and the Albany phones business (CFPA). They must never share
 * a pixel, dataset, ad account or container. This test is the enforcement: a
 * wrong id pasted in a year fails the build instead of quietly poisoning a
 * year of data in both businesses.
 */

const ROOT = resolve(__dirname, '..', '..')
const CONFIG_FILE = 'lib/tracking-config.ts'
const THIS_FILE = relative(ROOT, __filename)

function walk(dir: string, out: string[] = []): string[] {
  const abs = join(ROOT, dir)
  if (!existsSync(abs)) return out
  for (const entry of readdirSync(abs)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const rel = join(dir, entry)
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out)
    else if (/\.(ts|tsx|mts|mjs|js)$/.test(entry)) out.push(rel)
  }
  return out
}

const ROOT_FILES = ['next.config.ts', 'proxy.ts', 'vitest.config.mts', 'eslint.config.mjs'].filter((f) =>
  existsSync(join(ROOT, f))
)
/** Everything that ships or configures the build, tests included. */
const ALL_SOURCE = [...walk('app'), ...walk('lib'), ...walk('scripts'), ...walk('test'), ...walk('supabase'), ...ROOT_FILES]
/** Shipping source only: test files legitimately use fake GTM-/pixel-shaped ids. */
const SHIPPING_SOURCE = ALL_SOURCE.filter(
  (f) => !/(^|\/)__tests__\//.test(f) && !/\.test\.tsx?$/.test(f) && !f.startsWith('test/')
)
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8')

const ENV_NAMES = ['NEXT_PUBLIC_GTM_ID', 'META_PIXEL_ID', 'META_CAPI_ACCESS_TOKEN', 'META_CAPI_TEST_EVENT_CODE']

describe('tracking isolation from DTS-Albany and CFPA', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('forbids the DTS and CFPA pixel, dataset, page and ad-account ids', () => {
    for (const id of [
      '2161226681280301', // DTS pixel
      '1041298111860592', // DTS offline dataset
      '880082295178750', // DTS page
      '1099240922629305', // CFPA dataset
      '1528883671975586', // CFPA ad account
    ]) {
      expect(FORBIDDEN_IDS).toContain(id)
    }
  })

  it('lets no forbidden id into any source file', () => {
    const offenders: string[] = []
    for (const file of ALL_SOURCE) {
      if (file === CONFIG_FILE || file === THIS_FILE) continue
      const text = read(file)
      for (const bad of FORBIDDEN_IDS) {
        if (text.includes(bad)) offenders.push(`${file} contains ${bad}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('treats a forbidden id pasted into an env var as unset, at runtime', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('META_PIXEL_ID', '2161226681280301')
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-573J9THJ')
    const config = readTrackingConfig()
    expect(config.metaPixelId).toBeNull()
    expect(config.gtmId).toBeNull()
  })

  it('lets no forbidden id into the configured values of this environment', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const raw = ENV_NAMES.map((n) => process.env[n]).filter((v): v is string => Boolean(v))
    for (const value of raw) {
      for (const bad of FORBIDDEN_IDS) expect(value).not.toContain(bad)
    }
  })

  it('hardcodes no GA4, Tag Manager or Google Ads id in shipping source', () => {
    const offenders: string[] = []
    for (const file of SHIPPING_SOURCE) {
      if (file === CONFIG_FILE) continue
      read(file)
        .split('\n')
        .forEach((line, i) => {
          if (/(?<![A-Za-z0-9])(G-[A-Z0-9]{6,}|GTM-[A-Z0-9]{5,}|AW-\d{9,})(?![A-Za-z0-9])/.test(line)) {
            offenders.push(`${file}:${i + 1}  ${line.trim()}`)
          }
        })
    }
    expect(offenders).toEqual([])
  })

  it('hardcodes no 15-16 digit pixel/dataset id in shipping source', () => {
    const offenders: string[] = []
    for (const file of SHIPPING_SOURCE) {
      if (file === CONFIG_FILE) continue
      read(file)
        .split('\n')
        .forEach((line, i) => {
          if (/(?<![\d.])\d{15,16}(?![\d.])/.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`)
        })
    }
    expect(offenders).toEqual([])
  })

  it('reads every tracking env var as a literal process.env access', () => {
    const text = read(CONFIG_FILE)
    for (const name of ENV_NAMES) expect(text).toContain(`process.env.${name}`)
    // A dynamic lookup is invisible to scanners and to Next's build-time inlining.
    expect(text).not.toMatch(/process\.env\[/)
    expect(read('lib/meta-capi.ts')).not.toMatch(/process\.env/)
  })

  it('never exposes the Conversions API token or pixel id as a NEXT_PUBLIC_ variable', () => {
    const offenders: string[] = []
    for (const file of ALL_SOURCE) {
      const hits = read(file).match(/NEXT_PUBLIC_[A-Z0-9_]*(CAPI|TOKEN|PIXEL|SECRET)[A-Z0-9_]*/g)
      if (hits) offenders.push(`${file}: ${hits.join(', ')}`)
    }
    expect(offenders).toEqual([])
  })

  it('keeps the tracking config out of every client component, including through imports', () => {
    const SERVER_ONLY = new Set(['lib/tracking-config.ts', 'lib/meta-capi.ts'])

    function resolveImport(from: string, spec: string): string | null {
      let base: string
      if (spec.startsWith('@/')) base = spec.slice(2)
      else if (spec.startsWith('.')) base = relative(ROOT, resolve(ROOT, dirname(from), spec))
      else return null
      for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
        if (existsSync(join(ROOT, candidate)) && statSync(join(ROOT, candidate)).isFile()) return candidate
      }
      return null
    }

    function importsOf(file: string): string[] {
      const specs = [...read(file).matchAll(/(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)]
        .map((m) => m[1] ?? m[2])
        // Type-only imports vanish at compile time.
        .filter(Boolean)
      const typeOnly = new Set(
        [...read(file).matchAll(/import\s+type\s[^'"]*?from\s+['"]([^'"]+)['"]/g)].map((m) => m[1])
      )
      return specs
        .filter((s) => !typeOnly.has(s))
        .map((s) => resolveImport(file, s))
        .filter((f): f is string => f !== null)
    }

    const clientFiles = SHIPPING_SOURCE.filter((f) => /^\s*['"]use client['"]/.test(read(f).replace(/^(\s*\/\/[^\n]*\n)+/, '')))
    expect(clientFiles.length).toBeGreaterThan(5)

    const offenders: string[] = []
    for (const entry of clientFiles) {
      const seen = new Set<string>()
      const queue: { file: string; path: string[] }[] = [{ file: entry, path: [entry] }]
      while (queue.length) {
        const { file, path } = queue.shift()!
        if (seen.has(file)) continue
        seen.add(file)
        if (SERVER_ONLY.has(file)) {
          offenders.push(path.join(' -> '))
          continue
        }
        for (const next of importsOf(file)) queue.push({ file: next, path: [...path, next] })
      }
    }
    expect(offenders).toEqual([])
  })
})
