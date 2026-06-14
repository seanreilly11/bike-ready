import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    // Feature flags default off; run the suite with them on so tests exercise
    // the gating logic (matches the pre-opt-in default).
    env: {
      NEXT_PUBLIC_PREMIUM_ENABLED: 'true',
      NEXT_PUBLIC_TEST_ENABLED: 'true',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
