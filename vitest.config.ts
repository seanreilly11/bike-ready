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
      // Dummy Supabase vars so the admin client (lib/supabase/admin.ts), now
      // reachable from client code via the checkout server action, can be
      // constructed at import without throwing. Real calls are always mocked.
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SECRET_KEY: 'test-secret-key',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Neutralize `server-only` under Vitest - see tests/stubs/server-only.ts.
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
})
