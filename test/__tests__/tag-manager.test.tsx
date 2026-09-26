import { describe, it, expect, vi, afterEach } from 'vitest'
import { TagManager } from '@/app/components/TagManager'

describe('TagManager', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('renders nothing when no container is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', '')
    expect(TagManager()).toBeNull()
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', '   ')
    expect(TagManager()).toBeNull()
  })

  it('renders nothing for a malformed or foreign container id', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', "GTM-X');alert(1)//")
    expect(TagManager()).toBeNull()
  })

  it('hands the loader only the container id when configured', () => {
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-TEST123')
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'secret-token')
    const element = TagManager()
    expect(element).not.toBeNull()
    expect(element!.props).toEqual({ gtmId: 'GTM-TEST123' })
    expect(JSON.stringify(element)).not.toContain('secret-token')
  })
})
