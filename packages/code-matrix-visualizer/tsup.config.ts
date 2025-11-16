import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  external: ['react', 'react-dom'],
  injectStyle: false,
  // Copy CSS file to dist
  onSuccess: 'cp src/styles.css dist/styles.css',
});
