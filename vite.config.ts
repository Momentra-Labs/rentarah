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
  optimizeDeps: {
    // Pre-bundle deps that only lazy routes import (car detail calendar, map). Otherwise Vite finds them
    // mid-session, re-optimizes, and the open page mixes old/new chunks — e.g. CalendarPicker then reads a
    // second copy of the pickers context and throws "Can not find utils in context".
    include: [
      '@mui/x-date-pickers',
      '@mui/x-date-pickers/AdapterDayjs',
      '@mui/x-date-pickers/CalendarPicker',
      '@mui/x-date-pickers/PickersDay',
      '@mui/x-date-pickers/TimePicker',
      'dayjs',
      'dayjs/plugin/relativeTime',
      'leaflet',
      'leaflet.markercluster',
      'react-leaflet',
      'react-leaflet-markercluster',
    ],
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
