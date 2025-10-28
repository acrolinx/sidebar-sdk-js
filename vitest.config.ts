import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['html', 'lcov'],
    },
    projects: [
      {
        test: {
          include: ['tests/unit/**/*.{test,spec}.ts', 'tests/**/*.unit.{test,spec}.ts'],
          name: 'unit',
          environment: 'node',
          setupFiles: './tests/unit/setup-tests.ts',
        },
      },
      {
        test: {
          include: ['tests/browser/**/*.{test,spec}.ts', 'tests/**/*.browser.{test,spec}.ts'],
          name: 'browser',
          setupFiles: 'tests/browser/setup-tests.ts',
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
