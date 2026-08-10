// app/components/JsonLd.tsx

// JSON.stringify's output can't be trusted verbatim inside a <script> tag —
// a "</script" substring in any interpolated string (e.g. a company
// description) would break out of the script block. Escaping "<" to its
// unicode form is the standard mitigation for inline JSON-LD.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
