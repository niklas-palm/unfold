import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/framework/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', 'framer-motion', 'prism-react-renderer'],
  outDir: 'dist',
  treeshake: true,
})
