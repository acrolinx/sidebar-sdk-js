import { defineConfig } from 'vite';
import packageJson from './package.json';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'index',
      fileName: 'index',
      formats: ['es'],
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
  plugins: [
    dts({
      exclude: ['tests'],
      rollupTypes: true,
    }),
  ],
});
