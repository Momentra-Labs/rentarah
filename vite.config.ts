import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// For GitHub Pages project sites use: VITE_BASE=/your-repo-name/ npm run build
// (leading + trailing slash). Default '/' is for Vercel/Netlify/root domains.
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  plugins: [react()],
  base,
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
})
