import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))

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
