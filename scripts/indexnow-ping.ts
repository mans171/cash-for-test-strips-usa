/**
 * IndexNow URL submission script for cash4teststripsusa.com.
 *
 * Usage:
 *   npm run indexnow -- <url> [<url2> ...]
 *
 * Examples:
 *   npm run indexnow -- https://cash4teststripsusa.com/blog/recycling-diabetic-supplies
 *   npm run indexnow -- https://cash4teststripsusa.com/blog/recycling-diabetic-supplies \
 *                       https://cash4teststripsusa.com/sell-test-strips/ny
 *
 * The IndexNow key is read from the INDEXNOW_KEY environment variable, which
 * should also match the content of public/<key>.txt served at that URL.
 *
 * SECURITY NOTE: IndexNow keys are PUBLIC by design. They are a domain
 * ownership proof, not a secret — the key file is committed to the repository
 * and served over HTTP for search engines to verify. Do not treat INDEXNOW_KEY
 * as sensitive; it should be set in Vercel environment variables as a
 * plain-text variable (not a secret/encrypted one).
 *
 * API reference: https://www.indexnow.org/documentation
 */

const HOST = "cash4teststripsusa.com"
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

async function main() {
  const key = process.env.INDEXNOW_KEY
  if (!key) {
    console.error(
      "Error: INDEXNOW_KEY environment variable is not set.\n" +
      "Add it to .env.local or set it in your shell:\n" +
      "  export INDEXNOW_KEY=530cbc364b4a38252343cb3ee185a3e8"
    )
    process.exit(1)
  }

  // Collect URLs from command-line arguments (npm run indexnow -- <url...>).
  // The first two args are "node" and the script path; everything after "--"
  // is passed by npm as process.argv starting at index 2.
  const urlArgs = process.argv.slice(2).filter(Boolean)
  if (urlArgs.length === 0) {
    console.error(
      "Usage: npm run indexnow -- <url> [<url2> ...]\n" +
      "Example: npm run indexnow -- https://cash4teststripsusa.com/blog/recycling-diabetic-supplies"
    )
    process.exit(1)
  }

  // Validate that all URLs belong to the expected host.
  for (const url of urlArgs) {
    try {
      const parsed = new URL(url)
      if (parsed.host !== HOST) {
        console.error(`Error: URL host '${parsed.host}' does not match expected '${HOST}': ${url}`)
        process.exit(1)
      }
    } catch {
      console.error(`Error: Invalid URL: ${url}`)
      process.exit(1)
    }
  }

  const body = {
    host: HOST,
    key,
    // The key file is served at https://<host>/<key>.txt — IndexNow will
    // fetch it to confirm we control the domain.
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList: urlArgs,
  }

  console.log(`Submitting ${urlArgs.length} URL(s) to IndexNow...`)
  for (const url of urlArgs) console.log(`  ${url}`)

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  })

  if (res.ok || res.status === 202) {
    console.log(`\nSuccess. IndexNow responded: ${res.status} ${res.statusText}`)
    console.log("Search engines will be notified within minutes.")
  } else {
    const text = await res.text().catch(() => "(no body)")
    console.error(`\nIndexNow returned ${res.status} ${res.statusText}:\n${text}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
