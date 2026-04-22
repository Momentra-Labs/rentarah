import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// For GitHub Pages project sites use: VITE_BASE=/your-repo-name/ npm run build
// (leading + trailing slash). Default '/' is for Vercel/Netlify/root domains.
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  plugins: [react()],
  base,
})
