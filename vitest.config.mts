import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { readFileSync } from 'fs'

const __dir = dirname(fileURLToPath(import.meta.url))

// Load .env.local into process.env
const envPath = `${__dir}/.env.local`
try {
  const envContent = readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n')
  lines.forEach((line) => {
    const [key, ...value] = line.split('=')
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = value.join('=').trim()
    }
  })
} catch (err) {
  // .env.local doesn't exist or couldn't be read, that's ok
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
  },
  resolve: {
    alias: {
      '@': __dir,
    },
  },
})
