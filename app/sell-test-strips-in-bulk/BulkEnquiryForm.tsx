'use client'

import { useState } from 'react'
import { OWNER_PHONE } from '@/lib/owner'
import { STATE_LABELS } from '@/lib/states'

const INPUT = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

export function BulkEnquiryForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setMessage('')
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries())
    try {
      const res = await fetch('/api/bulk-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please call instead.')
        return
      }
      setStatus('sent')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please call instead.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900">Got it.</h3>
        <p className="text-sm text-gray-600 mt-1">
          We&apos;ll be in touch to talk through what you have and what we can pay for it. If
          you&apos;d rather not wait, call {OWNER_PHONE}.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div>
        <label className={LABEL} htmlFor="bulk-name">Your name</label>
        <input id="bulk-name" name="name" required className={INPUT} autoComplete="name" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={LABEL} htmlFor="bulk-phone">Phone</label>
          <input id="bulk-phone" name="phone" type="tel" required className={INPUT} autoComplete="tel" />
        </div>
        <div>
          <label className={LABEL} htmlFor="bulk-email">Email</label>
          <input id="bulk-email" name="email" type="email" required className={INPUT} autoComplete="email" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={LABEL} htmlFor="bulk-state">State</label>
          <select id="bulk-state" name="state" required className={INPUT} defaultValue="">
            <option value="" disabled>Choose your state</option>
            {Object.entries(STATE_LABELS)
              .filter(([code]) => code !== 'CANADA')
              .map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="bulk-location">City</label>
          <input id="bulk-location" name="location" className={INPUT} placeholder="Your city or town" />
        </div>
        <div>
          <label className={LABEL} htmlFor="bulk-quantity">Roughly how many pieces</label>
          <input id="bulk-quantity" name="quantity" className={INPUT} placeholder="e.g. 400" inputMode="numeric" />
        </div>
      </div>
      <div>
        <label className={LABEL} htmlFor="bulk-frequency">One-off or ongoing?</label>
        <select id="bulk-frequency" name="frequency" className={INPUT} defaultValue="">
          <option value="">Select one</option>
          <option value="One-off lot">One-off lot</option>
          <option value="Ongoing / regular volume">Ongoing, regular volume</option>
          <option value="Not sure yet">Not sure yet</option>
        </select>
      </div>
      <div>
        <label className={LABEL} htmlFor="bulk-details">What have you got?</label>
        <textarea
          id="bulk-details"
          name="details"
          rows={4}
          className={INPUT}
          placeholder="Brands, box sizes, expiry dates, and whether it's a mixed lot."
        />
      </div>

      {status === 'error' && <p className="text-sm text-red-600">{message}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-gray-900 text-white rounded-lg px-4 py-2.5 font-semibold text-sm disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>
      <p className="text-xs text-gray-500">
        Prefer to talk? Call {OWNER_PHONE}. We quote per lot, so the more accurate your description,
        the closer the first number will be.
      </p>
    </form>
  )
}
