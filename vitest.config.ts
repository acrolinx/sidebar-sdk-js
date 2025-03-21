import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['html', 'lcov'],
    },
  },
});
