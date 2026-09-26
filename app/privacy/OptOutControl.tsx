'use client'

import { useState, useSyncExternalStore } from 'react'
import { OPT_OUT_COOKIE, OPT_OUT_MAX_AGE, hasOptedOut } from '@/lib/tracking-consent'

type Status = 'loading' | 'gpc' | 'opted_out' | 'opted_in'

const subscribeNothing = () => () => {}

function readStatus(): Status {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  if (nav.globalPrivacyControl === true) return 'gpc'
  return hasOptedOut(document.cookie) ? 'opted_out' : 'opted_in'
}

/**
 * The "Do Not Sell or Share My Personal Information" switch. It sets one
 * first-party cookie that both halves of the tracking read: the browser stops
 * loading Tag Manager (so no Google Analytics and no Meta pixel), and the
 * server stops sending form submissions to the Meta Conversions API. The
 * rules live in lib/tracking-consent.ts.
 */
export function OptOutControl() {
  // Bumped after a cookie change so the snapshot below is read again.
  const [, setVersion] = useState(0)
  const status = useSyncExternalStore<Status>(subscribeNothing, readStatus, () => 'loading')

  function optOut() {
    document.cookie = `${OPT_OUT_COOKIE}=1; Max-Age=${OPT_OUT_MAX_AGE}; Path=/; SameSite=Lax; Secure`
    // Reload so a Tag Manager container already running on this page stops.
    window.location.reload()
  }

  function optIn() {
    document.cookie = `${OPT_OUT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax; Secure`
    setVersion((v) => v + 1)
  }

  if (status === 'loading') return null

  const box = 'rounded-xl border border-gray-200 bg-white p-5 mb-4'
  const button = 'mt-3 bg-ink text-white font-semibold px-5 py-2.5 rounded-lg text-sm'

  if (status === 'gpc') {
    return (
      <div className={box}>
        <p className="text-gray-700">
          Your browser is sending a Global Privacy Control signal, so you are already opted out.
          Google Analytics and the Meta pixel do not load for you, and we do not send your form
          details to Meta.
        </p>
      </div>
    )
  }

  if (status === 'opted_out') {
    return (
      <div className={box}>
        <p className="text-gray-700">
          You are opted out on this browser. Google Analytics and the Meta pixel do not load, and we
          do not send your form details to Meta.
        </p>
        <button type="button" onClick={optIn} className={`${button} bg-white !text-gray-700 border border-gray-300`}>
          Opt back in
        </button>
      </div>
    )
  }

  return (
    <div className={box}>
      <p className="text-gray-700">
        Opting out stops Google Analytics and the Meta pixel on this browser and stops us sending
        your form details to Meta. It is saved in a cookie on this browser for a year, so repeat it
        on each browser or device you use, and again if you clear your cookies.
      </p>
      <button type="button" onClick={optOut} className={button}>
        Do not sell or share my personal information
      </button>
    </div>
  )
}
