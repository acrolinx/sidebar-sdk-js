/// <reference types="@vitest/browser/providers/playwright" />

import { defineConfig } from 'vite';
import packageJson from './package.json';

export default defineConfig({
  build: {
    lib: {
      entry: './src/acrolinx-plugin.ts',
      name: 'acrolinx-sidebar-sdk',
      fileName: 'acrolinx-sidebar-sdk',
      formats: ['es', 'cjs', 'umd'],
    },
  },
  test: {
    coverage: {
      include: ['src'],
    },
  },
  define: {
    SDK_VERSION: JSON.stringify(packageJson.version),
  },
});
