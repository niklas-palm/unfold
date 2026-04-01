import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'unfold-ai': path.resolve(__dirname, 'src/framework/index.ts'),
    },
  },
  build: {
    outDir: 'dist-site',
    rollupOptions: {
      input: {
        main: 'index.html',
        examples: 'examples.html',
      },
    },
  },
})
