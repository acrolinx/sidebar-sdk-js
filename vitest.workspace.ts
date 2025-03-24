import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      include: ['tests/unit/**/*.{test,spec}.ts', 'tests/**/*.unit.{test,spec}.ts'],
      name: 'unit',
      environment: 'node',
      setupFiles: './tests/unit/setup-tests.ts',
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      include: ['tests/browser/**/*.{test,spec}.ts', 'tests/**/*.browser.{test,spec}.ts'],
      name: 'browser',
      setupFiles: 'tests/browser/setup-tests.ts',
      browser: {
        enabled: true,
        provider: 'playwright',
        instances: [{ browser: 'chromium' } /*, {browser: 'firefox'}, {browser: 'webkit'}*/],
      },
    },
  },
]);
