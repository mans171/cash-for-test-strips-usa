/** Where to send someone after login/signup, from a `?next=` param.
 *  Only same-origin absolute paths are honoured: a value starting with "//"
 *  (or "/\") is a protocol-relative URL that a browser follows off-site, so
 *  it is an open redirect and falls back to the homepage. */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next) return fallback
  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
