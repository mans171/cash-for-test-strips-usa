/** A field no human ever sees, let alone fills in. Both public lead forms
 *  render it visually hidden (off-screen, aria-hidden, tabIndex -1) and post
 *  its value; a form-filling bot writes into it and gives itself away.
 *
 *  The name is deliberately plausible-but-unused ("website2") rather than
 *  something like `honeypot`: the point is that a bot cannot tell it apart
 *  from the real fields. */
export const HONEYPOT_FIELD = 'website2'

/** True when the honeypot came back with anything in it. Anything that is not
 *  a non-empty string — missing, empty, whitespace, null, a number, a
 *  non-object body — is treated as a real submission, so a broken client can
 *  never lock a real seller out. */
export function isHoneypotTripped(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD]
  return typeof value === 'string' && value.trim().length > 0
}
