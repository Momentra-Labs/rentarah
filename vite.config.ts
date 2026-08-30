import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// For GitHub Pages project sites use: VITE_BASE=/your-repo-name/ npm run build
// (leading + trailing slash). Default '/' is for Vercel/Netlify/root domains.
const base = process.env.VITE_BASE ?? '/'
const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'leaflet'
          if (id.includes('@mui') || id.includes('@emotion')) return 'mui'
          return undefined
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
