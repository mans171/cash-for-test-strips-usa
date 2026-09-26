import { readTrackingConfig } from '@/lib/tracking-config'
import { GtmLoader } from './GtmLoader'

/**
 * The Tag Manager container for THIS SITE ONLY. A server component: it reads
 * the container id from `NEXT_PUBLIC_GTM_ID` and hands the loader nothing but
 * that id, so the client never touches the config module that holds the
 * Conversions API token.
 *
 * No id configured → nothing renders: no script, no placeholder, no error.
 *
 * ⛔ Never reuse a container across sites. The Albany supplies and phones
 * sites each have their own; a shared container is the most common way one
 * business's data ends up in another's reports.
 *
 * GA4 and the Meta browser pixel are configured INSIDE the container, not as
 * separate snippets here, so tags change without a deploy. See
 * docs/tracking-setup.md.
 */
export function TagManager() {
  const { gtmId } = readTrackingConfig()
  if (!gtmId) return null
  return <GtmLoader gtmId={gtmId} />
}
