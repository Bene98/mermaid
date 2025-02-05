import jison from './.vite/jisonPlugin.js';
import jsonSchemaPlugin from './.vite/jsonSchemaPlugin.js';
import typescript from '@rollup/plugin-typescript';
import { defaultExclude, defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    extensions: ['.js'],
    alias: {
      // Define your alias here
      $root: path.resolve(__dirname, 'packages/mermaid/src'),
    },
  },
  plugins: [
    jison(),
    jsonSchemaPlugin(), // handles .schema.yaml JSON Schema files
    typescript({ compilerOptions: { declaration: false } }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    // TODO: should we move this to a mermaid-core package?
    setupFiles: ['packages/mermaid/src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/vitest',
      exclude: [...defaultExclude, './tests/**', '**/__mocks__/**', '**/generated/'],
    },
    includeSource: ['packages/*/src/**/*.{js,ts}'],
  },
  build: {
    /** If you set esmExternals to true, this plugins assumes that
     all external dependencies are ES modules */

    commonjsOptions: {
      esmExternals: true,
    },
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
});
