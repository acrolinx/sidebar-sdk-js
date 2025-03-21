import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      reporter: ['html', 'lcov'],
    },
  },
});
