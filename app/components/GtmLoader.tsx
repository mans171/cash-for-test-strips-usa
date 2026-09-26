'use client'

import { useEffect, useSyncExternalStore } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { browserTrackingAllowed } from '@/lib/tracking-consent'
import { classifyContactHref } from '@/lib/contact-click'
import { pushEvent } from '@/lib/data-layer'

// Nothing to subscribe to: cookie and GPC are read fresh on every render.
const subscribeNothing = () => () => {}

/**
 * Loads the container in the browser, but only where and for whom it may run:
 * never on a private page (/admin, /kit/<token>, password reset), never for a
 * visitor who opted out on /privacy, never when the browser sends Global
 * Privacy Control. The rules live in lib/tracking-consent.ts and the server
 * half of the Conversions API reads the same ones.
 *
 * It also owns the one delegated click listener that turns every call, text,
 * email and buyer-website link on the site into a `contact_click` event.
 */
export function GtmLoader({ gtmId }: { gtmId: string }) {
  const pathname = usePathname() ?? '/'
  // Read in the browser only; the server snapshot is "not allowed", so the
  // server HTML never contains the container and hydration cannot mismatch.
  const allowed = useSyncExternalStore(
    subscribeNothing,
    () =>
      browserTrackingAllowed({
        pathname,
        cookie: document.cookie,
        gpc: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true,
      }),
    () => false
  )

  useEffect(() => {
    if (!allowed) return
    // Created before the container finishes loading so events fired meanwhile
    // are queued rather than dropped. Tag Manager drains the queue.
    const w = window as unknown as { dataLayer?: unknown[] }
    w.dataLayer = w.dataLayer || []
  }, [allowed])

  useEffect(() => {
    if (!allowed) return
    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!target) return
      const hit = classifyContactHref(target.getAttribute('href'))
      if (hit) pushEvent({ event: 'contact_click', method: hit.method, target: hit.target })
    }
    // Capture phase, so a link whose own handler stops propagation still counts.
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [allowed])

  if (!allowed) return null

  return (
    <Script
      id="gtm-container"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});`,
      }}
    />
  )
}
