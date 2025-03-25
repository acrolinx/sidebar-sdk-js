/// <reference types="@vitest/browser/providers/playwright" />

import { defineConfig } from 'vite';
import packageJson from './package.json';
import dts from 'vite-plugin-dts'

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
  plugins: [dts()]
});
