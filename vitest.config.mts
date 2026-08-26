import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      /*
       * Scoped to the pure logic on purpose. Instrumenting the React tree would
       * inflate the number with lines that only Playwright can meaningfully
       * exercise, and a coverage figure you cannot defend is worse than none.
       */
      include: [
        'src/lib/permissions.ts',
        'src/lib/format.ts',
        'src/lib/sla.ts',
        'src/lib/rate-limit.ts',
        'src/components/event-line.tsx',
      ],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
})
